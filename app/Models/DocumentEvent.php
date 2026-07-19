<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DocumentEvent extends Model
{
    public const TYPE_CREATED = 'created';

    public const TYPE_SENT = 'sent';

    public const TYPE_ACCEPTED = 'accepted';

    public const TYPE_REJECTED = 'rejected';

    public const TYPE_CONVERTED = 'converted';

    public const TYPE_OPENED = 'opened';

    public const TYPE_PAID = 'paid';

    public const TYPE_VOIDED = 'voided';

    public const TYPE_CDAR_STATUS_CHANGED = 'CDAR_STATUS_CHANGED';

    /**
     * @var list<string>
     */
    protected $fillable = [
        'document_id',
        'event_type',
        'description',
    ];

    /**
     * @return BelongsTo<Document, $this>
     */
    public function document(): BelongsTo
    {
        return $this->belongsTo(Document::class);
    }
}
