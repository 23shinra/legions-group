<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\User;
use App\Services\RosterInstaller;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

final class SyncRosterLoginsCommandTest extends TestCase
{
    use RefreshDatabase;

    public function test_sync_logins_updates_existing_users_in_place(): void
    {
        $this->seed();

        $managerId = (int) User::query()->where('name', 'Аширов Ислам')->value('id');

        User::query()->whereKey($managerId)->update([
            'email' => 'manager',
            'password' => Hash::make('123'),
        ]);

        $this->artisan('roster:sync-logins')->assertSuccessful();

        $manager = User::query()->findOrFail($managerId);

        $this->assertSame('islam.ashirov', $manager->email);
        $this->assertSame('Ислам', $manager->first_name);
        $this->assertSame('Аширов', $manager->last_name);
        $this->assertTrue(Hash::check(RosterInstaller::INITIAL_PASSWORD, (string) $manager->password));
    }

    public function test_sync_logins_falls_back_to_legacy_worker_email(): void
    {
        $this->seed();

        User::query()->where('email', 'eldanis.aytaev')->update(['email' => 'worker5']);

        $this->artisan('roster:sync-logins')->assertSuccessful();

        $this->assertSame('eldanis.aytaev', User::query()->where('name', 'Айтаев Эльданис')->value('email'));
    }
}
