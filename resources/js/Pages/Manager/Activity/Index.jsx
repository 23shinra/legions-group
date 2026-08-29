import BezelCard from '@/Components/ui/BezelCard';
import PageHeader from '@/Components/ui/PageHeader';
import SoftSelect from '@/Components/ui/SoftSelect';
import AppLayout from '@/Layouts/AppLayout';
import { formatDateTime, formatMoney } from '@/lib/format';
import { Head, router } from '@inertiajs/react';
import { useEffect, useMemo, useRef, useState } from 'react';

const ACTION_LABELS = {
    'time.arrival_requested': 'Запрос прихода',
    'time.arrival_confirmed': 'Подтверждение прихода',
    'time.ended': 'Завершение смены',
    'advance.requested': 'Запрос аванса',
    'advance.approved': 'Аванс одобрен',
    'advance.rejected': 'Аванс отклонён',
    'advance.paid': 'Аванс выплачен',
    'object.closed': 'Объект закрыт',
    'payment.created': 'Выплата зарплаты',
};

function logLabel(log) {
    return log.label || ACTION_LABELS[log.action] || log.action;
}

function matchesQuery(log, rawQuery) {
    const needle = rawQuery.trim().toLowerCase();

    if (!needle) {
        return true;
    }

    const haystack = [
        logLabel(log),
        log.action,
        log.user?.name,
        log.subject_name,
        log.meta?.member,
        log.meta?.amount != null ? String(log.meta.amount) : '',
        log.meta?.amount != null ? formatMoney(log.meta.amount) : '',
    ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

    return haystack.includes(needle);
}

export default function Index({
    logs = [],
    filters = {},
    indexRoute = 'manager.activity.index',
}) {
    const [q, setQ] = useState(filters.q ?? '');
    const [action, setAction] = useState(filters.action ?? '');
    const debounceRef = useRef(null);

    const apply = (next = {}) => {
        const nextQ = next.q !== undefined ? next.q : q;
        const nextAction = next.action !== undefined ? next.action : action;

        router.get(
            route(indexRoute),
            {
                q: nextQ || undefined,
                action: nextAction || undefined,
            },
            { preserveState: true, preserveScroll: true, replace: true },
        );
    };

    useEffect(() => {
        window.clearTimeout(debounceRef.current);
        debounceRef.current = window.setTimeout(() => {
            if ((filters.q ?? '') === q && (filters.action ?? '') === action) {
                return;
            }

            apply();
        }, 250);

        return () => window.clearTimeout(debounceRef.current);
    }, [q, action]);

    const visibleLogs = useMemo(
        () => logs.filter((log) => matchesQuery(log, q)),
        [logs, q],
    );

    return (
        <AppLayout>
            <Head title="Журнал" />

            <PageHeader
                eyebrow="Контроль"
                title="Журнал действий"
                subtitle="История операций в системе"
            />

            <BezelCard className="mb-6" padding="p-4 sm:p-5">
                <form
                    onSubmit={(event) => {
                        event.preventDefault();
                        apply();
                    }}
                    className="grid gap-3 sm:grid-cols-2"
                >
                    <div>
                        <label className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
                            Поиск
                        </label>
                        <input
                            value={q}
                            onChange={(event) => setQ(event.target.value)}
                            className="input-soft"
                            placeholder="ФИО, аванс, приход, выплата…"
                        />
                    </div>
                    <div>
                        <label className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
                            Тип
                        </label>
                        <SoftSelect
                            value={action}
                            onChange={setAction}
                            options={[
                                { value: '', label: 'Все' },
                                { value: 'time', label: 'Учёт времени' },
                                { value: 'advance', label: 'Авансы' },
                                { value: 'object', label: 'Объекты' },
                                { value: 'payment', label: 'Выплаты' },
                            ]}
                        />
                    </div>
                </form>
            </BezelCard>

            <BezelCard padding="p-0">
                <ul className="divide-y divide-[var(--bezel-ring)]">
                    {visibleLogs.length === 0 ? (
                        <li className="px-6 py-12 text-center text-[var(--muted)]">
                            {logs.length === 0
                                ? 'Записей пока нет'
                                : 'Ничего не найдено'}
                        </li>
                    ) : (
                        visibleLogs.map((log) => (
                            <li key={log.id} className="px-4 py-4 sm:px-6">
                                <div className="flex flex-wrap items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <p className="font-semibold text-[var(--ink)]">
                                            {logLabel(log)}
                                        </p>
                                        <p className="mt-1 text-sm text-[var(--muted)]">
                                            {[
                                                log.user?.name ?? 'Система',
                                                log.subject_name &&
                                                log.subject_name !== log.user?.name
                                                    ? log.subject_name
                                                    : null,
                                                log.meta?.amount != null
                                                    ? formatMoney(log.meta.amount)
                                                    : null,
                                            ]
                                                .filter(Boolean)
                                                .join(' · ')}
                                        </p>
                                    </div>
                                    <p className="shrink-0 text-sm text-[var(--muted)]">
                                        {formatDateTime(log.created_at)}
                                    </p>
                                </div>
                            </li>
                        ))
                    )}
                </ul>
            </BezelCard>
        </AppLayout>
    );
}
