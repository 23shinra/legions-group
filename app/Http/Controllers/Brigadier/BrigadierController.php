<?php

declare(strict_types=1);

namespace App\Http\Controllers\Brigadier;

use App\Enums\AdvanceStatus;
use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Models\AdvanceRequest;
use App\Models\ObjectAssignment;
use App\Models\User;
use App\Models\WorkObject;
use App\Services\AttendanceDigestService;
use App\Services\PayrollService;
use App\Services\ObjectAssignmentService;
use App\Services\TimeTrackingService;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

final class BrigadierController extends Controller
{
    public function home(Request $request): Response
    {
        $user = $request->user()->load('brigade');
        $brigade = $user->brigade;

        abort_if($brigade === null, 403, 'Бригада не назначена.');

        $objects = $brigade->activeObjects();
        $selectedObjectId = (int) ($request->integer('object') ?: $objects->first()?->id);
        $selectedObject = $objects->firstWhere('id', $selectedObjectId) ?? $objects->first();

        if ($selectedObject !== null) {
            $selectedObjectId = $selectedObject->id;
        }

        $memberIds = $brigade->members()
            ->where('is_active', true)
            ->where('role', UserRole::Worker)
            ->pluck('id');

        $assignments = ObjectAssignment::query()
            ->with('workObject')
            ->whereIn('user_id', $memberIds)
            ->whereNull('ended_on')
            ->get()
            ->keyBy('user_id');

        $members = $brigade->members()
            ->where('is_active', true)
            ->where('role', UserRole::Worker)
            ->orderBy('name')
            ->get()
            ->map(function (User $member) use ($assignments, $selectedObjectId): array {
                $activeEntry = $member->activeTimeEntry();
                $pendingEntry = $member->pendingTimeEntry();
                $assignment = $assignments->get($member->id);
                $startedAt = $activeEntry?->started_at ?? $pendingEntry?->started_at;
                $startedLocal = $startedAt?->copy()->timezone(AttendanceDigestService::TIMEZONE);
                $lateAfter = now(AttendanceDigestService::TIMEZONE)
                    ->startOfDay()
                    ->setTime(AttendanceDigestService::LATE_HOUR, 0);
                $todayMinutes = (int) $member->timeEntries()
                    ->whereDate('started_at', today())
                    ->whereNotNull('confirmed_at')
                    ->sum('worked_minutes');

                if ($activeEntry !== null && (int) ($activeEntry->worked_minutes ?? 0) === 0) {
                    $todayMinutes += max(0, (int) $activeEntry->started_at->diffInMinutes(now()));
                }

                return [
                    'id' => $member->id,
                    'name' => $member->name,
                    'phone' => $member->phone,
                    'position' => $member->position,
                    'status' => $activeEntry
                        ? 'working'
                        : ($pendingEntry ? 'awaiting' : 'absent'),
                    'started_at' => $activeEntry?->started_at?->toIso8601String(),
                    'pending_started_at' => $pendingEntry?->started_at?->toIso8601String(),
                    'assigned_object_id' => $assignment?->work_object_id,
                    'assigned_object_name' => $assignment?->workObject?->name,
                    'on_selected_object' => $selectedObjectId > 0
                        && (int) $assignment?->work_object_id === $selectedObjectId,
                    'today_minutes' => $todayMinutes,
                    'is_late' => $startedLocal !== null && $startedLocal->greaterThan($lateAfter),
                ];
            })
            ->values();

        return Inertia::render('Brigadier/Home', [
            'brigade' => $brigade,
            'objects' => $objects,
            'selectedObjectId' => $selectedObjectId,
            'selectedObject' => $selectedObject,
            'members' => $members,
        ]);
    }

    public function confirmMemberTime(
        Request $request,
        User $member,
        TimeTrackingService $time,
    ): RedirectResponse {
        $data = $request->validate([
            'started_at' => ['required', 'date'],
            'work_object_id' => ['required', 'integer', 'exists:work_objects,id'],
        ]);

        // Client sends an absolute ISO instant (from local time input) so we
        // do not misread Asia/Almaty wall-clock as UTC H:i.
        $startedAt = Carbon::parse($data['started_at'])->timezone(config('app.timezone'));
        $object = WorkObject::query()->findOrFail((int) $data['work_object_id']);

        $time->confirmArrival($request->user(), $member, $startedAt, $object);

        return back()->with('success', 'Приход подтверждён.');
    }

    public function endMemberTime(
        Request $request,
        User $member,
        TimeTrackingService $time,
    ): RedirectResponse {
        $time->endForMember($request->user(), $member);

        return back()->with('success', 'Смена завершена.');
    }

    public function transferMember(
        Request $request,
        User $member,
        ObjectAssignmentService $assignments,
    ): RedirectResponse {
        $data = $request->validate([
            'work_object_id' => ['required', 'integer', 'exists:work_objects,id'],
        ]);

        $object = WorkObject::query()->findOrFail((int) $data['work_object_id']);
        $assignments->transferMember($request->user(), $member, $object);

        return back()->with('success', 'Строитель перенесён на другой объект.');
    }

    public function advances(Request $request, PayrollService $payroll): Response
    {
        $user = $request->user()->load('brigade');
        $brigade = $user->brigade;

        abort_if($brigade === null, 403, 'Бригада не назначена.');

        $memberIds = $brigade->members()
            ->where('is_active', true)
            ->where('role', UserRole::Worker)
            ->pluck('id');

        $map = function (AdvanceRequest $advance) use ($payroll): array {
            $worker = $advance->user;
            $balance = $worker ? $payroll->balanceFor($worker) : [
                'days' => 0,
                'accrued' => 0,
                'remaining' => 0,
            ];

            return [
                'id' => $advance->id,
                'amount' => (float) $advance->amount,
                'comment' => $advance->comment,
                'status' => $advance->status->value,
                'created_at' => $advance->created_at?->toIso8601String(),
                'reviewed_at' => $advance->reviewed_at?->toIso8601String(),
                'paid_at' => $advance->paid_at?->toIso8601String(),
                'user' => $worker ? [
                    'id' => $worker->id,
                    'name' => $worker->name,
                    'position' => $worker->position,
                ] : null,
                'worked_days' => (int) ($balance['days'] ?? 0),
                'accrued' => (float) ($balance['accrued'] ?? 0),
                'remaining' => (float) ($balance['remaining'] ?? 0),
            ];
        };

        return Inertia::render('Brigadier/Advances', [
            'brigade' => $brigade,
            'pendingAdvances' => AdvanceRequest::query()
                ->with(['user'])
                ->whereIn('user_id', $memberIds)
                ->where('status', AdvanceStatus::Pending)
                ->latest()
                ->get()
                ->map($map),
            'historyAdvances' => AdvanceRequest::query()
                ->with(['user'])
                ->whereIn('user_id', $memberIds)
                ->where('status', '!=', AdvanceStatus::Pending)
                ->latest('reviewed_at')
                ->get()
                ->map($map),
        ]);
    }
}
