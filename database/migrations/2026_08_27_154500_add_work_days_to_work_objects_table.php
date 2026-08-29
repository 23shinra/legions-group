<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('work_objects', function (Blueprint $table): void {
            $table->unsignedSmallInteger('work_days')->nullable()->after('planned_end_date');
        });

        foreach (DB::table('work_objects')->get() as $object) {
            $days = 30;

            if ($object->start_date && $object->planned_end_date) {
                $days = max(1, (int) \Carbon\Carbon::parse($object->start_date)
                    ->diffInDays(\Carbon\Carbon::parse($object->planned_end_date)));
            }

            DB::table('work_objects')
                ->where('id', $object->id)
                ->update(['work_days' => $days]);
        }
    }

    public function down(): void
    {
        Schema::table('work_objects', function (Blueprint $table): void {
            $table->dropColumn('work_days');
        });
    }
};
