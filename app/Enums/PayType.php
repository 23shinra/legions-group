<?php

declare(strict_types=1);

namespace App\Enums;

enum PayType: string
{
    case Daily = 'daily';
    case Hourly = 'hourly';
    case Fixed = 'fixed';
    case Custom = 'custom';

    public function label(): string
    {
        return match ($this) {
            self::Daily => 'За день',
            self::Hourly => 'За час',
            self::Fixed => 'Фиксированная',
            self::Custom => 'Индивидуальная (как почасовая)',
        };
    }
}
