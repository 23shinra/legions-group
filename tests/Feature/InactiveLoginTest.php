<?php

declare(strict_types=1);

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

final class InactiveLoginTest extends TestCase
{
    use RefreshDatabase;

    public function test_inactive_user_cannot_log_in(): void
    {
        $this->seed();

        $worker = $this->firstWorker();
        $worker->update(['is_active' => false]);

        $this->post('/login', [
            'email' => $worker->email,
            'password' => 'password',
        ]);

        $this->assertGuest();
    }
}
