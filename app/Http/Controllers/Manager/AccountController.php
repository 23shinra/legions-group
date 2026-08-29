<?php

declare(strict_types=1);

namespace App\Http\Controllers\Manager;

use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\AccountService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

final class AccountController extends Controller
{
    public function index(Request $request, AccountService $accounts): Response
    {
        return Inertia::render('Manager/Accounts/Index', [
            'accounts' => $accounts->list($request->string('q')->toString() ?: null)
                ->load('brigade')
                ->map(fn (User $user): array => $this->accountPayload($user))
                ->values()
                ->all(),
            'filters' => [
                'q' => $request->string('q')->toString(),
            ],
            'status' => session('status'),
        ]);
    }

    public function edit(User $account): Response
    {
        $account->load('brigade');

        return Inertia::render('Manager/Accounts/Edit', [
            'account' => $this->accountPayload($account),
            'roles' => collect(UserRole::cases())->map(fn (UserRole $role): array => [
                'value' => $role->value,
                'label' => $role->label(),
            ])->values()->all(),
            'status' => session('status'),
        ]);
    }

    public function update(Request $request, User $account, AccountService $accounts): RedirectResponse
    {
        $data = $request->validate([
            'first_name' => ['required', 'string', 'max:255'],
            'last_name' => ['nullable', 'string', 'max:255'],
            'name' => ['required', 'string', 'max:255'],
            'email' => [
                'required',
                'string',
                'max:255',
                Rule::unique('users', 'email')->ignore($account->id),
            ],
            'phone' => ['nullable', 'string', 'max:30'],
            'role' => ['required', Rule::enum(UserRole::class)],
            'is_active' => ['boolean'],
        ]);

        $accounts->update($account, $data, $request->user());

        return redirect()
            ->route('manager.accounts.edit', $account)
            ->with('status', 'account-updated');
    }

    public function updatePassword(Request $request, User $account, AccountService $accounts): RedirectResponse
    {
        $data = $request->validate([
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ]);

        $accounts->updatePassword($account, $data['password']);

        return back()->with('status', 'account-password-updated');
    }

    /**
     * @return array<string, mixed>
     */
    private function accountPayload(User $user): array
    {
        return [
            'id' => $user->id,
            'name' => $user->name,
            'first_name' => $user->first_name,
            'last_name' => $user->last_name,
            'email' => $user->email,
            'phone' => $user->phone,
            'role' => $user->role->value,
            'role_label' => $user->role->label(),
            'is_active' => $user->is_active,
            'brigade' => $user->brigade?->only(['id', 'name']),
        ];
    }
}
