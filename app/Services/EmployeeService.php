<?php

declare(strict_types=1);

namespace App\Services;

use App\Enums\PayType;
use App\Enums\UserRole;
use App\Models\Brigade;
use App\Models\ObjectAssignment;
use App\Models\SalaryHistory;
use App\Models\User;
use App\Models\WorkObject;
use App\Support\LoginGenerator;
use App\Support\PayDefaults;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use InvalidArgumentException;
use PhpOffice\PhpSpreadsheet\Shared\Date;

final readonly class EmployeeService
{
    public function __construct(
        private RealtimeNotifier $realtime,
    ) {}

    /**
     * @param  array<string, mixed>  $data
     */
    public function create(array $data, User $manager): User
    {
        $role = UserRole::from((string) $data['role']);

        if (! in_array($role, [UserRole::Worker, UserRole::Brigadier], true)) {
            throw new InvalidArgumentException('Можно добавить только сотрудника или бригадира.');
        }

        $user = DB::transaction(function () use ($data, $manager, $role): User {
            $hiredAt = $data['hired_at'] ?? now()->toDateString();
            $payType = PayType::from((string) ($data['pay_type'] ?? PayType::Hourly->value));
            $nameParts = LoginGenerator::fromFullName((string) $data['name']);
            $email = ! empty($data['email'])
                ? Str::lower(trim((string) $data['email']))
                : LoginGenerator::uniqueLogin($nameParts['login']);

            $user = User::query()->create([
                'name' => (string) ($data['name'] ?: $nameParts['display_name']),
                'first_name' => $nameParts['first_name'],
                'last_name' => $nameParts['last_name'],
                'email' => $email,
                'password' => (string) ($data['password'] ?? RosterInstaller::INITIAL_PASSWORD),
                'phone' => $data['phone'] ?? null,
                'role' => $role,
                'brigade_id' => $data['brigade_id'] ?? null,
                'position' => $data['position'] ?? 'Подсобник',
                'pay_type' => $payType,
                'rate' => $data['rate'] ?? PayDefaults::hourlyRate(),
                'max_advance' => $data['max_advance'] ?? null,
                'hired_at' => $hiredAt,
                'is_active' => true,
                'email_verified_at' => now(),
            ]);

            SalaryHistory::query()->create([
                'user_id' => $user->id,
                'rate' => $user->rate,
                'pay_type' => $payType,
                'effective_from' => $user->hired_at,
                'note' => 'Стартовая ставка',
                'changed_by' => $manager->id,
            ]);

            if ($role === UserRole::Brigadier && ! empty($data['brigade_id'])) {
                Brigade::query()
                    ->whereKey($data['brigade_id'])
                    ->update(['brigadier_id' => $user->id]);
            }

            return $user;
        });

        $this->realtime->pingAround($user, 'roster.changed', $manager->id);

        return $user;
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(User $employee, array $data, User $manager): User
    {
        if (! in_array($employee->role, [UserRole::Worker, UserRole::Brigadier], true)) {
            throw new InvalidArgumentException('Можно редактировать только сотрудника или бригадира.');
        }

        $employee = DB::transaction(function () use ($employee, $data, $manager): User {
            $payType = isset($data['pay_type'])
                ? PayType::from((string) $data['pay_type'])
                : $employee->pay_type;
            $rate = array_key_exists('rate', $data)
                ? (float) $data['rate']
                : (float) $employee->rate;

            $rateChanged = abs($rate - (float) $employee->rate) > 0.0001
                || $payType !== $employee->pay_type;

            $employee->update([
                'name' => (string) ($data['name'] ?? $employee->name),
                'phone' => $data['phone'] ?? $employee->phone,
                'brigade_id' => array_key_exists('brigade_id', $data)
                    ? ($data['brigade_id'] ?: null)
                    : $employee->brigade_id,
                'position' => array_key_exists('position', $data)
                    ? $data['position']
                    : $employee->position,
                'pay_type' => $payType,
                'rate' => $rate,
                'max_advance' => array_key_exists('max_advance', $data)
                    ? ($data['max_advance'] !== null && $data['max_advance'] !== ''
                        ? (float) $data['max_advance']
                        : null)
                    : $employee->max_advance,
                'is_active' => array_key_exists('is_active', $data)
                    ? (bool) $data['is_active']
                    : $employee->is_active,
            ]);

            if ($rateChanged) {
                SalaryHistory::query()->create([
                    'user_id' => $employee->id,
                    'rate' => $rate,
                    'pay_type' => $payType,
                    'effective_from' => now()->toDateString(),
                    'note' => $data['rate_note'] ?? 'Изменение ставки',
                    'changed_by' => $manager->id,
                ]);
            }

            if ($employee->role === UserRole::Brigadier && $employee->brigade_id) {
                Brigade::query()
                    ->whereKey($employee->brigade_id)
                    ->update(['brigadier_id' => $employee->id]);
            }

            return $employee->fresh(['brigade', 'salaryHistories']);
        });

        $this->realtime->pingAround($employee, 'roster.changed', $manager->id);

        return $employee;
    }

    public function deactivate(User $employee): User
    {
        $this->assertStaff($employee);

        if ($employee->activeTimeEntry() !== null || $employee->pendingTimeEntry() !== null) {
            throw ValidationException::withMessages([
                'employee' => 'Сначала завершите смену сотрудника.',
            ]);
        }

        $employee = DB::transaction(function () use ($employee): User {
            ObjectAssignment::query()
                ->where('user_id', $employee->id)
                ->whereNull('ended_on')
                ->update(['ended_on' => today()->toDateString()]);

            if ($employee->role === UserRole::Brigadier && $employee->brigade_id) {
                Brigade::query()
                    ->whereKey($employee->brigade_id)
                    ->where('brigadier_id', $employee->id)
                    ->update(['brigadier_id' => null]);
            }

            $employee->update(['is_active' => false]);

            return $employee->fresh();
        });

        $this->realtime->pingAround($employee, 'roster.changed');

        return $employee;
    }

    public function restore(User $employee): User
    {
        $this->assertStaff($employee);

        $employee->update(['is_active' => true]);
        $employee = $employee->fresh();
        $this->realtime->pingAround($employee, 'roster.changed');

        return $employee;
    }

    public function attachToBrigade(User $employee, Brigade $brigade): User
    {
        $this->assertStaff($employee);

        $employee->update(['brigade_id' => $brigade->id]);
        $employee = $employee->fresh();
        $this->realtime->pingAround($employee, 'roster.changed');
        $this->realtime->ping([$brigade->brigadier_id], 'roster.changed');

        return $employee;
    }

    public function detachFromBrigade(User $employee, Brigade $brigade): User
    {
        $this->assertStaff($employee);

        if ((int) $employee->brigade_id !== (int) $brigade->id) {
            throw ValidationException::withMessages([
                'member' => 'Сотрудник не состоит в этой бригаде.',
            ]);
        }

        if ($employee->activeTimeEntry() !== null || $employee->pendingTimeEntry() !== null) {
            throw ValidationException::withMessages([
                'member' => 'Сначала завершите смену сотрудника.',
            ]);
        }

        $employee = DB::transaction(function () use ($employee, $brigade): User {
            $objectIds = WorkObject::query()
                ->where('brigade_id', $brigade->id)
                ->pluck('id');

            ObjectAssignment::query()
                ->where('user_id', $employee->id)
                ->whereIn('work_object_id', $objectIds)
                ->whereNull('ended_on')
                ->update(['ended_on' => today()->toDateString()]);

            if ((int) $brigade->brigadier_id === (int) $employee->id) {
                $brigade->update(['brigadier_id' => null]);
            }

            $employee->update(['brigade_id' => null]);

            return $employee->fresh();
        });

        $this->realtime->pingAround($employee, 'roster.changed');
        $this->realtime->ping([$brigade->brigadier_id], 'roster.changed');

        return $employee;
    }

    private function assertStaff(User $employee): void
    {
        if (! in_array($employee->role, [UserRole::Worker, UserRole::Brigadier], true)) {
            throw ValidationException::withMessages([
                'employee' => 'Можно менять только сотрудника или бригадира.',
            ]);
        }
    }

    /**
     * @param  array<string, mixed>  $row
     */
    public function createFromImportRow(array $row, User $manager): User
    {
        $name = $this->cell($row, ['imia', 'name', 'имя', 'fio', 'фio', 'фио', 'sotrudnik', 'сотрудник']);
        $email = $this->cell($row, ['login', 'logин', 'email', 'логин']);
        $phone = $this->cell($row, ['telefon', 'phone', 'телефон']);
        $roleRaw = $this->cell($row, ['rol', 'role', 'роль']);
        $brigadeName = $this->cell($row, ['brigada', 'brigade', 'бригада']);
        $position = $this->cell($row, ['dolzhnost', 'position', 'должность']);
        $payTypeRaw = $this->cell($row, ['tip_oplaty', 'pay_type', 'тип_оплаты', 'tipoplata']);
        $rate = $this->cell($row, ['stavka', 'rate', 'ставка']);
        $maxAdvance = $this->cell($row, ['limit_avansa', 'max_advance', 'лимит_аванса', 'limitavansa']);
        $hiredAt = $this->cell($row, ['data_priema', 'hired_at', 'дата_приема', 'datapriema']);
        $password = $this->cell($row, ['parol', 'password', 'пароль']);

        if ($name === null) {
            throw new InvalidArgumentException('Укажите имя.');
        }

        if ($email === null || $email === '') {
            $nameParts = LoginGenerator::fromFullName($name);
            $email = LoginGenerator::uniqueLogin($nameParts['login']);
        }

        if (User::query()->where('email', $email)->exists()) {
            throw new InvalidArgumentException("Логин «{$email}» уже занят.");
        }

        $brigadeId = null;
        if ($brigadeName !== null && $brigadeName !== '') {
            $brigade = Brigade::query()->where('name', $brigadeName)->first();

            if ($brigade === null) {
                throw new InvalidArgumentException("Бригада «{$brigadeName}» не найдена.");
            }

            $brigadeId = $brigade->id;
        }

        return $this->create([
            'name' => $name,
            'email' => $email,
            'password' => $password ?: RosterInstaller::INITIAL_PASSWORD,
            'phone' => $phone,
            'role' => $this->parseRole($roleRaw),
            'brigade_id' => $brigadeId,
            'position' => $position ?: 'Подсобник',
            'pay_type' => $this->parsePayType($payTypeRaw),
            'rate' => $rate === null || $rate === ''
                ? PayDefaults::hourlyRate()
                : (float) str_replace(',', '.', (string) $rate),
            'max_advance' => $maxAdvance !== null && $maxAdvance !== ''
                ? (float) str_replace(',', '.', (string) $maxAdvance)
                : null,
            'hired_at' => $this->parseDate($hiredAt),
        ], $manager);
    }

    /**
     * @param  array<string, mixed>  $row
     * @param  list<string>  $keys
     */
    private function cell(array $row, array $keys): ?string
    {
        foreach ($keys as $key) {
            $slug = Str::slug($key, '_');
            $value = $row[$slug] ?? $row[$key] ?? null;

            if ($value !== null && $value !== '') {
                return trim((string) $value);
            }
        }

        return null;
    }

    private function parseRole(?string $value): string
    {
        if ($value === null || $value === '') {
            return UserRole::Worker->value;
        }

        $normalized = Str::lower(trim($value));

        return match (true) {
            in_array($normalized, ['brigadier', 'бригадир', 'brig'], true) => UserRole::Brigadier->value,
            in_array($normalized, ['worker', 'сотрудник', 'рабочий', 'работник'], true) => UserRole::Worker->value,
            default => throw new InvalidArgumentException("Неизвестная роль «{$value}». Используйте worker или brigadier."),
        };
    }

    private function parsePayType(?string $value): string
    {
        if ($value === null || $value === '') {
            return PayType::Hourly->value;
        }

        $normalized = Str::lower(trim($value));

        return match (true) {
            in_array($normalized, ['hourly', 'за час', 'chas', 'час'], true) => PayType::Hourly->value,
            in_array($normalized, ['daily', 'за день', 'den', 'день'], true) => PayType::Daily->value,
            in_array($normalized, ['fixed', 'фикс', 'фиксированная'], true) => PayType::Fixed->value,
            in_array($normalized, ['custom', 'индивидуальная'], true) => PayType::Custom->value,
            default => throw new InvalidArgumentException("Неизвестный тип оплаты «{$value}»."),
        };
    }

    private function parseDate(?string $value): ?string
    {
        if ($value === null || $value === '') {
            return now()->toDateString();
        }

        if (is_numeric($value)) {
            return Date::excelToDateTimeObject((float) $value)->format('Y-m-d');
        }

        $timestamp = strtotime($value);

        if ($timestamp === false) {
            throw new InvalidArgumentException("Некорректная дата «{$value}».");
        }

        return date('Y-m-d', $timestamp);
    }
}
