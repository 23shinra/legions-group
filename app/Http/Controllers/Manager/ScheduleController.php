<?php

declare(strict_types=1);

namespace App\Http\Controllers\Manager;

use App\Enums\ObjectStatus;
use App\Http\Controllers\Controller;
use App\Models\Brigade;
use App\Models\WorkObject;
use App\Services\ShiftPlanService;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

final class ScheduleController extends Controller
{
    public function index(Request $request, ShiftPlanService $plans): Response
    {
        $date = $this->dateFromRequest($request);

        return Inertia::render('Manager/Schedule/Index', [
            'date' => $date->toDateString(),
            'employees' => $plans->roster($date),
            'objects' => WorkObject::query()
                ->where('status', '!=', ObjectStatus::Closed->value)
                ->orderBy('name')
                ->get(['id', 'name', 'address']),
            'brigades' => Brigade::query()->orderBy('name')->get(['id', 'name']),
        ]);
    }

    public function store(Request $request, ShiftPlanService $plans): RedirectResponse
    {
        $data = $request->validate([
            'date' => ['required', 'date'],
            'assignments' => ['required', 'array'],
            'assignments.*.user_id' => ['required', 'integer', 'exists:users,id'],
            'assignments.*.work_object_id' => ['nullable', 'integer', 'exists:work_objects,id'],
        ]);

        $date = Carbon::parse($data['date'])->startOfDay();
        $plans->saveForDate($date, $data['assignments'], $request->user());

        return back()->with('success', 'График сохранён.');
    }

    private function dateFromRequest(Request $request): Carbon
    {
        if ($request->filled('date')) {
            return Carbon::parse($request->string('date')->toString())->startOfDay();
        }

        return today()->addDay();
    }
}
