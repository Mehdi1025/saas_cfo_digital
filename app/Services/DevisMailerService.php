<?php

declare(strict_types=1);

namespace App\Services;

use App\Mail\DevisSentMail;
use App\Models\Document;
use Illuminate\Support\Facades\Mail;
use InvalidArgumentException;

class DevisMailerService
{
    public function send(Document $devis, ?string $recipientEmail = null): void
    {
        if (! $devis->isDevis()) {
            throw new InvalidArgumentException('Ce document n\'est pas un devis.');
        }

        $devis->loadMissing(['tier', 'lignes']);

        $recipient = $this->resolveRecipient($recipientEmail ?? $devis->tier?->email);

        if ($recipient === null || $recipient === '') {
            throw new InvalidArgumentException('Aucune adresse email disponible pour l\'envoi du devis.');
        }

        Mail::to($recipient)->send(new DevisSentMail($devis));
    }

    private function resolveRecipient(?string $clientEmail): ?string
    {
        if (is_string($clientEmail) && $clientEmail !== '') {
            return $clientEmail;
        }

        return null;
    }
}
