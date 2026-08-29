<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Enums\AdvanceStatus;
use App\Models\TimeEntry;
use App\Models\User;
use App\Services\AdvanceService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

final class AdvanceActionReliabilityTest extends TestCase
{
    use RefreshDatabase;

    public function test_manager_advances_page_renders_when_push_subscriptions_table_is_missing(): void
    {
        $this->seed();
        Schema::dropIfExists('push_subscriptions');

        $manager = User::query()->where('email', 'manager')->firstOrFail();

        $this->actingAs($manager)
            ->get(route('manager.advances.index'))
            ->assertOk();
    }

    public function test_worker_can_request_an_advance_when_push_subscriptions_table_is_missing(): void
    {
        $this->seed();

        $worker = User::query()->where('email', 'worker1')->firstOrFail();
        $this->seedConfirmedShift($worker);
        Schema::dropIfExists('push_subscriptions');

        $amount = min(10_000.0, (float) app(AdvanceService::class)->eligibility($worker)['available_for_advance']);

        $this->assertGreaterThan(0, $amount);

        $this->actingAs($worker)
            ->from(route('worker.advances'))
            ->post(route('worker.advances.store'), [
                'amount' => $amount,
                'comment' => 'На карту',
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('advance_requests', [
            'user_id' => $worker->id,
            'status' => AdvanceStatus::Pending->value,
        ]);
    }

    public function test_manager_can_approve_an_advance_when_push_subscriptions_table_is_missing(): void
    {
        $this->seed();

        $worker = User::query()->where('email', 'worker1')->firstOrFail();
        $manager = User::query()->where('email', 'manager')->firstOrFail();
        $this->seedConfirmedShift($worker);

        $amount = min(10_000.0, (float) app(AdvanceService::class)->eligibility($worker)['available_for_advance']);
        $advance = app(AdvanceService::class)->request($worker, $amount, 'На тест');

        Schema::dropIfExists('push_subscriptions');

        $this->actingAs($manager)
            ->from(route('manager.advances.index'))
            ->post(route('manager.advances.approve', $advance))
            ->assertRedirect();

        $this->assertSame(AdvanceStatus::Approved, $advance->fresh()->status);
    }

    private function seedConfirmedShift(User $worker): void
    {
        $worker->loadMissing('brigade.brigadier');
        $object = $worker->brigade?->activeObject();

        $this->assertNotNull($object);

        $worker->advanceRequests()->delete();
        $worker->payments()->delete();

        TimeEntry::query()->create([
            'user_id' => $worker->id,
            'brigade_id' => $worker->brigade_id,
            'work_object_id' => $object->id,
            'started_at' => now()->subDays(2)->setTime(8, 0),
            'ended_at' => now()->subDays(2)->setTime(17, 0),
            'confirmed_at' => now()->subDays(2)->setTime(8, 15),
            'confirmed_by' => $worker->brigade?->brigadier_id,
            'break_minutes' => 60,
            'worked_minutes' => 480,
        ]);
    }
}
