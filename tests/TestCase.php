<?php

namespace Tests;

use App\Enums\ObjectStatus;
use App\Enums\UserRole;
use App\Models\ObjectAssignment;
use App\Models\User;
use App\Models\WorkObject;
use Illuminate\Foundation\Testing\TestCase as BaseTestCase;

abstract class TestCase extends BaseTestCase
{
    protected function rosterUser(string $login): User
    {
        return User::query()->where('email', $login)->firstOrFail();
    }

    protected function userByRole(UserRole $role): User
    {
        return User::query()->where('role', $role)->firstOrFail();
    }

    protected function firstWorker(): User
    {
        return User::query()
            ->where('role', UserRole::Worker)
            ->orderBy('id')
            ->firstOrFail();
    }

    protected function ensureActiveObject(User $worker): WorkObject
    {
        $worker->loadMissing('brigade');
        $brigade = $worker->brigade;

        $this->assertNotNull($brigade);

        $object = $brigade->activeObject() ?? WorkObject::query()->create([
            'name' => 'Тестовый объект',
            'address' => 'Тест',
            'start_date' => now()->subWeek()->toDateString(),
            'brigade_id' => $brigade->id,
            'status' => ObjectStatus::Active,
        ]);

        ObjectAssignment::query()->firstOrCreate([
            'user_id' => $worker->id,
            'work_object_id' => $object->id,
            'ended_on' => null,
        ], [
            'started_on' => $object->start_date,
        ]);

        return $object;
    }
}
