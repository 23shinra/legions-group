<?php

declare(strict_types=1);

namespace App\Services;

use App\Enums\UserRole;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

final readonly class AccountService
{
    /**
     * @return Collection<int, User>
     */
    public function list(?string $query = null): Collection
    {
        return User::query()
            ->when($query !== null && trim($query) !== '', function (Builder $builder) use ($query): void {
                $term = '%'.Str::lower(trim($query)).'%';

                $builder->where(function (Builder $inner) use ($term): void {
                    $inner->whereRaw('LOWER(name) LIKE ?', [$term])
                        ->orWhereRaw('LOWER(email) LIKE ?', [$term])
                        ->orWhereRaw('LOWER(COALESCE(first_name, \'\')) LIKE ?', [$term])
                        ->orWhereRaw('LOWER(COALESCE(last_name, \'\')) LIKE ?', [$term]);
                });
            })
            ->orderBy('name')
            ->get();
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(User $account, array $data, User $manager): User
    {
        $newRole = UserRole::from((string) $data['role']);

        if ($account->is($manager)) {
            if ($newRole !== $manager->role) {
                throw ValidationException::withMessages([
                    'role' => 'Нельзя менять свою роль.',
                ]);
            }

            if (array_key_exists('is_active', $data) && ! (bool) $data['is_active']) {
                throw ValidationException::withMessages([
                    'is_active' => 'Нельзя деактивировать свой аккаунт.',
                ]);
            }
        }

        $payload = [
            'first_name' => (string) $data['first_name'],
            'last_name' => $data['last_name'] !== null && $data['last_name'] !== ''
                ? (string) $data['last_name']
                : null,
            'name' => (string) $data['name'],
            'email' => Str::lower(trim((string) $data['email'])),
            'phone' => $data['phone'] ?? null,
            'role' => $newRole,
            'is_active' => (bool) ($data['is_active'] ?? true),
        ];

        if (in_array($newRole, [UserRole::Worker, UserRole::Brigadier], true)) {
            $payload['brigade_id'] = $account->brigade_id;
        }

        $account->update($payload);

        return $account->fresh();
    }

    public function updatePassword(User $account, string $password): void
    {
        $account->update([
            'password' => $password,
        ]);
    }
}
