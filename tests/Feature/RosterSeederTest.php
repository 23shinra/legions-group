<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Enums\UserRole;
use App\Models\AdvanceRequest;
use App\Models\TimeEntry;
use App\Models\User;
use App\Services\RosterInstaller;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

final class RosterSeederTest extends TestCase
{
    use RefreshDatabase;

    public function test_seed_creates_the_live_roster_without_demo_history(): void
    {
        $this->seed();

        $this->assertSame('Аширов Ислам', User::query()->where('email', 'manager')->value('name'));
        $this->assertSame('Пархатова Рамиля', User::query()->where('email', 'accountant')->value('name'));
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
        $this->assertSame(0, TimeEntry::query()->count());
        $this->assertSame(0, AdvanceRequest::query()->count());
        $this->assertDatabaseMissing('users', ['name' => 'Иван Петров']);
        $this->assertDatabaseMissing('users', ['name' => 'Бригадир Нурлан']);
    }
}
