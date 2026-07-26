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

        if ($user->suspended_at !== null) {
            if ($request->expectsJson()) {
                abort(Response::HTTP_FORBIDDEN, 'Compte suspendu.');
            }

            return redirect('/')
                ->with('error', 'Votre compte est suspendu. Contactez l administrateur.');
        }

        $canAccessApp = in_array($user->stripe_status, ['active', 'trialing'], true);

        if (! $canAccessApp) {
            if ($request->expectsJson()) {
                abort(Response::HTTP_FORBIDDEN, 'Abonnement actif requis.');
            }

            return redirect()->to(route('profile.edit').'#subscription')
                ->with('error', 'Un abonnement actif est requis pour acceder a cette fonctionnalite.');
        }

        return $next($request);
    }
}
