<?php

declare(strict_types=1);

namespace Tests\Unit;

use App\Support\FinancialSimulation;
use App\Services\FinancialService;
use App\Models\FinancialRecord;
use PHPUnit\Framework\TestCase;

class FinancialSimulationTest extends TestCase
{
    public function test_it_projects_six_months_and_health_score(): void
    {
        $record = new FinancialRecord([
            'month' => '2026-07',
            'revenue' => 10000,
            'charges' => 6000,
            'marketing_budget' => 1000,
            'clients_count' => 5,
        ]);

        $service = new FinancialService();
        $result = FinancialSimulation::projectFromRecord($record, [
            'marketing_budget_delta' => 20,
            'new_clients_per_month' => 2,
            'fixed_charges_delta' => 10,
        ], $service);

        $this->assertCount(6, $result['projected']);
        $this->assertTrue($result['projected'][0]['is_projected']);
        $this->assertGreaterThan(10000, $result['projected'][5]['ca']);
        $this->assertGreaterThanOrEqual(0, FinancialSimulation::healthScore($result['horizon_kpis']));
        $this->assertLessThanOrEqual(100, FinancialSimulation::healthScore($result['horizon_kpis']));
    }
}
