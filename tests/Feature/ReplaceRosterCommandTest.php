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

final class ReplaceRosterCommandTest extends TestCase
{
    use RefreshDatabase;

    public function test_replace_wipes_demo_records_and_writes_the_live_roster(): void
    {
        $this->seed();

        $worker = $this->rosterUser('dilmurat.ashirov');

        TimeEntry::query()->create([
            'user_id' => $worker->id,
            'brigade_id' => $worker->brigade_id,
            'started_at' => now()->subHours(8),
            'ended_at' => now(),
            'break_minutes' => 60,
            'worked_minutes' => 420,
        ]);

        AdvanceRequest::query()->create([
            'user_id' => $worker->id,
            'amount' => 20000,
            'comment' => 'Демо',
        ]);

        $this->artisan('roster:replace', ['--force' => true])->assertSuccessful();

        $this->assertSame(0, TimeEntry::query()->count());
        $this->assertSame(0, AdvanceRequest::query()->count());
        $this->assertSame('Аширов Дильмурат', User::query()->where('email', 'dilmurat.ashirov')->value('name'));
        $this->assertSame(count(RosterInstaller::workerNames()), User::query()->where('role', UserRole::Worker)->count());
    }
}
