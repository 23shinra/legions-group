<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Services\RosterInstaller;
use Illuminate\Database\Seeder;

final class DatabaseSeeder extends Seeder
{
    public function run(RosterInstaller $roster): void
    {
        $roster->seed();
    }
}
