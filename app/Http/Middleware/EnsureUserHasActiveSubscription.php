<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserHasActiveSubscription
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

        $canAccessApp = $user->suspended_at === null
            && in_array($user->stripe_status, ['active', 'trialing'], true);

        if (! $canAccessApp) {
            if ($request->expectsJson()) {
                abort(Response::HTTP_FORBIDDEN, 'Abonnement actif requis.');
            }

            return redirect('/')
                ->with('error', 'Un abonnement actif est requis pour acceder a cette page.');
        }

        return $next($request);
    }
}
