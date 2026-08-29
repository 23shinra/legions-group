<?php

declare(strict_types=1);

namespace App\Services;

use App\Enums\UserRole;
use App\Models\TimeEntry;
use App\Models\User;
use App\Notifications\AttendanceAlert;
use Carbon\Carbon;
use Illuminate\Support\Collection;

final readonly class AttendanceDigestService
{
    public const TIMEZONE = 'Asia/Almaty';

    public const LATE_HOUR = 9;

    /**
     * @return array{absent: int, late: int}
     */
    public function run(?Carbon $forDate = null): array
    {
        $day = ($forDate ?? now(self::TIMEZONE))->timezone(self::TIMEZONE)->startOfDay();
        $lateAfter = $day->copy()->setTime(self::LATE_HOUR, 0);

        $workers = User::query()
            ->with('brigade.brigadier')
            ->where('role', UserRole::Worker)
            ->where('is_active', true)
            ->get();

        $entries = TimeEntry::query()
            ->whereBetween('started_at', [
                $day->copy()->timezone('UTC'),
                $day->copy()->endOfDay()->timezone('UTC'),
            ])
            ->where(function ($query): void {
                $query->whereNotNull('confirmed_at')
                    ->orWhereNull('ended_at');
            })
            ->get()
            ->groupBy('user_id');

        $managers = User::query()
            ->where('role', UserRole::Manager)
            ->where('is_active', true)
            ->get();

        $absent = 0;
        $late = 0;

        foreach ($workers as $worker) {
            $todayEntries = $entries->get($worker->id, collect());
            $openOrConfirmed = $todayEntries->first(
                fn (TimeEntry $entry): bool => $entry->ended_at === null || $entry->confirmed_at !== null,
            );

            if ($openOrConfirmed === null) {
                $this->notifyRecipients($worker, $managers, 'absent');
                $absent++;

                continue;
            }

            $startedLocal = $openOrConfirmed->started_at?->copy()->timezone(self::TIMEZONE);

            if ($startedLocal !== null && $startedLocal->greaterThan($lateAfter)) {
                $this->notifyRecipients(
                    $worker,
                    $managers,
                    'late',
                    'приход в '.$startedLocal->format('H:i'),
                );
                $late++;
            }
        }

        return ['absent' => $absent, 'late' => $late];
    }

    /**
     * @param  Collection<int, User>  $managers
     */
    private function notifyRecipients(
        User $worker,
        Collection $managers,
        string $kind,
        string $detail = '',
    ): void {
        $recipients = collect();
        $brigadier = $worker->brigade?->brigadier;

        if ($brigadier !== null && $brigadier->is_active) {
            $recipients->push($brigadier);
        }

        $recipients = $recipients->concat($managers)->unique('id');

        foreach ($recipients as $recipient) {
            if ($this->alreadyNotified($recipient, $worker, $kind)) {
                continue;
            }

            $recipient->notify(new AttendanceAlert($kind, $worker, $detail));
        }
    }

    private function alreadyNotified(User $recipient, User $worker, string $kind): bool
    {
        return $recipient->notifications()
            ->where('type', AttendanceAlert::class)
            ->whereDate('created_at', today())
            ->get()
            ->contains(function ($notification) use ($worker, $kind): bool {
                $data = $notification->data ?? [];

                return ($data['kind'] ?? null) === $kind
                    && (int) ($data['user_id'] ?? 0) === (int) $worker->id;
            });
    }
}
