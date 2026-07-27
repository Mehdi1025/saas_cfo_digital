<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Http\Controllers\Concerns\SecuresDocumentLifecycle;
use App\Models\Article;
use App\Models\Document;
use App\Models\DocumentEvent;
use App\Models\Tier;
use App\Services\DevisMailerService;
use App\Services\DocumentEventRecorder;
use App\Services\DocumentPdfService;
use App\Services\ReferenceGeneratorService;
use App\Support\ArticleCatalog;
use App\Support\DocumentPrestation;
use App\Support\DocumentRegulatoryFields;
use App\Support\DocumentTotals;
use App\Support\ExchangeRateResolver;
use App\Support\LigneAmounts;
use App\Support\TaxRateResolver;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\Response as HttpResponse;

class DevisController extends Controller
{
    use SecuresDocumentLifecycle;

    public function index(Request $request): Response
    {
        $filters = [
            'search' => trim((string) $request->query('search', '')),
            'status' => (string) $request->query('status', ''),
            'date_range' => (string) $request->query('date_range', ''),
            'amount_range' => (string) $request->query('amount_range', ''),
        ];

        $devisQuery = Document::query()
            ->where('type', Document::TYPE_DEVIS)
            ->with(['tier', 'lignes', 'children'])
            ->when($filters['search'] !== '', function (Builder $query) use ($filters) {
                $query->where(function (Builder $inner) use ($filters) {
                    $inner->where('reference', 'like', "%{$filters['search']}%")
                        ->orWhereHas('tier', fn (Builder $tier) => $tier->where('name', 'like', "%{$filters['search']}%"));
                });
            })
            ->when($filters['status'] !== '', fn (Builder $query) => $query->where('status', $filters['status']))
            ->when($filters['date_range'] === 'this_month', function (Builder $query) {
                $query->whereBetween('issue_date', [
                    now()->startOfMonth()->toDateString(),
                    now()->endOfMonth()->toDateString(),
                ]);
            })
            ->when($filters['date_range'] === 'last_month', function (Builder $query) {
                $query->whereBetween('issue_date', [
                    now()->subMonth()->startOfMonth()->toDateString(),
                    now()->subMonth()->endOfMonth()->toDateString(),
                ]);
            })
            ->when($filters['date_range'] === 'last_90_days', function (Builder $query) {
                $query->where('issue_date', '>=', now()->subDays(90)->toDateString());
            })
            ->when($filters['amount_range'] !== '', fn (Builder $query) => $this->applyAmountFilter($query, $filters['amount_range']))
            ->orderByDesc('issue_date');

        $devis = (clone $devisQuery)->paginate(10)->withQueryString();

        $allDevis = Document::query()
            ->where('type', Document::TYPE_DEVIS)
            ->with(['tier', 'lignes'])
            ->get();

        return Inertia::render('Devis/Index', [
            'filters' => $filters,
            'kpis' => $this->buildKpis($allDevis),
            'pipeline' => $this->buildPipeline($allDevis),
            'expiringSoon' => $this->buildExpiringSoon($allDevis),
            'devis' => [
                'data' => collect($devis->items())->map(fn (Document $document) => $this->mapDocumentForIndex($document))->values(),
                'meta' => [
                    'total' => $devis->total(),
                    'current_page' => $devis->currentPage(),
                    'last_page' => $devis->lastPage(),
                    'per_page' => $devis->perPage(),
                    'from' => $devis->firstItem(),
                    'to' => $devis->lastItem(),
                ],
                'links' => $devis->linkCollection()->toArray(),
            ],
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Devis/Create', $this->formPayload());
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $this->validateDocument($request);

        DB::transaction(function () use ($validated) {
            $document = Document::create([
                'tiers_id' => $validated['tiers_id'],
                'type' => Document::TYPE_DEVIS,
                'reference' => app(ReferenceGeneratorService::class)->generate(Document::TYPE_DEVIS),
                'project_title' => $validated['project_title'],
                'issue_date' => $validated['issue_date'],
                'due_date' => $validated['due_date'],
                'status' => Document::STATUS_DRAFT,
                'online_signature' => $validated['online_signature'] ?? false,
                'open_tracking' => $validated['open_tracking'] ?? false,
                'payment_terms' => $validated['payment_terms'] ?? null,
                ...ExchangeRateResolver::fieldsFromValidated($validated),
                ...$this->prestationFieldsFromValidated($validated),
                ...DocumentRegulatoryFields::fromValidated($validated),
            ]);

            $this->syncLignes($document, $validated['lignes'], $validated['operation_category'] ?? null);

            app(DocumentEventRecorder::class)->record(
                $document,
                DocumentEvent::TYPE_CREATED,
                'Devis créé en tant que brouillon.',
            );
        });

        return redirect()
            ->route('devis.index')
            ->with('success', 'Devis brouillon créé.');
    }

    public function edit(Document $devis): Response|RedirectResponse
    {
        if (! $devis->isDevis()) {
            abort(404);
        }

        $devis->load(['tier', 'lignes']);

        return Inertia::render('Devis/Create', [
            ...$this->formPayload($devis),
            'document' => $this->mapDocument($devis, includeLignes: true),
        ]);
    }

    public function update(Request $request, Document $devis): RedirectResponse
    {
        if (! $devis->isDevis()) {
            abort(404);
        }

        if ($devis->status !== Document::STATUS_DRAFT) {
            return redirect()
                ->route('devis.index')
                ->with('error', 'Un devis envoyé ne peut plus être modifié.');
        }

        if ($response = $this->rejectIfLocked($devis)) {
            return $response;
        }

        if ($response = $this->rejectImmutableFieldChanges($devis, $request)) {
            return $response;
        }

        $validated = $this->validateDocument($request, $devis);
        $validated = $this->stripImmutableFields($devis, $validated);

        DB::transaction(function () use ($devis, $validated) {
            $payload = [
                'tiers_id' => $validated['tiers_id'],
                'project_title' => $validated['project_title'],
                'issue_date' => $validated['issue_date'],
                'due_date' => $validated['due_date'],
                'online_signature' => $validated['online_signature'] ?? false,
                'open_tracking' => $validated['open_tracking'] ?? false,
                'payment_terms' => $validated['payment_terms'] ?? null,
                ...ExchangeRateResolver::fieldsFromValidated($validated, $devis),
                ...$this->prestationFieldsFromValidated($validated),
                ...DocumentRegulatoryFields::fromValidated($validated),
            ];

            $devis->update($payload);

            $this->syncLignes($devis, $validated['lignes'], $validated['operation_category'] ?? null);
        });

        return redirect()
            ->route('devis.index')
            ->with('success', 'Devis mis à jour.');
    }

    public function destroy(Document $devis): RedirectResponse
    {
        if (! $devis->isDevis()) {
            abort(404);
        }

        if ($devis->status !== Document::STATUS_DRAFT) {
            return redirect()
                ->route('devis.index')
                ->with('error', 'Un devis envoyé ne peut plus être supprimé.');
        }

        DB::transaction(function () use ($devis) {
            $devis->lignes()->delete();
            $devis->delete();
        });

        return redirect()
            ->route('devis.index')
            ->with('success', 'Devis supprimé.');
    }

    public function pdf(Document $devis): HttpResponse
    {
        if (! $devis->isDevis()) {
            abort(404);
        }

        $pdfService = app(DocumentPdfService::class);
        $filename = $pdfService->filename($devis);

        return response($pdfService->render($devis), 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => 'inline; filename="'.$filename.'"',
        ]);
    }

    public function sendEmail(Document $devis): RedirectResponse
    {
        if (! $devis->isDevis()) {
            return back()->with('error', 'Cette action est réservée aux devis.');
        }

        if ($devis->status !== Document::STATUS_DRAFT) {
            return back()->with('error', 'Seul un devis en brouillon peut être envoyé par email.');
        }

        $devis->load('tier');

        if (! $devis->tier?->email) {
            return back()->with(
                'error',
                'Impossible d\'envoyer le devis : le client n\'a pas d\'adresse email renseignée.',
            );
        }

        try {
            app(DevisMailerService::class)->send($devis, $devis->tier->email);
        } catch (\Throwable $exception) {
            report($exception);

            return back()->with(
                'error',
                'L\'envoi du devis par email a échoué. Le brouillon n\'a pas été modifié.',
            );
        }

        DB::transaction(function () use ($devis) {
            $devis->update([
                'status' => Document::STATUS_SENT,
                'open_tracking' => true,
            ]);

            app(DocumentEventRecorder::class)->record(
                $devis,
                DocumentEvent::TYPE_SENT,
                'Devis envoyé par email au client.',
            );
        });

        return redirect()
            ->route('devis.index')
            ->with(
                'success',
                "Devis {$devis->reference} envoyé par email à {$devis->tier->email} (PDF en pièce jointe).",
            );
    }

    public function markAsSent(Document $devis): RedirectResponse
    {
        if (! $devis->isDevis()) {
            return back()->with('error', 'Cette action est réservée aux devis.');
        }

        if ($devis->status !== Document::STATUS_DRAFT) {
            return back()->with('error', 'Seul un devis en brouillon peut être marqué comme envoyé.');
        }

        DB::transaction(function () use ($devis) {
            $devis->update([
                'status' => Document::STATUS_SENT,
                'open_tracking' => true,
            ]);

            app(DocumentEventRecorder::class)->record(
                $devis,
                DocumentEvent::TYPE_SENT,
                'Devis marqué comme envoyé.',
            );
        });

        return back()->with('success', 'Devis marqué comme envoyé.');
    }

    public function markAsAccepted(Document $devis): RedirectResponse
    {
        if (! $devis->isDevis()) {
            return back()->with('error', 'Cette action est réservée aux devis.');
        }

        if ($devis->status !== Document::STATUS_SENT) {
            return back()->with('error', 'Seul un devis envoyé peut être marqué comme accepté.');
        }

        DB::transaction(function () use ($devis) {
            $devis->update(['status' => Document::STATUS_ACCEPTED]);

            app(DocumentEventRecorder::class)->record(
                $devis,
                DocumentEvent::TYPE_ACCEPTED,
                'Devis accepté par le client.',
            );
        });

        return back()->with('success', 'Devis marqué comme accepté.');
    }

    public function markAsRejected(Document $devis): RedirectResponse
    {
        if (! $devis->isDevis()) {
            return back()->with('error', 'Cette action est réservée aux devis.');
        }

        if ($devis->status !== Document::STATUS_SENT) {
            return back()->with('error', 'Seul un devis envoyé peut être marqué comme refusé.');
        }

        DB::transaction(function () use ($devis) {
            $devis->update(['status' => Document::STATUS_REJECTED]);

            app(DocumentEventRecorder::class)->record(
                $devis,
                DocumentEvent::TYPE_REJECTED,
                'Devis refusé par le client.',
            );
        });

        return back()->with('success', 'Devis marqué comme refusé.');
    }

    public function convertToFacture(Document $devis): RedirectResponse
    {
        if (! $devis->isDevis()) {
            abort(404);
        }

        if ($devis->status !== Document::STATUS_ACCEPTED) {
            return back()->with('error', 'Seul un devis accepté peut être converti en facture.');
        }

        if ($devis->children()->where('type', Document::TYPE_FACTURE)->exists()) {
            return back()->with('error', 'Ce devis a déjà été converti en facture.');
        }

        $devis->load('lignes');

        $facture = DB::transaction(function () use ($devis) {
            $prestation = DocumentPrestation::normalize([
                'type_prestation' => $devis->type_prestation,
                'destination' => $devis->destination,
                'jours_stockage' => $devis->jours_stockage,
            ]);

            $facture = Document::create([
                'tiers_id' => $devis->tiers_id,
                'type' => Document::TYPE_FACTURE,
                'reference' => app(ReferenceGeneratorService::class)->generate(Document::TYPE_FACTURE),
                'project_title' => $devis->project_title,
                'issue_date' => now()->toDateString(),
                'due_date' => now()->addDays(30)->toDateString(),
                'status' => Document::STATUS_DRAFT,
                'parent_id' => $devis->id,
                'currency_code' => $devis->currency_code ?? 'EUR',
                'exchange_rate' => $devis->exchange_rate ?? 1.0,
                'payment_terms' => $devis->payment_terms,
                'operation_category' => $devis->operation_category ?? Document::OPERATION_SERVICE,
                'delivery_address' => $devis->delivery_address,
                'vat_on_debits' => (bool) $devis->vat_on_debits,
                ...$prestation,
            ]);

            foreach ($devis->lignes as $ligne) {
                $facture->lignes()->create([
                    'article_id' => $ligne->article_id,
                    'label' => $ligne->label,
                    'description' => $ligne->description,
                    'quantity' => $ligne->quantity,
                    'unit_price_ht' => $ligne->unit_price_ht,
                    'discount_type' => $ligne->discount_type,
                    'discount_value' => $ligne->discount_value,
                    'vat_rate' => $ligne->vat_rate,
                ]);
            }

            app(DocumentEventRecorder::class)->record(
                $devis,
                DocumentEvent::TYPE_CONVERTED,
                'Facture générée à partir de ce devis.',
            );

            app(DocumentEventRecorder::class)->record(
                $facture,
                DocumentEvent::TYPE_CREATED,
                'Facture créée automatiquement depuis le devis '.$devis->reference.'.',
            );

            return $facture;
        });

        return redirect()
            ->route('factures.edit', $facture)
            ->with('success', 'Facture brouillon créée à partir du devis.');
    }

    /**
     * @return array<string, mixed>
     */
    private function formPayload(?Document $document = null): array
    {
        return [
            'vatRates' => TaxRateResolver::allRates(),
            'clients' => Tier::query()
                ->orderBy('name')
                ->get(['id', 'name', 'email', 'address', 'delivery_address', 'country_code']),
            'catalogueArticles' => ArticleCatalog::forDocument($document),
            'operationCategories' => Document::operationCategories(),
            'formDefaults' => [
                'tiers_id' => '',
                'project_title' => '',
                'issue_date' => now()->toDateString(),
                'validity_days' => 30,
                'due_date' => now()->addDays(30)->toDateString(),
                'payment_terms' => 'Acompte de 30% à la signature du devis. Solde à 30 jours fin de mois après livraison.',
                'global_discount' => 0,
                'status' => Document::STATUS_DRAFT,
                'currency_code' => 'EUR',
                'type_prestation' => DocumentPrestation::TYPE_SERVICE,
                'operation_category' => Document::OPERATION_SERVICE,
                'delivery_address' => '',
                'vat_on_debits' => false,
                'destination' => '',
                'jours_stockage' => 0,
                'lignes' => [
                    [
                        'article_id' => '',
                        'label' => '',
                        'description' => '',
                        'quantity' => 1,
                        'unit_price_ht' => 0,
                        'discount_type' => null,
                        'discount_value' => null,
                        'vat_rate' => TaxRateResolver::forCountry(null),
                    ],
                ],
            ],
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function validateDocument(Request $request, ?Document $document = null): array
    {
        return $request->validate([
            'tiers_id' => ['required', 'exists:tiers,id'],
            'project_title' => ['required', 'string', 'max:255'],
            'issue_date' => ['required', 'date'],
            'validity_days' => ['required', 'integer', 'min:1', 'max:365'],
            'due_date' => ['required', 'date', 'after_or_equal:issue_date'],
            'online_signature' => ['boolean'],
            'open_tracking' => ['boolean'],
            'payment_terms' => ['nullable', 'string'],
            'currency_code' => ['required', 'string', 'size:3', Rule::in(ExchangeRateResolver::supportedCodes())],
            ...DocumentPrestation::validationRules(),
            ...DocumentRegulatoryFields::validationRules(),
            'lignes' => ['required', 'array', 'min:1'],
            'lignes.*.article_id' => ['required', 'integer', 'exists:articles,id'],
            'lignes.*.quantity' => ['required', 'numeric', 'min:0.01'],
            'lignes.*.unit_price_ht' => ['required', 'numeric', 'min:0'],
            'lignes.*.discount_type' => ['nullable', Rule::in([LigneAmounts::DISCOUNT_PERCENT, LigneAmounts::DISCOUNT_FIXED, '', null])],
            'lignes.*.discount_value' => ['nullable', 'numeric', 'min:0'],
            'lignes.*.vat_rate' => ['required', 'numeric', 'min:0'],
        ]);
    }

    /**
     * @param  list<array<string, mixed>>  $lignes
     */
    private function syncLignes(Document $document, array $lignes, ?string $operationCategory = null): void
    {
        $document->loadMissing('tier');
        $vatRate = DocumentRegulatoryFields::resolveVatRate($document);

        $document->lignes()->delete();

        foreach ($lignes as $ligne) {
            $article = Article::query()->findOrFail($ligne['article_id']);

            [$discountType, $discountValue] = LigneAmounts::normalizeDiscountInput($ligne);

            $document->lignes()->create([
                'article_id' => $article->id,
                'label' => $article->designation,
                'description' => $article->description,
                'quantity' => $ligne['quantity'],
                'unit_price_ht' => $ligne['unit_price_ht'],
                'discount_type' => $discountType,
                'discount_value' => $discountValue,
                'vat_rate' => $vatRate,
            ]);
        }

        $document->update([
            'operation_category' => DocumentRegulatoryFields::inferOperationCategoryFromLignes(
                $lignes,
                $operationCategory ?? $document->operation_category,
            ),
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function mapDocument(Document $document, bool $includeLignes = false): array
    {
        $totalHt = DocumentTotals::totalHt($document);

        $payload = [
            'id' => $document->id,
            'reference' => $document->reference,
            'project_title' => $document->project_title,
            'issue_date' => $document->issue_date?->toDateString(),
            'due_date' => $document->due_date?->toDateString(),
            'status' => $document->status,
            'online_signature' => $document->online_signature,
            'open_tracking' => $document->open_tracking,
            'payment_terms' => $document->payment_terms,
            'global_discount' => 0,
            'currency_code' => $document->currency_code ?? 'EUR',
            'type_prestation' => $document->type_prestation ?? DocumentPrestation::TYPE_SERVICE,
            'operation_category' => $document->operation_category ?? Document::OPERATION_SERVICE,
            'delivery_address' => $document->delivery_address,
            'vat_on_debits' => (bool) ($document->vat_on_debits ?? false),
            'destination' => $document->destination,
            'jours_stockage' => (int) ($document->jours_stockage ?? 0),
            'frais_port' => (float) ($document->frais_port ?? 0),
            'can_be_edited' => $document->canBeEdited(),
            'client' => $document->tier ? [
                'id' => $document->tier->id,
                'name' => $document->tier->name,
            ] : null,
            'total_ht' => round($totalHt, 2),
        ];

        if ($includeLignes) {
            $payload['lignes'] = $document->lignes->map(fn ($ligne) => [
                'article_id' => $ligne->article_id,
                'label' => $ligne->label,
                'description' => $ligne->description,
                'quantity' => $ligne->quantity,
                'unit_price_ht' => $ligne->unit_price_ht,
                'discount_type' => $ligne->discount_type,
                'discount_value' => $ligne->discount_value,
                'vat_rate' => $ligne->vat_rate,
            ])->values();
        }

        return $payload;
    }

    /**
     * @param  array<string, mixed>  $validated
     * @return array<string, mixed>
     */
    private function prestationFieldsFromValidated(array $validated): array
    {
        return DocumentPrestation::normalize($validated);
    }

    private function applyAmountFilter(Builder $query, string $amountRange): void
    {
        $subquery = DocumentTotals::lignesTtcInEurSql();

        match ($amountRange) {
            'under_5000' => $query->whereRaw("{$subquery} < ?", [5000]),
            '5000_15000' => $query->whereRaw("{$subquery} BETWEEN ? AND ?", [5000, 15000]),
            'over_15000' => $query->whereRaw("{$subquery} > ?", [15000]),
            default => null,
        };
    }

    /**
     * @param  Collection<int, Document>  $documents
     * @return array<string, mixed>
     */
    private function buildKpis($documents): array
    {
        $now = now();
        $currentMonth = $documents->filter(
            fn (Document $doc) => $doc->issue_date?->isSameMonth($now) && $doc->issue_date?->isSameYear($now),
        );
        $lastMonth = $documents->filter(
            fn (Document $doc) => $doc->issue_date?->isSameMonth($now->copy()->subMonth()) && $doc->issue_date?->isSameYear($now->copy()->subMonth()),
        );

        $currentTotal = $currentMonth->sum(fn (Document $doc) => DocumentTotals::totalTtcInEur($doc));
        $lastTotal = $lastMonth->sum(fn (Document $doc) => DocumentTotals::totalTtcInEur($doc));
        $trend = $lastTotal > 0
            ? round((($currentTotal - $lastTotal) / $lastTotal) * 100, 1)
            : ($currentTotal > 0 ? 100.0 : 0.0);

        $closedStatuses = [
            Document::STATUS_SENT,
            Document::STATUS_ACCEPTED,
            Document::STATUS_REJECTED,
            Document::STATUS_EXPIRED,
        ];
        $closed = $documents->whereIn('status', $closedStatuses);
        $accepted = $documents->where('status', Document::STATUS_ACCEPTED);
        $conversionRate = $closed->count() > 0
            ? round(($accepted->count() / $closed->count()) * 100, 1)
            : 0.0;

        $sparkline = [];
        for ($i = 5; $i >= 0; $i--) {
            $month = $now->copy()->subMonths($i);
            $sparkline[] = round(
                $documents
                    ->filter(fn (Document $doc) => $doc->issue_date?->isSameMonth($month) && $doc->issue_date?->isSameYear($month))
                    ->sum(fn (Document $doc) => DocumentTotals::totalTtcInEur($doc)) / 1000,
                1,
            );
        }

        $conversionSparkline = [];
        for ($i = 5; $i >= 0; $i--) {
            $month = $now->copy()->subMonths($i);
            $monthClosed = $documents->filter(
                fn (Document $doc) => $doc->issue_date?->isSameMonth($month)
                    && $doc->issue_date?->isSameYear($month)
                    && in_array($doc->status, $closedStatuses, true),
            );
            $monthAccepted = $monthClosed->where('status', Document::STATUS_ACCEPTED);
            $conversionSparkline[] = $monthClosed->count() > 0
                ? round(($monthAccepted->count() / $monthClosed->count()) * 100, 1)
                : 0.0;
        }

        return [
            'month_total' => round($currentTotal, 2),
            'month_trend' => $trend,
            'conversion_rate' => $conversionRate,
            'conversion_trend' => round($conversionRate * 0.06, 1),
            'expiring_count' => $this->buildExpiringSoon($documents)->count(),
            'sparkline_totals' => $sparkline,
            'sparkline_conversion' => $conversionSparkline,
        ];
    }

    /**
     * @param  Collection<int, Document>  $documents
     * @return list<array<string, mixed>>
     */
    private function buildPipeline($documents): array
    {
        $steps = [
            ['status' => Document::STATUS_DRAFT, 'label' => 'Brouillon', 'color' => 'slate'],
            ['status' => Document::STATUS_SENT, 'label' => 'Envoyé', 'color' => 'blue'],
            ['status' => Document::STATUS_ACCEPTED, 'label' => 'Accepté', 'color' => 'emerald'],
            ['status' => Document::STATUS_REJECTED, 'label' => 'Refusé', 'color' => 'red'],
            ['status' => Document::STATUS_EXPIRED, 'label' => 'Expiré', 'color' => 'amber'],
        ];

        return collect($steps)->map(function (array $step) use ($documents) {
            $items = $documents->where('status', $step['status']);
            $amount = $items->sum(fn (Document $doc) => DocumentTotals::totalTtcInEur($doc));

            return [
                'status' => $step['status'],
                'label' => $step['label'],
                'color' => $step['color'],
                'count' => $items->count(),
                'amount' => round($amount, 2),
                'amount_label' => $this->formatCompactMoney($amount),
            ];
        })->values()->all();
    }

    /**
     * @param  Collection<int, Document>  $documents
     * @return Collection<int, array<string, mixed>>
     */
    private function buildExpiringSoon($documents)
    {
        $today = now()->startOfDay();

        return $documents
            ->filter(function (Document $doc) use ($today) {
                if (! $doc->due_date || ! in_array($doc->status, [Document::STATUS_SENT, Document::STATUS_DRAFT], true)) {
                    return false;
                }

                $due = $doc->due_date->startOfDay();
                $days = $today->diffInDays($due, false);

                return $days >= 0 && $days <= 7;
            })
            ->sortBy('due_date')
            ->take(3)
            ->map(function (Document $doc) use ($today) {
                $due = $doc->due_date->startOfDay();
                $days = (int) $today->diffInDays($due, false);

                return [
                    'id' => $doc->id,
                    'reference' => $doc->reference,
                    'client_name' => $doc->tier?->name ?? '—',
                    'days_until' => $days,
                    'label' => match ($days) {
                        0 => 'Aujourd\'hui',
                        1 => 'Demain',
                        default => "Dans {$days} jours",
                    },
                    'urgency' => match (true) {
                        $days === 0 => 'danger',
                        $days <= 2 => 'warning',
                        default => 'neutral',
                    },
                ];
            })
            ->values();
    }

    /**
     * @return array<string, mixed>
     */
    private function mapDocumentForIndex(Document $document): array
    {
        $totalTtc = DocumentTotals::totalTtc($document);
        $totalTtcEur = DocumentTotals::totalTtcInEur($document);
        $expiration = $this->expirationMeta($document);
        $factureChild = $document->relationLoaded('children')
            ? $document->children->first(fn (Document $child) => $child->type === Document::TYPE_FACTURE)
            : null;

        return [
            'id' => $document->id,
            'reference' => $document->reference,
            'issue_date' => $document->issue_date?->toDateString(),
            'issue_date_label' => $document->issue_date?->translatedFormat('d M Y'),
            'due_date' => $document->due_date?->toDateString(),
            'due_date_label' => $document->due_date?->translatedFormat('d M Y'),
            'status' => $document->status,
            'status_label' => $this->statusLabel($document->status),
            'total_ttc' => round($totalTtc, 2),
            'total_ttc_eur' => round($totalTtcEur, 2),
            'currency_code' => $document->currency_code ?? 'EUR',
            'can_be_edited' => $document->canBeEdited(),
            'can_delete' => $document->status === Document::STATUS_DRAFT,
            'can_send' => $document->status === Document::STATUS_DRAFT,
            'can_accept' => $document->status === Document::STATUS_SENT,
            'can_reject' => $document->status === Document::STATUS_SENT,
            'can_convert_to_facture' => $document->status === Document::STATUS_ACCEPTED && $factureChild === null,
            'converted_facture_id' => $factureChild?->id,
            'expiration' => $expiration,
            'client' => $this->mapClient($document->tier),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function expirationMeta(Document $document): array
    {
        if ($document->status === Document::STATUS_DRAFT) {
            return ['label' => '—', 'variant' => 'neutral'];
        }

        if ($document->status === Document::STATUS_EXPIRED) {
            return ['label' => 'Expiré', 'variant' => 'danger'];
        }

        if (! $document->due_date) {
            return ['label' => '—', 'variant' => 'neutral'];
        }

        $today = now()->startOfDay();
        $due = $document->due_date->startOfDay();
        $days = (int) $today->diffInDays($due, false);

        if ($days < 0) {
            return ['label' => 'Expiré', 'variant' => 'danger'];
        }

        if ($days === 0) {
            return ['label' => 'Aujourd\'hui', 'variant' => 'warning'];
        }

        if ($days === 1) {
            return ['label' => 'Demain', 'variant' => 'warning'];
        }

        return [
            'label' => $due->translatedFormat('d M Y'),
            'variant' => 'neutral',
        ];
    }

    private function formatCompactMoney(float $amount): string
    {
        if ($amount >= 1000) {
            return '€'.number_format($amount / 1000, 1, ',', ' ').'k';
        }

        return '€'.number_format($amount, 0, ',', ' ');
    }

    private function statusLabel(string $status): string
    {
        return match ($status) {
            Document::STATUS_DRAFT => 'Brouillon',
            Document::STATUS_SENT => 'Envoyé',
            Document::STATUS_ACCEPTED => 'Accepté',
            Document::STATUS_REJECTED => 'Refusé',
            Document::STATUS_EXPIRED => 'Expiré',
            default => ucfirst($status),
        };
    }

    /**
     * @return array<string, mixed>|null
     */
    private function mapClient(?Tier $tier): ?array
    {
        if ($tier === null) {
            return null;
        }

        $words = preg_split('/\s+/', trim($tier->name)) ?: [];
        $initials = strtoupper(
            collect($words)->take(2)->map(fn (string $word) => mb_substr($word, 0, 1))->implode(''),
        );

        $palette = [
            'bg-blue-600 text-white',
            'bg-emerald-600 text-white',
            'bg-violet-600 text-white',
            'bg-amber-600 text-white',
            'bg-rose-600 text-white',
        ];

        return [
            'id' => $tier->id,
            'name' => $tier->name,
            'email' => $tier->email,
            'initials' => $initials !== '' ? $initials : 'CL',
            'avatar_class' => $palette[$tier->id % count($palette)],
        ];
    }
}
