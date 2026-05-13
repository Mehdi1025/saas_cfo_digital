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
            'revenue' => ['required', 'numeric', 'min:0', 'max:9999999999.99'],
            'charges' => ['required', 'numeric', 'min:0', 'max:9999999999.99'],
            'marketing_budget' => ['required', 'numeric', 'min:0', 'max:9999999999.99'],
            'clients_count' => ['required', 'integer', 'min:0', 'max:999999'],
        ]);

        $request->user()->financialRecords()->updateOrCreate(
            ['month' => $validated['month']],
            $validated
        );

        return redirect()->route('financial-entry.index');
    }
}
