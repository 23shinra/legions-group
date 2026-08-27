<?php

declare(strict_types=1);

namespace App\Http\Controllers\Brigadier;

use App\Enums\AdvanceStatus;
use App\Http\Controllers\Controller;
use App\Models\AdvanceRequest;
use App\Models\TimeEntry;
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

        $members = $brigade->members()
            ->where('is_active', true)
            ->orderBy('name')
            ->get()
            ->map(function ($member) {
                $working = TimeEntry::query()
                    ->where('user_id', $member->id)
                    ->whereDate('started_at', today())
                    ->whereNull('ended_at')
                    ->exists();

                return [
                    'id' => $member->id,
                    'name' => $member->name,
                    'status' => $working ? 'working' : 'absent',
                ];
            });

        $pendingAdvances = AdvanceRequest::query()
            ->with('user')
            ->whereIn('user_id', $brigade->members()->pluck('id'))
            ->where('status', AdvanceStatus::Pending)
            ->latest()
            ->limit(10)
            ->get();

        return Inertia::render('Brigadier/Home', [
            'brigade' => $brigade,
            'members' => $members,
            'todayObject' => $brigade->activeObject(),
            'pendingAdvances' => $pendingAdvances,
        ]);
    }
}
