<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\TimeEntry;
use App\Models\User;
use App\Models\WorkObject;
use App\Notifications\AdvanceApprovedForPayment;
use App\Notifications\AdvanceStatusChanged;
use App\Notifications\ArrivalConfirmationRequested;
use App\Notifications\Events\ImmediateBroadcastNotificationCreated;
use App\Notifications\LiveRefresh;
use App\Notifications\NewAdvanceRequest;
use App\Services\AdvanceService;
use App\Services\TimeTrackingService;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

final class RealtimeNotificationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed();
    }

    public function test_arrival_request_notifies_brigadier_and_managers(): void
    {
        Notification::fake();

        $worker = User::query()->where('email', 'worker1')->firstOrFail();
        $brigadier = $worker->brigade?->brigadier;
        $manager = User::query()->where('email', 'manager')->firstOrFail();

        $this->assertNotNull($brigadier);

        app(TimeTrackingService::class)->requestArrival($worker);

        Notification::assertSentTo($brigadier, ArrivalConfirmationRequested::class);
        Notification::assertSentTo($manager, LiveRefresh::class);

        $notification = new ArrivalConfirmationRequested($worker->pendingTimeEntry());
        $this->assertContains('broadcast', $notification->via($brigadier));
    }

    public function test_advance_request_notifies_managers_accountants_and_brigadier(): void
    {
        Notification::fake();

        $worker = User::query()->where('email', 'worker1')->firstOrFail();
        $this->seedConfirmedShift($worker);

        $manager = User::query()->where('email', 'manager')->firstOrFail();
        $accountant = User::query()->where('email', 'accountant')->firstOrFail();
        $brigadier = $worker->brigade?->brigadier;

        $this->assertNotNull($brigadier);

        $eligibility = app(AdvanceService::class)->eligibility($worker);
        $amount = min(10_000.0, (float) $eligibility['available_for_advance']);

        $this->assertTrue($eligibility['can_request']);
        $this->assertGreaterThan(0, $amount);

        app(AdvanceService::class)->request($worker, $amount, 'Тестовый аванс');

        Notification::assertSentTo($manager, NewAdvanceRequest::class);
        Notification::assertSentTo($accountant, NewAdvanceRequest::class);
        Notification::assertSentTo($brigadier, NewAdvanceRequest::class);

        $advance = $worker->advanceRequests()->latest()->firstOrFail();
        $notification = new NewAdvanceRequest($advance);

        $this->assertContains('broadcast', $notification->via($manager));
        $this->assertContains('broadcast', $notification->via($brigadier));
    }

    public function test_advance_approval_notifies_worker_accountants_and_watchers(): void
    {
        $worker = User::query()->where('email', 'worker1')->firstOrFail();
        $this->seedConfirmedShift($worker);

        $manager = User::query()->where('email', 'manager')->firstOrFail();
        $accountant = User::query()->where('email', 'accountant')->firstOrFail();
        $brigadier = $worker->brigade?->brigadier;

        $this->assertNotNull($brigadier);

        $eligibility = app(AdvanceService::class)->eligibility($worker);
        $amount = min(10_000.0, (float) $eligibility['available_for_advance']);

        $this->assertTrue($eligibility['can_request']);
        $this->assertGreaterThan(0, $amount);

        $advance = app(AdvanceService::class)->request($worker, $amount, 'На тест');

        Notification::fake();

        app(AdvanceService::class)->approve($advance, $manager);

        Notification::assertSentTo($worker, AdvanceStatusChanged::class);
        Notification::assertSentTo($accountant, AdvanceApprovedForPayment::class);
        Notification::assertSentTo($brigadier, LiveRefresh::class);
        Notification::assertSentTo($manager, LiveRefresh::class);
    }

    public function test_immediate_broadcast_event_is_not_queued(): void
    {
        $worker = User::query()->where('email', 'worker1')->firstOrFail();
        $entry = $worker->pendingTimeEntry();

        if ($entry === null) {
            app(TimeTrackingService::class)->requestArrival($worker);
            $entry = $worker->fresh()->pendingTimeEntry();
        }

        $this->assertNotNull($entry);

        $notification = new ArrivalConfirmationRequested($entry);
        $event = new ImmediateBroadcastNotificationCreated(
            $worker,
            $notification,
            $notification->toArray($worker),
        );

        $this->assertInstanceOf(ShouldBroadcastNow::class, $event);
    }

    private function seedConfirmedShift(User $worker): WorkObject
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

        return $object;
    }
}
