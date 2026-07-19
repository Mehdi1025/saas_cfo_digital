<?php

declare(strict_types=1);

namespace App\Support;

use App\Models\Document;
use App\Models\LigneDocument;
use App\Models\Tier;
use App\Services\CompanySettingsService;

class InvoiceComplianceValidator
{
    public function __construct(
        private readonly CompanySettingsService $companySettings,
    ) {}

    /**
     * @return list<string>
     */
    public function validate(Document $document): array
    {
        $document->loadMissing(['tier', 'lignes']);

        return array_values(array_filter([
            ...$this->validateIssuer(),
            ...$this->validateClient($document->tier),
            ...$this->validateDocument($document),
            ...$this->validateLines($document),
        ]));
    }

    /**
     * @return list<string>
     */
    private function validateIssuer(): array
    {
        $company = $this->companySettings->current();
        $errors = [];

        if (! $this->isCompleteAddress($company->address)) {
            $errors[] = 'Émetteur : l\'adresse complète de l\'entreprise est obligatoire (BR-FR).';
        }

        if (! $this->isValidSiret($company->registration_number)) {
            $errors[] = 'Émetteur : le SIRET (14 chiffres) est obligatoire (BR-FR).';
        }

        if (! $this->isValidIntracomVat($company->vat_number)) {
            $errors[] = 'Émetteur : le numéro de TVA intracommunautaire est obligatoire (BR-FR).';
        }

        return $errors;
    }

    /**
     * @return list<string>
     */
    private function validateClient(?Tier $client): array
    {
        if ($client === null) {
            return ['Client : un client doit être associé à la facture (BR-FR).'];
        }

        $errors = [];

        if (! $this->isCompleteAddress($client->address)) {
            $errors[] = 'Client : l\'adresse complète du client est obligatoire (BR-FR).';
        }

        if ($this->isFrenchProfessional($client)) {
            if (! $this->isValidSiretOrSiren($client->registration_number ?? null)) {
                $errors[] = 'Client : le SIRET ou SIREN est obligatoire pour un professionnel basé en France (BR-FR).';
            }

            if (! $this->isValidIntracomVat($client->vat_number)) {
                $errors[] = 'Client : le numéro de TVA intracommunautaire est obligatoire pour un professionnel basé en France (BR-FR).';
            }
        }

        return $errors;
    }

    /**
     * @return list<string>
     */
    private function validateDocument(Document $document): array
    {
        if (! in_array($document->operation_category, Document::operationCategories(), true)) {
            return ['Document : la catégorie d\'opération (bien, service ou mixte) est obligatoire (BR-FR).'];
        }

        return [];
    }

    /**
     * @return list<string>
     */
    private function validateLines(Document $document): array
    {
        if ($document->lignes->isEmpty()) {
            return ['Lignes : la facture doit contenir au moins une ligne (BR-FR).'];
        }

        $errors = [];

        foreach ($document->lignes as $index => $ligne) {
            $lineNumber = $index + 1;
            $errors = array_merge($errors, $this->validateLine($ligne, $lineNumber));
        }

        return $errors;
    }

    /**
     * @return list<string>
     */
    private function validateLine(LigneDocument $ligne, int $lineNumber): array
    {
        $errors = [];
        $prefix = "Ligne {$lineNumber}";

        if (! filled(trim((string) ($ligne->label ?: $ligne->description)))) {
            $errors[] = "{$prefix} : une désignation est obligatoire (BR-FR).";
        }

        if (! is_numeric($ligne->quantity) || (float) $ligne->quantity <= 0) {
            $errors[] = "{$prefix} : la quantité doit être strictement supérieure à zéro (BR-FR).";
        }

        if (! is_numeric($ligne->unit_price_ht)) {
            $errors[] = "{$prefix} : le prix unitaire HT doit être défini (BR-FR).";
        }

        if (! is_numeric($ligne->vat_rate)) {
            $errors[] = "{$prefix} : le taux de TVA doit être défini (BR-FR).";
        }

        return $errors;
    }

    private function isFrenchProfessional(Tier $client): bool
    {
        if ($client->type !== 'client') {
            return false;
        }

        $countryCode = strtoupper(trim((string) ($client->country_code ?? 'FR')));

        return $countryCode === '' || $countryCode === 'FR';
    }

    private function isCompleteAddress(?string $address): bool
    {
        $address = trim((string) $address);

        if ($address === '') {
            return false;
        }

        return mb_strlen($address) >= 10 && preg_match('/\d/', $address) === 1;
    }

    private function isValidSiret(?string $value): bool
    {
        $digits = preg_replace('/\D/', '', (string) $value) ?? '';

        return strlen($digits) === 14;
    }

    private function isValidSiretOrSiren(?string $value): bool
    {
        $digits = preg_replace('/\D/', '', (string) $value) ?? '';
        $length = strlen($digits);

        return $length === 9 || $length === 14;
    }

    private function isValidIntracomVat(?string $value): bool
    {
        $normalized = strtoupper(preg_replace('/\s+/', '', (string) $value) ?? '');

        if ($normalized === '') {
            return false;
        }

        return preg_match('/^[A-Z]{2}[A-Z0-9]{2,12}$/', $normalized) === 1;
    }
}
