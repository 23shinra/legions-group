<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\UserRole;
use App\Services\RealtimeNotifier;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

final class ActivityLog extends Model
{
    /** @var array<string, string> */
    public const ACTION_LABELS = [
        'time.arrival_requested' => 'Запрос прихода',
        'time.arrival_confirmed' => 'Подтверждение прихода',
        'time.ended' => 'Завершение смены',
        'advance.requested' => 'Запрос аванса',
        'advance.approved' => 'Аванс одобрен',
        'advance.rejected' => 'Аванс отклонён',
        'advance.paid' => 'Аванс выплачен',
        'object.closed' => 'Объект закрыт',
        'payment.created' => 'Выплата зарплаты',
    ];

    protected $fillable = [
        'user_id',
        'action',
        'subject_type',
        'subject_id',
        'meta',
    ];

    protected function casts(): array
    {
        return [
            'meta' => 'array',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function subject(): MorphTo
    {
        return $this->morphTo();
    }

    public function label(): string
    {
        return self::ACTION_LABELS[$this->action] ?? $this->action;
    }

    public static function record(?User $actor, string $action, ?Model $subject = null, array $meta = []): self
    {
        $log = self::query()->create([
            'user_id' => $actor?->id,
            'action' => $action,
            'subject_type' => $subject ? $subject::class : null,
            'subject_id' => $subject?->getKey(),
            'meta' => $meta,
        ]);

        app(RealtimeNotifier::class)->pingRoles(
            [UserRole::Manager, UserRole::Accountant],
            'activity.logged',
            0,
        );

        return $log;
    }

    public function scopeSearch(Builder $query, string $search): Builder
    {
        $needle = mb_strtolower(trim($search));

        if ($needle === '') {
            return $query;
        }

        $like = '%'.$needle.'%';
        $actions = self::actionsMatching($needle);
        $matchedUserIds = User::query()
            ->get(['id', 'name'])
            ->filter(static fn (User $user): bool => str_contains(mb_strtolower($user->name), $needle))
            ->pluck('id');

        return $query->where(function (Builder $builder) use ($like, $actions, $needle, $matchedUserIds): void {
            $builder->where('action', 'like', $like);

            if ($actions !== []) {
                $builder->orWhereIn('action', $actions);
            }

            if ($matchedUserIds->isNotEmpty()) {
                $builder->orWhereIn('user_id', $matchedUserIds)
                    ->orWhere(function (Builder $metaQuery) use ($matchedUserIds): void {
                        foreach ($matchedUserIds as $userId) {
                            $metaQuery->orWhere('meta', 'like', '%"member_id":'.$userId.'%')
                                ->orWhere('meta', 'like', '%"member_id": '.$userId.'%')
                                ->orWhere('meta', 'like', '%"employee_id":'.$userId.'%')
                                ->orWhere('meta', 'like', '%"employee_id": '.$userId.'%');
                        }
                    });
            }

            if (is_numeric($needle)) {
                $builder->orWhere('meta', 'like', '%'.$needle.'%');
            }
        });
    }

    /**
     * @return list<string>
     */
    public static function actionsMatching(string $needle): array
    {
        $matched = [];

        foreach (self::ACTION_LABELS as $action => $label) {
            if (
                str_contains(mb_strtolower($label), $needle)
                || str_contains($action, $needle)
            ) {
                $matched[] = $action;
            }
        }

        $groups = [
            'приход' => 'time.arrival',
            'пришёл' => 'time.arrival',
            'пришел' => 'time.arrival',
            'смен' => 'time.',
            'учёт' => 'time.',
            'учет' => 'time.',
            'аванс' => 'advance.',
            'выплат' => 'payment.',
            'зарплат' => 'payment.',
            'оклад' => 'payment.',
            'объект' => 'object.',
        ];

        foreach ($groups as $word => $prefix) {
            if (! str_contains($needle, $word) && ! str_contains($word, $needle)) {
                continue;
            }

            foreach (array_keys(self::ACTION_LABELS) as $action) {
                if (str_starts_with($action, $prefix)) {
                    $matched[] = $action;
                }
            }
        }

        return array_values(array_unique($matched));
    }
}
