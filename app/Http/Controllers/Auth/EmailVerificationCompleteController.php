<?php

declare(strict_types=1);

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class EmailVerificationCompleteController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $user = $request->user();

        return Inertia::render('Auth/EmailVerified', [
            'hasActiveSubscription' => in_array($user->stripe_status, ['active', 'trialing'], true),
            'userName' => $user->name,
        ]);
    }
}
