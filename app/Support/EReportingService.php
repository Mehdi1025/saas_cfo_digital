<?php

declare(strict_types=1);

namespace App\Support;

use App\Models\Document;
use App\Models\Payment;
use App\Models\Tier;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;

class EReportingService
{
    /**
     * @return array{
     *     user_id: int,
     *     transactions: list<array<string, mixed>>,
     *     payments: list<array<string, mixed>>,
     *     document_ids: list<int>,
     *     payment_ids: list<int>
     * }
     */
    public function collectDataForUser(User $user): array
    {
        $transactions = $this->collectTransactions($user);
        $payments = $this->collectPayments($user);

        return [
            'user_id' => $user->id,
            'transactions' => $transactions['items'],
            'payments' => $payments['items'],
            'document_ids' => $transactions['ids'],
            'payment_ids' => $payments['ids'],
        ];
    }

    /**
     * @return array{items: list<array<string, mixed>>, ids: list<int>}
     */
    private function collectTransactions(User $user): array
    {
        $documents = Document::query()
            ->withoutGlobalScopes()
            ->with('tier')
            ->where('type', Document::TYPE_FACTURE)
            ->whereIn('status', [Document::STATUS_SENT, Document::STATUS_PAID])
            ->whereNull('ereported_at')
            ->whereHas('tier', function (Builder $query) use ($user): void {
                $query->where('user_id', $user->id)
                    ->where(function (Builder $inner): void {
                        $inner->where(function (Builder $b2c): void {
                            $this->applyB2CScope($b2c);
                        })->orWhere(function (Builder $export): void {
                            $this->applyInternationalScope($export);
                        });
                    });
            })
            ->orderBy('issue_date')
            ->get();

        $items = [];
        $ids = [];

        foreach ($documents as $document) {
            $tier = $document->tier;

            if ($tier === null) {
                continue;
            }

            $items[] = [
                'document_id' => $document->id,
                'reference' => $document->reference,
                'issue_date' => $document->issue_date?->toDateString(),
                'amount_ht' => round(DocumentTotals::totalHt($document), 2),
                'amount_ttc' => round(DocumentTotals::totalTtc($document), 2),
                'currency_code' => $document->currency_code ?? 'EUR',
                'operation_category' => $document->operation_category ?? Document::OPERATION_SERVICE,
                'client_name' => $tier->name,
                'client_country_code' => $tier->country_code,
                'reporting_reason' => $this->reportingReason($tier),
            ];
            $ids[] = $document->id;
        }

        return [
            'items' => $items,
            'ids' => $ids,
        ];
    }

    /**
     * @return array{items: list<array<string, mixed>>, ids: list<int>}
     */
    private function collectPayments(User $user): array
    {
        $payments = Payment::query()
            ->withoutGlobalScopes()
            ->with(['document', 'tier'])
            ->where('status', Payment::STATUS_SUCCESS)
            ->whereNull('ereported_at')
            ->whereHas('tier', fn (Builder $query) => $query->where('user_id', $user->id))
            ->whereHas('document', function (Builder $query): void {
                $query->whereIn('operation_category', [
                    Document::OPERATION_SERVICE,
                    Document::OPERATION_MIXTE,
                ])->where(function (Builder $inner): void {
                    $inner->where('vat_on_debits', false)
                        ->orWhereNull('vat_on_debits');
                });
            })
            ->orderBy('paid_at')
            ->get();

        $items = [];
        $ids = [];

        foreach ($payments as $payment) {
            $document = $payment->document;

            if ($document === null) {
                continue;
            }

            $items[] = [
                'payment_id' => $payment->id,
                'document_id' => $document->id,
                'document_reference' => $document->reference,
                'operation_category' => $document->operation_category,
                'amount' => (float) $payment->amount,
                'financial_discount_amount' => (float) ($payment->financial_discount_amount ?? 0),
                'paid_at' => $payment->paid_at?->toIso8601String(),
                'payment_method' => $payment->payment_method,
                'client_name' => $payment->tier?->name,
            ];
            $ids[] = $payment->id;
        }

        return [
            'items' => $items,
            'ids' => $ids,
        ];
    }

    private function applyB2CScope(Builder $query): void
    {
        $query->where(function (Builder $inner): void {
            $inner->whereNull('vat_number')
                ->orWhere('vat_number', '');
        })->where(function (Builder $inner): void {
            $inner->whereNull('registration_number')
                ->orWhere('registration_number', '');
        });
    }

    private function applyInternationalScope(Builder $query): void
    {
        $query->whereNotNull('country_code')
            ->where('country_code', '!=', '')
            ->where('country_code', '!=', 'FR');
    }

    private function reportingReason(Tier $tier): string
    {
        if ($this->isInternational($tier)) {
            return 'international';
        }

        return 'b2c';
    }

    private function isInternational(Tier $tier): bool
    {
        $code = strtoupper(trim((string) ($tier->country_code ?? '')));

        return $code !== '' && $code !== 'FR';
    }
}
