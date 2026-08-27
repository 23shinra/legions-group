<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

final class RpmAuthTest extends TestCase
{
    use RefreshDatabase;

    public function test_manager_can_open_dashboard(): void
    {
        $this->seed();

        $manager = User::query()->where('email', 'manager')->firstOrFail();

        $this->actingAs($manager)
            ->get(route('manager.dashboard'))
            ->assertOk();
    }

    public function test_worker_can_open_home(): void
    {
        $this->seed();

        $worker = User::query()->where('email', 'worker1')->firstOrFail();

        $this->actingAs($worker)
            ->get(route('worker.home'))
            ->assertOk();
    }

    public function test_worker_cannot_open_manager_dashboard(): void
    {
        $this->seed();

        $worker = User::query()->where('email', 'worker1')->firstOrFail();

        $this->actingAs($worker)
            ->get(route('manager.dashboard'))
            ->assertForbidden();
    }
}
