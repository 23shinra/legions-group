<?php

declare(strict_types=1);

namespace App\Enums;

enum AdvancePaymentMethod: string
{
    case Transfer = 'transfer';
    case Cash = 'cash';

    public function label(): string
    {
        return match ($this) {
            self::Transfer => 'Перевод',
            self::Cash => 'Наличные',
        };
    }
}
