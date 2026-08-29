<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Enums\UserRole;
use App\Models\AdvanceRequest;
use App\Models\TimeEntry;
use App\Models\User;
use App\Services\RosterInstaller;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

final class RosterSeederTest extends TestCase
{
    use RefreshDatabase;

    public function test_seed_creates_the_live_roster_without_demo_history(): void
    {
        $this->seed();

        $this->assertSame('Аширов Ислам', User::query()->where('email', 'islam.ashirov')->value('name'));
        $this->assertSame('Пархатова Рамиля', User::query()->where('email', 'ramilya.parhatova')->value('name'));
        $this->assertSame(RosterInstaller::brigadierNames(), User::query()
            ->where('role', UserRole::Brigadier)
            ->orderBy('id')
            ->pluck('name')
            ->all());
        $this->assertSame(RosterInstaller::workerNames(), User::query()
            ->where('role', UserRole::Worker)
            ->orderBy('id')
            ->pluck('name')
            ->all());
        $this->assertSame(19, User::query()->count());
        $this->assertSame(19, User::query()->distinct('email')->count('email'));
        $this->assertTrue(Hash::check(RosterInstaller::INITIAL_PASSWORD, (string) User::query()->where('email', 'islam.ashirov')->value('password')));
        $this->assertFalse(Hash::check('123', (string) User::query()->where('email', 'islam.ashirov')->value('password')));
        $this->assertSame(0, TimeEntry::query()->count());
        $this->assertSame(0, AdvanceRequest::query()->count());
        $this->assertDatabaseMissing('users', ['name' => 'Иван Петров']);
        $this->assertDatabaseMissing('users', ['name' => 'Бригадир Нурлан']);
    }
}
