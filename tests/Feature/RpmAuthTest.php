<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\User;
use App\Services\RosterInstaller;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

final class RpmAuthTest extends TestCase
{
    use RefreshDatabase;

    public function test_manager_can_open_dashboard(): void
    {
        $this->seed();

        $manager = $this->rosterUser('islam.ashirov');

        $this->actingAs($manager)
            ->get(route('manager.dashboard'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('Manager/Dashboard'));
    }

    public function test_worker_can_open_home(): void
    {
        $this->seed();

        $worker = $this->firstWorker();

        $this->actingAs($worker)
            ->get(route('worker.home'))
            ->assertOk();
    }

    public function test_worker_cannot_open_manager_dashboard(): void
    {
        $this->seed();

        $worker = $this->firstWorker();

        $this->actingAs($worker)
            ->get(route('manager.dashboard'))
            ->assertForbidden();
    }

    public function test_seeded_manager_can_login_with_initial_password(): void
    {
        $this->seed();

        $response = $this->post('/login', [
            'email' => 'islam.ashirov',
            'password' => RosterInstaller::INITIAL_PASSWORD,
        ]);

        $this->assertAuthenticated();
        $response->assertRedirect(route('dashboard', absolute: false));
    }

    public function test_seeded_manager_cannot_login_with_old_demo_password(): void
    {
        $this->seed();

        $response = $this->post('/login', [
            'email' => 'islam.ashirov',
            'password' => '123',
        ]);

        $this->assertGuest();
        $response->assertSessionHasErrors([
            'email' => 'Неправильный логин или пароль.',
        ]);
    }

    public function test_accountant_can_login_with_canonical_login(): void
    {
        $this->seed();

        $response = $this->post('/login', [
            'email' => 'ramilya.parhatova',
            'password' => RosterInstaller::INITIAL_PASSWORD,
        ]);

        $this->assertAuthenticatedAs($this->rosterUser('ramilya.parhatova'));
        $response->assertRedirect(route('dashboard', absolute: false));
    }

    public function test_accountant_can_login_with_legacy_login(): void
    {
        $this->seed();

        User::query()->where('email', 'ramilya.parhatova')->update(['email' => 'accountant']);

        $response = $this->post('/login', [
            'email' => 'ramilya.parhatova',
            'password' => RosterInstaller::INITIAL_PASSWORD,
        ]);

        $this->assertAuthenticated();
        $response->assertRedirect(route('dashboard', absolute: false));
    }

    public function test_legacy_accountant_alias_can_login(): void
    {
        $this->seed();

        User::query()->where('email', 'ramilya.parhatova')->update(['email' => 'accountant']);

        $response = $this->post('/login', [
            'email' => 'accountant',
            'password' => RosterInstaller::INITIAL_PASSWORD,
        ]);

        $this->assertAuthenticated();
        $response->assertRedirect(route('dashboard', absolute: false));
    }

    public function test_all_roster_accounts_can_login_with_initial_password(): void
    {
        $this->seed();

        foreach (RosterInstaller::accounts() as $entry) {
            $response = $this->post('/login', [
                'email' => $entry['login'],
                'password' => RosterInstaller::INITIAL_PASSWORD,
            ]);

            $this->assertAuthenticated();
            $response->assertRedirect(route('dashboard', absolute: false));

            auth()->logout();
        }
    }
}
