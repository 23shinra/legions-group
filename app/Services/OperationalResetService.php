<?php

declare(strict_types=1);

namespace App\Services;

use App\Enums\UserRole;
use App\Models\ActivityLog;
use App\Models\AdvanceRequest;
use App\Models\SalaryHistory;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;

final class OperationalResetService
{
    /**
     * @return array<string, int>
     */
    public function clear(User $manager): array
    {
        $counts = [
            'payments' => 0,
            'advances' => 0,
            'time_entries' => 0,
            'objects' => 0,
            'activity_logs' => 0,
        ];

        DB::transaction(function () use ($manager, &$counts): void {
            $this->deleteAdvanceReceipts();

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
            ] as $table) {
                if (! Schema::hasTable($table)) {
                    continue;
                }

                $deleted = DB::table($table)->delete();

                if ($table === 'payments') {
                    $counts['payments'] = $deleted;
                } elseif ($table === 'advance_requests') {
                    $counts['advances'] = $deleted;
                } elseif ($table === 'time_entries') {
                    $counts['time_entries'] = $deleted;
                } elseif ($table === 'activity_logs') {
                    $counts['activity_logs'] = $deleted;
                }
            }

            if (Schema::hasTable('work_objects')) {
                $counts['objects'] = DB::table('work_objects')->delete();
            }

            Schema::enableForeignKeyConstraints();

            $this->seedSalaryBaselines($manager);
            ActivityLog::record($manager, 'operational.reset', $manager, [
                'cleared' => $counts,
            ]);
        });

        return $counts;
    }

    private function deleteAdvanceReceipts(): void
    {
        AdvanceRequest::query()
            ->whereNotNull('payment_receipt_path')
            ->pluck('payment_receipt_path')
            ->each(function (string $path): void {
                Storage::disk('public')->delete($path);
            });
    }

    private function seedSalaryBaselines(User $manager): void
    {
        User::query()
            ->whereIn('role', [UserRole::Worker, UserRole::Brigadier])
            ->each(function (User $employee) use ($manager): void {
                SalaryHistory::query()->create([
                    'user_id' => $employee->id,
                    'rate' => $employee->rate,
                    'pay_type' => $employee->pay_type,
                    'effective_from' => $employee->hired_at ?? now()->toDateString(),
                    'note' => 'Базовая ставка после очистки',
                    'changed_by' => $manager->id,
                ]);
            });
    }
}
