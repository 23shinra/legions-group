<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('phone')->nullable()->after('email');
            $table->string('role')->default('worker')->after('phone');
            $table->unsignedBigInteger('brigade_id')->nullable()->after('role');
            $table->string('position')->nullable()->after('brigade_id');
            $table->string('pay_type')->default('hourly')->after('position');
            $table->decimal('rate', 12, 2)->default(0)->after('pay_type');
            $table->decimal('max_advance', 12, 2)->nullable()->after('rate');
            $table->date('hired_at')->nullable()->after('max_advance');
            $table->boolean('is_active')->default(true)->after('hired_at');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'phone',
                'role',
                'brigade_id',
                'position',
                'pay_type',
                'rate',
                'max_advance',
                'hired_at',
                'is_active',
            ]);
        });
    }
};
