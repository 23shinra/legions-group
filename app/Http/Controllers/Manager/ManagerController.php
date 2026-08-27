<?php

declare(strict_types=1);

namespace App\Http\Controllers\Manager;

use App\Enums\AdvanceStatus;
use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Models\AdvanceRequest;
use App\Models\Brigade;
use App\Models\TimeEntry;
use App\Models\User;
use App\Models\WorkObject;
use App\Services\AdvanceService;
use App\Services\ObjectCloseService;
use App\Services\PayrollService;
use App\Services\ReportService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

final class ManagerController extends Controller
{
    public function dashboard(ReportService $reports): Response
    {
        $workers = User::query()
            ->whereIn('role', [UserRole::Worker, UserRole::Brigadier])
            ->where('is_active', true)
            ->get();

        $openEntries = TimeEntry::query()
            ->with([
                'user:id,name,role,brigade_id,position',
                'user.brigade:id,name',
                'workObject:id,name,address',
            ])
            ->whereDate('started_at', today())
            ->whereNull('ended_at')
            ->get();

        $atWorkIds = $openEntries->pluck('user_id');

        $pendingAdvances = AdvanceRequest::query()
            ->where('status', AdvanceStatus::Pending)
            ->get();

        $mapWorker = static function (TimeEntry $entry): array {
            $user = $entry->user;

            return [
                'id' => $user?->id,
                'name' => $user?->name,
                'role' => $user?->role?->value,
                'position' => $user?->position,
                'brigade' => $user?->brigade?->name,
                'started_at' => $entry->started_at?->toIso8601String(),
            ];
        };

        $objectPresence = WorkObject::query()
            ->where('status', 'active')
            ->orderBy('name')
            ->get()
            ->map(function (WorkObject $object) use ($openEntries, $mapWorker) {
                $present = $openEntries
                    ->where('work_object_id', $object->id)
                    ->values()
                    ->map($mapWorker);

                return [
                    'id' => $object->id,
                    'name' => $object->name,
                    'address' => $object->address,
                    'count' => $present->count(),
                    'workers' => $present,
                ];
            })
            ->values();

        $unassigned = $openEntries
            ->filter(fn (TimeEntry $entry) => $entry->work_object_id === null)
            ->values()
            ->map($mapWorker);

        if ($unassigned->isNotEmpty()) {
            $objectPresence->push([
                'id' => null,
                'name' => 'Без объекта',
                'address' => null,
                'count' => $unassigned->count(),
                'workers' => $unassigned,
            ]);
        }

        $brigades = Brigade::query()
            ->with(['brigadier', 'members'])
            ->orderBy('name')
            ->get()
            ->map(function (Brigade $brigade) use ($atWorkIds, $reports) {
                $memberIds = $brigade->members->pluck('id');

                return [
                    'id' => $brigade->id,
                    'name' => $brigade->name,
                    'brigadier' => $brigade->brigadier,
                    'object' => $brigade->activeObject(),
                    'membersCount' => $memberIds->count(),
                    'atWork' => $memberIds->intersect($atWorkIds)->count(),
                    'hoursToday' => $reports->todayMinutesForBrigade($brigade),
                    'pendingAdvances' => AdvanceRequest::query()
                        ->whereIn('user_id', $memberIds)
                        ->where('status', AdvanceStatus::Pending)
                        ->count(),
                ];
            });

        return Inertia::render('Manager/Dashboard', [
            'stats' => [
                'totalEmployees' => $workers->count(),
                'atWork' => $atWorkIds->unique()->count(),
                'absent' => max(0, $workers->count() - $atWorkIds->unique()->count()),
                'hoursToday' => $reports->todayOpenMinutes(),
                'advanceRequestsCount' => $pendingAdvances->count(),
                'advanceRequestsSum' => (float) $pendingAdvances->sum('amount'),
                'activeObjects' => WorkObject::query()->where('status', 'active')->count(),
            ],
            'objectPresence' => $objectPresence,
            'brigades' => $brigades,
        ]);
    }

    public function employees(): Response
    {
        $atWorkIds = TimeEntry::query()
            ->whereDate('started_at', today())
            ->whereNull('ended_at')
            ->pluck('user_id');

        $employees = User::query()
            ->with('brigade')
            ->whereIn('role', [UserRole::Worker, UserRole::Brigadier])
            ->orderBy('name')
            ->get()
            ->map(fn (User $user) => [
                ...$user->toArray(),
                'is_working' => $atWorkIds->contains($user->id),
            ]);

        return Inertia::render('Manager/Employees/Index', [
            'employees' => $employees,
        ]);
    }

    public function showEmployee(User $employee, PayrollService $payroll): Response
    {
        return Inertia::render('Manager/Employees/Show', [
            'employee' => $employee->load('brigade', 'salaryHistories'),
            'balance' => $payroll->balanceFor($employee),
            'recentEntries' => $employee->timeEntries()->with('workObject')->latest('started_at')->limit(20)->get(),
            'recentAdvances' => $employee->advanceRequests()->latest()->limit(20)->get(),
        ]);
    }

    public function brigades(): Response
    {
        $atWorkIds = TimeEntry::query()
            ->whereDate('started_at', today())
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
                    'brigadier' => $brigade->brigadier,
                    'members_count' => $memberIds->count(),
                    'at_work' => $memberIds->intersect($atWorkIds)->count(),
                    'object' => $brigade->activeObject(),
                ];
            });

        return Inertia::render('Manager/Brigades/Index', [
            'brigades' => $brigades,
        ]);
    }

    public function showBrigade(Brigade $brigade): Response
    {
        $brigade->load(['brigadier', 'members' => fn ($q) => $q->orderBy('name')]);

        $atWorkIds = TimeEntry::query()
            ->whereDate('started_at', today())
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

        return Inertia::render('Manager/Brigades/Show', [
            'brigade' => [
                'id' => $brigade->id,
                'name' => $brigade->name,
                'brigadier' => $brigade->brigadier,
                'object' => $object,
                'members_count' => $members->count(),
                'at_work' => $members->where('is_working', true)->count(),
            ],
            'members' => $members,
        ]);
    }

    public function objects(): Response
    {
        return Inertia::render('Manager/Objects/Index', [
            'objects' => WorkObject::query()->with('brigade')->latest()->get(),
        ]);
    }

    public function showObject(WorkObject $object, ReportService $reports): Response
    {
        $object->load('brigade.brigadier', 'brigade.members');
        $brigade = $object->brigade;

        $atWorkIds = TimeEntry::query()
            ->where('work_object_id', $object->id)
            ->whereDate('started_at', today())
            ->whereNull('ended_at')
            ->pluck('user_id');

        $brigades = [];
        if ($brigade) {
            $memberIds = $brigade->members->pluck('id');
            $brigades[] = [
                'id' => $brigade->id,
                'name' => $brigade->name,
                'brigadier' => $brigade->brigadier,
                'members_count' => $memberIds->count(),
                'at_work' => $memberIds->intersect($atWorkIds)->count(),
            ];
        }

        return Inertia::render('Manager/Objects/Show', [
            'object' => $object,
            'brigades' => $brigades,
            'stats' => [
                'brigades_count' => count($brigades),
                'workers_count' => $atWorkIds->count(),
                'hours_today' => (int) TimeEntry::query()
                    ->where('work_object_id', $object->id)
                    ->whereDate('started_at', today())
                    ->sum('worked_minutes'),
            ],
            'settlement' => $object->settlement,
        ]);
    }

    public function closeObject(WorkObject $object, ObjectCloseService $service, Request $request): RedirectResponse
    {
        $service->close($object, $request->user());

        return redirect()
            ->route('manager.objects.show', $object)
            ->with('success', 'Объект закрыт. Расчёт сформирован.');
    }

    public function advances(PayrollService $payroll): Response
    {
        $advances = AdvanceRequest::query()
            ->with(['user.brigade'])
            ->latest()
            ->get()
            ->map(function (AdvanceRequest $advance) use ($payroll) {
                $user = $advance->user;
                $balance = $user ? $payroll->balanceFor($user) : [
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
                    'user' => $user ? [
                        'id' => $user->id,
                        'name' => $user->name,
                        'brigade' => $user->brigade?->name,
                        'position' => $user->position,
                    ] : null,
                    'worked_days' => (int) ($balance['days'] ?? 0),
                    'accrued' => (float) ($balance['accrued'] ?? 0),
                    'remaining' => (float) ($balance['remaining'] ?? 0),
                ];
            });

        return Inertia::render('Manager/Advances/Index', [
            'advances' => $advances,
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

    public function reports(ReportService $reports): Response
    {
        $data = $reports->employeeReport();

        return Inertia::render('Manager/Reports/Index', [
            'summary' => $data['summary'],
            'reports' => $data['reports'],
        ]);
    }

    public function exportReports(ReportService $reports): BinaryFileResponse
    {
        $data = $reports->employeeReport();
        $filename = storage_path('app/reports/employees-'.now()->format('Ymd-His').'.xlsx');

        if (! is_dir(dirname($filename))) {
            mkdir(dirname($filename), 0755, true);
        }

        return (new \App\Exports\EmployeeReportExport($data['reports']))->download('otchet-sotrudniki.xlsx');
    }
}
