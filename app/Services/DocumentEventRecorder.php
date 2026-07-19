<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Document;
use App\Models\DocumentEvent;

class DocumentEventRecorder
{
    public function record(Document $document, string $eventType, ?string $description = null): DocumentEvent
    {
        return $document->events()->create([
            'event_type' => $eventType,
            'description' => $description,
        ]);
    }

    public function recordOpenedOnce(Document $document): ?DocumentEvent
    {
        $alreadyOpened = $document->events()
            ->where('event_type', DocumentEvent::TYPE_OPENED)
            ->exists();

        if ($alreadyOpened) {
            return null;
        }

        return $this->record(
            $document,
            DocumentEvent::TYPE_OPENED,
            'Email ouvert par le destinataire.',
        );
    }

    public function recordCdarStatusChange(
        Document $document,
        string $newCdarStatus,
        ?string $reason = null,
    ): ?DocumentEvent {
        $currentStatus = $document->cdar_status;

        if ($currentStatus === $newCdarStatus) {
            return null;
        }

        $previous = $currentStatus;
        $newLabel = Document::cdarStatusLabel($newCdarStatus);

        if ($previous !== null && $previous !== $newCdarStatus) {
            $description = sprintf(
                'Statut CDAR : %s → %s',
                Document::cdarStatusLabel($previous),
                $newLabel,
            );
        } else {
            $description = 'Statut CDAR : '.$newLabel;
        }

        if ($reason !== null && $reason !== '') {
            $description .= ' — '.$reason;
        }

        return $this->record(
            $document,
            DocumentEvent::TYPE_CDAR_STATUS_CHANGED,
            $description,
        );
    }
}
