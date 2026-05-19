<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Services\FinancialService;
use Inertia\Inertia;
use Inertia\Response;

class AdminUserDashboardController extends Controller
{
    public function __construct(private FinancialService $financialService)
    {
    }

    public function __invoke(User $user): Response
    {
        if (! in_array($user->stripe_status, ['active', 'trialing'], true)) {
            abort(403, 'Ce client n a pas d abonnement actif.');
        }

        $records = $user->financialRecords()
            ->orderBy('month')
            ->get();

        return Inertia::render('Dashboard', [
            'dashboardData' => $this->financialService->buildDashboardData($records),
            'viewedUser' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'stripe_status' => $user->stripe_status,
                'suspended_at' => $user->suspended_at,
            ],
        ]);
    }
}
