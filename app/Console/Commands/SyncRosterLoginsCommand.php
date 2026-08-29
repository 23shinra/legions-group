<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Models\User;
use App\Services\RosterInstaller;
use Illuminate\Console\Command;

final class SyncRosterLoginsCommand extends Command
{
    protected $signature = 'roster:sync-logins {--dry-run : Show matches without updating}';

    protected $description = 'Update existing roster users to real logins and password without wiping data';

    public function handle(RosterInstaller $installer): int
    {
        if ($this->option('dry-run')) {
            foreach (RosterInstaller::accounts() as $entry) {
                $exists = User::query()->where('name', $entry['name'])->exists();
                $this->line(sprintf(
                    '%s → %s (%s)',
                    $entry['name'],
                    $entry['login'],
                    $exists ? 'found' : 'MISSING',
                ));
            }

            return self::SUCCESS;
        }

        $updated = $installer->syncLoginsInPlace();

        $this->info("Updated {$updated} accounts.");

        return self::SUCCESS;
    }
}
