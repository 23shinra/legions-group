<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Enums\PayType;
use App\Enums\UserRole;
use App\Models\Brigade;
use App\Models\User;
use App\Notifications\AssignedToBrigade;
use App\Notifications\Channels\QuietWebPushChannel;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

final class BrigadeAssignmentNotificationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed();
    }

    public function test_attaching_a_worker_sends_them_a_brigade_assignment_notification(): void
    {
        Notification::fake();

        $manager = $this->rosterUser('islam.ashirov');
        $brigade = $this->abdurasitovBrigade();
        $worker = User::factory()->create([
            'role' => UserRole::Worker,
            'brigade_id' => null,
            'is_active' => true,
            'name' => 'Петров Иван',
            'first_name' => 'Иван',
            'last_name' => 'Петров',
        ]);

        $this->actingAs($manager)
            ->from(route('manager.brigades.show', $brigade))
            ->post(route('manager.brigades.members.store', $brigade), [
                'user_id' => $worker->id,
            ])
            ->assertRedirect(route('manager.brigades.show', $brigade));

        $this->assertSame($brigade->id, $worker->fresh()->brigade_id);

        Notification::assertSentTo($worker, AssignedToBrigade::class, function (AssignedToBrigade $notification) use ($worker): bool {
            $payload = $notification->toArray($worker);

            return $payload['message'] === 'Вас прикрепили к бригаде Абдурашитов Ильяр'
                && $payload['url'] === '/worker'
                && in_array(QuietWebPushChannel::class, $notification->via($worker), true);
        });
    }

    public function test_attaching_a_worker_already_in_the_brigade_does_not_notify(): void
    {
        Notification::fake();

        $manager = $this->rosterUser('islam.ashirov');
        $brigade = $this->abdurasitovBrigade();
        $worker = User::factory()->create([
            'role' => UserRole::Worker,
            'brigade_id' => $brigade->id,
            'is_active' => true,
        ]);

        $this->actingAs($manager)
            ->post(route('manager.brigades.members.store', $brigade), [
                'user_id' => $worker->id,
            ])
            ->assertRedirect();

        Notification::assertNotSentTo($worker, AssignedToBrigade::class);
    }

    public function test_changing_a_worker_brigade_on_the_employee_card_notifies_them(): void
    {
        Notification::fake();

        $manager = $this->rosterUser('islam.ashirov');
        $brigade = $this->abdurasitovBrigade();
        $other = Brigade::query()->whereKeyNot($brigade->id)->firstOrFail();
        $worker = User::factory()->create([
            'role' => UserRole::Worker,
            'brigade_id' => $other->id,
            'is_active' => true,
            'name' => 'Петров Иван',
            'pay_type' => PayType::Hourly,
            'rate' => 1500,
        ]);

        $this->actingAs($manager)
            ->from(route('manager.employees.show', $worker))
            ->patch(route('manager.employees.update', $worker), [
                'name' => $worker->name,
                'phone' => $worker->phone,
                'brigade_id' => $brigade->id,
                'position' => $worker->position ?? 'Подсобник',
                'pay_type' => PayType::Hourly->value,
                'rate' => 1500,
            ])
            ->assertRedirect(route('manager.employees.show', $worker));

        Notification::assertSentTo($worker, AssignedToBrigade::class);
    }

    public function test_attaching_a_brigadier_does_not_notify_them(): void
    {
        Notification::fake();

        $manager = $this->rosterUser('islam.ashirov');
        $brigade = $this->abdurasitovBrigade();
        $brigadier = User::factory()->create([
            'role' => UserRole::Brigadier,
            'brigade_id' => null,
            'is_active' => true,
            'name' => 'Сидоров Пётр',
        ]);

        $this->actingAs($manager)
            ->post(route('manager.brigades.members.store', $brigade), [
                'user_id' => $brigadier->id,
            ])
            ->assertRedirect();

        Notification::assertNotSentTo($brigadier, AssignedToBrigade::class);
    }

    private function abdurasitovBrigade(): Brigade
    {
        return Brigade::query()
            ->whereHas('brigadier', fn ($query) => $query->where('last_name', 'Абдурашитов'))
            ->firstOrFail();
    }
}
