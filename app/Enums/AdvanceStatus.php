<?php

declare(strict_types=1);

namespace App\Enums;

enum AdvanceStatus: string
{
    case Pending = 'pending';
    case Approved = 'approved';
    case Rejected = 'rejected';
    case Paid = 'paid';

    public function label(): string
    {
        return match ($this) {
            self::Pending => 'Ожидает',
            self::Approved => 'Одобрено',
            self::Rejected => 'Отклонено',
            self::Paid => 'Выплачено',
        };
    }
}
