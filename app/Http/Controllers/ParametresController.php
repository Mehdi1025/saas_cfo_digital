<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Services\CompanySettingsService;
use App\Services\DeliveryDestinationService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ParametresController extends Controller
{
    public function index(
        CompanySettingsService $companySettings,
        DeliveryDestinationService $deliveryDestinations,
    ): Response {
        return Inertia::render('FinFlow/Settings/Index', [
            'settings' => $companySettings->forFrontend(),
            'destinations' => $deliveryDestinations->forFrontend(),
            'mail' => [
                'mailer' => config('mail.default'),
                'host' => config('mail.mailers.smtp.host'),
                'port' => config('mail.mailers.smtp.port'),
                'from_address' => config('mail.from.address'),
                'from_name' => config('mail.from.name'),
                'test_recipient' => config('mail.test_recipient'),
            ],
            'tax_rates' => config('taxes'),
            'integrations' => [
                'groq_configured' => filled(config('services.groq.api_key')),
                'groq_model' => config('services.groq.model') ?? env('GROQ_MODEL', 'llama-3.3-70b-versatile'),
            ],
        ]);
    }

    public function update(
        Request $request,
        CompanySettingsService $companySettings,
        DeliveryDestinationService $deliveryDestinations,
    ): RedirectResponse {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'address' => ['nullable', 'string', 'max:1000'],
            'registration_number' => ['nullable', 'string', 'max:100'],
            'vat_number' => ['nullable', 'string', 'max:100'],
            'email' => ['nullable', 'email', 'max:255'],
            'phone' => ['nullable', 'string', 'max:50'],
            'brand_color' => ['required', 'string', 'regex:/^#[0-9A-Fa-f]{6}$/'],
            'electronic_invoicing_active' => ['sometimes', 'boolean'],
            'logo' => ['nullable', 'image', 'max:5120'],
            'remove_logo' => ['sometimes', 'boolean'],
            'destinations' => ['nullable', 'array', 'min:1'],
            'destinations.*.id' => ['nullable', 'integer', 'exists:delivery_destinations,id'],
            'destinations.*.name' => ['required', 'string', 'max:255'],
            'destinations.*.fee_per_day' => ['required', 'numeric', 'min:0'],
        ]);

        $currentSettings = $companySettings->current();
        $wantsElectronicInvoicing = $request->boolean('electronic_invoicing_active');
        $settingsPayload = collect($validated)->except(['logo', 'remove_logo', 'destinations'])->all();
        $settingsPayload['electronic_invoicing_active'] = $wantsElectronicInvoicing;

        if ($wantsElectronicInvoicing) {
            $siret = trim((string) ($settingsPayload['registration_number'] ?? ''));
            $vatNumber = trim((string) ($settingsPayload['vat_number'] ?? ''));

            if ($siret === '' || $vatNumber === '') {
                return redirect()
                    ->route('parametres.index')
                    ->withErrors([
                        'electronic_invoicing_active' => 'Le SIRET et le numéro de TVA intracommunautaire sont requis pour activer la facturation électronique.',
                    ])
                    ->withInput();
            }

            if (! $currentSettings->electronic_invoicing_active) {
                $settingsPayload['billing_mandate_accepted_at'] = now();
            }
        }

        $companySettings->update(
            $settingsPayload,
            $request->file('logo'),
            $request->boolean('remove_logo'),
        );

        if (isset($validated['destinations'])) {
            $deliveryDestinations->sync($validated['destinations']);
        }

        return redirect()
            ->route('parametres.index')
            ->with('success', 'Paramètres enregistrés.');
    }
}
