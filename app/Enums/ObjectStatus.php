<?php

declare(strict_types=1);

namespace App\Enums;

enum ObjectStatus: string
{
    case Planned = 'planned';
    case Active = 'active';
    case Completed = 'completed';
    case Closed = 'closed';

    public function label(): string
    {
        return match ($this) {
            self::Planned => 'Планируется',
            self::Active => 'В работе',
            self::Completed => 'Завершён',
            self::Closed => 'Закрыт',
        };
    }
}
