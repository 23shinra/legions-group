<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

final class TimeEntry extends Model
{
    protected $fillable = [
        'user_id',
        'brigade_id',
        'work_object_id',
        'started_at',
        'ended_at',
        'break_minutes',
        'worked_minutes',
        'latitude',
        'longitude',
    ];

    protected function casts(): array
    {
        return [
            'started_at' => 'datetime',
            'ended_at' => 'datetime',
            'latitude' => 'decimal:7',
            'longitude' => 'decimal:7',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function brigade(): BelongsTo
    {
        return $this->belongsTo(Brigade::class);
    }

    public function workObject(): BelongsTo
    {
        return $this->belongsTo(WorkObject::class);
    }

    public function isOpen(): bool
    {
        return $this->ended_at === null;
    }
}
