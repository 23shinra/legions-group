<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class AuthenticatedSessionController extends Controller
{
    public function create(): Response
    {
        return Inertia::render('Auth/Login', [
            'status' => session('status'),
            'demoAccounts' => [
                ['login' => 'manager', 'label' => 'Руководитель', 'role' => 'manager'],
                ['login' => 'accountant', 'label' => 'Бухгалтер', 'role' => 'accountant'],
                ['login' => 'brigadier1', 'label' => 'Бригадир', 'role' => 'brigadier'],
                ['login' => 'worker1', 'label' => 'Строитель', 'role' => 'worker'],
            ],
        ]);
    }

    public function store(LoginRequest $request): RedirectResponse
    {
        $request->authenticate();

        $request->session()->regenerate();

        return redirect()->intended(route('dashboard', absolute: false));
    }

    public function destroy(Request $request): RedirectResponse
    {
        Auth::guard('web')->logout();

        $request->session()->invalidate();

        $request->session()->regenerateToken();

        return redirect('/');
    }
}
