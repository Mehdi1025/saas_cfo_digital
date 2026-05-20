<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Services\AiInsightService;
use App\Services\FinancialService;
use Inertia\Inertia;
use Inertia\Response;

class AdminUserDashboardController extends Controller
{
    public function __construct(
        private FinancialService $financialService,
        private AiInsightService $aiInsightService,
    ) {
    }

    public function __invoke(User $user): Response
    {
        $records = $user->financialRecords()
            ->orderBy('month')
            ->get();

        $dashboardData = $this->financialService->buildDashboardData($records);
        $aiInsight = $this->aiInsightService->findOrGenerateForDashboard($user, $dashboardData);

        return Inertia::render('Dashboard', [
            'dashboardData' => $dashboardData,
            'aiInsight' => $this->aiInsightService->toDashboardPayload($aiInsight),
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
