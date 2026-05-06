<?php

namespace App\Http\Controllers;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class FinancialRecordController extends Controller
{
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'month' => ['required', 'date_format:Y-m'],
            'revenue' => ['required', 'numeric', 'min:0'],
            'charges' => ['required', 'numeric', 'min:0'],
            'marketing_budget' => ['required', 'numeric', 'min:0'],
            'clients_count' => ['required', 'integer', 'min:0'],
        ]);

        $request->user()->financialRecords()->updateOrCreate(
            ['month' => $validated['month']],
            $validated
        );

        return redirect()->route('dashboard');
    }
}
