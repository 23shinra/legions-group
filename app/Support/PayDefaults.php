<?php

declare(strict_types=1);

namespace App\Support;

final class PayDefaults
{
    public const DAILY_RATE = 18000.0;

    public const WORKDAY_HOURS = 10;

    public const OVERTIME_RATE = 1500.0;

    public static function hourlyRate(): float
    {
        return self::DAILY_RATE / self::WORKDAY_HOURS;
    }

    public static function workdayMinutes(): int
    {
        return self::WORKDAY_HOURS * 60;
    }

    /** @return array<string, float|int> */
    public static function toArray(): array
    {
        return [
            'daily_rate' => self::DAILY_RATE,
            'hourly_rate' => self::hourlyRate(),
            'overtime_rate' => self::OVERTIME_RATE,
            'workday_hours' => self::WORKDAY_HOURS,
        ];
    }
}
