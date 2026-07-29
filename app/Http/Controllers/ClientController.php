<?php

namespace App\Http\Controllers;

use App\Models\Tier;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ClientController extends Controller
{
    public function index(Request $request): Response
    {
        $search = trim((string) $request->query('search', ''));
        $highlightClientId = $request->integer('created') ?: null;

        $clientsQuery = Tier::query()
            ->when($search !== '', function ($query) use ($search) {
                $query->where(function ($inner) use ($search) {
                    $inner->where('name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%")
                        ->orWhere('address', 'like', "%{$search}%");
                });
            })
            ->orderBy('name');

        $clients = $clientsQuery->paginate(12)->withQueryString();

        $items = collect($clients->items())->map(function (Tier $tier) {
            $idFactor = ($tier->id % 9) + 1;
            $revenue = $idFactor * 13800;
            $outstanding = (int) round($revenue * (($tier->id % 4) * 0.08));

            return [
                'id' => $tier->id,
                'name' => $tier->name,
                'email' => $tier->email,
                'address' => $tier->address,
                'delivery_address' => $tier->delivery_address,
                'registration_number' => $tier->registration_number,
                'vat_number' => $tier->vat_number,
                'country_code' => $tier->country_code,
                'type' => $tier->type,
                'status' => $tier->type === 'client' ? 'Actif' : 'Prospect',
                'revenue' => $revenue,
                'outstanding' => $outstanding,
            ];
        })->values();

        $totalRevenue = $items->sum('revenue');
        $totalOutstanding = $items->sum('outstanding');
        $activeClients = $items->where('type', 'client')->count();

        return Inertia::render('FinFlow/Clients/Index', [
            'filters' => [
                'search' => $search,
            ],
            'highlight_client_id' => $highlightClientId,
            'clients' => [
                'data' => $items,
                'meta' => [
                    'total' => $clients->total(),
                    'current_page' => $clients->currentPage(),
                    'last_page' => $clients->lastPage(),
                    'per_page' => $clients->perPage(),
                ],
            ],
            'stats' => [
                'total_clients' => $clients->total(),
                'active_clients' => $activeClients,
                'total_revenue' => $totalRevenue,
                'total_outstanding' => $totalOutstanding,
            ],
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['nullable', 'email', 'max:255'],
            'type' => ['required', 'in:client,prospect'],
            'address' => ['nullable', 'string'],
            'delivery_address' => ['nullable', 'string', 'max:2000'],
            'country_code' => ['nullable', 'string', 'max:2'],
            'registration_number' => ['nullable', 'string', 'max:20'],
            'vat_number' => ['nullable', 'string', 'max:255'],
        ]);

        $client = Tier::create([
            ...$validated,
            'user_id' => $request->user()->id,
            'country_code' => $this->normalizeCountryCode($validated['country_code'] ?? null),
        ]);

        return redirect()
            ->route('clients.index', [
                'search' => $client->name,
                'created' => $client->id,
            ])
            ->with('success', 'Client ajouté.');
    }

    public function update(Request $request, Tier $client): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['nullable', 'email', 'max:255'],
            'type' => ['required', 'in:client,prospect'],
            'address' => ['nullable', 'string'],
            'delivery_address' => ['nullable', 'string', 'max:2000'],
            'country_code' => ['nullable', 'string', 'max:2'],
            'registration_number' => ['nullable', 'string', 'max:20'],
            'vat_number' => ['nullable', 'string', 'max:255'],
        ]);

        $client->update([
            ...$validated,
            'country_code' => $this->normalizeCountryCode(
                $validated['country_code'] ?? $client->country_code,
            ),
        ]);

        return redirect()->route('clients.index')->with('success', 'Client mis à jour.');
    }

    private function normalizeCountryCode(?string $countryCode): string
    {
        $code = strtoupper(trim((string) $countryCode));

        return $code !== '' ? $code : '';
    }

    public function destroy(Tier $client): RedirectResponse
    {
        if ($client->documents()->exists()) {
            return redirect()
                ->route('clients.index')
                ->with('error', 'Impossible de supprimer ce client car il possède déjà des documents.');
        }

        $client->delete();

        return redirect()->route('clients.index')->with('success', 'Client supprimé.');
    }
}
