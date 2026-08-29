<?php

declare(strict_types=1);

namespace App\Http\Controllers\Manager;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

final class ActivityLogController extends Controller
{
    public function index(Request $request): Response
    {
        $query = ActivityLog::query()->with('user')->latest();

        if ($action = $request->string('action')->toString()) {
            $query->where('action', 'like', $action.'%');
        }

        if ($userId = $request->integer('user_id')) {
            $query->where('user_id', $userId);
        }

        $search = trim($request->string('q')->toString());

        if ($search !== '') {
            $query->search($search);
        }

        $logs = $query->limit(300)->get();
        $memberIds = $logs
            ->map(static fn (ActivityLog $log): int => (int) (
                $log->meta['member_id'] ?? $log->meta['employee_id'] ?? 0
            ))
            ->filter()
            ->unique()
            ->values();
        $members = $memberIds->isEmpty()
            ? collect()
            : User::query()->whereIn('id', $memberIds)->pluck('name', 'id');

        return Inertia::render('Manager/Activity/Index', [
            'logs' => $logs->map(static fn (ActivityLog $log): array => [
                'id' => $log->id,
                'action' => $log->action,
                'label' => $log->label(),
                'meta' => $log->meta,
                'created_at' => $log->created_at?->toIso8601String(),
                'user' => $log->user ? [
                    'id' => $log->user->id,
                    'name' => $log->user->name,
                ] : null,
                'subject_name' => $log->meta['member']
                    ?? $members->get((int) ($log->meta['member_id'] ?? $log->meta['employee_id'] ?? 0)),
            ]),
            'indexRoute' => $request->routeIs('accountant.*')
                ? 'accountant.activity.index'
                : 'manager.activity.index',
            'filters' => [
                'q' => $search !== '' ? $search : null,
                'action' => $request->string('action')->toString() ?: null,
                'user_id' => $request->integer('user_id') ?: null,
            ],
        ]);
    }
}
