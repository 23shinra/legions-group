<?php

declare(strict_types=1);

namespace App\Exports;

use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Facades\Excel;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

final class EmployeesImportTemplateExport implements FromCollection, WithHeadings
{
    public function collection(): Collection
    {
        return collect([
            [
                'Петров Иван',
                '',
                '+77001234567',
                'worker',
                'Бригада №1',
                'Подсобник',
                'hourly',
                1800,
                50000,
                now()->toDateString(),
            ],
        ]);
    }

    /** @return list<string> */
    public function headings(): array
    {
        return [
            'Имя',
            'Логин',
            'Телефон',
            'Роль',
            'Бригада',
            'Должность',
            'Тип оплаты',
            'Ставка',
            'Лимит аванса',
            'Дата приёма',
        ];
    }

    public function download(string $filename): BinaryFileResponse
    {
        return Excel::download($this, $filename);
    }
}
