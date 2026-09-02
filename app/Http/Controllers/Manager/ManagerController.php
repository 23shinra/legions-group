<?php

declare(strict_types=1);

namespace App\Http\Controllers\Manager;

use App\Enums\AdvanceStatus;
use App\Enums\PayType;
use App\Enums\UserRole;
use App\Exports\BrigadeReportExport;
use App\Exports\EmployeeReportExport;
use App\Exports\EmployeesImportTemplateExport;
use App\Exports\ObjectReportExport;
use App\Http\Controllers\Controller;
use App\Http\Requests\Manager\ClearOperationalDataRequest;
use App\Imports\EmployeesImport;
use App\Models\AdvanceRequest;
use App\Models\Brigade;
use App\Models\ObjectAssignment;
use App\Models\TimeEntry;
use App\Models\User;
use App\Models\WorkObject;
use App\Services\AdvanceService;
use App\Services\AttendanceDigestService;
use App\Services\EmployeeService;
use App\Services\ObjectAssignmentService;
use App\Services\ObjectCloseService;
use App\Services\ObjectService;
use App\Services\OperationalResetService;
use App\Services\PayrollService;
use App\Services\RealtimeNotifier;
use App\Services\ReportService;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;
use Maatwebsite\Excel\Facades\Excel;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

final class ManagerController extends Controller
{
    public function dashboard(ReportService $reports): Response
    {
        $workers = User::query()
            ->with('brigade:id,name')
            ->whereIn('role', [UserRole::Worker, UserRole::Brigadier])
            ->where('is_active', true)
            ->orderBy('name')
            ->get();

        $todayEntries = TimeEntry::query()
            ->with([
                'user:id,name,role,brigade_id,position',
                'user.brigade:id,name',
                'workObject:id,name,address',
            ])
            ->whereDate('started_at', today())
            ->whereNull('ended_at')
            ->get();

        $openEntries = $todayEntries->whereNotNull('confirmed_at')->values();
        $awaitingEntries = $todayEntries->whereNull('confirmed_at')->values();

        $atWorkIds = $openEntries->pluck('user_id')->unique();
        $awaitingIds = $awaitingEntries->pluck('user_id')->unique();
        $presentOrAwaitingIds = $atWorkIds->merge($awaitingIds)->unique();

        $lateAfter = now(AttendanceDigestService::TIMEZONE)
            ->startOfDay()
            ->setTime(AttendanceDigestService::LATE_HOUR, 0);

        $mapPresenceWorker = static function (TimeEntry $entry) use ($lateAfter): array {
            $user = $entry->user;
            $startedLocal = $entry->started_at?->copy()->timezone(AttendanceDigestService::TIMEZONE);
            $isLate = $entry->confirmed_at !== null
                && $startedLocal !== null
                && $startedLocal->greaterThan($lateAfter);

            return [
                'id' => $user?->id,
                'name' => $user?->name,
                'role' => $user?->role?->value,
                'position' => $user?->position,
                'brigade' => $user?->brigade?->name,
                'object' => $entry->workObject?->name,
                'started_at' => $entry->started_at?->toIso8601String(),
                'is_late' => $isLate,
            ];
        };

        $late = $openEntries
            ->filter(fn (TimeEntry $entry): bool => ($mapPresenceWorker($entry)['is_late'] ?? false) === true)
            ->values()
            ->map($mapPresenceWorker);

        $awaiting = $awaitingEntries->map($mapPresenceWorker)->values();

        $absent = $workers
            ->reject(fn (User $user): bool => $presentOrAwaitingIds->contains($user->id))
            ->values()
            ->map(static fn (User $user): array => [
                'id' => $user->id,
                'name' => $user->name,
                'position' => $user->position,
                'brigade' => $user->brigade?->name,
            ]);

        $pendingAdvancesQuery = AdvanceRequest::query()
            ->with(['user:id,name,position'])
            ->where('status', AdvanceStatus::Pending)
            ->latest();

        $pendingAdvancesCount = (clone $pendingAdvancesQuery)->count();
        $pendingAdvancesSum = (float) (clone $pendingAdvancesQuery)->sum('amount');
        $pendingAdvances = $pendingAdvancesQuery
            ->limit(8)
            ->get()
            ->map(static fn (AdvanceRequest $advance): array => [
                'id' => $advance->id,
                'amount' => (float) $advance->amount,
                'comment' => $advance->comment,
                'created_at' => $advance->created_at?->toIso8601String(),
                'user' => $advance->user ? [
                    'id' => $advance->user->id,
                    'name' => $advance->user->name,
                    'position' => $advance->user->position,
                ] : null,
            ]);

        $assignedByObject = ObjectAssignment::query()
            ->whereNull('ended_on')
            ->selectRaw('work_object_id, count(*) as assigned_count')
            ->groupBy('work_object_id')
            ->pluck('assigned_count', 'work_object_id');

        $objectPresence = WorkObject::query()
            ->where('status', 'active')
            ->orderBy('name')
            ->get()
            ->map(function (WorkObject $object) use ($openEntries, $mapPresenceWorker, $assignedByObject) {
                $present = $openEntries
                    ->where('work_object_id', $object->id)
                    ->values()
                    ->map($mapPresenceWorker);

                return [
                    'id' => $object->id,
                    'name' => $object->name,
                    'address' => $object->address,
                    'count' => $present->count(),
                    'assigned' => (int) ($assignedByObject[$object->id] ?? 0),
                    'workers' => $present,
                ];
            })
            ->values();

        $unassigned = $openEntries
            ->filter(fn (TimeEntry $entry): bool => $entry->work_object_id === null)
            ->values()
            ->map($mapPresenceWorker);

        if ($unassigned->isNotEmpty()) {
            $objectPresence->push([
                'id' => null,
                'name' => 'Без объекта',
                'address' => null,
                'count' => $unassigned->count(),
                'assigned' => 0,
                'workers' => $unassigned,
            ]);
        }

        $brigades = Brigade::query()
            ->with(['brigadier', 'members'])
            ->orderBy('name')
            ->get()
            ->map(function (Brigade $brigade) use ($atWorkIds, $reports) {
                $memberIds = $brigade->members->pluck('id');
                $membersCount = $memberIds->count();
                $atWork = $memberIds->intersect($atWorkIds)->count();

                return [
                    'id' => $brigade->id,
                    'name' => $brigade->name,
                    'display_name' => $brigade->displayName(),
                    'brigadier' => $brigade->brigadier,
                    'object' => $brigade->activeObject(),
                    'membersCount' => $membersCount,
                    'atWork' => $atWork,
                    'absent' => max(0, $membersCount - $atWork),
                    'hoursToday' => $reports->todayMinutesForBrigade($brigade),
                    'pendingAdvances' => AdvanceRequest::query()
                        ->whereIn('user_id', $memberIds)
                        ->where('status', AdvanceStatus::Pending)
                        ->count(),
                ];
            });

        $atWorkCount = $atWorkIds->count();
        $awaitingCount = $awaitingIds->count();
        $lateCount = $late->count();
        $absentCount = $absent->count();

        return Inertia::render('Manager/Dashboard', [
            'stats' => [
                'totalEmployees' => $workers->count(),
                'atWork' => $atWorkCount,
                'awaitingCount' => $awaitingCount,
                'lateCount' => $lateCount,
                'absent' => $absentCount,
                'hoursToday' => $reports->todayOpenMinutes(),
                'advanceRequestsCount' => $pendingAdvancesCount,
                'advanceRequestsSum' => $pendingAdvancesSum,
                'activeObjects' => WorkObject::query()->where('status', 'active')->count(),
            ],
            'awaiting' => $awaiting,
            'late' => $late,
            'absent' => $absent,
            'pendingAdvances' => $pendingAdvances,
            'objectPresence' => $objectPresence,
            'brigades' => $brigades,
        ]);
    }

    public function employees(Request $request, PayrollService $payroll): Response
    {
        $atWorkIds = TimeEntry::query()
            ->whereDate('started_at', today())
            ->whereNotNull('confirmed_at')
            ->whereNull('ended_at')
            ->pluck('user_id');

        $employees = User::query()
            ->with('brigade')
            ->whereIn('role', [UserRole::Worker, UserRole::Brigadier])
            ->orderBy('name')
            ->get()
            ->map(function (User $user) use ($atWorkIds, $payroll) {
                $balance = $payroll->balanceFor($user);

                return [
                    ...$user->toArray(),
                    'is_working' => $atWorkIds->contains($user->id),
                    'remaining' => $balance['remaining'],
                    'accrued' => $balance['accrued'],
                    'pay_type_label' => $user->pay_type instanceof PayType
                        ? $user->pay_type->label()
                        : null,
                ];
            });

        return Inertia::render('Manager/Employees/Index', [
            'employees' => $employees,
            'filters' => [
                'owed' => $request->boolean('owed'),
            ],
            'status' => session('status'),
            'brigades' => Brigade::options(),
            'payTypes' => collect(PayType::cases())->map(fn (PayType $type) => [
                'value' => $type->value,
                'label' => $type->label(),
            ]),
        ]);
    }

    public function showEmployee(User $employee, PayrollService $payroll): Response
    {
        return Inertia::render('Manager/Employees/Show', [
            'employee' => $employee->load('brigade.brigadier', 'salaryHistories'),
            'balance' => $payroll->balanceFor($employee),
            'recentEntries' => $employee->timeEntries()->with('workObject')->latest('started_at')->limit(20)->get(),
            'recentAdvances' => $employee->advanceRequests()->latest()->limit(20)->get(),
            'assignments' => $employee->objectAssignments()
                ->with('workObject')
                ->latest('started_on')
                ->get(),
            'brigades' => Brigade::options(),
            'payTypes' => collect(PayType::cases())->map(fn (PayType $type) => [
                'value' => $type->value,
                'label' => $type->label(),
            ]),
        ]);
    }

    public function updateEmployee(
        Request $request,
        User $employee,
        EmployeeService $employees,
    ): RedirectResponse {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'phone' => ['nullable', 'string', 'max:30'],
            'brigade_id' => ['nullable', 'exists:brigades,id'],
            'position' => ['nullable', 'string', 'max:255'],
            'pay_type' => ['required', Rule::enum(PayType::class)],
            'rate' => ['required', 'numeric', 'min:0'],
            'max_advance' => ['nullable', 'numeric', 'min:0'],
            'is_active' => ['nullable', 'boolean'],
            'rate_note' => ['nullable', 'string', 'max:255'],
        ]);

        $employees->update($employee, $data, $request->user());

        return back()->with('success', 'Сотрудник обновлён.');
    }

    public function destroyEmployee(User $employee, EmployeeService $employees): RedirectResponse
    {
        $employees->deactivate($employee);

        return redirect()
            ->route('manager.employees.index')
            ->with('success', 'Сотрудник убран из работы. История и зарплата сохранены.');
    }

    public function restoreEmployee(User $employee, EmployeeService $employees): RedirectResponse
    {
        $employees->restore($employee);

        return back()->with('success', 'Сотрудник снова в работе.');
    }

    public function brigades(): Response
    {
        $atWorkIds = TimeEntry::query()
            ->whereDate('started_at', today())
            ->whereNotNull('confirmed_at')
            ->whereNull('ended_at')
            ->pluck('user_id');

        $brigades = Brigade::query()
            ->with(['brigadier', 'members'])
            ->orderBy('name')
            ->get()
            ->map(function (Brigade $brigade) use ($atWorkIds) {
                $memberIds = $brigade->members->pluck('id');

                return [
                    'id' => $brigade->id,
                    'name' => $brigade->name,
                    'display_name' => $brigade->displayName(),
                    'brigadier' => $brigade->brigadier,
                    'members_count' => $memberIds->count(),
                    'at_work' => $memberIds->intersect($atWorkIds)->count(),
                    'object' => $brigade->activeObject(),
                ];
            });

        return Inertia::render('Manager/Brigades/Index', [
            'brigades' => $brigades,
            'brigadiers' => User::query()
                ->where('role', UserRole::Brigadier)
                ->where('is_active', true)
                ->orderBy('name')
                ->get(['id', 'name', 'brigade_id']),
        ]);
    }

    public function storeBrigade(Request $request, RealtimeNotifier $realtime): RedirectResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'brigadier_id' => ['nullable', 'exists:users,id'],
        ]);

        $brigade = Brigade::query()->create([
            'name' => $data['name'],
            'brigadier_id' => $data['brigadier_id'] ?? null,
        ]);

        if (! empty($data['brigadier_id'])) {
            User::query()->whereKey($data['brigadier_id'])->update([
                'brigade_id' => $brigade->id,
                'role' => UserRole::Brigadier,
            ]);
        }

        $realtime->pingRoles([UserRole::Manager], 'roster.changed');
        $realtime->ping([$brigade->brigadier_id], 'roster.changed');

        return back()->with('success', 'Бригада создана.');
    }

    public function updateBrigade(Request $request, Brigade $brigade, RealtimeNotifier $realtime): RedirectResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'brigadier_id' => ['nullable', 'exists:users,id'],
        ]);

        $brigade->update([
            'name' => $data['name'],
            'brigadier_id' => $data['brigadier_id'] ?? null,
        ]);

        if (! empty($data['brigadier_id'])) {
            User::query()->whereKey($data['brigadier_id'])->update([
                'brigade_id' => $brigade->id,
                'role' => UserRole::Brigadier,
            ]);
        }

        $realtime->pingRoles([UserRole::Manager], 'roster.changed');
        $realtime->ping([$brigade->brigadier_id], 'roster.changed');

        return back()->with('success', 'Бригада обновлена.');
    }

    public function showBrigade(Brigade $brigade): Response
    {
        $brigade->load(['brigadier', 'members' => fn ($q) => $q->orderBy('name')]);

        $atWorkIds = TimeEntry::query()
            ->whereDate('started_at', today())
            ->whereNotNull('confirmed_at')
            ->whereNull('ended_at')
            ->pluck('user_id');

        $members = $brigade->members->map(fn (User $member) => [
            'id' => $member->id,
            'name' => $member->name,
            'email' => $member->email,
            'phone' => $member->phone,
            'position' => $member->position,
            'role' => $member->role instanceof \BackedEnum ? $member->role->value : $member->role,
            'is_working' => $atWorkIds->contains($member->id),
        ]);

        $object = $brigade->activeObject();

        $memberIds = $members->pluck('id');

        return Inertia::render('Manager/Brigades/Show', [
            'brigade' => [
                'id' => $brigade->id,
                'name' => $brigade->name,
                'display_name' => $brigade->displayName(),
                'brigadier_id' => $brigade->brigadier_id,
                'brigadier' => $brigade->brigadier,
                'object' => $object,
                'members_count' => $members->count(),
                'at_work' => $members->where('is_working', true)->count(),
            ],
            'members' => $members,
            'availableWorkers' => User::query()
                ->whereIn('role', [UserRole::Worker, UserRole::Brigadier])
                ->where('is_active', true)
                ->where(fn ($query) => $query
                    ->whereNull('brigade_id')
                    ->orWhere('brigade_id', '!=', $brigade->id))
                ->whereNotIn('id', $memberIds)
                ->orderBy('name')
                ->get(['id', 'name', 'position', 'brigade_id']),
            'brigadiers' => User::query()
                ->where('role', UserRole::Brigadier)
                ->where('is_active', true)
                ->orderBy('name')
                ->get(['id', 'name', 'brigade_id']),
        ]);
    }

    public function addBrigadeMember(
        Request $request,
        Brigade $brigade,
        EmployeeService $employees,
    ): RedirectResponse {
        $data = $request->validate([
            'user_id' => ['required', 'integer', 'exists:users,id'],
        ]);

        $member = User::query()->findOrFail($data['user_id']);
        $employees->attachToBrigade($member, $brigade);

        return back()->with('success', 'Сотрудник добавлен в бригаду.');
    }

    public function removeBrigadeMember(
        Brigade $brigade,
        User $member,
        EmployeeService $employees,
    ): RedirectResponse {
        $employees->detachFromBrigade($member, $brigade);

        return back()->with('success', 'Сотрудник убран из бригады.');
    }

    public function objects(): Response
    {
        return Inertia::render('Manager/Objects/Index', [
            'objects' => WorkObject::query()->with('brigade')->latest()->get(),
            'brigades' => Brigade::options(),
        ]);
    }

    public function storeObject(Request $request, ObjectService $objects): RedirectResponse
    {
        $objects->create($request->all());

        return redirect()
            ->route('manager.objects.index')
            ->with('success', 'Объект создан.');
    }

    public function updateObject(WorkObject $object, Request $request, ObjectService $objects): RedirectResponse
    {
        $objects->update($object, $request->all());

        return back()->with('success', 'Объект обновлён.');
    }

    public function showObject(WorkObject $object, ReportService $reports): Response
    {
        $object->load('brigade.brigadier', 'brigade.members');
        $brigade = $object->brigade;

        $atWorkIds = TimeEntry::query()
            ->where('work_object_id', $object->id)
            ->whereDate('started_at', today())
            ->whereNotNull('confirmed_at')
            ->whereNull('ended_at')
            ->pluck('user_id');

        $brigades = [];
        if ($brigade) {
            $memberIds = $brigade->members->pluck('id');
            $brigades[] = [
                'id' => $brigade->id,
                'name' => $brigade->name,
                'display_name' => $brigade->displayName(),
                'brigadier' => $brigade->brigadier,
                'members_count' => $memberIds->count(),
                'at_work' => $memberIds->intersect($atWorkIds)->count(),
            ];
        }

        $assigned = ObjectAssignment::query()
            ->with('user')
            ->where('work_object_id', $object->id)
            ->whereNull('ended_on')
            ->get()
            ->filter(fn (ObjectAssignment $row) => $row->user !== null)
            ->values();

        $assignedIds = $assigned->pluck('user_id');

        return Inertia::render('Manager/Objects/Show', [
            'object' => $object,
            'brigades' => Brigade::options(),
            'brigadesOnObject' => $brigades,
            'workers' => $assigned->map(function (ObjectAssignment $row) use ($atWorkIds) {
                $user = $row->user;
                $payType = $user->pay_type;

                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'position' => $user->position,
                    'rate' => $user->rate,
                    'pay_type' => $payType instanceof PayType ? $payType->value : $payType,
                    'pay_type_label' => $payType instanceof PayType ? $payType->label() : null,
                    'is_working' => $atWorkIds->contains($user->id),
                ];
            }),
            'availableWorkers' => User::query()
                ->whereIn('role', [UserRole::Worker, UserRole::Brigadier])
                ->where('is_active', true)
                ->whereNotIn('id', $assignedIds)
                ->orderBy('name')
                ->get(['id', 'name', 'position', 'rate', 'pay_type', 'brigade_id']),
            'stats' => [
                'brigades_count' => count($brigades),
                'workers_count' => $assigned->count(),
                'hours_today' => (int) TimeEntry::query()
                    ->where('work_object_id', $object->id)
                    ->whereDate('started_at', today())
                    ->sum('worked_minutes'),
            ],
            'settlement' => $object->settlement,
        ]);
    }

    public function assignObjectMember(
        Request $request,
        WorkObject $object,
        ObjectAssignmentService $assignments,
    ): RedirectResponse {
        $data = $request->validate([
            'user_id' => ['required', 'integer', 'exists:users,id'],
        ]);

        $member = User::query()->findOrFail($data['user_id']);
        $assignments->placeOnObject($member, $object);

        return back()->with('success', 'Сотрудник назначен на объект. Ставка не меняется.');
    }

    public function unassignObjectMember(
        WorkObject $object,
        User $member,
        ObjectAssignmentService $assignments,
    ): RedirectResponse {
        $assignments->removeFromObject($member, $object);

        return back()->with('success', 'Сотрудник снят с объекта.');
    }

    public function closeObject(WorkObject $object, ObjectCloseService $service, Request $request): RedirectResponse
    {
        $service->close($object, $request->user());

        return redirect()
            ->route('manager.objects.show', $object)
            ->with('success', 'Объект закрыт. Расчёт сформирован.');
    }

    public function advances(Request $request, PayrollService $payroll): Response
    {
        $map = function (AdvanceRequest $advance) use ($payroll): array {
            $user = $advance->user;
            $balance = $user ? $payroll->balanceFor($user) : [
                'days' => 0,
                'minutes' => 0,
                'accrued' => 0,
                'advances' => 0,
                'paid' => 0,
                'remaining' => 0,
            ];

            return [
                'id' => $advance->id,
                'amount' => (float) $advance->amount,
                'comment' => $advance->comment,
                'status' => $advance->status->value,
                'payment_method' => $advance->payment_method?->value,
                'payment_method_label' => $advance->payment_method?->label(),
                'payment_receipt_url' => $advance->receiptUrl(),
                'created_at' => $advance->created_at?->toIso8601String(),
                'reviewed_at' => $advance->reviewed_at?->toIso8601String(),
                'paid_at' => $advance->paid_at?->toIso8601String(),
                'user' => $user ? [
                    'id' => $user->id,
                    'name' => $user->name,
                    'brigade' => $user->brigade?->name,
                    'position' => $user->position,
                ] : null,
                'worked_days' => (int) ($balance['days'] ?? 0),
                'worked_minutes' => (int) ($balance['minutes'] ?? 0),
                'accrued' => (float) ($balance['accrued'] ?? 0),
                'advances' => (float) ($balance['advances'] ?? 0),
                'paid' => (float) ($balance['paid'] ?? 0),
                'remaining' => (float) ($balance['remaining'] ?? 0),
            ];
        };

        $month = $request->string('month')->toString();
        $status = $request->string('status')->toString();

        $history = AdvanceRequest::query()
            ->with(['user.brigade'])
            ->where('status', '!=', AdvanceStatus::Pending)
            ->latest('reviewed_at');

        if (preg_match('/^\d{4}-\d{2}$/', $month) === 1) {
            $start = Carbon::parse($month.'-01')->startOfMonth();
            $history->whereBetween('created_at', [$start, $start->copy()->endOfMonth()]);
        }

        if (in_array($status, ['approved', 'rejected', 'paid'], true)) {
            $history->where('status', $status);
        }

        return Inertia::render('Manager/Advances/Index', [
            'pendingAdvances' => AdvanceRequest::query()
                ->with(['user.brigade'])
                ->where('status', AdvanceStatus::Pending)
                ->latest()
                ->get()
                ->map($map),
            'historyAdvances' => $history->get()->map($map),
            'filters' => [
                'month' => $month ?: now()->format('Y-m'),
                'status' => $status,
            ],
        ]);
    }

    public function approveAdvance(AdvanceRequest $advance, AdvanceService $service, Request $request): RedirectResponse
    {
        $service->approve($advance, $request->user());

        return back()->with('success', 'Аванс одобрен.');
    }

    public function rejectAdvance(AdvanceRequest $advance, AdvanceService $service, Request $request): RedirectResponse
    {
        $service->reject($advance, $request->user());

        return back()->with('success', 'Аванс отклонён.');
    }

    public function reports(Request $request, ReportService $reports): Response
    {
        [$from, $to] = $this->reportPeriod($request);
        $type = $request->string('type')->toString() ?: 'employees';

        $objectId = $request->integer('object_id') ?: null;

        if ($type === 'brigades') {
            $data = $reports->brigadeReport($from, $to);
        } elseif ($type === 'object' && $objectId) {
            $object = WorkObject::query()->findOrFail($objectId);
            $data = $reports->objectReport($object);
        } elseif ($type === 'owed') {
            $data = $reports->employeeReport($from, $to);
            $data['reports'] = array_values(array_filter(
                $data['reports'],
                static fn (array $row): bool => (float) ($row['remaining'] ?? 0) > 0,
            ));
            $data['summary']['totalEmployees'] = count($data['reports']);
        } else {
            $data = $reports->employeeReport($from, $to);
        }

        return Inertia::render('Manager/Reports/Index', [
            'summary' => $data['summary'],
            'reports' => $data['reports'],
            'filters' => [
                'from' => $from->toDateString(),
                'to' => $to->toDateString(),
                'type' => $type,
                'object_id' => $objectId,
            ],
            'objects' => WorkObject::query()->orderBy('name')->get(['id', 'name']),
        ]);
    }

    public function showReport(Request $request, User $employee, ReportService $reports): Response
    {
        [$from, $to] = $this->reportPeriod($request);
        $report = $reports->employeeReportRow($employee, $from, $to);

        abort_if($report === null, 404);

        return Inertia::render('Manager/Reports/Show', [
            'report' => $report,
            'filters' => [
                'from' => $from->toDateString(),
                'to' => $to->toDateString(),
            ],
        ]);
    }

    public function exportReports(Request $request, ReportService $reports): BinaryFileResponse
    {
        [$from, $to] = $this->reportPeriod($request);
        $type = $request->string('type')->toString() ?: 'employees';

        if ($type === 'brigades') {
            $data = $reports->brigadeReport($from, $to);

            return (new BrigadeReportExport($data['reports']))
                ->download('otchet-brigady.xlsx');
        }

        if ($type === 'object' && $request->integer('object_id')) {
            $object = WorkObject::query()->findOrFail($request->integer('object_id'));
            $data = $reports->objectReport($object);

            return (new ObjectReportExport($data['reports']))
                ->download('otchet-objekt.xlsx');
        }

        $data = $reports->employeeReport($from, $to);

        if ($type === 'owed') {
            $data['reports'] = array_values(array_filter(
                $data['reports'],
                static fn (array $row): bool => (float) ($row['remaining'] ?? 0) > 0,
            ));
        }

        return (new EmployeeReportExport($data['reports']))
            ->download('otchet-sotrudniki.xlsx');
    }

    public function exportPdf(Request $request, ReportService $reports): \Illuminate\Http\Response
    {
        [$from, $to] = $this->reportPeriod($request);
        $type = $request->string('type')->toString() ?: 'employees';
        $title = 'Отчёт по сотрудникам';
        $data = $reports->employeeReport($from, $to);

        if ($type === 'brigades') {
            $title = 'Отчёт по бригадам';
            $data = $reports->brigadeReport($from, $to);
        } elseif ($type === 'object' && $request->integer('object_id')) {
            $object = WorkObject::query()->findOrFail($request->integer('object_id'));
            $title = 'Отчёт по объекту: '.$object->name;
            $data = $reports->objectReport($object);
        } elseif ($type === 'owed') {
            $title = 'Кому должны зарплату';
            $data['reports'] = array_values(array_filter(
                $data['reports'],
                static fn (array $row): bool => (float) ($row['remaining'] ?? 0) > 0,
            ));
        }

        return response()
            ->view('reports.print', [
                'title' => $title,
                'period' => $from->format('d.m.Y').' — '.$to->format('d.m.Y'),
                'summary' => $data['summary'],
                'rows' => $data['reports'],
                'type' => $type,
            ])
            ->header('Content-Type', 'text/html; charset=UTF-8');
    }

    /**
     * @return array{0: Carbon, 1: Carbon}
     */
    private function reportPeriod(Request $request): array
    {
        $from = $request->filled('from')
            ? Carbon::parse($request->string('from')->toString())->startOfDay()
            : now()->startOfMonth();
        $to = $request->filled('to')
            ? Carbon::parse($request->string('to')->toString())->endOfDay()
            : now()->endOfMonth();

        if ($from->greaterThan($to)) {
            [$from, $to] = [$to->copy()->startOfDay(), $from->copy()->endOfDay()];
        }

        return [$from, $to];
    }

    public function storeEmployee(Request $request, EmployeeService $employees): RedirectResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['nullable', 'string', 'max:255', 'unique:users,email'],
            'password' => ['nullable', 'string', 'min:8', 'max:255'],
            'phone' => ['nullable', 'string', 'max:30'],
            'role' => ['required', Rule::in([UserRole::Worker->value, UserRole::Brigadier->value])],
            'brigade_id' => ['nullable', 'exists:brigades,id'],
            'position' => ['nullable', 'string', 'max:255'],
            'pay_type' => ['required', Rule::enum(PayType::class)],
            'rate' => ['required', 'numeric', 'min:0'],
            'max_advance' => ['nullable', 'numeric', 'min:0'],
            'hired_at' => ['nullable', 'date'],
        ]);

        $employees->create($data, $request->user());

        return back()->with('status', 'employee-created');
    }

    public function importEmployees(Request $request, EmployeeService $employees): RedirectResponse
    {
        $request->validate([
            'file' => ['required', 'file', 'mimes:xlsx,xls,csv', 'max:5120'],
        ]);

        $import = new EmployeesImport($request->user(), $employees);
        Excel::import($import, $request->file('file'));

        if ($import->createdCount() === 0 && $import->errors() !== []) {
            return back()->withErrors([
                'file' => implode(' ', array_slice($import->errors(), 0, 3)),
            ]);
        }

        $message = "Добавлено сотрудников: {$import->createdCount()}.";

        if ($import->errors() !== []) {
            $message .= ' Ошибки: '.implode(' ', array_slice($import->errors(), 0, 5));
        }

        return back()->with('status', $message);
    }

    public function importEmployeesTemplate(): BinaryFileResponse
    {
        return (new EmployeesImportTemplateExport)->download('shablon-sotrudniki.xlsx');
    }

    public function clearOperationalData(
        ClearOperationalDataRequest $request,
        OperationalResetService $reset,
    ): RedirectResponse {
        $counts = $reset->clear($request->user());

        return redirect()
            ->route('manager.dashboard')
            ->with('success', sprintf(
                'Данные очищены: выплат %d, авансов %d, смен %d, объектов %d. Сотрудники и бригады сохранены.',
                $counts['payments'],
                $counts['advances'],
                $counts['time_entries'],
                $counts['objects'],
            ));
    }
}
