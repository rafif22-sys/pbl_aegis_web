<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RoleMiddleware
{
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        if (! $request->user()) {
            return $request->expectsJson()
                ? response()->json(['message' => 'Unauthenticated.'], 401)
                : redirect()->route('login');
        }

        if (! in_array($request->user()->role, $roles)) {
            return $request->expectsJson()
                ? response()->json(['message' => 'Forbidden. Insufficient role.'], 403)
                : abort(403, 'Akses ditolak.');
        }

        return $next($request);
    }
}