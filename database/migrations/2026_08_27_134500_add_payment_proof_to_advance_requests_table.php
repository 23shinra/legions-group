<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('advance_requests', function (Blueprint $table): void {
            $table->string('payment_method')->nullable()->after('paid_at');
            $table->string('payment_receipt_path')->nullable()->after('payment_method');
            $table->text('payment_note')->nullable()->after('payment_receipt_path');
        });
    }

    public function down(): void
    {
        Schema::table('advance_requests', function (Blueprint $table): void {
            $table->dropColumn(['payment_method', 'payment_receipt_path', 'payment_note']);
        });
    }
};
