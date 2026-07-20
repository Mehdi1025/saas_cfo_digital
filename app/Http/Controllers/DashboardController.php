<?php

namespace App\Http\Controllers;

use App\Models\User;
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
        $aiInsight = $this->aiInsightService->findForDashboard($user, $dashboardData);

        return Inertia::render('Dashboard', [
            'dashboardData' => $dashboardData,
            'aiInsight' => $this->aiInsightService->toDashboardPayload($aiInsight),
            'aiInsightStatus' => $this->aiInsightService->dashboardStatus($aiInsight, $dashboardData),
        ]);
    }

    public function aiInsight(Request $request): \Illuminate\Http\JsonResponse
    {
        $authUser = $request->user();
        $viewedUserId = $request->integer('viewed_user_id') ?: null;
        $user = $authUser;

        if ($viewedUserId && $authUser->role === 'admin') {
            $user = User::query()->findOrFail($viewedUserId);
        }

        $records = $user->financialRecords()
            ->orderBy('month')
            ->get();

        $dashboardData = $this->financialService->buildDashboardData($records);
        $aiInsight = $this->aiInsightService->findOrGenerateForDashboard($user, $dashboardData);

        return response()->json([
            'aiInsight' => $this->aiInsightService->toDashboardPayload($aiInsight),
            'aiInsightStatus' => $this->aiInsightService->dashboardStatus($aiInsight, $dashboardData, false),
        ]);
    }
}
