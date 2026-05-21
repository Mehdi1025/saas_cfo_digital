<?php

namespace App\Http\Controllers;

use App\Models\AiInsight;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class AdminAiInsightController extends Controller
{
    public function update(Request $request, AiInsight $aiInsight): RedirectResponse
    {
        $validated = $request->validate([
            'edited_content' => ['required', 'string', 'max:10000'],
        ]);

        $aiInsight->update([
            'edited_content' => $validated['edited_content'],
            'edited_by_admin_id' => $request->user()->id,
            'edited_at' => now(),
        ]);

        return back()->with('success', 'Analyse IA mise a jour.');
    }
}
