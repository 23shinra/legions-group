<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\PayType;
use App\Enums\UserRole;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

#[Fillable([
    'name',
    'email',
    'password',
    'phone',
    'role',
    'brigade_id',
    'position',
    'pay_type',
    'rate',
    'max_advance',
    'hired_at',
    'is_active',
])]
#[Hidden(['password', 'remember_token'])]
final class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable;

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'role' => UserRole::class,
            'pay_type' => PayType::class,
            'rate' => 'decimal:2',
            'max_advance' => 'decimal:2',
            'hired_at' => 'date',
            'is_active' => 'boolean',
        ];
    }

    public function brigade(): BelongsTo
    {
        return $this->belongsTo(Brigade::class);
    }

    public function timeEntries(): HasMany
    {
        return $this->hasMany(TimeEntry::class);
    }

    public function advanceRequests(): HasMany
    {
        return $this->hasMany(AdvanceRequest::class);
    }

    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
    }

    public function salaryHistories(): HasMany
    {
        return $this->hasMany(SalaryHistory::class);
    }

    public function objectAssignments(): HasMany
    {
        return $this->hasMany(ObjectAssignment::class);
    }

    public function activeTimeEntry(): ?TimeEntry
    {
        return $this->timeEntries()
            ->whereDate('started_at', today())
            ->whereNull('ended_at')
            ->whereNotNull('confirmed_at')
            ->latest('started_at')
            ->first();
    }

    public function pendingTimeEntry(): ?TimeEntry
    {
        return $this->timeEntries()
            ->whereDate('started_at', today())
            ->whereNull('ended_at')
            ->whereNull('confirmed_at')
            ->latest('started_at')
            ->first();
    }

    public function isWorking(): bool
    {
        return $this->activeTimeEntry() !== null;
    }

    public function isManager(): bool
    {
        return $this->role === UserRole::Manager;
    }

    public function isAccountant(): bool
    {
        return $this->role === UserRole::Accountant;
    }

    public function isBrigadier(): bool
    {
        return $this->role === UserRole::Brigadier;
    }

    public function isWorker(): bool
    {
        return $this->role === UserRole::Worker;
    }
}
