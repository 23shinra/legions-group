<?php

declare(strict_types=1);

use App\Enums\PayType;
use App\Enums\UserRole;
use App\Support\PayDefaults;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::table('users')
            ->whereIn('role', [UserRole::Worker->value, UserRole::Brigadier->value])
            ->update([
                'pay_type' => PayType::Hourly->value,
                'rate' => PayDefaults::hourlyRate(),
            ]);
    }

    public function down(): void
    {
        // Ставки до стандартизации не восстанавливаем.
    }
};
