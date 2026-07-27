<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Http\Controllers\Concerns\SecuresDocumentLifecycle;
use App\Jobs\TransmitInvoiceToPaJob;
use App\Models\Article;
use App\Models\Document;
use App\Models\DocumentEvent;
use App\Models\Payment;
use App\Models\Tier;
use App\Services\DocumentEventRecorder;
use App\Services\DocumentMailerService;
use App\Services\DocumentPdfService;
use App\Services\ReferenceGeneratorService;
use App\Support\ArticleCatalog;
use App\Support\DocumentPrestation;
use App\Support\DocumentRegulatoryFields;
use App\Support\DocumentTotals;
use App\Support\ExchangeRateResolver;
use App\Support\FinancialDiscount;
use App\Support\InvoiceComplianceValidator;
use App\Support\LigneAmounts;
use App\Support\TaxRateResolver;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\Response as HttpResponse;

class FactureController extends Controller
{
    use SecuresDocumentLifecycle;

    public function index(Request $request): Response
    {
        $filters = [
            'search' => trim((string) $request->query('search', '')),
            'status' => (string) $request->query('status', ''),
            'date_range' => (string) $request->query('date_range', ''),
            'amount_range' => (string) $request->query('amount_range', ''),
            'document_type' => (string) $request->query('document_type', ''),
        ];

        $documentsQuery = Document::query()
            ->whereIn('type', [Document::TYPE_FACTURE, Document::TYPE_AVOIR])
            ->with(['tier', 'lignes', 'children', 'payments', 'parent'])
            ->when($filters['document_type'] === 'facture', fn (Builder $query) => $query->where('type', Document::TYPE_FACTURE))
            ->when($filters['document_type'] === 'avoir', fn (Builder $query) => $query->where('type', Document::TYPE_AVOIR))
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

        $documents = (clone $documentsQuery)->paginate(10)->withQueryString();

        $allFactures = Document::query()
            ->where('type', Document::TYPE_FACTURE)
            ->with(['tier', 'lignes', 'children', 'payments'])
            ->get();

        return Inertia::render('Factures/Index', [
            'filters' => $filters,
            'kpis' => $this->buildKpis($allFactures),
            'pipeline' => $this->buildPipeline($allFactures),
            'overdue' => $this->buildOverdue($allFactures),
            'factures' => [
                'data' => collect($documents->items())->map(fn (Document $document) => $this->mapDocumentForIndex($document))->values(),
                'meta' => [
                    'total' => $documents->total(),
                    'current_page' => $documents->currentPage(),
                    'last_page' => $documents->lastPage(),
                    'per_page' => $documents->perPage(),
                    'from' => $documents->firstItem(),
                    'to' => $documents->lastItem(),
                ],
                'links' => $documents->linkCollection()->toArray(),
            ],
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('FinFlow/InvoiceCreate', $this->formPayload());
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $this->validateDocument($request);

        $document = DB::transaction(function () use ($validated) {
            $document = Document::create([
                'tiers_id' => $validated['tiers_id'],
                'type' => Document::TYPE_FACTURE,
                'reference' => app(ReferenceGeneratorService::class)->generate(Document::TYPE_FACTURE),
                'issue_date' => $validated['issue_date'],
                'due_date' => $validated['due_date'],
                'status' => Document::STATUS_DRAFT,
                ...ExchangeRateResolver::fieldsFromValidated($validated),
                ...$this->prestationFieldsFromValidated($validated),
                ...$this->financialFieldsFromValidated($validated),
                ...DocumentRegulatoryFields::fromValidated($validated),
            ]);

            $this->syncLignes($document, $validated['lignes'], $validated['operation_category'] ?? null);

            app(DocumentEventRecorder::class)->record(
                $document,
                DocumentEvent::TYPE_CREATED,
                'Facture créée.',
            );

            return $document;
        });

        return redirect()
            ->route('factures.index')
            ->with('success', 'Facture créée. Cliquez sur « Envoyer » dans la liste pour l\'envoyer par email au client.');
    }

    public function edit(Document $facture): Response|RedirectResponse
    {
        if (! $facture->isFacture() && ! $facture->isAvoir()) {
            abort(404);
        }

        $facture->load(['tier', 'lignes', 'parent', 'children', 'events']);

        return Inertia::render('FinFlow/InvoiceCreate', [
            ...$this->formPayload($facture),
            'document' => $this->mapDocument($facture, includeLignes: true),
        ]);
    }

    public function update(Request $request, Document $facture): RedirectResponse
    {
        if ($response = $this->rejectIfLocked($facture)) {
            return $response;
        }

        if ($response = $this->rejectImmutableFieldChanges($facture, $request)) {
            return $response;
        }

        if (! $facture->isFacture() && ! $facture->isAvoir()) {
            abort(404);
        }

        $validated = $this->validateDocument($request, $facture);
        $validated = $this->stripImmutableFields($facture, $validated);

        DB::transaction(function () use ($facture, $validated) {
            $payload = [
                'tiers_id' => $validated['tiers_id'],
                'issue_date' => $validated['issue_date'],
                'due_date' => $validated['due_date'],
                ...ExchangeRateResolver::fieldsFromValidated($validated, $facture),
                ...$this->prestationFieldsFromValidated($validated),
                ...$this->financialFieldsFromValidated($validated),
                ...DocumentRegulatoryFields::fromValidated($validated),
            ];

            $facture->update($payload);

            $this->syncLignes($facture, $validated['lignes'], $validated['operation_category'] ?? null);
        });

        return redirect()
            ->route('factures.index')
            ->with('success', 'Facture mise à jour.');
    }

    public function destroy(Document $facture): RedirectResponse
    {
        if ($response = $this->rejectIfLocked($facture)) {
            return $response;
        }

        if (! $facture->isFacture() && ! $facture->isAvoir()) {
            abort(404);
        }

        DB::transaction(function () use ($facture) {
            $facture->lignes()->delete();
            $facture->delete();
        });

        return redirect()
            ->route('factures.index')
            ->with('success', 'Facture supprimée.');
    }

    public function send(Document $facture): RedirectResponse
    {
        if (! $facture->isFacture()) {
            return back()->with('error', 'Cette action est réservée aux factures.');
        }

        if ($facture->status !== Document::STATUS_DRAFT) {
            return back()->with('error', 'Seule une facture en brouillon peut être envoyée.');
        }

        $facture->load(['tier', 'lignes']);

        $complianceErrors = app(InvoiceComplianceValidator::class)->validate($facture);

        if ($complianceErrors !== []) {
            return back()
                ->with(
                    'error',
                    'Émission refusée : la facture ne respecte pas les exigences de facturation électronique (BR-FR).',
                )
                ->with('compliance_errors', $complianceErrors);
        }

        if ($response = $this->rejectIfLocked($facture)) {
            return $response;
        }

        if (! $facture->tier?->email) {
            return back()->with(
                'error',
                'Impossible d\'envoyer la facture : le client n\'a pas d\'adresse email renseignée.',
            );
        }

        try {
            app(DocumentMailerService::class)->send($facture, $facture->tier->email);
        } catch (\Throwable $exception) {
            report($exception);

            return back()->with(
                'error',
                'L\'envoi de la facture par email a échoué. Le brouillon n\'a pas été modifié.',
            );
        }

        DB::transaction(function () use ($facture) {
            $facture->update(['status' => Document::STATUS_SENT]);

            app(DocumentEventRecorder::class)->record(
                $facture,
                DocumentEvent::TYPE_SENT,
                'Facture envoyée par email au client.',
            );
        });

        TransmitInvoiceToPaJob::dispatch($facture->id);

        return back()->with(
            'success',
            "Facture {$facture->reference} envoyée par email à {$facture->tier->email} (Factur-X en pièce jointe).",
        );
    }

    public function pdf(Document $facture): HttpResponse
    {
        $pdfService = app(DocumentPdfService::class);
        $filename = $pdfService->filename($facture);

        $pdfContent = $facture->status !== Document::STATUS_DRAFT
            ? $pdfService->renderFacturX($facture)
            : $pdfService->render($facture);

        return response($pdfContent, 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => 'inline; filename="'.$filename.'"',
        ]);
    }

    public function recordPayment(Request $request, Document $facture): RedirectResponse
    {
        if (! $facture->isFacture()) {
            return back()->with('error', 'Cette action est réservée aux factures.');
        }

        if (! in_array($facture->status, [Document::STATUS_SENT], true)) {
            return back()->with('error', 'Seule une facture envoyée peut recevoir un paiement.');
        }

        $validated = $request->validate([
            'amount' => ['required', 'numeric', 'min:0'],
            'payment_date' => ['required', 'date'],
            'payment_method' => ['required', 'string', Rule::in(['virement', 'cb', 'especes', 'cheque'])],
            'notes' => ['nullable', 'string', 'max:1000'],
        ]);

        $methodMap = [
            'virement' => Payment::METHOD_SEPA,
            'cb' => Payment::METHOD_CARD,
            'especes' => Payment::METHOD_MANUAL,
            'cheque' => Payment::METHOD_MANUAL,
        ];

        $resolution = FinancialDiscount::resolvePayment(
            $facture,
            (float) $validated['amount'],
            $validated['payment_date'],
        );

        if ($resolution['settled'] <= 0) {
            return back()->withErrors([
                'amount' => 'Le montant encaissé doit être supérieur à 0.',
            ]);
        }

        if ($resolution['remaining_after'] > 0.01 && $resolution['amount'] >= FinancialDiscount::remainingBalance($facture)) {
            return back()->withErrors([
                'amount' => 'Pour bénéficier de l\'escompte, saisissez le net à payer indiqué.',
            ]);
        }

        DB::transaction(function () use ($facture, $validated, $methodMap, $resolution) {
            $facture->payments()->create([
                'tiers_id' => $facture->tiers_id,
                'document_id' => $facture->id,
                'kind' => Payment::KIND_PAYMENT,
                'amount' => $resolution['amount'],
                'financial_discount_amount' => $resolution['financial_discount_amount'],
                'transaction_fee' => 0,
                'payment_method' => $methodMap[$validated['payment_method']] ?? Payment::METHOD_MANUAL,
                'payment_method_detail' => $validated['payment_method'],
                'status' => Payment::STATUS_SUCCESS,
                'paid_at' => $validated['payment_date'],
                'notes' => $validated['notes'] ?? null,
            ]);

            if ($resolution['remaining_after'] <= 0.01) {
                $facture->update(['status' => Document::STATUS_PAID]);
            }

            $message = $resolution['escompte_applied']
                ? sprintf(
                    'Paiement enregistré avec escompte financier de %s €.',
                    number_format($resolution['financial_discount_amount'], 2, ',', ' '),
                )
                : 'Paiement enregistré.';

            app(DocumentEventRecorder::class)->record(
                $facture,
                DocumentEvent::TYPE_PAID,
                $message,
            );
        });

        $success = $resolution['escompte_applied']
            ? sprintf(
                'Paiement enregistré. Escompte financier appliqué : %s €.',
                number_format($resolution['financial_discount_amount'], 2, ',', ' '),
            )
            : 'Paiement enregistré avec succès.';

        return back()->with('success', $success);
    }

    public function generateAvoir(Document $facture): RedirectResponse
    {
        if (! $facture->isFacture()) {
            return back()->with('error', 'Cette action est réservée aux factures.');
        }

        if (! in_array($facture->status, [Document::STATUS_SENT, Document::STATUS_PAID], true)) {
            return back()->with('error', 'Seules les factures envoyées ou payées peuvent générer un avoir.');
        }

        if ($facture->children()->where('type', Document::TYPE_AVOIR)->exists()) {
            return back()->with('error', 'Un avoir existe déjà pour cette facture.');
        }

        $facture->load('lignes');

        $avoir = DB::transaction(function () use ($facture) {
            $avoir = Document::create([
                'tiers_id' => $facture->tiers_id,
                'type' => Document::TYPE_AVOIR,
                'reference' => app(ReferenceGeneratorService::class)->generate(Document::TYPE_AVOIR),
                'issue_date' => now()->toDateString(),
                'due_date' => null,
                'status' => Document::STATUS_DRAFT,
                'parent_id' => $facture->id,
                'currency_code' => $facture->currency_code,
                'exchange_rate' => $facture->exchange_rate,
                'payment_terms' => $facture->payment_terms,
                'operation_category' => $facture->operation_category ?? Document::OPERATION_SERVICE,
                'delivery_address' => $facture->delivery_address,
                'vat_on_debits' => (bool) $facture->vat_on_debits,
            ]);

            foreach ($facture->lignes as $ligne) {
                $avoir->lignes()->create([
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
                $facture,
                DocumentEvent::TYPE_VOIDED,
                "Avoir {$avoir->reference} généré.",
            );

            return $avoir;
        });

        return redirect()
            ->route('factures.edit', $avoir)
            ->with('success', 'Avoir généré en brouillon.');
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
                'issue_date' => now()->toDateString(),
                'due_date' => now()->addDays(30)->toDateString(),
                'status' => Document::STATUS_DRAFT,
                'currency_code' => 'EUR',
                'type_prestation' => DocumentPrestation::TYPE_SERVICE,
                'operation_category' => Document::OPERATION_SERVICE,
                'delivery_address' => '',
                'vat_on_debits' => false,
                'destination' => '',
                'jours_stockage' => 0,
                'financial_discount_percent' => 0,
                'financial_discount_days' => null,
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
            'issue_date' => ['required', 'date'],
            'due_date' => ['nullable', 'date', 'after_or_equal:issue_date'],
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
            'financial_discount_percent' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'financial_discount_days' => ['nullable', 'integer', 'min:1', 'max:365'],
        ]);
    }

    /**
     * @param  array<string, mixed>  $validated
     * @return array<string, mixed>
     */
    private function financialFieldsFromValidated(array $validated): array
    {
        $percent = round((float) ($validated['financial_discount_percent'] ?? 0), 2);
        $days = isset($validated['financial_discount_days']) && $validated['financial_discount_days'] !== ''
            ? (int) $validated['financial_discount_days']
            : null;

        if ($percent <= 0) {
            return [
                'financial_discount_percent' => 0,
                'financial_discount_days' => null,
            ];
        }

        return [
            'financial_discount_percent' => $percent,
            'financial_discount_days' => $days ?? 10,
        ];
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
        $document->loadMissing(['children', 'parent']);

        $totalHt = DocumentTotals::totalHt($document);

        $hasAvoir = $document->isFacture()
            && $document->children->contains(fn (Document $child) => $child->type === Document::TYPE_AVOIR);

        $payload = [
            'id' => $document->id,
            'type' => $document->type,
            'reference' => $document->reference,
            'issue_date' => $document->issue_date?->toDateString(),
            'due_date' => $document->due_date?->toDateString(),
            'status' => $document->status,
            'can_be_edited' => $document->canBeEdited(),
            'can_create_avoir' => $document->isFacture()
                && in_array($document->status, [Document::STATUS_SENT, Document::STATUS_PAID], true)
                && ! $hasAvoir,
            'parent_reference' => $document->parent?->reference,
            'client' => $document->tier ? [
                'id' => $document->tier->id,
                'name' => $document->tier->name,
            ] : null,
            'total_ht' => round($totalHt, 2),
            'currency_code' => $document->currency_code ?? 'EUR',
            'type_prestation' => $document->type_prestation ?? DocumentPrestation::TYPE_SERVICE,
            'operation_category' => $document->operation_category ?? Document::OPERATION_SERVICE,
            'delivery_address' => $document->delivery_address,
            'vat_on_debits' => (bool) ($document->vat_on_debits ?? false),
            'destination' => $document->destination,
            'jours_stockage' => (int) ($document->jours_stockage ?? 0),
            'frais_port' => (float) ($document->frais_port ?? 0),
            'financial_discount_percent' => (float) ($document->financial_discount_percent ?? 0),
            'financial_discount_days' => $document->financial_discount_days,
            'financial_discount_deadline' => FinancialDiscount::deadline($document)?->toDateString(),
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

            $payload['events'] = $document->events->map(fn (DocumentEvent $event) => [
                'id' => $event->id,
                'event_type' => $event->event_type,
                'description' => $event->description,
                'created_at' => $event->created_at?->toIso8601String(),
                'created_at_label' => $event->created_at
                    ? $event->created_at->locale('fr')->translatedFormat('j F Y \à H:i')
                    : null,
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
            fn (Document $doc) => $doc->issue_date?->isSameMonth($now) && $doc->issue_date?->isSameYear($now)
                && $doc->status !== Document::STATUS_CANCELLED,
        );
        $lastMonth = $documents->filter(
            fn (Document $doc) => $doc->issue_date?->isSameMonth($now->copy()->subMonth()) && $doc->issue_date?->isSameYear($now->copy()->subMonth())
                && $doc->status !== Document::STATUS_CANCELLED,
        );

        $currentTotal = $currentMonth->sum(fn (Document $doc) => DocumentTotals::totalTtcInEur($doc))
            - $this->sumSentAvoirInEurForMonth($now);
        $lastTotal = $lastMonth->sum(fn (Document $doc) => DocumentTotals::totalTtcInEur($doc))
            - $this->sumSentAvoirInEurForMonth($now->copy()->subMonth());
        $currentTotal = max(0, $currentTotal);
        $lastTotal = max(0, $lastTotal);
        $trend = $lastTotal > 0
            ? round((($currentTotal - $lastTotal) / $lastTotal) * 100, 1)
            : ($currentTotal > 0 ? 100.0 : 0.0);

        $collected = $currentMonth->where('status', Document::STATUS_PAID)
            ->sum(fn (Document $doc) => DocumentTotals::totalTtcInEur($doc));
        $recoveryRate = $currentTotal > 0
            ? round(($collected / $currentTotal) * 100, 1)
            : 0.0;

        $lastMonthCollected = $lastMonth->where('status', Document::STATUS_PAID)
            ->sum(fn (Document $doc) => DocumentTotals::totalTtcInEur($doc));
        $lastRecoveryRate = $lastTotal > 0
            ? round(($lastMonthCollected / $lastTotal) * 100, 1)
            : 0.0;
        $recoveryTrend = round($recoveryRate - $lastRecoveryRate, 1);

        $sparkline = [];
        for ($i = 5; $i >= 0; $i--) {
            $month = $now->copy()->subMonths($i);
            $sparkline[] = round(
                $documents
                    ->filter(fn (Document $doc) => $doc->issue_date?->isSameMonth($month) && $doc->issue_date?->isSameYear($month)
                        && $doc->status !== Document::STATUS_CANCELLED)
                    ->sum(fn (Document $doc) => DocumentTotals::totalTtcInEur($doc)) / 1000,
                1,
            );
        }

        $recoverySparkline = [];
        for ($i = 5; $i >= 0; $i--) {
            $month = $now->copy()->subMonths($i);
            $monthDocs = $documents->filter(
                fn (Document $doc) => $doc->issue_date?->isSameMonth($month) && $doc->issue_date?->isSameYear($month)
                    && $doc->status !== Document::STATUS_CANCELLED,
            );
            $monthTotal = $monthDocs->sum(fn (Document $doc) => DocumentTotals::totalTtcInEur($doc));
            $monthCollected = $monthDocs->where('status', Document::STATUS_PAID)
                ->sum(fn (Document $doc) => DocumentTotals::totalTtcInEur($doc));
            $recoverySparkline[] = $monthTotal > 0
                ? round(($monthCollected / $monthTotal) * 100, 1)
                : 0.0;
        }

        $overdueSparkline = [];
        for ($i = 5; $i >= 0; $i--) {
            $monthEnd = $now->copy()->subMonths($i)->endOfMonth()->startOfDay();
            $overdueSparkline[] = round(
                $documents
                    ->filter(function (Document $doc) use ($monthEnd) {
                        return $doc->status === Document::STATUS_SENT
                            && $doc->due_date
                            && $doc->due_date->startOfDay()->lte($monthEnd);
                    })
                    ->sum(fn (Document $doc) => DocumentTotals::totalTtcInEur($doc)) / 1000,
                1,
            );
        }

        $currentOverdueAmount = $documents
            ->filter(fn (Document $doc) => $doc->status === Document::STATUS_SENT
                && $doc->due_date
                && $doc->due_date->startOfDay()->lt($now->startOfDay()))
            ->sum(fn (Document $doc) => DocumentTotals::totalTtcInEur($doc));
        $lastMonthOverdueAmount = $documents
            ->filter(function (Document $doc) use ($now) {
                $lastMonthEnd = $now->copy()->subMonth()->endOfMonth()->startOfDay();

                return $doc->status === Document::STATUS_SENT
                    && $doc->due_date
                    && $doc->due_date->startOfDay()->lte($lastMonthEnd);
            })
            ->sum(fn (Document $doc) => DocumentTotals::totalTtcInEur($doc));
        $overdueTrend = $lastMonthOverdueAmount > 0
            ? round((($currentOverdueAmount - $lastMonthOverdueAmount) / $lastMonthOverdueAmount) * 100, 1)
            : ($currentOverdueAmount > 0 ? 100.0 : 0.0);

        $encoursDocs = $documents->where('status', Document::STATUS_SENT);
        $encoursAmount = $encoursDocs->sum(fn (Document $doc) => DocumentTotals::totalTtcInEur($doc));
        $encoursCount = $encoursDocs->count();

        return [
            'month_total' => round($currentTotal, 2),
            'month_trend' => $trend,
            'recovery_rate' => $recoveryRate,
            'recovery_trend' => $recoveryTrend,
            'encours_amount' => round($encoursAmount, 2),
            'encours_count' => $encoursCount,
            'overdue_count' => $this->buildOverdue($documents)->count(),
            'overdue_amount' => round($currentOverdueAmount, 2),
            'overdue_trend' => $overdueTrend,
            'sparkline_totals' => $sparkline,
            'sparkline_recovery' => $recoverySparkline,
            'sparkline_overdue' => $overdueSparkline,
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
            ['status' => Document::STATUS_PAID, 'label' => 'Payé', 'color' => 'emerald'],
            ['status' => Document::STATUS_CANCELLED, 'label' => 'Annulé', 'color' => 'red'],
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
    private function buildOverdue($documents)
    {
        $today = now()->startOfDay();

        return $documents
            ->filter(function (Document $doc) use ($today) {
                return $doc->status === Document::STATUS_SENT
                    && $doc->due_date
                    && $doc->due_date->startOfDay()->lt($today);
            })
            ->sortBy('due_date')
            ->take(3)
            ->map(function (Document $doc) use ($today) {
                $due = $doc->due_date->startOfDay();
                $days = (int) $due->diffInDays($today, false);

                return [
                    'id' => $doc->id,
                    'reference' => $doc->reference,
                    'client_name' => $doc->tier?->name ?? '—',
                    'days_overdue' => abs($days),
                    'label' => abs($days) === 0
                        ? 'Aujourd\'hui'
                        : 'En retard de '.abs($days).' jour'.(abs($days) > 1 ? 's' : ''),
                    'urgency' => abs($days) >= 7 ? 'danger' : 'warning',
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
        $amountPaid = round((float) $document->payments->sum('amount'), 2);
        $financialDiscountApplied = round((float) $document->payments->sum('financial_discount_amount'), 2);
        $settledAmount = FinancialDiscount::settledAmount($document);
        $remainingBalance = FinancialDiscount::remainingBalance($document, $totalTtc);
        $paymentQuote = FinancialDiscount::quoteForRemaining($document, now()->toDateString(), $totalTtc);
        $dueMeta = $this->dueDateMeta($document);
        $hasAvoir = $document->isFacture()
            && $document->children->contains(fn (Document $child) => $child->type === Document::TYPE_AVOIR);
        $isPartiallyPaid = $document->status === Document::STATUS_SENT && $settledAmount > 0 && $remainingBalance > 0.01;

        return [
            'id' => $document->id,
            'type' => $document->type,
            'type_label' => $document->type === Document::TYPE_AVOIR ? 'Avoir' : 'Facture',
            'reference' => $document->reference,
            'parent_reference' => $document->parent?->reference,
            'issue_date' => $document->issue_date?->toDateString(),
            'issue_date_label' => $this->formatDocumentDate($document->issue_date),
            'due_date' => $document->due_date?->toDateString(),
            'due_date_label' => $this->formatDocumentDate($document->due_date),
            'status' => $document->status,
            'status_label' => $this->statusLabel($document->status),
            'cdar_status' => $document->cdar_status,
            'cdar_status_label' => Document::cdarStatusLabel($document->cdar_status),
            'total_ttc' => round($totalTtc, 2),
            'amount_paid' => $amountPaid,
            'financial_discount_applied' => $financialDiscountApplied,
            'settled_amount' => $settledAmount,
            'remaining_balance' => $remainingBalance,
            'financial_discount_percent' => (float) ($document->financial_discount_percent ?? 0),
            'financial_discount_days' => $document->financial_discount_days,
            'financial_discount_deadline' => FinancialDiscount::deadline($document)?->toDateString(),
            'financial_discount_eligible' => $paymentQuote['eligible'],
            'financial_discount_amount_available' => $paymentQuote['discount_amount'],
            'suggested_payment_amount' => $paymentQuote['net_cash_due'],
            'is_partially_paid' => $isPartiallyPaid,
            'currency_code' => $document->currency_code ?? 'EUR',
            'can_be_edited' => $document->canBeEdited(),
            'can_send' => $document->isFacture() && $document->status === Document::STATUS_DRAFT,
            'can_record_payment' => $document->isFacture() && ($document->status === Document::STATUS_SENT || $isPartiallyPaid),
            'can_create_avoir' => $document->isFacture()
                && in_array($document->status, [Document::STATUS_SENT, Document::STATUS_PAID], true)
                && ! $hasAvoir,
            'has_avoir' => $hasAvoir,
            'due_date_display' => $dueMeta,
            'client' => $this->mapClient($document->tier),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function dueDateMeta(Document $document): array
    {
        if ($document->status === Document::STATUS_DRAFT) {
            return ['label' => '—', 'variant' => 'neutral'];
        }

        if ($document->status === Document::STATUS_PAID) {
            return [
                'label' => $this->formatDocumentDate($document->due_date) ?? '—',
                'variant' => 'neutral',
            ];
        }

        if ($document->status === Document::STATUS_CANCELLED) {
            return ['label' => '—', 'variant' => 'neutral'];
        }

        if (! $document->due_date) {
            return ['label' => '—', 'variant' => 'neutral'];
        }

        $today = now()->startOfDay();
        $due = $document->due_date->startOfDay();
        $days = (int) $today->diffInDays($due, false);

        if ($days < 0) {
            return ['label' => 'En retard', 'variant' => 'danger'];
        }

        if ($days === 0) {
            return ['label' => 'Aujourd\'hui', 'variant' => 'warning'];
        }

        if ($days === 1) {
            return ['label' => 'Demain', 'variant' => 'warning'];
        }

        return [
            'label' => $this->formatDocumentDate($due),
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

    private function formatDocumentDate(?Carbon $date): ?string
    {
        if ($date === null) {
            return null;
        }

        $months = [
            1 => 'Jan', 2 => 'Fév', 3 => 'Mar', 4 => 'Avr',
            5 => 'Mai', 6 => 'Juin', 7 => 'Juil', 8 => 'Aoû',
            9 => 'Sep', 10 => 'Oct', 11 => 'Nov', 12 => 'Déc',
        ];

        return sprintf(
            '%02d %s %d',
            $date->day,
            $months[$date->month] ?? $date->format('M'),
            $date->year,
        );
    }

    private function statusLabel(string $status): string
    {
        return match ($status) {
            Document::STATUS_DRAFT => 'Brouillon',
            Document::STATUS_SENT => 'Envoyé',
            Document::STATUS_PAID => 'Payé',
            Document::STATUS_CANCELLED => 'Annulé',
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

    private function sumSentAvoirInEurForMonth(Carbon $month): float
    {
        return (float) Document::query()
            ->where('type', Document::TYPE_AVOIR)
            ->where('status', Document::STATUS_SENT)
            ->whereYear('issue_date', $month->year)
            ->whereMonth('issue_date', $month->month)
            ->selectRaw('COALESCE(SUM('.DocumentTotals::lignesTtcInEurSql().'), 0) as total_eur')
            ->value('total_eur');
    }
}
