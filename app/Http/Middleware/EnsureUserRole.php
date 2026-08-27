<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use App\Enums\UserRole;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

final class EnsureUserRole
{
    /**
     * @param  Closure(Request): Response  $next
     */
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $user = $request->user();

        if ($user === null) {
            abort(403);
        }

        $allowed = collect($roles)->map(fn (string $role): UserRole => UserRole::from($role));

        if (! $allowed->contains($user->role)) {
            abort(403, 'Недостаточно прав.');
        }

        return $next($request);
    }
}
