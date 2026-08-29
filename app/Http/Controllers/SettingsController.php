<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Enums\PayType;
use App\Models\Brigade;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

final class SettingsController
{
    public function __invoke(Request $request): Response
    {
        $user = $request->user();

        return Inertia::render('Settings/Index', [
            'status' => session('status'),
            'brigades' => $user?->isManager()
                ? Brigade::query()->orderBy('name')->get(['id', 'name'])
                : [],
            'payTypes' => $user?->isManager()
                ? collect(PayType::cases())->map(fn (PayType $type): array => [
                    'value' => $type->value,
                    'label' => $type->label(),
                ])->values()->all()
                : [],
        ]);
    }
}
