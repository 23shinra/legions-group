<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Enums\AdvanceStatus;
use App\Enums\ObjectStatus;
use App\Enums\PayType;
use App\Enums\UserRole;
use App\Models\AdvanceRequest;
use App\Models\Brigade;
use App\Models\ObjectAssignment;
use App\Models\Payment;
use App\Models\SalaryHistory;
use App\Models\TimeEntry;
use App\Models\User;
use App\Models\WorkObject;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

final class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $password = Hash::make('123');

        $manager = User::query()->create([
            'name' => 'Руководитель Алиев',
            'email' => 'manager',
            'password' => $password,
            'phone' => '+77001112233',
            'role' => UserRole::Manager,
            'position' => 'Руководитель',
            'pay_type' => PayType::Fixed,
            'rate' => 0,
            'hired_at' => now()->subYears(3),
            'email_verified_at' => now(),
        ]);

        $accountant = User::query()->create([
            'name' => 'Бухгалтер Сатыбалдиева',
            'email' => 'accountant',
            'password' => $password,
            'phone' => '+77004445566',
            'role' => UserRole::Accountant,
            'position' => 'Бухгалтер',
            'pay_type' => PayType::Fixed,
            'rate' => 0,
            'hired_at' => now()->subYears(2),
            'email_verified_at' => now(),
        ]);

        $brigadierNames = [
            'Бригадир Нурлан',
            'Бригадир Ерлан',
            'Бригадир Даурен',
            'Бригадир Асхат',
            'Бригадир Тимур',
        ];

        $brigadiers = [];
        foreach ($brigadierNames as $i => $name) {
            $rate = fake()->numberBetween(2200, 3200);
            $brigadiers[] = User::query()->create([
                'name' => $name,
                'email' => 'brigadier'.($i + 1),
                'password' => $password,
                'phone' => '+7701'.str_pad((string) ($i + 1), 7, '0', STR_PAD_LEFT),
                'role' => UserRole::Brigadier,
                'position' => 'Бригадир',
                'pay_type' => PayType::Hourly,
                'rate' => $rate,
                'max_advance' => fake()->randomElement([50000, 70000, 100000]),
                'hired_at' => now()->subYears(2),
                'email_verified_at' => now(),
            ]);
        }

        $brigades = [];
        for ($i = 0; $i < 4; $i++) {
            $brigades[] = Brigade::query()->create([
                'name' => 'Бригада №'.($i + 1),
                'brigadier_id' => $brigadiers[$i]->id,
            ]);
            $brigadiers[$i]->update(['brigade_id' => $brigades[$i]->id]);
        }

        $brigadiers[4]->update(['brigade_id' => $brigades[0]->id]);

        $workerNames = [
            'Иван Петров', 'Пётр Сидоров', 'Али Касымов', 'Сергей Иванов', 'Арман Беков',
            'Данияр Омаров', 'Максим Ким', 'Ермек Жунусов', 'Азамат Тулеуов', 'Руслан Сапаров',
            'Нурсултан Алиев', 'Бауржан Муратов', 'Саят Ибраев', 'Тимур Жаксылык', 'Айдын Сериков',
            'Кайрат Нурмагамбетов', 'Диас Абдуллаев', 'Ерасыл Кенжебаев', 'Алихан Мусин', 'Бекзат Рахимов',
        ];

        $workers = [];
        foreach ($workerNames as $i => $name) {
            $brigade = $brigades[$i % 4];
            $rate = fake()->numberBetween(1500, 2800);

            $worker = User::query()->create([
                'name' => $name,
                'email' => 'worker'.($i + 1),
                'password' => $password,
                'phone' => '+7702'.str_pad((string) ($i + 1), 7, '0', STR_PAD_LEFT),
                'role' => UserRole::Worker,
                'brigade_id' => $brigade->id,
                'position' => fake()->randomElement(['Рабочий', 'Монтажник', 'Бетонщик', 'Разнорабочий']),
                'pay_type' => PayType::Hourly,
                'rate' => $rate,
                'max_advance' => fake()->randomElement([30000, 40000, 50000, 60000]),
                'hired_at' => now()->subMonths(fake()->numberBetween(1, 18)),
                'email_verified_at' => now(),
            ]);

            SalaryHistory::query()->create([
                'user_id' => $worker->id,
                'rate' => $rate,
                'pay_type' => PayType::Hourly,
                'effective_from' => $worker->hired_at,
                'note' => 'Стартовая ставка',
                'changed_by' => $manager->id,
            ]);

            $workers[] = $worker;
        }

        foreach ($brigadiers as $brigadier) {
            SalaryHistory::query()->create([
                'user_id' => $brigadier->id,
                'rate' => $brigadier->rate,
                'pay_type' => PayType::Hourly,
                'effective_from' => $brigadier->hired_at,
                'note' => 'Стартовая ставка',
                'changed_by' => $manager->id,
            ]);
        }

        $objects = [];
        foreach ($brigades as $i => $brigade) {
            $object = WorkObject::query()->create([
                'name' => 'Объект №'.($i + 1),
                'address' => 'г. Алматы, ул. Примерная '.(($i + 1) * 10),
                'start_date' => now()->subDays(20)->toDateString(),
                'planned_end_date' => now()->addDays(30)->toDateString(),
                'brigade_id' => $brigade->id,
                'status' => ObjectStatus::Active,
            ]);
            $objects[$brigade->id] = $object;

            foreach ($workers as $worker) {
                if ((int) $worker->brigade_id !== (int) $brigade->id) {
                    continue;
                }

                ObjectAssignment::query()->create([
                    'user_id' => $worker->id,
                    'work_object_id' => $object->id,
                    'started_on' => $object->start_date,
                ]);
            }

            ObjectAssignment::query()->create([
                'user_id' => $brigade->brigadier_id,
                'work_object_id' => $object->id,
                'started_on' => $object->start_date,
            ]);
        }

        $crew = collect($workers)->merge(collect($brigadiers)->take(4));

        foreach ($crew as $person) {
            $brigadeId = (int) $person->brigade_id;
            $object = $objects[$brigadeId] ?? null;
            if ($object === null) {
                continue;
            }

            $shiftDays = fake()->numberBetween(6, 14);
            for ($d = $shiftDays; $d >= 1; $d--) {
                if (fake()->boolean(18)) {
                    continue;
                }

                $day = now()->subDays($d)->startOfDay();
                if ($day->isWeekend() && fake()->boolean(40)) {
                    continue;
                }

                $startHour = fake()->numberBetween(7, 9);
                $startMinute = fake()->randomElement([0, 10, 15, 30]);
                $startedAt = $day->copy()->setTime($startHour, $startMinute);
                $workMinutes = fake()->numberBetween(420, 600);
                $break = fake()->randomElement([30, 45, 60]);
                $endedAt = $startedAt->copy()->addMinutes($workMinutes + $break);

                TimeEntry::query()->create([
                    'user_id' => $person->id,
                    'brigade_id' => $brigadeId,
                    'work_object_id' => $object->id,
                    'started_at' => $startedAt,
                    'ended_at' => $endedAt,
                    'break_minutes' => $break,
                    'worked_minutes' => $workMinutes,
                ]);
            }

            // ~60% currently on site today
            if (fake()->boolean(60)) {
                $startedAt = now()->startOfDay()->setTime(fake()->numberBetween(7, 9), fake()->randomElement([0, 15, 30]));
                TimeEntry::query()->create([
                    'user_id' => $person->id,
                    'brigade_id' => $brigadeId,
                    'work_object_id' => $object->id,
                    'started_at' => $startedAt,
                    'ended_at' => null,
                    'break_minutes' => 0,
                    'worked_minutes' => 0,
                ]);
            }
        }

        $advanceComments = [
            'Нужны деньги на продукты',
            'Оплата за квартиру',
            'Семейные расходы',
            'Срочно нужны средства',
            null,
            null,
        ];

        foreach ($workers as $i => $worker) {
            $rolls = fake()->numberBetween(0, 3);
            for ($r = 0; $r < $rolls; $r++) {
                $status = fake()->randomElement([
                    AdvanceStatus::Pending,
                    AdvanceStatus::Pending,
                    AdvanceStatus::Approved,
                    AdvanceStatus::Paid,
                    AdvanceStatus::Rejected,
                ]);

                $amount = fake()->randomElement([15000, 20000, 25000, 30000, 35000, 40000, 50000]);
                $created = now()->subDays(fake()->numberBetween(0, 12))->setTime(
                    fake()->numberBetween(9, 18),
                    fake()->numberBetween(0, 59),
                );

                $payload = [
                    'user_id' => $worker->id,
                    'amount' => $amount,
                    'comment' => fake()->randomElement($advanceComments),
                    'status' => $status,
                    'created_at' => $created,
                    'updated_at' => $created,
                ];

                if (in_array($status, [AdvanceStatus::Approved, AdvanceStatus::Paid, AdvanceStatus::Rejected], true)) {
                    $payload['reviewed_by'] = $manager->id;
                    $payload['reviewed_at'] = $created->copy()->addHours(2);
                    $payload['review_comment'] = $status === AdvanceStatus::Rejected
                        ? 'Недостаточно отработанных часов'
                        : null;
                }

                if ($status === AdvanceStatus::Paid) {
                    $payload['paid_by'] = $accountant->id;
                    $payload['paid_at'] = $created->copy()->addDay();
                }

                AdvanceRequest::query()->create($payload);
            }
        }

        // Guarantee a few pending advances for demos
        foreach (collect($workers)->random(4) as $worker) {
            AdvanceRequest::query()->create([
                'user_id' => $worker->id,
                'amount' => fake()->randomElement([20000, 30000, 40000]),
                'comment' => 'Нужен аванс',
                'status' => AdvanceStatus::Pending,
            ]);
        }

        foreach (collect($workers)->random(8) as $worker) {
            Payment::query()->create([
                'user_id' => $worker->id,
                'amount' => fake()->randomElement([80000, 100000, 120000, 150000]),
                'paid_on' => now()->subDays(fake()->numberBetween(3, 20))->toDateString(),
                'paid_by' => $accountant->id,
                'period' => now()->subMonth()->format('m.Y'),
                'comment' => 'Выплата зарплаты',
                'work_object_id' => $objects[(int) $worker->brigade_id]->id ?? null,
            ]);
        }
    }
}
