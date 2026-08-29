<?php

declare(strict_types=1);

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

final class AccountManagerTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed();
    }

    public function test_manager_can_list_all_accounts(): void
    {
        $manager = $this->rosterUser('islam.ashirov');

        $this->actingAs($manager)
            ->get(route('manager.accounts.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Manager/Accounts/Index')
                ->has('accounts', 19));
    }

    public function test_manager_can_update_account_login_role_and_active_state(): void
    {
        $manager = $this->rosterUser('islam.ashirov');
        $worker = $this->firstWorker();

        $this->actingAs($manager)
            ->patch(route('manager.accounts.update', $worker), [
                'first_name' => 'Тест',
                'last_name' => 'Рабочий',
                'name' => 'Рабочий Тест',
                'email' => 'test.worker',
                'phone' => '+77001112233',
                'role' => 'worker',
                'is_active' => false,
            ])
            ->assertRedirect(route('manager.accounts.edit', $worker));

        $worker->refresh();

        $this->assertSame('test.worker', $worker->email);
        $this->assertFalse($worker->is_active);
        $this->assertNotNull($worker->brigade_id);
    }

    public function test_manager_can_set_account_password(): void
    {
        $manager = $this->rosterUser('islam.ashirov');
        $worker = $this->firstWorker();

        $this->actingAs($manager)
            ->patch(route('manager.accounts.password', $worker), [
                'password' => 'new-password-1',
                'password_confirmation' => 'new-password-1',
            ])
            ->assertRedirect();

        $this->assertTrue(Hash::check('new-password-1', (string) $worker->fresh()->password));
    }

    public function test_manager_cannot_deactivate_self(): void
    {
        $manager = $this->rosterUser('islam.ashirov');

        $this->actingAs($manager)
            ->from(route('manager.accounts.edit', $manager))
            ->patch(route('manager.accounts.update', $manager), [
                'first_name' => 'Ислам',
                'last_name' => 'Аширов',
                'name' => 'Аширов Ислам',
                'email' => 'islam.ashirov',
                'phone' => null,
                'role' => 'manager',
                'is_active' => false,
            ])
            ->assertSessionHasErrors('is_active');
    }

    public function test_accountant_and_worker_cannot_access_account_manager(): void
    {
        $accountant = $this->rosterUser('ramilya.parhatova');
        $worker = $this->firstWorker();

        $this->actingAs($accountant)
            ->get(route('manager.accounts.index'))
            ->assertForbidden();

        $this->actingAs($worker)
            ->get(route('manager.accounts.index'))
            ->assertForbidden();
    }
}
