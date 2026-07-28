<?php

declare(strict_types=1);

namespace Tests\Unit;

use App\Models\BankAccount;
use App\Models\BankTransaction;
use App\Models\FinancialRecord;
use App\Models\User;
use App\Support\BankTreasurySummary;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class BankTreasurySummaryTest extends TestCase
{
    use RefreshDatabase;

    public function test_it_returns_null_when_no_bridge_accounts(): void
    {
        $user = User::factory()->create();

        $this->assertNull(BankTreasurySummary::forUser($user));
    }

    public function test_it_sums_checking_accounts_and_net_flow(): void
    {
        $user = User::factory()->create();

        $checking = BankAccount::query()->create([
            'user_id' => $user->id,
            'bridge_account_id' => '111',
            'bank_name' => 'Compte courant',
            'balance' => 15000,
            'type' => 'checking',
        ]);

        BankAccount::query()->create([
            'user_id' => $user->id,
            'bridge_account_id' => '222',
            'bank_name' => 'Livret',
            'balance' => 5000,
            'type' => 'savings',
        ]);

        BankTransaction::query()->create([
            'bank_account_id' => $checking->id,
            'bridge_transaction_id' => 'tx-1',
            'amount' => 1200,
            'date' => now()->subDays(3)->toDateString(),
            'label' => 'Virement client',
            'status' => 'posted',
        ]);

        BankTransaction::query()->create([
            'bank_account_id' => $checking->id,
            'bridge_transaction_id' => 'tx-2',
            'amount' => -400,
            'date' => now()->subDays(2)->toDateString(),
            'label' => 'Paiement fournisseur',
            'status' => 'posted',
        ]);

        $summary = BankTreasurySummary::forUser($user->fresh());

        $this->assertNotNull($summary);
        $this->assertTrue($summary['has_live_data']);
        $this->assertSame(15000.0, $summary['checking_balance']);
        $this->assertSame(20000.0, $summary['liquid_balance']);
        $this->assertSame(800.0, $summary['net_flow_30d']);
        $this->assertNotEmpty($summary['cashflow_events']);
    }

    public function test_it_includes_projected_events_from_financial_record(): void
    {
        $user = User::factory()->create();

        BankAccount::query()->create([
            'user_id' => $user->id,
            'bridge_account_id' => '333',
            'bank_name' => 'Compte courant',
            'balance' => 8000,
            'type' => 'checking',
        ]);

        FinancialRecord::query()->create([
            'user_id' => $user->id,
            'month' => now()->format('Y-m'),
            'revenue' => 20000,
            'charges' => 12000,
            'marketing_budget' => 500,
            'clients_count' => 10,
        ]);

        $summary = BankTreasurySummary::forUser($user->fresh());

        $this->assertNotNull($summary);
        $this->assertTrue(
            collect($summary['cashflow_events'])->contains(fn (array $event) => $event['id'] === 'proj-charges'),
        );
        $this->assertTrue(
            collect($summary['cashflow_events'])->contains(fn (array $event) => $event['id'] === 'proj-revenue'),
        );
    }
}
