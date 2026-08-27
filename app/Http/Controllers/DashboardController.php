<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Enums\UserRole;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

final class DashboardController extends Controller
{
    public function __invoke(Request $request): RedirectResponse
    {
        /** @var \App\Models\User $user */
        $user = $request->user();
        $role = $user->role instanceof UserRole ? $user->role : UserRole::from((string) $user->role);

        return redirect()->route($role->homeRoute());
    }
}
