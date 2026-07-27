<?php

namespace App\Http\Controllers;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class KpiProfileController extends Controller
{
    private const PROFILES = [
        'free',
        'agence',
        'btp',
        'retail',
        'ecom',
        'chr',
        'lib',
        'saas',
    ];

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'profile' => ['required', 'string', 'in:'.implode(',', self::PROFILES)],
            'preferences' => ['nullable', 'array'],
            'preferences.enabled_secondary' => ['nullable', 'array'],
            'preferences.enabled_secondary.*' => ['string', 'max:80'],
        ]);

        $user = $request->user();

        $user->forceFill([
            'kpi_profile' => $validated['profile'],
            'kpi_preferences' => $validated['preferences'] ?? ['enabled_secondary' => []],
            'kpi_onboarding_completed_at' => $user->kpi_onboarding_completed_at ?? now(),
        ])->save();

        return back()->with('success', 'Profil Fio configure. Votre dashboard est pret.');
    }
}
