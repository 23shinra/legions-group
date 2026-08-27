<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\ObjectStatus;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

final class WorkObject extends Model
{
    protected $fillable = [
        'name',
        'address',
        'start_date',
        'planned_end_date',
        'brigade_id',
        'status',
        'closed_at',
        'closed_by',
        'settlement',
    ];

    protected function casts(): array
    {
        return [
            'start_date' => 'date',
            'planned_end_date' => 'date',
            'status' => ObjectStatus::class,
            'closed_at' => 'datetime',
            'settlement' => 'array',
        ];
    }

    public function brigade(): BelongsTo
    {
        return $this->belongsTo(Brigade::class);
    }

    public function closer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'closed_by');
    }

    public function assignments(): HasMany
    {
        return $this->hasMany(ObjectAssignment::class);
    }

    public function timeEntries(): HasMany
    {
        return $this->hasMany(TimeEntry::class);
    }

    public function isClosed(): bool
    {
        return $this->status === ObjectStatus::Closed;
    }
}
