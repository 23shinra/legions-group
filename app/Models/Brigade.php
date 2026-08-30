<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Collection;

final class Brigade extends Model
{
    protected $fillable = [
        'name',
        'brigadier_id',
    ];

    public function brigadier(): BelongsTo
    {
        return $this->belongsTo(User::class, 'brigadier_id');
    }

    public function members(): HasMany
    {
        return $this->hasMany(User::class);
    }

    public function workObjects(): HasMany
    {
        return $this->hasMany(WorkObject::class);
    }

    public function activeObjects(): \Illuminate\Database\Eloquent\Collection
    {
        return $this->workObjects()
            ->whereIn('status', ['active', 'planned'])
            ->whereNull('closed_at')
            ->orderBy('start_date')
            ->get();
    }

    public function activeObject(): ?WorkObject
    {
        return $this->workObjects()
            ->whereIn('status', ['active', 'planned'])
            ->latest('start_date')
            ->first();
    }

    public function displayName(): string
    {
        $this->loadMissing('brigadier');

        $fromBrigadier = $this->brigadier?->familyName();

        if ($fromBrigadier !== null && $fromBrigadier !== '') {
            return $fromBrigadier;
        }

        return $this->name;
    }

    /**
     * @return Collection<int, array{id: int, name: string, display_name: string}>
     */
    public static function options(): Collection
    {
        return self::query()
            ->with('brigadier')
            ->orderBy('name')
            ->get()
            ->map(fn (self $brigade): array => [
                'id' => $brigade->id,
                'name' => $brigade->name,
                'display_name' => $brigade->displayName(),
            ])
            ->values();
    }
}
