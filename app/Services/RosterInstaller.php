<?php

declare(strict_types=1);

namespace App\Services;

use App\Enums\PayType;
use App\Enums\UserRole;
use App\Models\Brigade;
use App\Models\SalaryHistory;
use App\Models\User;
use App\Support\PayDefaults;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

final class RosterInstaller
{
    public const INITIAL_PASSWORD = 'password';

    /**
     * @return list<string>
     */
    public static function workerNames(): array
    {
        return array_values(array_map(
            static fn (array $entry): string => $entry['name'],
            array_filter(self::accounts(), static fn (array $entry): bool => $entry['role'] === UserRole::Worker),
        ));
    }

    /**
     * @return list<string>
     */
    public static function brigadierNames(): array
    {
        return array_values(array_map(
            static fn (array $entry): string => $entry['name'],
            array_filter(self::accounts(), static fn (array $entry): bool => $entry['role'] === UserRole::Brigadier),
        ));
    }

    /**
     * @return list<array{
     *     login: string,
     *     name: string,
     *     first_name: string,
     *     last_name: string|null,
     *     role: UserRole
     * }>
     */
    public static function accounts(): array
    {
        return [
            [
                'login' => 'islam.ashirov',
                'name' => 'Аширов Ислам',
                'first_name' => 'Ислам',
                'last_name' => 'Аширов',
                'role' => UserRole::Manager,
            ],
            [
                'login' => 'ramilya.parhatova',
                'name' => 'Пархатова Рамиля',
                'first_name' => 'Рамиля',
                'last_name' => 'Пархатова',
                'role' => UserRole::Accountant,
            ],
            [
                'login' => 'abdykahar.kadyrov',
                'name' => 'Кадыров Абдыкахар',
                'first_name' => 'Абдыкахар',
                'last_name' => 'Кадыров',
                'role' => UserRole::Brigadier,
            ],
            [
                'login' => 'ilyar.abdurashitov',
                'name' => 'Абдурашитов Ильяр',
                'first_name' => 'Ильяр',
                'last_name' => 'Абдурашитов',
                'role' => UserRole::Brigadier,
            ],
            [
                'login' => 'alizhan.nurmatov',
                'name' => 'Нурматов Алижан',
                'first_name' => 'Алижан',
                'last_name' => 'Нурматов',
                'role' => UserRole::Brigadier,
            ],
            [
                'login' => 'tursun.kadyrov',
                'name' => 'Кадыров Турсун',
                'first_name' => 'Турсун',
                'last_name' => 'Кадыров',
                'role' => UserRole::Brigadier,
            ],
            [
                'login' => 'dilmurat.ashirov',
                'name' => 'Аширов Дильмурат',
                'first_name' => 'Дильмурат',
                'last_name' => 'Аширов',
                'role' => UserRole::Worker,
            ],
            [
                'login' => 'abdulla.nuruzov',
                'name' => 'Нурузов Абдулла',
                'first_name' => 'Абдулла',
                'last_name' => 'Нурузов',
                'role' => UserRole::Worker,
            ],
            [
                'login' => 'rishat.sadyrov',
                'name' => 'Садыров Ришат',
                'first_name' => 'Ришат',
                'last_name' => 'Садыров',
                'role' => UserRole::Worker,
            ],
            [
                'login' => 'dilya.iziyarov',
                'name' => 'Изияров Диля',
                'first_name' => 'Диля',
                'last_name' => 'Изияров',
                'role' => UserRole::Worker,
            ],
            [
                'login' => 'eldanis.aytaev',
                'name' => 'Айтаев Эльданис',
                'first_name' => 'Эльданис',
                'last_name' => 'Айтаев',
                'role' => UserRole::Worker,
            ],
            [
                'login' => 'alibek.alimbekov',
                'name' => 'Алимбеков Алибек',
                'first_name' => 'Алибек',
                'last_name' => 'Алимбеков',
                'role' => UserRole::Worker,
            ],
            [
                'login' => 'roma',
                'name' => 'Рома',
                'first_name' => 'Рома',
                'last_name' => null,
                'role' => UserRole::Worker,
            ],
            [
                'login' => 'dilmurat.akhmetov',
                'name' => 'Ахметов Дильмурат',
                'first_name' => 'Дильмурат',
                'last_name' => 'Ахметов',
                'role' => UserRole::Worker,
            ],
            [
                'login' => 'amranzhan.turganov',
                'name' => 'Турганов Амранжан',
                'first_name' => 'Амранжан',
                'last_name' => 'Турганов',
                'role' => UserRole::Worker,
            ],
            [
                'login' => 'arafat.turganov',
                'name' => 'Турганов Арафат',
                'first_name' => 'Арафат',
                'last_name' => 'Турганов',
                'role' => UserRole::Worker,
            ],
            [
                'login' => 'ilyar.nurmatov',
                'name' => 'Нурматов Ильяр',
                'first_name' => 'Ильяр',
                'last_name' => 'Нурматов',
                'role' => UserRole::Worker,
            ],
            [
                'login' => 'konstantin.chernyshov',
                'name' => 'Чернышов Константин',
                'first_name' => 'Константин',
                'last_name' => 'Чернышов',
                'role' => UserRole::Worker,
            ],
            [
                'login' => 'dilmurat.abdurakhmanov',
                'name' => 'Абдурахманов Дильмурат',
                'first_name' => 'Дильмурат',
                'last_name' => 'Абдурахманов',
                'role' => UserRole::Worker,
            ],
        ];
    }

    public function seed(): void
    {
        $hourlyRate = PayDefaults::hourlyRate();

        $manager = $this->createAccount(
            collect(self::accounts())->firstWhere('role', UserRole::Manager),
            $hourlyRate,
        );

        $this->createAccount(
            collect(self::accounts())->firstWhere('role', UserRole::Accountant),
            $hourlyRate,
        );

        $brigades = [];

        foreach (self::accounts() as $entry) {
            if ($entry['role'] !== UserRole::Brigadier) {
                continue;
            }

            $brigadier = $this->createAccount($entry, $hourlyRate);

            $brigade = Brigade::query()->create([
                'name' => $brigadier->familyName(),
                'brigadier_id' => $brigadier->id,
            ]);

            $brigadier->update(['brigade_id' => $brigade->id]);
            $brigades[] = $brigade;

            SalaryHistory::query()->create([
                'user_id' => $brigadier->id,
                'rate' => $hourlyRate,
                'pay_type' => PayType::Hourly,
                'effective_from' => $brigadier->hired_at,
                'note' => 'Стартовая ставка',
                'changed_by' => $manager->id,
            ]);
        }

        $workerIndex = 0;

        foreach (self::accounts() as $entry) {
            if ($entry['role'] !== UserRole::Worker) {
                continue;
            }

            $brigade = $brigades[$workerIndex % count($brigades)] ?? null;
            $workerIndex++;

            $worker = $this->createAccount($entry, $hourlyRate, $brigade?->id);

            SalaryHistory::query()->create([
                'user_id' => $worker->id,
                'rate' => $hourlyRate,
                'pay_type' => PayType::Hourly,
                'effective_from' => $worker->hired_at,
                'note' => 'Стартовая ставка',
                'changed_by' => $manager->id,
            ]);
        }
    }

    /**
     * @param  array{
     *     login: string,
     *     name: string,
     *     first_name: string,
     *     last_name: string|null,
     *     role: UserRole
     * }|null  $entry
     */
    private function createAccount(?array $entry, float $hourlyRate, ?int $brigadeId = null): User
    {
        if ($entry === null) {
            throw new \InvalidArgumentException('Roster entry is missing.');
        }

        return User::query()->create([
            'name' => $entry['name'],
            'first_name' => $entry['first_name'],
            'last_name' => $entry['last_name'],
            'email' => $entry['login'],
            'password' => self::INITIAL_PASSWORD,
            'role' => $entry['role'],
            'brigade_id' => $brigadeId,
            'position' => match ($entry['role']) {
                UserRole::Manager => 'Руководитель',
                UserRole::Accountant => 'Бухгалтер',
                UserRole::Brigadier => 'Бригадир',
                UserRole::Worker => 'Строитель',
            },
            'pay_type' => in_array($entry['role'], [UserRole::Manager, UserRole::Accountant], true)
                ? PayType::Fixed
                : PayType::Hourly,
            'rate' => in_array($entry['role'], [UserRole::Manager, UserRole::Accountant], true)
                ? 0
                : $hourlyRate,
            'hired_at' => now(),
            'email_verified_at' => now(),
        ]);
    }

    public function syncLoginsInPlace(): int
    {
        $updated = 0;

        foreach (self::accounts() as $entry) {
            $user = $this->findUserForEntry($entry);

            if ($user === null) {
                continue;
            }

            $user->update([
                'first_name' => $entry['first_name'],
                'last_name' => $entry['last_name'],
                'email' => $entry['login'],
                'password' => self::INITIAL_PASSWORD,
                'is_active' => true,
            ]);

            $updated++;
        }

        return $updated;
    }

    /**
     * @param  array{
     *     login: string,
     *     name: string,
     *     first_name: string,
     *     last_name: string|null,
     *     role: UserRole
     * }  $entry
     */
    public function findUserForEntry(array $entry): ?User
    {
        $user = User::query()->where('name', $entry['name'])->first();

        if ($user !== null) {
            return $user;
        }

        $user = User::query()->where('email', $entry['login'])->first();

        if ($user !== null) {
            return $user;
        }

        foreach (self::legacyEmailsFor($entry['login']) as $legacyEmail) {
            $user = User::query()->where('email', $legacyEmail)->first();

            if ($user !== null) {
                return $user;
            }
        }

        return null;
    }

    /**
     * @return list<string>
     */
    public static function legacyEmailsFor(string $login): array
    {
        return match ($login) {
            'islam.ashirov' => ['manager'],
            'ramilya.parhatova' => ['accountant'],
            'abdykahar.kadyrov' => ['brigadier1'],
            'ilyar.abdurashitov' => ['brigadier2'],
            'alizhan.nurmatov' => ['brigadier3'],
            'tursun.kadyrov' => ['brigadier4'],
            'dilmurat.ashirov' => ['worker1'],
            'abdulla.nuruzov' => ['worker2'],
            'rishat.sadyrov' => ['worker3'],
            'dilya.iziyarov' => ['worker4'],
            'eldanis.aytaev' => ['worker5'],
            'alibek.alimbekov' => ['worker6'],
            'roma' => ['worker7'],
            'dilmurat.akhmetov' => ['worker8'],
            'amranzhan.turganov' => ['worker9'],
            'arafat.turganov' => ['worker10'],
            'ilyar.nurmatov' => ['worker11'],
            'konstantin.chernyshov' => ['worker12'],
            'dilmurat.abdurakhmanov' => ['worker13'],
            default => [],
        };
    }

    /**
     * @return list<string>
     */
    public static function loginCandidatesFor(string $input): array
    {
        $input = strtolower(trim($input));
        $candidates = [];

        if ($input !== '') {
            $candidates[] = $input;
        }

        foreach (self::accounts() as $entry) {
            $login = $entry['login'];
            $legacy = self::legacyEmailsFor($login);

            if ($login === $input || in_array($input, $legacy, true)) {
                $candidates[] = $login;
                $candidates = array_merge($candidates, $legacy);
            }
        }

        return array_values(array_unique($candidates));
    }

    public function replace(): void
    {
        $this->wipe();
        $this->seed();
    }

    private function wipe(): void
    {
        Schema::disableForeignKeyConstraints();

        foreach ([
            'push_subscriptions',
            'notifications',
            'activity_logs',
            'salary_histories',
            'payments',
            'advance_requests',
            'time_entries',
            'object_assignments',
            'shift_plans',
            'sessions',
        ] as $table) {
            if (Schema::hasTable($table)) {
                DB::table($table)->delete();
            }
        }

        if (Schema::hasTable('work_objects')) {
            DB::table('work_objects')->delete();
        }

        if (Schema::hasTable('users')) {
            DB::table('users')->update(['brigade_id' => null]);
        }

        if (Schema::hasTable('brigades')) {
            DB::table('brigades')->update(['brigadier_id' => null]);
            DB::table('brigades')->delete();
        }

        if (Schema::hasTable('users')) {
            DB::table('users')->delete();
        }

        Schema::enableForeignKeyConstraints();
    }
}
