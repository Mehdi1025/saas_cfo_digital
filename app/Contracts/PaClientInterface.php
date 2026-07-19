<?php

declare(strict_types=1);

namespace App\Contracts;

use App\Models\Document;

interface PaClientInterface
{
    /**
     * Transmet une facture Factur-X à la Plateforme Agréée.
     *
     * @return string Identifiant unique renvoyé par la PA (pa_document_id)
     */
    public function submitInvoice(Document $document, string $facturxContent): string;

    /**
     * Interroge la PA sur le statut CDAR d'une facture déjà transmise.
     *
     * @return string Statut CDAR (ex. Document::CDAR_DEPOSEE)
     */
    public function checkInvoiceStatus(string $paDocumentId): string;

    /**
     * Transmet des données d'e-reporting à la PA.
     *
     * @param  array<string, mixed>  $reportingData
     */
    public function submitEreporting(array $reportingData): bool;
}
