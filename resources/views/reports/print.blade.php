<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="utf-8">
    <title>{{ $title }}</title>
    <style>
        body { font-family: DejaVu Sans, Arial, sans-serif; color: #111; margin: 24px; }
        h1 { font-size: 20px; margin: 0 0 4px; }
        p { margin: 0 0 16px; color: #555; }
        table { width: 100%; border-collapse: collapse; font-size: 12px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background: #f4f4f4; }
        .right { text-align: right; }
        .summary { margin: 0 0 16px; }
        @media print { button { display: none; } }
    </style>
</head>
<body>
    <button type="button" onclick="window.print()">Сохранить PDF</button>
    <h1>{{ $title }}</h1>
    <p>Период: {{ $period }}</p>
    <p class="summary">
        Начислено: {{ number_format($summary['totalAccrued'] ?? 0, 0, '.', ' ') }} ₸
        · Часы: {{ number_format(($summary['totalHours'] ?? 0) / 60, 1, '.', ' ') }}
        · Опоздания: {{ $summary['totalLates'] ?? 0 }}
        · Остаток: {{ number_format($summary['totalRemaining'] ?? 0, 0, '.', ' ') }} ₸
    </p>
    <table>
        <thead>
            <tr>
                @if (($type ?? '') === 'brigades')
                    <th>Бригада</th>
                    <th>Сотрудников</th>
                @else
                    <th>Сотрудник</th>
                    <th>{{ ($type ?? '') === 'object' ? 'Объект' : 'Бригада' }}</th>
                @endif
                <th class="right">Часы</th>
                <th class="right">Начислено</th>
                <th class="right">Опоздания</th>
                <th class="right">Остаток</th>
            </tr>
        </thead>
        <tbody>
            @foreach ($rows as $row)
                <tr>
                    <td>{{ $row['employee'] ?? $row['brigade'] ?? '—' }}</td>
                    <td>{{ $row['object'] ?? $row['brigade'] ?? ($row['members'] ?? '—') }}</td>
                    <td class="right">{{ number_format(($row['hours'] ?? 0) / 60, 1, '.', ' ') }}</td>
                    <td class="right">{{ number_format($row['accrued'] ?? 0, 0, '.', ' ') }}</td>
                    <td class="right">{{ $row['lates'] ?? 0 }}</td>
                    <td class="right">{{ number_format($row['remaining'] ?? 0, 0, '.', ' ') }}</td>
                </tr>
            @endforeach
        </tbody>
    </table>
    <script>window.addEventListener('load', () => setTimeout(() => window.print(), 300));</script>
</body>
</html>
