<?php

declare(strict_types=1);

namespace App\Exports;

use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Facades\Excel;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

final class EmployeeReportExport implements FromCollection, WithHeadings
{
    /**
     * @param  list<array<string, mixed>>  $rows
     */
    public function __construct(
        private readonly array $rows,
    ) {}

    public function collection(): Collection
    {
        return collect($this->rows)->map(fn (array $row): array => [
            $row['employee'] ?? '',
            $row['brigade'] ?? '',
            $row['period'] ?? '',
            round(($row['hours'] ?? 0) / 60, 2),
            $row['days'] ?? 0,
            $row['lates'] ?? 0,
            $row['accrued'] ?? 0,
            $row['advances'] ?? 0,
            $row['paid'] ?? 0,
            $row['remaining'] ?? 0,
        ]);
    }

    /** @return list<string> */
    public function headings(): array
    {
        return [
            'Сотрудник',
            'Бригада',
            'Период',
            'Часы',
            'Дни',
            'Опоздания',
            'Начислено',
            'Авансы',
            'Выплачено',
            'Остаток',
        ];
    }

    public function download(string $filename): BinaryFileResponse
    {
        return Excel::download($this, $filename);
    }
}
