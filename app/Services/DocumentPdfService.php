<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Document;
use App\Support\DocumentPrestation;
use App\Support\DocumentTotals;
use App\Support\FacturXAssembler;
use App\Support\FacturXCiiGenerator;
use App\Support\FinancialDiscount;
use App\Support\LigneAmounts;
use Barryvdh\DomPDF\Facade\Pdf;

class DocumentPdfService
{
    public function __construct(
        private readonly CompanySettingsService $companySettings,
        private readonly FacturXCiiGenerator $ciiGenerator,
        private readonly FacturXAssembler $facturXAssembler,
    ) {}

    public function render(Document $document): string
    {
        $document->loadMissing(['tier', 'lignes']);

        return Pdf::loadView('pdf.facture', $this->viewData($document))
            ->setPaper('a4')
            ->output();
    }

    public function filename(Document $document): string
    {
        return sprintf('%s.pdf', $document->reference);
    }

    /**
     * PDF Factur-X (PDF/A-3 + XML CII EN 16931 embarqué) pour émission / envoi.
     */
    public function renderFacturX(Document $document): string
    {
        $document->loadMissing(['tier', 'lignes']);

        $pdfContent = $this->render($document);
        $xmlContent = $this->ciiGenerator->generate($document);

        return $this->facturXAssembler->assemble($pdfContent, $xmlContent);
    }

    public function facturXFilename(Document $document): string
    {
        return sprintf('%s-facturx.pdf', $document->reference);
    }

    /**
     * @return array<string, mixed>
     */
    private function viewData(Document $document): array
    {
        $lignes = $document->lignes;

        $linesSubtotal = $lignes->sum(fn ($ligne) => LigneAmounts::totalHt($ligne));
        $linesTax = $lignes->sum(fn ($ligne) => LigneAmounts::vatAmount($ligne));
        $fraisPort = DocumentPrestation::fraisPortForDocument($document);
        $shippingTax = DocumentTotals::shippingTotalTax($document);
        $subtotal = $linesSubtotal + $fraisPort;
        $tax = $linesTax + $shippingTax;

        $currency = $document->currency_code ?? 'EUR';
        $totalTtc = $subtotal + $tax;
        $financialQuote = FinancialDiscount::quoteForRemaining(
            $document,
            $document->issue_date?->toDateString() ?? now()->toDateString(),
            $totalTtc,
        );

        return [
            'document' => $document,
            'company' => $this->companySettings->forPdf(),
            'client' => $document->tier,
            'lignes' => $lignes,
            'lines_subtotal' => $linesSubtotal,
            'subtotal' => $subtotal,
            'tax' => $tax,
            'total' => $totalTtc,
            'currency' => $currency,
            'documentTypeLabel' => $this->documentTypeLabel($document),
            'financial_discount_configured' => FinancialDiscount::isConfigured($document),
            'financial_discount_percent' => FinancialDiscount::percent($document),
            'financial_discount_days' => FinancialDiscount::days($document),
            'financial_discount_deadline' => FinancialDiscount::deadline($document),
            'financial_discount_amount' => $financialQuote['discount_amount'],
            'net_payable_with_discount' => $financialQuote['net_cash_due'],
        ];
    }

    private function documentTypeLabel(Document $document): string
    {
        return match ($document->type) {
            Document::TYPE_DEVIS => 'DEVIS',
            Document::TYPE_AVOIR => 'AVOIR',
            default => 'FACTURE',
        };
    }
}
