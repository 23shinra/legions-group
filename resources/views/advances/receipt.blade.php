<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="utf-8">
    <title>Квитанция №{{ $advance->id }}</title>
    <style>
        body {
            font-family: DejaVu Sans, Arial, sans-serif;
            color: #0a0a0a;
            margin: 0;
            padding: 32px;
            background: #fff;
        }
        .sheet {
            max-width: 640px;
            margin: 0 auto;
            border: 1px solid #e5e5e5;
            border-radius: 16px;
            padding: 28px 32px;
        }
        .eyebrow {
            font-size: 11px;
            letter-spacing: 0.18em;
            text-transform: uppercase;
            color: #737373;
            margin: 0 0 8px;
        }
        h1 {
            font-size: 24px;
            margin: 0 0 4px;
        }
        .muted {
            color: #737373;
            font-size: 13px;
            margin: 0 0 24px;
        }
        .amount {
            font-size: 32px;
            font-weight: 800;
            margin: 0 0 24px;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            font-size: 14px;
        }
        th, td {
            text-align: left;
            padding: 10px 0;
            border-bottom: 1px solid #ececec;
            vertical-align: top;
        }
        th {
            width: 40%;
            color: #737373;
            font-weight: 600;
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 0.08em;
        }
        .actions {
            margin: 0 0 20px;
        }
        .actions button {
            border: 0;
            background: #0a0a0a;
            color: #fff;
            border-radius: 999px;
            padding: 10px 18px;
            font-size: 13px;
            font-weight: 600;
            cursor: pointer;
        }
        @media print {
            body { padding: 0; }
            .actions { display: none; }
            .sheet { border: 0; border-radius: 0; padding: 0; max-width: none; }
        }
    </style>
</head>
<body>
    <div class="actions">
        <button type="button" onclick="window.print()">Скачать / печать</button>
    </div>

    <div class="sheet">
        <p class="eyebrow">Legionis Group</p>
        <h1>Квитанция об авансе</h1>
        <p class="muted">№{{ $advance->id }} · {{ optional($advance->paid_at)->timezone('Asia/Almaty')->format('d.m.Y H:i') ?? '—' }}</p>

        <p class="amount">{{ number_format((float) $advance->amount, 0, '.', ' ') }} ₸</p>

        <table>
            <tr>
                <th>Сотрудник</th>
                <td>{{ $employee?->name ?? '—' }}</td>
            </tr>
            <tr>
                <th>Должность</th>
                <td>{{ $employee?->position ?? '—' }}</td>
            </tr>
            <tr>
                <th>Бригада</th>
                <td>{{ $employee?->brigade?->name ?? '—' }}</td>
            </tr>
            <tr>
                <th>Комментарий</th>
                <td>{{ $advance->comment ?: '—' }}</td>
            </tr>
            <tr>
                <th>Способ оплаты</th>
                <td>{{ $advance->payment_method?->label() ?? '—' }}</td>
            </tr>
            @if ($advance->payment_note)
                <tr>
                    <th>Примечание</th>
                    <td>{{ $advance->payment_note }}</td>
                </tr>
            @endif
            <tr>
                <th>Выплатил</th>
                <td>{{ $payer?->name ?? '—' }}</td>
            </tr>
            <tr>
                <th>Статус</th>
                <td>Выплачено</td>
            </tr>
        </table>
    </div>

    <script>window.addEventListener('load', () => setTimeout(() => window.print(), 300));</script>
</body>
</html>
