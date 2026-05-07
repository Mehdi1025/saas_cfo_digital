<?php

namespace App\Http\Controllers;

use App\Services\FinancialService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    private FinancialService $financialService;

    public function __construct(FinancialService $financialService)
    {
        $this->financialService = $financialService;
    }

    public function __invoke(Request $request): Response
    {
        $user = $request->user();

        $records = $user->financialRecords()
            ->orderBy('month')
            ->get();

        return Inertia::render('Dashboard', [
            'dashboardData' => $this->financialService->buildDashboardData($records),
        ]);
    }
}
