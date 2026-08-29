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
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;

final class RosterInstaller
{
    public const PASSWORD = '123';

    /**
     * @return list<string>
     */
    public static function workerNames(): array
    {
        return [
            'Аширов Дильмурат',
            'Нурузов Абдулла',
            'Садыров Ришат',
            'Изияров Диля',
            'Айтаев Эльданиз',
            'Алимбеков Алибек',
            'Рома',
            'Ахметов Дильмурат',
            'Турганов Амранжан',
            'Турганов Арафат',
            'Нурматов Ильяр',
            'Чернышов Константин',
            'Абдурахманов Дильмурат',
        ];
    }

    /**
     * @return list<string>
     */
    public static function brigadierNames(): array
    {
        return [
            'Кадыров Абдыкахар',
            'Абдурашитов Ильяр',
            'Нурматов Алижан',
            'Кадыров Турсун',
        ];
    }

    public function seed(): void
    {
        $password = Hash::make(self::PASSWORD);
        $hourlyRate = PayDefaults::hourlyRate();

        $manager = User::query()->create([
            'name' => 'Аширов Ислам',
            'email' => 'manager',
            'password' => $password,
            'role' => UserRole::Manager,
            'position' => 'Руководитель',
            'pay_type' => PayType::Fixed,
            'rate' => 0,
            'hired_at' => now(),
            'email_verified_at' => now(),
        ]);

        User::query()->create([
            'name' => 'Пархатова Рамиля',
            'email' => 'accountant',
            'password' => $password,
            'role' => UserRole::Accountant,
            'position' => 'Бухгалтер',
            'pay_type' => PayType::Fixed,
            'rate' => 0,
            'hired_at' => now(),
            'email_verified_at' => now(),
        ]);

        $brigadeNames = [
            'Бригада Кадырова А.',
            'Бригада Абдурашитова',
            'Бригада Нурматова',
            'Бригада Кадырова Т.',
        ];

        $brigades = [];

        foreach (self::brigadierNames() as $index => $name) {
            $brigadier = User::query()->create([
                'name' => $name,
                'email' => 'brigadier'.($index + 1),
                'password' => $password,
                'role' => UserRole::Brigadier,
                'position' => 'Бригадир',
                'pay_type' => PayType::Hourly,
                'rate' => $hourlyRate,
                'hired_at' => now(),
                'email_verified_at' => now(),
            ]);

            $brigade = Brigade::query()->create([
                'name' => $brigadeNames[$index],
                'brigadier_id' => $brigadier->id,
            ]);

            $brigadier->update(['brigade_id' => $brigade->id]);

            SalaryHistory::query()->create([
                'user_id' => $brigadier->id,
                'rate' => $hourlyRate,
                'pay_type' => PayType::Hourly,
                'effective_from' => $brigadier->hired_at,
                'note' => 'Стартовая ставка',
                'changed_by' => $manager->id,
            ]);

            $brigades[] = $brigade;
        }

        foreach (self::workerNames() as $index => $name) {
            $brigade = $brigades[$index % count($brigades)];

            $worker = User::query()->create([
                'name' => $name,
                'email' => 'worker'.($index + 1),
                'password' => $password,
                'role' => UserRole::Worker,
                'brigade_id' => $brigade->id,
                'position' => 'Строитель',
                'pay_type' => PayType::Hourly,
                'rate' => $hourlyRate,
                'hired_at' => now(),
                'email_verified_at' => now(),
            ]);

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
