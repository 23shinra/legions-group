<?php

declare(strict_types=1);

namespace App\Services;

use App\Enums\ObjectStatus;
use App\Enums\UserRole;
use App\Models\Brigade;
use App\Models\WorkObject;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

final readonly class ObjectService
{
    public function __construct(
        private ObjectAssignmentService $assignments,
        private RealtimeNotifier $realtime,
    ) {}

    /**
     * @param  array<string, mixed>  $data
     */
    public function create(array $data): WorkObject
    {
        $payload = $this->validate($data);
        $status = ObjectStatus::tryFrom((string) ($data['status'] ?? ObjectStatus::Active->value))
            ?? ObjectStatus::Active;

        if ($status === ObjectStatus::Closed) {
            $status = ObjectStatus::Active;
        }

        $object = DB::transaction(function () use ($payload, $status): WorkObject {
            $object = WorkObject::query()->create([
                ...$payload,
                'status' => $status,
            ]);

            if ($object->brigade_id) {
                $this->assignments->assignBrigadeMembersToObject($object);
            }

            return $object->fresh(['brigade']);
        });

        $this->pingObjectWatchers($object);

        return $object;
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(WorkObject $object, array $data): WorkObject
    {
        if ($object->isClosed()) {
            throw ValidationException::withMessages([
                'object' => 'Нельзя редактировать закрытый объект.',
            ]);
        }

        $payload = $this->validate($data, $object);
        $previousBrigadeId = $object->brigade_id;

        if (isset($data['status'])) {
            $status = ObjectStatus::tryFrom((string) $data['status']);
            if ($status !== null && $status !== ObjectStatus::Closed) {
                $payload['status'] = $status;
            }
        }

        $object = DB::transaction(function () use ($object, $payload, $previousBrigadeId): WorkObject {
            $object->update($payload);
            $object = $object->fresh(['brigade']);

            if (
                $object->brigade_id
                && (int) $object->brigade_id !== (int) $previousBrigadeId
            ) {
                $this->assignments->assignBrigadeMembersToObject($object);
            }

            return $object;
        });

        $this->pingObjectWatchers($object);

        return $object;
    }

    private function pingObjectWatchers(WorkObject $object): void
    {
        $object->loadMissing('brigade.brigadier', 'brigade.members');

        $this->realtime->ping(
            collect([$object->brigade?->brigadier])
                ->concat($object->brigade?->members ?? []),
            'roster.changed',
        );
        $this->realtime->pingRoles([UserRole::Manager], 'roster.changed');
    }

    /**
     * @param  array<string, mixed>  $data
     * @return array<string, mixed>
     */
    private function validate(array $data, ?WorkObject $object = null): array
    {
        $validator = Validator::make($data, [
            'name' => ['required', 'string', 'max:255'],
            'address' => ['nullable', 'string', 'max:500'],
            'brigade_id' => ['nullable', 'exists:brigades,id'],
            'start_date' => ['nullable', 'date'],
            'work_days' => ['required', 'integer', 'min:1', 'max:365'],
            'status' => ['nullable', Rule::enum(ObjectStatus::class)],
        ]);

        if ($validator->fails()) {
            throw new ValidationException($validator);
        }

        $payload = $validator->validated();
        unset($payload['status']);

        $workDays = (int) $payload['work_days'];
        $startDate = $payload['start_date'] ?? now()->toDateString();

        if (($payload['brigade_id'] ?? '') === '') {
            $payload['brigade_id'] = null;
        }

        $payload['start_date'] = $startDate;
        $payload['work_days'] = $workDays;
        $payload['planned_end_date'] = \Carbon\Carbon::parse($startDate)
            ->addDays($workDays)
            ->toDateString();

        if (isset($payload['brigade_id'])) {
            Brigade::query()->findOrFail($payload['brigade_id']);
        }

        return $payload;
    }
}
