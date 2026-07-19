<?php

declare(strict_types=1);

namespace App\Support;

use App\Models\Document;

class DocumentTotals
{
    /**
     * Sous-requête SQL : total TTC des lignes (hors frais de port document).
     */
    public static function lignesTtcSubquery(): string
    {
        $ligneHt = LigneAmounts::ligneHtSql('ld');

        return "(SELECT COALESCE(SUM({$ligneHt} * (1 + ld.vat_rate / 100)), 0) FROM ligne_documents ld WHERE ld.document_id = documents.id)";
    }

    /**
     * Expression SQL : total TTC converti en EUR (taux figé, lignes seules).
     */
    public static function lignesTtcInEurSql(): string
    {
        return self::lignesTtcSubquery().' * documents.exchange_rate';
    }

    public static function linesTotalHt(Document $document): float
    {
        $document->loadMissing('lignes');

        return (float) $document->lignes->sum(
            fn ($ligne) => LigneAmounts::totalHt($ligne),
        );
    }

    public static function linesTotalTax(Document $document): float
    {
        $document->loadMissing('lignes');

        return (float) $document->lignes->sum(
            fn ($ligne) => LigneAmounts::vatAmount($ligne),
        );
    }

    public static function shippingTotalTax(Document $document): float
    {
        $document->loadMissing('tier');
        $fraisPort = DocumentPrestation::fraisPortForDocument($document);

        if ($fraisPort <= 0) {
            return 0.0;
        }

        $vatRate = TaxRateResolver::forCountry($document->tier?->country_code);

        return $fraisPort * ($vatRate / 100);
    }

    public static function totalHt(Document $document): float
    {
        return self::linesTotalHt($document) + DocumentPrestation::fraisPortForDocument($document);
    }

    public static function totalTtc(Document $document): float
    {
        return self::totalHt($document)
            + self::linesTotalTax($document)
            + self::shippingTotalTax($document);
    }

    public static function totalTtcInEur(Document $document): float
    {
        return self::totalTtc($document) * (float) ($document->exchange_rate ?? 1.0);
    }
}
