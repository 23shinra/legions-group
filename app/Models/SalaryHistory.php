<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\PayType;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

final class SalaryHistory extends Model
{
    protected $fillable = [
        'user_id',
        'rate',
        'pay_type',
        'effective_from',
        'note',
        'changed_by',
    ];

    protected function casts(): array
    {
        return [
            'rate' => 'decimal:2',
            'pay_type' => PayType::class,
            'effective_from' => 'date',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function changer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'changed_by');
    }
}
