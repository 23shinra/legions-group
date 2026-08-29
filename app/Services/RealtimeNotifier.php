<?php

declare(strict_types=1);

namespace App\Services;

use App\Enums\UserRole;
use App\Models\User;
use App\Notifications\LiveRefresh;
use Illuminate\Support\Collection;

final readonly class RealtimeNotifier
{
    /**
     * @param  iterable<User|int|null>  $users
     */
    public function ping(iterable $users, string $event, ?int $exceptId = null): void
    {
        $exceptId ??= $this->actorId();

        $ids = Collection::make($users)
            ->map(static function (User|int|null $user): int {
                if ($user instanceof User) {
                    return (int) $user->id;
                }

                return (int) $user;
            })
            ->filter(static fn (int $id): bool => $id > 0 && $id !== $exceptId)
            ->unique()
            ->values();

        if ($ids->isEmpty()) {
            return;
        }

        User::query()
            ->whereIn('id', $ids)
            ->where('is_active', true)
            ->get()
            ->each(fn (User $user) => $user->notify(new LiveRefresh($event)));
    }

    /**
     * @param  list<UserRole>  $roles
     */
    public function pingRoles(array $roles, string $event, ?int $exceptId = null): void
    {
        $exceptId ??= $this->actorId();

        $query = User::query()
            ->whereIn('role', $roles)
            ->where('is_active', true);

        if ($exceptId !== null) {
            $query->whereKeyNot($exceptId);
        }

        $query->get()->each(fn (User $user) => $user->notify(new LiveRefresh($event)));
    }

    public function pingAround(User $employee, string $event, ?int $exceptId = null): void
    {
        $employee->loadMissing('brigade.brigadier');

        $this->ping([
            $employee,
            $employee->brigade?->brigadier,
        ], $event, $exceptId);

        $this->pingRoles([UserRole::Manager], $event, $exceptId);
    }

    private function actorId(): ?int
    {
        $id = auth()->id();

        return $id !== null ? (int) $id : null;
    }
}
