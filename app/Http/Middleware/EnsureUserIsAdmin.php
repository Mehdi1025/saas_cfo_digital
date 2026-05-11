<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserIsAdmin
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user) {
            return redirect()->route('login');
        }

        if ($user->role !== 'admin') {
            if ($request->expectsJson()) {
                abort(Response::HTTP_FORBIDDEN, 'Acces administrateur requis.');
            }

            return redirect('/')
                ->with('error', 'Acces administrateur requis.');
        }

        return $next($request);
    }
}
