<?php

declare(strict_types=1);

namespace App\Http\Controllers\Worker;

use App\Http\Controllers\Controller;
use App\Services\AdvanceService;
use App\Services\PayrollService;
use App\Services\TimeTrackingService;
use App\Services\WorkerContextService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

final class WorkerController extends Controller
{
    public function home(
        Request $request,
        PayrollService $payroll,
        AdvanceService $advances,
        WorkerContextService $context,
    ): Response {
        $user = $request->user()->load('brigade');
        $activeEntry = $user->activeTimeEntry();
        $pendingEntry = $user->pendingTimeEntry();
        $activeObject = $context->activeObject($user);
        $todayObject = ($activeEntry ?? $pendingEntry)?->workObject ?? $activeObject;
        $workSummary = $payroll->objectSummary($user, $activeObject);

        return Inertia::render('Worker/Home', [
            'todayObject' => $todayObject,
            'tomorrowObject' => $context->tomorrowObject($user),
            'brigade' => $user->brigade,
            'activeEntry' => $activeEntry,
            'pendingEntry' => $pendingEntry,
            'balance' => $workSummary,
            'recentAdvances' => $user->advanceRequests()->latest()->limit(5)->get(),
            'advanceEligibility' => $advances->eligibility($user),
        ]);
    }

    public function requestArrival(Request $request, TimeTrackingService $time): RedirectResponse
    {
        $data = $request->validate([
            'latitude' => ['nullable', 'numeric', 'between:-90,90'],
            'longitude' => ['nullable', 'numeric', 'between:-180,180'],
        ]);

        $time->requestArrival(
            $request->user(),
            isset($data['latitude']) ? (float) $data['latitude'] : null,
            isset($data['longitude']) ? (float) $data['longitude'] : null,
        );

        return back()->with('success', 'Приход отмечен. Ожидайте подтверждения бригадира.');
    }

    public function endShift(Request $request, TimeTrackingService $time): RedirectResponse
    {
        $time->endForWorker($request->user());

        return back()->with('success', 'Смена завершена.');
    }

    public function salary(
        Request $request,
        PayrollService $payroll,
        WorkerContextService $context,
    ): Response {
        $user = $request->user();
        $activeObject = $context->activeObject($user);

        return Inertia::render('Worker/Salary', [
            'balance' => $payroll->objectSummary($user, $activeObject),
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
}
