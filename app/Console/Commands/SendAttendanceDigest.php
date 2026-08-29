<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Services\AttendanceDigestService;
use Illuminate\Console\Command;

final class SendAttendanceDigest extends Command
{
    protected $signature = 'attendance:digest';

    protected $description = 'Уведомить бригадиров и руководителя о невыходах и опозданиях';

    public function handle(AttendanceDigestService $digest): int
    {
        $result = $digest->run();

        $this->info(sprintf(
            'Не вышли: %d. Опоздали: %d.',
            $result['absent'],
            $result['late'],
        ));

        return self::SUCCESS;
    }
}
