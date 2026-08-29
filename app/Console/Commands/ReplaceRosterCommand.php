<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Services\RosterInstaller;
use Illuminate\Console\Command;

final class ReplaceRosterCommand extends Command
{
    protected $signature = 'roster:replace {--force : Confirm replacing all people and demo records}';

    protected $description = 'Удалить демо-данные и записать актуальный состав Legionis';

    public function handle(RosterInstaller $roster): int
    {
        if (! $this->option('force') && ! $this->confirm('Удалить всех текущих сотрудников и демо-записи?')) {
            return self::FAILURE;
        }

        $roster->replace();

        $this->info('Состав обновлён.');

        return self::SUCCESS;
    }
}
