<?php

namespace Tests\Unit;

use App\Models\FinancialRecord;
use App\Services\FinancialService;
use PHPUnit\Framework\TestCase;

class FinancialServiceTest extends TestCase
{
    public function test_it_calculates_net_margin(): void
    {
        $service = new FinancialService();
        $record = new FinancialRecord([
            'revenue' => 12000,
            'charges' => 3000,
        ]);

        $this->assertSame(9000, $service->calculateNetMargin($record));
    }

    public function test_it_returns_null_for_cac_when_clients_count_is_zero(): void
    {
        $service = new FinancialService();
        $record = new FinancialRecord([
            'marketing_budget' => 1500,
            'clients_count' => 0,
        ]);

        $this->assertNull($service->calculateCac($record));
    }

    public function test_it_calculates_cac_when_clients_count_is_available(): void
    {
        $service = new FinancialService();
        $record = new FinancialRecord([
            'marketing_budget' => 1500,
            'clients_count' => 6,
        ]);

        $this->assertSame(250, $service->calculateCac($record));
    }

    public function test_it_returns_null_for_ltv_when_clients_count_is_zero(): void
    {
        $service = new FinancialService();
        $record = new FinancialRecord([
            'revenue' => 10000,
            'clients_count' => 0,
        ]);

        $this->assertNull($service->calculateLtv($record));
    }

    public function test_it_calculates_ltv_when_clients_count_is_available(): void
    {
        $service = new FinancialService();
        $record = new FinancialRecord([
            'revenue' => 12000,
            'clients_count' => 6,
        ]);

        $this->assertSame(2000, $service->calculateLtv($record));
    }

    public function test_it_returns_a_critical_alert_when_margin_is_negative(): void
    {
        $service = new FinancialService();
        $record = new FinancialRecord([
            'revenue' => 3000,
            'charges' => 5000,
            'marketing_budget' => 1200,
            'clients_count' => 4,
        ]);

        $alert = $service->buildAlert($record);

        $this->assertSame('critique', $alert['niveau']);
        $this->assertSame('Votre marge est negative ce mois-ci.', $alert['message']);
    }

    public function test_it_returns_a_warning_alert_when_charges_exceed_seventy_percent_of_revenue(): void
    {
        $service = new FinancialService();
        $record = new FinancialRecord([
            'revenue' => 10000,
            'charges' => 8000,
            'marketing_budget' => 1000,
            'clients_count' => 10,
        ]);

        $alert = $service->buildAlert($record);

        $this->assertSame('attention', $alert['niveau']);
        $this->assertSame('Vos charges depassent 70 % de votre chiffre d affaires.', $alert['message']);
    }

    public function test_it_returns_a_healthy_alert_when_indicators_are_favorable(): void
    {
        $service = new FinancialService();
        $record = new FinancialRecord([
            'revenue' => 12000,
            'charges' => 3000,
            'marketing_budget' => 1500,
            'clients_count' => 6,
        ]);

        $alert = $service->buildAlert($record);

        $this->assertSame('sain', $alert['niveau']);
        $this->assertSame('Vos indicateurs sont favorables ce mois-ci.', $alert['message']);
    }
}
