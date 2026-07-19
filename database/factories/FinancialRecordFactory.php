<?php

namespace Database\Factories;

use App\Models\FinancialRecord;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<FinancialRecord>
 */
class FinancialRecordFactory extends Factory
{
    protected $model = FinancialRecord::class;

    public function definition(): array
    {
        $revenue = random_int(8000, 18000);
        $charges = random_int(2500, min(9000, $revenue - 500));
        $marketingBudget = random_int(700, 2500);
        $clientsCount = random_int(3, 12);

        return [
            'user_id' => User::factory(),
            'month' => now()->subMonths(random_int(0, 11))->format('Y-m'),
            'revenue' => $revenue,
            'charges' => $charges,
            'marketing_budget' => $marketingBudget,
            'clients_count' => $clientsCount,
        ];
    }
}
