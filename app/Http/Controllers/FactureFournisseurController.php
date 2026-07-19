<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Models\Document;
use App\Models\FactureFournisseur;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class FactureFournisseurController extends Controller
{
    public function index(Request $request): Response
    {
        $factures = FactureFournisseur::query()
            ->orderByDesc('issue_date')
            ->orderByDesc('id')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('FacturesFournisseurs/Index', [
            'factures' => [
                'data' => collect($factures->items())->map(fn (FactureFournisseur $facture) => [
                    'id' => $facture->id,
                    'pa_document_id' => $facture->pa_document_id,
                    'supplier_name' => $facture->supplier_name,
                    'supplier_siret' => $facture->supplier_siret,
                    'reference' => $facture->reference,
                    'issue_date' => $facture->issue_date?->toDateString(),
                    'issue_date_label' => $facture->issue_date
                        ? $facture->issue_date->locale('fr')->translatedFormat('j M Y')
                        : '—',
                    'amount_ht' => (float) $facture->amount_ht,
                    'amount_ttc' => (float) $facture->amount_ttc,
                    'cdar_status' => $facture->cdar_status,
                    'cdar_status_label' => Document::cdarStatusLabel($facture->cdar_status),
                    'pdf_url' => $facture->pdf_url,
                ])->values(),
                'meta' => [
                    'total' => $factures->total(),
                    'current_page' => $factures->currentPage(),
                    'last_page' => $factures->lastPage(),
                    'per_page' => $factures->perPage(),
                    'from' => $factures->firstItem(),
                    'to' => $factures->lastItem(),
                ],
                'links' => $factures->linkCollection()->toArray(),
            ],
        ]);
    }
}
