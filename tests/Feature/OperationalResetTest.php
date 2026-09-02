<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\AdvanceRequest;
use App\Models\Payment;
use App\Models\TimeEntry;
use App\Models\User;
use App\Models\WorkObject;
use App\Services\RosterInstaller;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

final class OperationalResetTest extends TestCase
{
    use RefreshDatabase;

    public function test_manager_can_clear_operational_data_with_password(): void
    {
        $this->seed();

        $manager = $this->rosterUser('islam.ashirov');
        $worker = $this->firstWorker();

        Payment::query()->create([
            'user_id' => $worker->id,
            'amount' => 50_000,
            'paid_on' => now()->toDateString(),
            'paid_by' => $manager->id,
        ]);

        AdvanceRequest::query()->create([
            'user_id' => $worker->id,
            'amount' => 10_000,
            'status' => 'pending',
        ]);

        TimeEntry::query()->create([
            'user_id' => $worker->id,
            'started_at' => now()->subHours(8),
            'ended_at' => now(),
            'worked_minutes' => 480,
        ]);

        $this->assertGreaterThan(0, Payment::query()->count());
        $this->assertGreaterThan(0, AdvanceRequest::query()->count());
        $this->assertGreaterThan(0, TimeEntry::query()->count());

        $response = $this->actingAs($manager)
            ->post(route('manager.operational-reset'), [
                'password' => RosterInstaller::INITIAL_PASSWORD,
                'confirm' => true,
            ]);

        $response->assertRedirect(route('manager.dashboard'));
        $this->assertSame(0, Payment::query()->count());
        $this->assertSame(0, AdvanceRequest::query()->count());
        $this->assertSame(0, TimeEntry::query()->count());
        $this->assertSame(0, WorkObject::query()->count());
        $this->assertSame(19, User::query()->count());
    }

    public function test_manager_cannot_clear_operational_data_with_wrong_password(): void
    {
        $this->seed();

        $manager = $this->rosterUser('islam.ashirov');

        $this->actingAs($manager)
            ->post(route('manager.operational-reset'), [
                'password' => 'wrong-password',
                'confirm' => true,
            ])
            ->assertSessionHasErrors('password');
    }

    public function test_worker_cannot_clear_operational_data(): void
    {
        $this->seed();

        $worker = $this->firstWorker();

        $this->actingAs($worker)
            ->post(route('manager.operational-reset'), [
                'password' => RosterInstaller::INITIAL_PASSWORD,
                'confirm' => true,
            ])
            ->assertForbidden();
    }
}
