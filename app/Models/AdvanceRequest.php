<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\AdvanceStatus;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

final class AdvanceRequest extends Model
{
    protected $fillable = [
        'user_id',
        'amount',
        'comment',
        'status',
        'reviewed_by',
        'reviewed_at',
        'review_comment',
        'paid_by',
        'paid_at',
    ];

    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
            'status' => AdvanceStatus::class,
            'reviewed_at' => 'datetime',
            'paid_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }

    public function payer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'paid_by');
    }
}
