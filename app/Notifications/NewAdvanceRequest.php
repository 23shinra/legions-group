<?php

declare(strict_types=1);

namespace App\Notifications;

use App\Enums\UserRole;
use App\Models\AdvanceRequest;
use App\Models\User;
use Illuminate\Notifications\Notification;

final class NewAdvanceRequest extends Notification
{
    public function __construct(
        private readonly AdvanceRequest $advance,
    ) {}

    /** @return list<string> */
    public function via(object $notifiable): array
    {
        return ['database', 'broadcast'];
    }

    public function broadcastType(): string
    {
        return 'advance.new';
    }

    /** @return array<string, mixed> */
    public function toArray(object $notifiable): array
    {
        $url = '/manager/advances';

        if ($notifiable instanceof User) {
            $url = match ($notifiable->role) {
                UserRole::Brigadier => '/brigadier/advances',
                UserRole::Accountant => '/accountant/advances',
                default => '/manager/advances',
            };
        }

        return [
            'type' => 'advance.new',
            'event' => 'advance.new',
            'advance_id' => $this->advance->id,
            'user' => $this->advance->user?->name,
            'amount' => (float) $this->advance->amount,
            'message' => sprintf(
                'Новый запрос аванса: %s — %s ₸',
                $this->advance->user?->name ?? 'сотрудник',
                number_format((float) $this->advance->amount, 0, '.', ' ')
            ),
            'url' => $url,
        ];
    }
}
