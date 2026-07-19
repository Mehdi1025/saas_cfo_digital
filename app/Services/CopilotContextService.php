<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Article;
use App\Models\Document;
use App\Models\Payment;
use App\Models\Tier;
use App\Models\User;
use App\Support\DocumentTotals;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Carbon;

class CopilotContextService
{
    public function __construct(private FinancialService $financialService) {}

    /**
     * Contexte complet injecté à Groq pour le copilote.
     *
     * @return array<string, mixed>
     */
    public function buildForUser(User $user): array
    {
        $records = $user->financialRecords()->orderBy('month')->get();
        $cfo = $this->financialService->buildDashboardData($records);

        return [
            'client' => [
                'id' => $user->id,
                'nom' => $user->name,
                'email' => $user->email,
                'abonnement' => $user->stripe_status,
            ],
            'cfo_digital' => $cfo,
            'facturation' => $this->buildFacturationContext($user),
            'donnees_disponibles' => [
                'saisie_mensuelle' => $records->isNotEmpty(),
                'facturation' => $this->documentsQuery($user)->exists(),
            ],
            'genere_le' => now()->toIso8601String(),
        ];
    }

    /**
     * Résumé affiché dans la sidebar de la page Copilote.
     *
     * @return array<string, mixed>
     */
    public function buildUiSummary(User $user): array
    {
        $records = $user->financialRecords()->orderByDesc('month')->get();
        $cfo = $this->financialService->buildDashboardData(
            $records->sortBy('month')->values(),
        );
        $kpis = $cfo['kpis_mensuels'] ?? [];
        $facturation = $this->buildFacturationContext($user);

        return [
            'has_financial_data' => $records->isNotEmpty(),
            'has_facturation_data' => ($facturation['documents_total'] ?? 0) > 0,
            'month' => $kpis['mois_actuel'] ?? null,
            'revenue' => $kpis['chiffre_affaires'] ?? 0,
            'net_margin' => $kpis['marge_nette'] ?? 0,
            'cac' => $kpis['cac'] ?? null,
            'ltv' => $kpis['ltv'] ?? null,
            'alert' => is_array($cfo['alerte'] ?? null)
                ? ($cfo['alerte']['message'] ?? null)
                : null,
            'facturation' => [
                'ca_encaisse_mois' => $facturation['ca_encaisse_mois_eur'] ?? 0,
                'factures_en_retard' => $facturation['factures_en_retard_count'] ?? 0,
                'devis_en_attente' => $facturation['devis_en_attente_count'] ?? 0,
                'clients_total' => $facturation['clients_total'] ?? 0,
                'encours_factures_eur' => $facturation['encours_factures_eur'] ?? 0,
            ],
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function buildFacturationContext(User $user): array
    {
        $now = now();
        $today = $now->copy()->startOfDay();

        $facturesQuery = $this->documentsQuery($user)->where('type', Document::TYPE_FACTURE);
        $devisQuery = $this->documentsQuery($user)->where('type', Document::TYPE_DEVIS);

        $caEncaisseMois = $this->sumPaidInEurForMonth($user, $now);

        $facturesEnRetardQuery = (clone $facturesQuery)
            ->where('status', Document::STATUS_SENT)
            ->where('due_date', '<', $today->toDateString());

        $montantFacturesEnRetard = (float) (clone $facturesEnRetardQuery)
            ->selectRaw('COALESCE(SUM('.DocumentTotals::lignesTtcInEurSql().'), 0) as total_eur')
            ->value('total_eur');

        $encoursFactures = (float) (clone $facturesQuery)
            ->where('status', Document::STATUS_SENT)
            ->selectRaw('COALESCE(SUM('.DocumentTotals::lignesTtcInEurSql().'), 0) as total_eur')
            ->value('total_eur');

        $devisEnAttenteMontant = (float) (clone $devisQuery)
            ->where('status', Document::STATUS_SENT)
            ->selectRaw('COALESCE(SUM('.DocumentTotals::lignesTtcInEurSql().'), 0) as total_eur')
            ->value('total_eur');

        $paiements30j = (float) $this->paymentsQuery($user)
            ->where('status', Payment::STATUS_SUCCESS)
            ->where('paid_at', '>=', $now->copy()->subDays(30))
            ->sum('amount');

        return [
            'periode' => $now->translatedFormat('F Y'),
            'ca_encaisse_mois_eur' => round($caEncaisseMois, 2),
            'encours_factures_eur' => round($encoursFactures, 2),
            'factures_en_retard_count' => (clone $facturesEnRetardQuery)->count(),
            'factures_en_retard_montant_eur' => round($montantFacturesEnRetard, 2),
            'devis_en_attente_count' => (clone $devisQuery)->where('status', Document::STATUS_SENT)->count(),
            'devis_en_attente_montant_eur' => round($devisEnAttenteMontant, 2),
            'paiements_30j_eur' => round($paiements30j, 2),
            'clients_total' => $this->tiersQuery($user)->where('type', 'client')->count(),
            'prospects_total' => $this->tiersQuery($user)->where('type', 'prospect')->count(),
            'articles_catalogue' => Article::query()
                ->withoutGlobalScope('authenticatedUser')
                ->where('user_id', $user->id)
                ->where('is_active', true)
                ->count(),
            'documents_total' => $this->documentsQuery($user)->count(),
            'factures_par_statut' => $this->countByStatus($facturesQuery),
            'devis_par_statut' => $this->countByStatus($devisQuery),
            'factures_en_retard' => $this->overdueInvoicesList($user, 5),
            'activite_recente' => $this->recentActivity($user, 6),
        ];
    }

    /**
     * @return Builder<Document>
     */
    private function documentsQuery(User $user): Builder
    {
        return Document::query()
            ->withoutGlobalScope('forAuthenticatedUser')
            ->whereHas(
                'tier',
                fn (Builder $query) => $query
                    ->withoutGlobalScope('authenticatedUser')
                    ->where('user_id', $user->id),
            );
    }

    /**
     * @return Builder<Tier>
     */
    private function tiersQuery(User $user): Builder
    {
        return Tier::query()
            ->withoutGlobalScope('authenticatedUser')
            ->where('user_id', $user->id);
    }

    /**
     * @return Builder<Payment>
     */
    private function paymentsQuery(User $user): Builder
    {
        return Payment::query()
            ->withoutGlobalScope('forAuthenticatedUser')
            ->whereHas(
                'tier',
                fn (Builder $query) => $query
                    ->withoutGlobalScope('authenticatedUser')
                    ->where('user_id', $user->id),
            );
    }

    private function sumPaidInEurForMonth(User $user, Carbon $month): float
    {
        return (float) $this->documentsQuery($user)
            ->where('type', Document::TYPE_FACTURE)
            ->where('status', Document::STATUS_PAID)
            ->whereYear('issue_date', $month->year)
            ->whereMonth('issue_date', $month->month)
            ->selectRaw('COALESCE(SUM('.DocumentTotals::lignesTtcInEurSql().'), 0) as total_eur')
            ->value('total_eur');
    }

    /**
     * @param  Builder<Document>  $query
     * @return array<string, int>
     */
    private function countByStatus(Builder $query): array
    {
        return (clone $query)
            ->selectRaw('status, COUNT(*) as total')
            ->groupBy('status')
            ->pluck('total', 'status')
            ->map(fn ($count) => (int) $count)
            ->all();
    }

    /**
     * @return list<array<string, mixed>>
     */
    private function overdueInvoicesList(User $user, int $limit): array
    {
        $today = now()->startOfDay();

        return $this->documentsQuery($user)
            ->where('type', Document::TYPE_FACTURE)
            ->where('status', Document::STATUS_SENT)
            ->where('due_date', '<', $today->toDateString())
            ->with(['tier:id,name'])
            ->orderBy('due_date')
            ->limit($limit)
            ->get()
            ->map(function (Document $document) use ($today) {
                $dueDate = $document->due_date?->startOfDay();

                return [
                    'reference' => $document->reference,
                    'client' => $document->tier?->name,
                    'montant_eur' => round($document->totalTtcInEur(), 2),
                    'jours_retard' => $dueDate ? $dueDate->diffInDays($today) : null,
                    'echeance' => $document->due_date?->toDateString(),
                ];
            })
            ->values()
            ->all();
    }

    /**
     * @return list<array<string, mixed>>
     */
    private function recentActivity(User $user, int $limit): array
    {
        return $this->documentsQuery($user)
            ->with(['tier:id,name'])
            ->orderByDesc('updated_at')
            ->limit($limit)
            ->get()
            ->map(fn (Document $document) => [
                'type' => $document->type,
                'reference' => $document->reference,
                'statut' => $document->status,
                'client' => $document->tier?->name,
                'montant_eur' => round($document->totalTtcInEur(), 2),
                'date' => $document->issue_date?->toDateString(),
            ])
            ->values()
            ->all();
    }
}
