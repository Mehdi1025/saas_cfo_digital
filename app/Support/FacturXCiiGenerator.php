<?php

declare(strict_types=1);

namespace App\Support;

use App\Models\Document;
use App\Models\LigneDocument;
use App\Services\CompanySettingsService;
use DOMDocument;
use DOMElement;

class FacturXCiiGenerator
{
    private const NS_RSM = 'urn:un:unece:uncefact:data:standard:CrossIndustryInvoice:100';

    private const NS_RAM = 'urn:un:unece:uncefact:data:standard:ReusableAggregateBusinessInformationEntity:100';

    private const NS_UDT = 'urn:un:unece:uncefact:data:standard:UnqualifiedDataType:100';

    private const GUIDELINE_ID = 'urn:cen.eu:en16931:2017#compliant#urn:factur-x.eu:1p0:en16931';

    private DOMDocument $dom;

    public function __construct(
        private readonly CompanySettingsService $companySettings,
    ) {}

    public function generate(Document $document): string
    {
        $document->loadMissing(['tier', 'lignes']);

        $company = $this->companySettings->forPdf();
        $client = $document->tier;
        $currency = strtoupper((string) ($document->currency_code ?? 'EUR'));
        $sellerCountry = $this->resolveCountryCode(null, (string) ($company['address'] ?? ''));
        $buyerCountry = $this->resolveCountryCode($client?->country_code, (string) ($client?->address ?? ''));

        $this->dom = new DOMDocument('1.0', 'UTF-8');
        $this->dom->formatOutput = true;

        $root = $this->dom->createElementNS(self::NS_RSM, 'rsm:CrossIndustryInvoice');
        $root->setAttributeNS('http://www.w3.org/2000/xmlns/', 'xmlns:qdt', 'urn:un:unece:uncefact:data:standard:QualifiedDataType:100');
        $root->setAttributeNS('http://www.w3.org/2000/xmlns/', 'xmlns:ram', self::NS_RAM);
        $root->setAttributeNS('http://www.w3.org/2000/xmlns/', 'xmlns:udt', self::NS_UDT);
        $this->dom->appendChild($root);

        $this->appendDocumentContext($root);
        $this->appendExchangedDocument($root, $document);
        $this->appendSupplyChainTradeTransaction(
            $root,
            $document,
            $company,
            $client,
            $currency,
            $sellerCountry,
            $buyerCountry,
        );

        return $this->dom->saveXML() ?: '';
    }

    private function appendDocumentContext(DOMElement $root): void
    {
        $context = $this->rsmElement('ExchangedDocumentContext');
        $guideline = $this->ramElement('GuidelineSpecifiedDocumentContextParameter');
        $guideline->appendChild($this->ramElement('ID', self::GUIDELINE_ID));
        $context->appendChild($guideline);
        $root->appendChild($context);
    }

    private function appendExchangedDocument(DOMElement $root, Document $document): void
    {
        $exchanged = $this->rsmElement('ExchangedDocument');
        $exchanged->appendChild($this->ramElement('ID', (string) $document->reference));
        $exchanged->appendChild($this->ramElement('TypeCode', $this->documentTypeCode($document)));
        $exchanged->appendChild($this->dateTimeElement(
            'IssueDateTime',
            $document->issue_date?->format('Ymd') ?? now()->format('Ymd'),
        ));

        $operationLabel = Document::operationCategoryLabel($document->operation_category);
        $exchanged->appendChild($this->noteElement(
            sprintf('Catégorie d\'opération : %s', $operationLabel),
        ));

        if ($document->vat_on_debits) {
            $exchanged->appendChild($this->noteElement(
                'TVA sur les débits (article 269 du CGI)',
            ));
        }

        if ($document->due_date !== null) {
            $exchanged->appendChild($this->noteElement(
                sprintf('Date d\'échéance : %s', $document->due_date->format('Y-m-d')),
            ));
        }

        $root->appendChild($exchanged);
    }

    /**
     * @param  array<string, mixed>  $company
     */
    private function appendSupplyChainTradeTransaction(
        DOMElement $root,
        Document $document,
        array $company,
        ?object $client,
        string $currency,
        string $sellerCountry,
        string $buyerCountry,
    ): void {
        $transaction = $this->rsmElement('SupplyChainTradeTransaction');

        $lineNumber = 1;
        foreach ($document->lignes as $ligne) {
            $transaction->appendChild($this->buildLineItem(
                $document,
                $ligne,
                $lineNumber,
            ));
            $lineNumber++;
        }

        $fraisPort = DocumentPrestation::fraisPortForDocument($document);
        if ($fraisPort > 0) {
            $shippingVatRate = DocumentRegulatoryFields::resolveVatRate($document);
            $transaction->appendChild($this->buildShippingLineItem(
                $document,
                $lineNumber,
                $fraisPort,
                $shippingVatRate,
            ));
        }

        $agreement = $this->ramElement('ApplicableHeaderTradeAgreement');
        $agreement->appendChild($this->buildTradeParty(
            'SellerTradeParty',
            (string) ($company['name'] ?? ''),
            (string) ($company['address'] ?? ''),
            (string) ($company['email'] ?? ''),
            (string) ($company['registration_number'] ?? ''),
            null,
            $sellerCountry,
        ));
        $agreement->appendChild($this->buildTradeParty(
            'BuyerTradeParty',
            (string) ($client?->name ?? 'Client'),
            (string) ($client?->address ?? ''),
            (string) ($client?->email ?? ''),
            null,
            (string) ($client?->vat_number ?? ''),
            $buyerCountry,
        ));
        $transaction->appendChild($agreement);

        $deliveryAddress = trim((string) ($document->delivery_address ?? $client?->delivery_address ?? ''));
        $delivery = $this->ramElement('ApplicableHeaderTradeDelivery');
        if ($deliveryAddress !== '') {
            $shipTo = $this->ramElement('ShipToTradeParty');
            $shipTo->appendChild($this->ramElement('Name', (string) ($client?->name ?? 'Destinataire livraison')));
            $shipTo->appendChild($this->postalAddress($deliveryAddress, $buyerCountry));
            $delivery->appendChild($shipTo);
        }
        $transaction->appendChild($delivery);

        $settlement = $this->ramElement('ApplicableHeaderTradeSettlement');
        $settlement->appendChild($this->ramElement('InvoiceCurrencyCode', $currency));

        foreach ($this->taxBreakdown($document) as $tax) {
            $settlement->appendChild($this->buildApplicableTradeTax(
                $tax['rate'],
                $tax['category'],
                $tax['basis'],
                $tax['amount'],
                $tax['exemption_reason'],
            ));
        }

        $settlement->appendChild($this->buildMonetarySummation($document));

        $transaction->appendChild($settlement);

        $root->appendChild($transaction);
    }

    private function buildTradeParty(
        string $partyTag,
        string $name,
        string $address,
        string $email,
        ?string $registrationNumber,
        ?string $vatNumber,
        string $countryCode,
    ): DOMElement {
        $party = $this->ramElement($partyTag);
        $party->appendChild($this->ramElement('Name', $name));

        if ($address !== '') {
            $party->appendChild($this->postalAddress($address, $countryCode));
        }

        if ($email !== '') {
            $communication = $this->ramElement('URIUniversalCommunication');
            $uri = $this->ramElement('URIID', $email);
            $uri->setAttribute('schemeID', 'EM');
            $communication->appendChild($uri);
            $party->appendChild($communication);
        }

        if (filled($registrationNumber)) {
            $registration = $this->ramElement('SpecifiedTaxRegistration');
            $id = $this->ramElement('ID', preg_replace('/\s+/', '', $registrationNumber));
            $id->setAttribute('schemeID', '0002');
            $registration->appendChild($id);
            $party->appendChild($registration);
        }

        if (filled($vatNumber)) {
            $party->appendChild($this->taxRegistration($vatNumber));
        }

        return $party;
    }

    private function buildLineItem(Document $document, LigneDocument $ligne, int $lineNumber): DOMElement
    {
        [$category, $exemptionReason] = $this->vatCategory($document, (float) $ligne->vat_rate);
        $lineHt = LigneAmounts::totalHt($ligne);
        $label = trim((string) ($ligne->label ?: $ligne->description ?: 'Ligne '.$lineNumber));

        $lineItem = $this->ramElement('IncludedSupplyChainTradeLineItem');

        $lineDocument = $this->ramElement('AssociatedDocumentLineDocument');
        $lineDocument->appendChild($this->ramElement('LineID', (string) $lineNumber));
        $lineItem->appendChild($lineDocument);

        $product = $this->ramElement('SpecifiedTradeProduct');
        $product->appendChild($this->ramElement('Name', $label));
        if (filled($ligne->description) && $ligne->description !== $ligne->label) {
            $product->appendChild($this->ramElement('Description', (string) $ligne->description));
        }
        $lineItem->appendChild($product);

        $agreement = $this->ramElement('SpecifiedLineTradeAgreement');
        $price = $this->ramElement('NetPriceProductTradePrice');
        $price->appendChild($this->ramElement('ChargeAmount', $this->formatAmount((float) $ligne->unit_price_ht)));
        $agreement->appendChild($price);
        $lineItem->appendChild($agreement);

        $delivery = $this->ramElement('SpecifiedLineTradeDelivery');
        $quantity = $this->ramElement('BilledQuantity', $this->formatQuantity((float) $ligne->quantity));
        $quantity->setAttribute('unitCode', 'C62');
        $delivery->appendChild($quantity);
        $lineItem->appendChild($delivery);

        $lineSettlement = $this->ramElement('SpecifiedLineTradeSettlement');
        $lineSettlement->appendChild($this->buildApplicableTradeTax(
            (float) $ligne->vat_rate,
            $category,
            $lineHt,
            LigneAmounts::vatAmount($ligne),
            $exemptionReason,
            includeAmounts: false,
        ));
        $summation = $this->ramElement('SpecifiedTradeSettlementLineMonetarySummation');
        $summation->appendChild($this->ramElement('LineTotalAmount', $this->formatAmount($lineHt)));
        $lineSettlement->appendChild($summation);
        $lineItem->appendChild($lineSettlement);

        return $lineItem;
    }

    private function buildShippingLineItem(
        Document $document,
        int $lineNumber,
        float $fraisPort,
        float $vatRate,
    ): DOMElement {
        [$category, $exemptionReason] = $this->vatCategory($document, $vatRate);
        $taxAmount = $fraisPort * ($vatRate / 100);

        $lineItem = $this->ramElement('IncludedSupplyChainTradeLineItem');

        $lineDocument = $this->ramElement('AssociatedDocumentLineDocument');
        $lineDocument->appendChild($this->ramElement('LineID', (string) $lineNumber));
        $lineItem->appendChild($lineDocument);

        $product = $this->ramElement('SpecifiedTradeProduct');
        $product->appendChild($this->ramElement('Name', 'Frais de port'));
        $lineItem->appendChild($product);

        $agreement = $this->ramElement('SpecifiedLineTradeAgreement');
        $price = $this->ramElement('NetPriceProductTradePrice');
        $price->appendChild($this->ramElement('ChargeAmount', $this->formatAmount($fraisPort)));
        $agreement->appendChild($price);
        $lineItem->appendChild($agreement);

        $delivery = $this->ramElement('SpecifiedLineTradeDelivery');
        $quantity = $this->ramElement('BilledQuantity', '1');
        $quantity->setAttribute('unitCode', 'C62');
        $delivery->appendChild($quantity);
        $lineItem->appendChild($delivery);

        $lineSettlement = $this->ramElement('SpecifiedLineTradeSettlement');
        $lineSettlement->appendChild($this->buildApplicableTradeTax(
            $vatRate,
            $category,
            $fraisPort,
            $taxAmount,
            $exemptionReason,
            includeAmounts: false,
        ));
        $summation = $this->ramElement('SpecifiedTradeSettlementLineMonetarySummation');
        $summation->appendChild($this->ramElement('LineTotalAmount', $this->formatAmount($fraisPort)));
        $lineSettlement->appendChild($summation);
        $lineItem->appendChild($lineSettlement);

        return $lineItem;
    }

    private function buildApplicableTradeTax(
        float $rate,
        string $category,
        float $basis,
        float $amount,
        ?string $exemptionReason,
        bool $includeAmounts = true,
    ): DOMElement {
        $tax = $this->ramElement('ApplicableTradeTax');

        if ($includeAmounts) {
            $tax->appendChild($this->ramElement('CalculatedAmount', $this->formatAmount($amount)));
            $tax->appendChild($this->ramElement('TypeCode', 'VAT'));
            $tax->appendChild($this->ramElement('BasisAmount', $this->formatAmount($basis)));
        } else {
            $tax->appendChild($this->ramElement('TypeCode', 'VAT'));
        }

        $tax->appendChild($this->ramElement('CategoryCode', $category));
        $tax->appendChild($this->ramElement('RateApplicablePercent', $this->formatAmount($rate)));

        if ($exemptionReason !== null) {
            $tax->appendChild($this->ramElement('ExemptionReason', $exemptionReason));
        }

        return $tax;
    }

    private function buildMonetarySummation(Document $document): DOMElement
    {
        $totalHt = DocumentTotals::totalHt($document);
        $totalTax = DocumentTotals::linesTotalTax($document) + DocumentTotals::shippingTotalTax($document);
        $totalTtc = DocumentTotals::totalTtc($document);

        $summation = $this->ramElement('SpecifiedTradeSettlementHeaderMonetarySummation');
        $summation->appendChild($this->ramElement('LineTotalAmount', $this->formatAmount($totalHt)));
        $summation->appendChild($this->ramElement('TaxBasisTotalAmount', $this->formatAmount($totalHt)));
        $summation->appendChild($this->ramElement('TaxTotalAmount', $this->formatAmount($totalTax)));
        $summation->appendChild($this->ramElement('GrandTotalAmount', $this->formatAmount($totalTtc)));
        $summation->appendChild($this->ramElement('DuePayableAmount', $this->formatAmount($totalTtc)));

        return $summation;
    }

    /**
     * @return list<array{rate: float, category: string, basis: float, amount: float, exemption_reason: ?string}>
     */
    private function taxBreakdown(Document $document): array
    {
        $groups = [];

        foreach ($document->lignes as $ligne) {
            $rate = (float) $ligne->vat_rate;
            $key = number_format($rate, 2, '.', '');
            [$category, $exemptionReason] = $this->vatCategory($document, $rate);

            if (! isset($groups[$key])) {
                $groups[$key] = [
                    'rate' => $rate,
                    'category' => $category,
                    'basis' => 0.0,
                    'amount' => 0.0,
                    'exemption_reason' => $exemptionReason,
                ];
            }

            $groups[$key]['basis'] += LigneAmounts::totalHt($ligne);
            $groups[$key]['amount'] += LigneAmounts::vatAmount($ligne);
        }

        $fraisPort = DocumentPrestation::fraisPortForDocument($document);
        if ($fraisPort > 0) {
            $rate = DocumentRegulatoryFields::resolveVatRate($document);
            $key = number_format($rate, 2, '.', '');
            [$category, $exemptionReason] = $this->vatCategory($document, $rate);

            if (! isset($groups[$key])) {
                $groups[$key] = [
                    'rate' => $rate,
                    'category' => $category,
                    'basis' => 0.0,
                    'amount' => 0.0,
                    'exemption_reason' => $exemptionReason,
                ];
            }

            $groups[$key]['basis'] += $fraisPort;
            $groups[$key]['amount'] += DocumentTotals::shippingTotalTax($document);
        }

        return array_values($groups);
    }

    /**
     * @return array{0: string, 1: ?string}
     */
    private function vatCategory(Document $document, float $rate): array
    {
        if ($document->vat_on_debits) {
            return ['E', 'TVA sur les débits — article 269 du CGI'];
        }

        if ($rate <= 0.0) {
            return ['Z', null];
        }

        return ['S', null];
    }

    private function postalAddress(string $address, string $countryCode): DOMElement
    {
        $postal = $this->ramElement('PostalTradeAddress');
        $postal->appendChild($this->ramElement('LineOne', $address));
        $postal->appendChild($this->ramElement('CountryID', strtoupper($countryCode)));

        return $postal;
    }

    private function taxRegistration(string $vatNumber): DOMElement
    {
        $registration = $this->ramElement('SpecifiedTaxRegistration');
        $id = $this->ramElement('ID', $vatNumber);
        $id->setAttribute('schemeID', 'VA');
        $registration->appendChild($id);

        return $registration;
    }

    private function noteElement(string $content): DOMElement
    {
        $note = $this->ramElement('IncludedNote');
        $note->appendChild($this->ramElement('Content', $content));

        return $note;
    }

    private function dateTimeElement(string $tag, string $dateYmd): DOMElement
    {
        $dateTime = $this->ramElement($tag);
        $dateString = $this->dom->createElementNS(self::NS_UDT, 'udt:DateTimeString', $dateYmd);
        $dateString->setAttribute('format', '102');
        $dateTime->appendChild($dateString);

        return $dateTime;
    }

    private function ramElement(string $name, ?string $value = null): DOMElement
    {
        $element = $this->dom->createElementNS(self::NS_RAM, 'ram:'.$name);

        if ($value !== null) {
            $element->appendChild($this->dom->createTextNode($value));
        }

        return $element;
    }

    private function rsmElement(string $name, ?string $value = null): DOMElement
    {
        $element = $this->dom->createElementNS(self::NS_RSM, 'rsm:'.$name);

        if ($value !== null) {
            $element->appendChild($this->dom->createTextNode($value));
        }

        return $element;
    }

    private function documentTypeCode(Document $document): string
    {
        return match ($document->type) {
            Document::TYPE_AVOIR => '381',
            default => '380',
        };
    }

    private function resolveCountryCode(?string $explicit, string $addressFallback): string
    {
        if (filled($explicit)) {
            return strtoupper(substr((string) $explicit, 0, 2));
        }

        if (preg_match('/\b([A-Z]{2})\s*$/u', trim($addressFallback), $matches) === 1) {
            return strtoupper($matches[1]);
        }

        return 'FR';
    }

    private function formatAmount(float $amount): string
    {
        return number_format($amount, 2, '.', '');
    }

    private function formatQuantity(float $quantity): string
    {
        return rtrim(rtrim(number_format($quantity, 4, '.', ''), '0'), '.') ?: '0';
    }
}
