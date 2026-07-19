<?php

declare(strict_types=1);

namespace App\Support;

use Atgp\FacturX\Utils\ProfileHandler;
use Atgp\FacturX\Writer;
use Illuminate\Support\Facades\Log;

class FacturXAssembler
{
    /**
     * Assemble un PDF Factur-X (PDF/A-3 + XML CII embarqué) à partir du PDF visuel et du XML CII.
     *
     * L'injection conforme PDF/A-3 est réalisée via atgp/factur-x (Writer + FPDI) :
     * le XML est attaché en Associated File (AF) selon la spécification Factur-X EN 16931.
     *
     * Alternatives documentées si le PDF source n'est pas compatible FPDI (compression DomPDF) :
     * - atgp/factur-x : Writer::generate($pdf, $xml, ProfileHandler::PROFILE_FACTURX_EN16931)
     * - Ghostscript : conversion préalable du PDF visuel en PDF/A-3 avant injection
     * - horstoeko/zugferd : ZugferdDocumentPdfBuilder pour un pipeline ZUGFeRD/Factur-X équivalent
     */
    public function assemble(string $pdfContent, string $xmlContent): string
    {
        try {
            $writer = new Writer(importExternalLinks: false);

            return $writer->generate(
                pdfInvoice: $pdfContent,
                xml: $xmlContent,
                profile: ProfileHandler::PROFILE_FACTURX_EN16931,
                validateXSD: true,
            );
        } catch (\Throwable $exception) {
            Log::warning('Factur-X assembly failed, returning visual PDF only.', [
                'message' => $exception->getMessage(),
            ]);

            return $pdfContent;
        }
    }
}
