<?php

declare(strict_types=1);

namespace App\Http\Controllers\Worker;

use App\Http\Controllers\Controller;
use App\Services\AdvanceService;
use App\Services\PayrollService;
use App\Services\TimeTrackingService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

final class WorkerController extends Controller
{
    public function home(Request $request, PayrollService $payroll, AdvanceService $advances): Response
    {
        $user = $request->user()->load('brigade');
        $activeEntry = $user->activeTimeEntry();
        $todayObject = $activeEntry?->workObject
            ?? $user->brigade?->activeObject();

        return Inertia::render('Worker/Home', [
            'todayObject' => $todayObject,
            'brigade' => $user->brigade,
            'activeEntry' => $activeEntry,
            'balance' => $payroll->balanceFor($user),
            'recentAdvances' => $user->advanceRequests()->latest()->limit(5)->get(),
            'advanceEligibility' => $advances->eligibility($user),
        ]);
    }

    public function salary(Request $request, PayrollService $payroll): Response
    {
        return Inertia::render('Worker/Salary', [
            'balance' => $payroll->balanceFor($request->user()),
        ]);
    }

    public function advances(Request $request, AdvanceService $advances): Response
    {
        $user = $request->user();
        $list = $user->advanceRequests()->latest()->get();

        return Inertia::render('Worker/Advances', [
            'advances' => $list,
            'total' => (float) $list->where('status', 'paid')->sum('amount'),
            'advanceEligibility' => $advances->eligibility($user),
        ]);
    }

    public function createAdvance(): RedirectResponse
    {
        return redirect()->route('worker.advances');
    }

    public function storeAdvance(Request $request, AdvanceService $advances): RedirectResponse
    {
        $data = $request->validate([
            'amount' => ['required', 'numeric', 'min:1'],
            'comment' => ['nullable', 'string', 'max:1000'],
        ]);

        $advances->request($request->user(), (float) $data['amount'], $data['comment'] ?? null);

        return back()->with('success', 'Запрос на аванс отправлен.');
    }

    public function hours(Request $request): Response
    {
        $entries = $request->user()->timeEntries()->with('workObject')->latest('started_at')->limit(60)->get();

        return Inertia::render('Worker/Hours', [
            'entries' => $entries,
            'totalMinutes' => (int) $entries->sum('worked_minutes'),
        ]);
    }

    public function start(Request $request, TimeTrackingService $time): RedirectResponse
    {
        $data = $request->validate([
            'latitude' => ['nullable', 'numeric'],
            'longitude' => ['nullable', 'numeric'],
        ]);

        $time->start(
            $request->user(),
            isset($data['latitude']) ? (float) $data['latitude'] : null,
            isset($data['longitude']) ? (float) $data['longitude'] : null,
        );

        return back()->with('success', 'Работа начата.');
    }

    public function end(Request $request, TimeTrackingService $time): RedirectResponse
    {
        $data = $request->validate([
            'break_minutes' => ['nullable', 'integer', 'min:0', 'max:480'],
        ]);

        $time->end($request->user(), (int) ($data['break_minutes'] ?? 0));

        return back()->with('success', 'Работа завершена.');
    }
}
