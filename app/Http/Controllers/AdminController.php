<?php

namespace App\Http\Controllers;

use App\Models\User;
use Inertia\Inertia;
use Inertia\Response;

class AdminController extends Controller
{
    public function __invoke(): Response
    {
        $activeStatuses = ['active', 'trialing'];
        $activeUsersCount = User::whereIn('stripe_status', $activeStatuses)->count();
        $mrr = User::whereIn('stripe_status', ['active'])
            ->sum('subscription_amount');

        return Inertia::render('Admin/Dashboard', [
            'stats' => [
                'total_users' => User::count(),
                'active_subscriptions' => $activeUsersCount,
                'mrr' => number_format($mrr, 2, '.', ''),
            ],
            'users' => User::query()
                ->select([
                    'id',
                    'name',
                    'email',
                    'role',
                    'stripe_status',
                    'stripe_price_id',
                    'subscription_amount',
                    'subscription_currency',
                    'suspended_at',
                    'created_at',
                ])
                ->latest()
                ->get(),
        ]);
    }
}
