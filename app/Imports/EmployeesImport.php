<?php

declare(strict_types=1);

namespace App\Imports;

use App\Models\User;
use App\Services\EmployeeService;
use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\ToCollection;
use Maatwebsite\Excel\Concerns\WithHeadingRow;

final class EmployeesImport implements ToCollection, WithHeadingRow
{
    private int $created = 0;

    /** @var list<string> */
    private array $errors = [];

    public function __construct(
        private readonly User $manager,
        private readonly EmployeeService $employees,
    ) {}

    public function collection(Collection $rows): void
    {
        foreach ($rows as $index => $row) {
            $line = $index + 2;
            $data = $row->toArray();

            if ($this->isEmptyRow($data)) {
                continue;
            }

            try {
                $this->employees->createFromImportRow($data, $this->manager);
                $this->created++;
            } catch (\Throwable $exception) {
                $this->errors[] = "Строка {$line}: {$exception->getMessage()}";
            }
        }
    }

    public function createdCount(): int
    {
        return $this->created;
    }

    /** @return list<string> */
    public function errors(): array
    {
        return $this->errors;
    }

    /**
     * @param  array<string, mixed>  $row
     */
    private function isEmptyRow(array $row): bool
    {
        foreach ($row as $value) {
            if ($value !== null && trim((string) $value) !== '') {
                return false;
            }
        }

        return true;
    }
}
