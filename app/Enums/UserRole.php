<?php

declare(strict_types=1);

namespace App\Enums;

enum UserRole: string
{
    case Worker = 'worker';
    case Brigadier = 'brigadier';
    case Manager = 'manager';
    case Accountant = 'accountant';

    public function label(): string
    {
        return match ($this) {
            self::Worker => 'Рабочий',
            self::Brigadier => 'Бригадир',
            self::Manager => 'Руководитель',
            self::Accountant => 'Бухгалтер',
        };
    }

    public function homeRoute(): string
    {
        return match ($this) {
            self::Worker => 'worker.home',
            self::Brigadier => 'brigadier.home',
            self::Manager => 'manager.dashboard',
            self::Accountant => 'accountant.dashboard',
        };
    }
}
