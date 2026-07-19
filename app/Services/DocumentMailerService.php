<?php

declare(strict_types=1);

namespace App\Services;

use App\Mail\DocumentSentMail;
use App\Models\Document;
use Illuminate\Support\Facades\Mail;
use InvalidArgumentException;

class DocumentMailerService
{
    public function send(Document $document, ?string $recipientEmail = null): void
    {
        $document->loadMissing(['tier', 'lignes']);

        $recipient = $this->resolveRecipient($recipientEmail ?? $document->tier?->email);

        if ($recipient === null || $recipient === '') {
            throw new InvalidArgumentException('Aucune adresse email disponible pour l\'envoi du document.');
        }

        Mail::to($recipient)->send(new DocumentSentMail($document));
    }

    private function resolveRecipient(?string $clientEmail): ?string
    {
        if (is_string($clientEmail) && $clientEmail !== '') {
            return $clientEmail;
        }

        return null;
    }
}
