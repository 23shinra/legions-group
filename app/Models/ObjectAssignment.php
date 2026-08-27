<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

final class ObjectAssignment extends Model
{
    protected $fillable = [
        'user_id',
        'work_object_id',
        'started_on',
        'ended_on',
    ];

    protected function casts(): array
    {
        return [
            'started_on' => 'date',
            'ended_on' => 'date',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function workObject(): BelongsTo
    {
        return $this->belongsTo(WorkObject::class);
    }
}
