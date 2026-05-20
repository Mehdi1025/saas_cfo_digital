<?php

namespace App\Http\Controllers;

use App\Services\FinancialService;
use App\Services\AiInsightService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __construct(
        private FinancialService $financialService,
        private AiInsightService $aiInsightService,
    ) {
    }

    public function __invoke(Request $request): Response
    {
        $user = $request->user();

        $records = $user->financialRecords()
            ->orderBy('month')
            ->get();

        $dashboardData = $this->financialService->buildDashboardData($records);
        $aiInsight = $this->aiInsightService->findOrGenerateForDashboard($user, $dashboardData);

        return Inertia::render('Dashboard', [
            'dashboardData' => $dashboardData,
            'aiInsight' => $this->aiInsightService->toDashboardPayload($aiInsight),
        ]);
    }
}
