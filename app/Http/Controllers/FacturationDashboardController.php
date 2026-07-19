<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Models\Document;
use App\Models\Tier;
use App\Services\FinancialAnalysisService;
use App\Support\DocumentTotals;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Carbon;
use Inertia\Inertia;
use Inertia\Response;

class FacturationDashboardController extends Controller
{
    public function index(): Response
    {
        $factures = Document::query()
            ->where('type', Document::TYPE_FACTURE)
            ->with('lignes')
            ->get();

        $devis = Document::query()
            ->where('type', Document::TYPE_DEVIS)
            ->with('lignes')
            ->get();

        $today = now()->startOfDay();

        $caEncaisse = (float) Document::query()
            ->where('type', Document::TYPE_FACTURE)
            ->where('status', Document::STATUS_PAID)
            ->selectRaw('COALESCE(SUM('.DocumentTotals::lignesTtcInEurSql().'), 0) as total_eur')
            ->value('total_eur');

        $devisEnAttente = $devis->where('status', Document::STATUS_SENT);
        $devisEnAttenteAmount = (float) Document::query()
            ->where('type', Document::TYPE_DEVIS)
            ->where('status', Document::STATUS_SENT)
            ->selectRaw('COALESCE(SUM('.DocumentTotals::lignesTtcInEurSql().'), 0) as total_eur')
            ->value('total_eur');
        $devisEnAttenteCount = $devisEnAttente->count();

        $facturesEnRetard = $factures->filter(
            fn (Document $doc) => $doc->status === Document::STATUS_SENT
                && $doc->due_date
                && $doc->due_date->startOfDay()->lt($today),
        );
        $facturesEnRetardCount = $facturesEnRetard->count();

        $nouveauxClients = Tier::query()
            ->where('type', 'client')
            ->whereBetween('created_at', [now()->startOfMonth(), now()->endOfMonth()])
            ->count();

        $nouveauxClientsLastMonth = Tier::query()
            ->where('type', 'client')
            ->whereBetween('created_at', [
                now()->subMonth()->startOfMonth(),
                now()->subMonth()->endOfMonth(),
            ])
            ->count();

        $clientsTrend = $nouveauxClientsLastMonth > 0
            ? round((($nouveauxClients - $nouveauxClientsLastMonth) / $nouveauxClientsLastMonth) * 100, 1)
            : ($nouveauxClients > 0 ? 100.0 : 0.0);

        $caEncaisseTrend = $this->paidAmountTrend();

        return Inertia::render('Facturation/Dashboard', [
            'kpis' => [
                'ca_encaisse' => [
                    'amount' => round($caEncaisse, 2),
                    'trend_percent' => $caEncaisseTrend,
                    'sparkline' => $this->buildPaidSparkline(),
                ],
                'devis_en_attente' => [
                    'amount' => round($devisEnAttenteAmount, 2),
                    'count' => $devisEnAttenteCount,
                    'sparkline' => $this->buildPendingDevisSparkline(),
                ],
                'factures_en_retard' => [
                    'count' => $facturesEnRetardCount,
                    'sparkline' => $this->buildOverdueSparkline(),
                ],
                'nouveaux_clients' => [
                    'count' => $nouveauxClients,
                    'trend_percent' => $clientsTrend,
                    'sparkline' => $this->buildNewClientsSparkline(),
                ],
            ],
            'revenue_chart' => $this->buildRevenueChart(),
            'invoice_distribution' => $this->buildInvoiceDistribution($today),
            'recent_activity' => $this->buildRecentActivity(),
        ]);
    }

    public function analyze(FinancialAnalysisService $financialAnalysisService): JsonResponse
    {
        try {
            $analysis = $financialAnalysisService->analyze($this->buildAnonymizedFinancialData());

            return response()->json(['analysis' => $analysis]);
        } catch (\Throwable $exception) {
            report($exception);

            return response()->json([
                'error' => $exception->getMessage() ?: 'Impossible de générer l\'analyse pour le moment. Réessayez plus tard.',
            ], 503);
        }
    }

    /**
     * @return array<string, int|float|string>
     */
    private function buildAnonymizedFinancialData(): array
    {
        $now = now();
        $today = $now->copy()->startOfDay();

        $caEncaisseMois = $this->sumPaidInEurForMonth($now);

        $facturesEnRetardQuery = Document::query()
            ->where('type', Document::TYPE_FACTURE)
            ->where('status', Document::STATUS_SENT)
            ->where('due_date', '<', $today->toDateString())
            ->with('lignes');

        $facturesEnRetardCount = (clone $facturesEnRetardQuery)->count();
        $montantFacturesEnRetard = (float) (clone $facturesEnRetardQuery)
            ->selectRaw('COALESCE(SUM('.DocumentTotals::lignesTtcInEurSql().'), 0) as total_eur')
            ->value('total_eur');

        $devisEnAttenteMontant = (float) Document::query()
            ->where('type', Document::TYPE_DEVIS)
            ->where('status', Document::STATUS_SENT)
            ->selectRaw('COALESCE(SUM('.DocumentTotals::lignesTtcInEurSql().'), 0) as total_eur')
            ->value('total_eur');

        $devisEnAttenteCount = Document::query()
            ->where('type', Document::TYPE_DEVIS)
            ->where('status', Document::STATUS_SENT)
            ->count();

        $nouveauxClients = Tier::query()
            ->where('type', 'client')
            ->whereBetween('created_at', [$now->copy()->startOfMonth(), $now->copy()->endOfMonth()])
            ->count();

        return [
            'periode' => $now->translatedFormat('F Y'),
            'ca_encaisse_mois_eur' => round($caEncaisseMois, 2),
            'ca_encaisse_tendance_pct_vs_mois_precedent' => $this->paidAmountTrend(),
            'factures_en_retard_count' => $facturesEnRetardCount,
            'factures_en_retard_montant_eur' => round($montantFacturesEnRetard, 2),
            'devis_en_attente_montant_eur' => round($devisEnAttenteMontant, 2),
            'devis_en_attente_count' => $devisEnAttenteCount,
            'nouveaux_clients_mois' => $nouveauxClients,
        ];
    }

    private function paidAmountTrend(): float
    {
        $now = now();
        $current = $this->sumPaidInEurForMonth($now);
        $previous = $this->sumPaidInEurForMonth($now->copy()->subMonth());

        if ($previous <= 0) {
            return $current > 0 ? 100.0 : 0.0;
        }

        return round((($current - $previous) / $previous) * 100, 1);
    }

    private function sumPaidInEurForMonth(Carbon $month): float
    {
        return (float) Document::query()
            ->where('type', Document::TYPE_FACTURE)
            ->where('status', Document::STATUS_PAID)
            ->whereYear('issue_date', $month->year)
            ->whereMonth('issue_date', $month->month)
            ->selectRaw('COALESCE(SUM('.DocumentTotals::lignesTtcInEurSql().'), 0) as total_eur')
            ->value('total_eur');
    }

    /**
     * @return list<float>
     */
    private function buildPaidSparkline(): array
    {
        $sparkline = [];
        for ($i = 6; $i >= 0; $i--) {
            $month = now()->copy()->subMonths($i);
            $sparkline[] = round($this->sumPaidInEurForMonth($month) / 1000, 1);
        }

        return $sparkline;
    }

    /**
     * @return list<float>
     */
    private function buildPendingDevisSparkline(): array
    {
        $sparkline = [];
        for ($i = 6; $i >= 0; $i--) {
            $monthEnd = now()->copy()->subMonths($i)->endOfMonth()->toDateString();
            $sparkline[] = round(
                (float) Document::query()
                    ->where('type', Document::TYPE_DEVIS)
                    ->where('status', Document::STATUS_SENT)
                    ->where('issue_date', '<=', $monthEnd)
                    ->selectRaw('COALESCE(SUM('.DocumentTotals::lignesTtcInEurSql().'), 0) as total_eur')
                    ->value('total_eur') / 1000,
                1,
            );
        }

        return $sparkline;
    }

    /**
     * @return list<float>
     */
    private function buildOverdueSparkline(): array
    {
        $sparkline = [];
        for ($i = 6; $i >= 0; $i--) {
            $monthEnd = now()->copy()->subMonths($i)->endOfMonth()->toDateString();
            $sparkline[] = (float) Document::query()
                ->where('type', Document::TYPE_FACTURE)
                ->where('status', Document::STATUS_SENT)
                ->where('due_date', '<', $monthEnd)
                ->count();
        }

        return $sparkline;
    }

    /**
     * @return list<float>
     */
    private function buildNewClientsSparkline(): array
    {
        $sparkline = [];
        for ($i = 6; $i >= 0; $i--) {
            $month = now()->copy()->subMonths($i);
            $sparkline[] = (float) Tier::query()
                ->where('type', 'client')
                ->whereYear('created_at', $month->year)
                ->whereMonth('created_at', $month->month)
                ->count();
        }

        return $sparkline;
    }

    /**
     * @return list<array{month: string, value: float}>
     */
    private function buildRevenueChart(): array
    {
        $months = [
            1 => 'Jan', 2 => 'Fév', 3 => 'Mar', 4 => 'Avr',
            5 => 'Mai', 6 => 'Juin', 7 => 'Juil', 8 => 'Aoû',
            9 => 'Sep', 10 => 'Oct', 11 => 'Nov', 12 => 'Déc',
        ];

        $chart = [];
        for ($i = 5; $i >= 0; $i--) {
            $month = now()->copy()->subMonths($i);

            $facturesTotal = (float) Document::query()
                ->where('type', Document::TYPE_FACTURE)
                ->where('status', '!=', Document::STATUS_CANCELLED)
                ->whereYear('issue_date', $month->year)
                ->whereMonth('issue_date', $month->month)
                ->selectRaw('COALESCE(SUM('.DocumentTotals::lignesTtcInEurSql().'), 0) as total_eur')
                ->value('total_eur');

            $avoirTotal = $this->sumSentAvoirInEurForMonth($month);

            $chart[] = [
                'month' => $months[$month->month] ?? $month->format('M'),
                'value' => round(max(0, $facturesTotal - $avoirTotal) / 1000, 1),
            ];
        }

        return $chart;
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

    /**
     * @return array{data: list<array{name: string, value: int, color: string}>, total: int}
     */
    private function buildInvoiceDistribution(Carbon $today): array
    {
        $active = Document::query()
            ->where('type', Document::TYPE_FACTURE)
            ->where('status', '!=', Document::STATUS_CANCELLED);

        $total = (clone $active)->count();

        if ($total === 0) {
            return [
                'data' => [
                    ['name' => 'Payées', 'value' => 0, 'color' => '#10b981'],
                    ['name' => 'En attente', 'value' => 0, 'color' => '#f59e0b'],
                    ['name' => 'En retard', 'value' => 0, 'color' => '#ef4444'],
                ],
                'total' => 0,
            ];
        }

        $paid = (clone $active)->where('status', Document::STATUS_PAID)->count();
        $overdue = (clone $active)
            ->where('status', Document::STATUS_SENT)
            ->where('due_date', '<', $today->toDateString())
            ->count();
        $pending = (clone $active)->where('status', Document::STATUS_SENT)->count() - $overdue;
        $other = $total - $paid - $overdue - $pending;

        $pending += max(0, $other);

        $paidPct = (int) round(($paid / $total) * 100);
        $pendingPct = (int) round(($pending / $total) * 100);
        $overduePct = max(0, 100 - $paidPct - $pendingPct);

        return [
            'data' => [
                ['name' => 'Payées', 'value' => $paidPct, 'color' => '#10b981'],
                ['name' => 'En attente', 'value' => $pendingPct, 'color' => '#f59e0b'],
                ['name' => 'En retard', 'value' => $overduePct, 'color' => '#ef4444'],
            ],
            'total' => $total,
        ];
    }

    /**
     * @return list<array<string, mixed>>
     */
    private function buildRecentActivity(): array
    {
        $today = now()->startOfDay();

        return Document::query()
            ->with(['tier', 'lignes'])
            ->orderByDesc('updated_at')
            ->limit(7)
            ->get()
            ->map(function (Document $document) use ($today) {
                $isOverdue = $document->isFacture()
                    && $document->status === Document::STATUS_SENT
                    && $document->due_date
                    && $document->due_date->startOfDay()->lt($today);

                $amountNative = DocumentTotals::totalTtc($document);
                $currency = $document->currency_code ?? 'EUR';

                return [
                    'id' => $document->id,
                    'client' => $document->tier?->name ?? '—',
                    'ref' => $document->reference,
                    'type' => $this->typeLabel($document->type),
                    'amount' => $this->formatMoney($amountNative, $currency),
                    'amount_eur' => $this->formatMoney(DocumentTotals::totalTtcInEur($document), 'EUR'),
                    'currency_code' => $currency,
                    'status' => $isOverdue ? 'En retard' : $this->statusLabel($document->status),
                    'status_variant' => $isOverdue
                        ? 'danger'
                        : $this->statusVariant($document->status),
                    'date' => $this->relativeDateLabel($document->updated_at),
                    'initials' => $this->clientInitials($document->tier?->name),
                    'avatar_class' => $this->avatarClass($document->tier?->id ?? $document->id),
                ];
            })
            ->values()
            ->all();
    }

    private function typeLabel(string $type): string
    {
        return match ($type) {
            Document::TYPE_FACTURE => 'Facture',
            Document::TYPE_DEVIS => 'Devis',
            Document::TYPE_AVOIR => 'Avoir',
            default => ucfirst($type),
        };
    }

    private function statusLabel(string $status): string
    {
        return match ($status) {
            Document::STATUS_DRAFT => 'Brouillon',
            Document::STATUS_SENT => 'Envoyé',
            Document::STATUS_PAID => 'Payée',
            Document::STATUS_CANCELLED => 'Annulé',
            Document::STATUS_ACCEPTED => 'Accepté',
            Document::STATUS_REJECTED => 'Refusé',
            Document::STATUS_EXPIRED => 'Expiré',
            default => ucfirst($status),
        };
    }

    private function statusVariant(string $status): string
    {
        return match ($status) {
            Document::STATUS_PAID, Document::STATUS_ACCEPTED => 'success',
            Document::STATUS_SENT, Document::STATUS_DRAFT, Document::STATUS_EXPIRED => 'warning',
            Document::STATUS_REJECTED, Document::STATUS_CANCELLED => 'danger',
            default => 'warning',
        };
    }

    private function relativeDateLabel(?Carbon $date): string
    {
        if ($date === null) {
            return '—';
        }

        $diffDays = (int) $date->startOfDay()->diffInDays(now()->startOfDay(), false);

        if ($diffDays === 0) {
            return "Aujourd'hui";
        }

        if ($diffDays === 1) {
            return 'Hier';
        }

        if ($diffDays > 1 && $diffDays <= 7) {
            return 'Il y a '.$diffDays.'j';
        }

        return $date->translatedFormat('d M Y');
    }

    private function clientInitials(?string $name): string
    {
        if ($name === null || trim($name) === '') {
            return 'CL';
        }

        $words = preg_split('/\s+/', trim($name)) ?: [];

        return strtoupper(
            collect($words)->take(2)->map(fn (string $word) => mb_substr($word, 0, 1))->implode(''),
        ) ?: 'CL';
    }

    private function avatarClass(int $id): string
    {
        $palette = [
            'bg-blue-600 text-white',
            'bg-emerald-600 text-white',
            'bg-violet-600 text-white',
            'bg-amber-600 text-white',
            'bg-rose-600 text-white',
        ];

        return $palette[$id % count($palette)];
    }

    private function formatMoney(float $amount, string $currency = 'EUR'): string
    {
        $symbol = match (strtoupper($currency)) {
            'USD' => '$',
            'GBP' => '£',
            'CHF' => 'CHF ',
            default => '',
        };

        if ($symbol !== '' && $symbol !== 'CHF ') {
            return $symbol.number_format($amount, 2, '.', ',');
        }

        if ($symbol === 'CHF ') {
            return 'CHF '.number_format($amount, 2, '.', ',');
        }

        return number_format($amount, 2, ',', ' ').' €';
    }
}
