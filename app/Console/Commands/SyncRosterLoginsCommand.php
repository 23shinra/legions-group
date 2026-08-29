<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Models\User;
use App\Services\RosterInstaller;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Auth;

final class SyncRosterLoginsCommand extends Command
{
    protected $signature = 'roster:sync-logins {--dry-run : Show matches without updating}';

    protected $description = 'Update existing roster users to real logins and password without wiping data';

    public function handle(RosterInstaller $installer): int
    {
        if ($this->option('dry-run')) {
            foreach (RosterInstaller::accounts() as $entry) {
                $user = $installer->findUserForEntry($entry);
                $this->line(sprintf(
                    '%s → %s (%s)',
                    $entry['name'],
                    $entry['login'],
                    $user !== null ? "found as {$user->email}" : 'MISSING',
                ));
            }

            return self::SUCCESS;
        }

        $updated = $installer->syncLoginsInPlace();

        $this->info("Updated {$updated} accounts.");

        foreach (RosterInstaller::accounts() as $entry) {
            $authOk = Auth::attempt([
                'email' => $entry['login'],
                'password' => RosterInstaller::INITIAL_PASSWORD,
            ]);
            Auth::logout();

            $this->line(sprintf(
                '%s / %s: %s',
                $entry['login'],
                RosterInstaller::INITIAL_PASSWORD,
                $authOk ? 'OK' : 'FAIL',
            ));
        }

        $missing = collect(RosterInstaller::accounts())
            ->filter(fn (array $entry): bool => $installer->findUserForEntry($entry) === null)
            ->pluck('name');

        if ($missing->isNotEmpty()) {
            $this->warn('Missing: '.$missing->implode(', '));
        }

        $this->info('Users in DB: '.User::query()->count());

        return self::SUCCESS;
    }
}
