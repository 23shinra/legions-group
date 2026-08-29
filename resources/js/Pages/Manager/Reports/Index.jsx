import EmployeeReportList from '@/Components/Reports/EmployeeReportList';
import ReportTable from '@/Components/Reports/ReportTable';
import BezelCard from '@/Components/ui/BezelCard';
import PageHeader from '@/Components/ui/PageHeader';
import SoftDatePicker from '@/Components/ui/SoftDatePicker';
import SoftSelect from '@/Components/ui/SoftSelect';
import AppLayout from '@/Layouts/AppLayout';
import { formatHours, formatMoney } from '@/lib/format';
import { Head, router } from '@inertiajs/react';
import { AnimatePresence, motion } from 'framer-motion';
import {
    ChartBar,
    Clock,
    CurrencyCircleDollar,
    DownloadSimple,
    Trophy,
    Users,
    WarningCircle,
    Wallet,
    X,
} from '@phosphor-icons/react';
import { useEffect, useMemo, useState } from 'react';

export default function Index({
    reports = [],
    summary = {},
    filters = {},
    objects = [],
}) {
    const [chartOpen, setChartOpen] = useState(false);
    const [from, setFrom] = useState(filters.from ?? '');
    const [to, setTo] = useState(filters.to ?? '');
    const [type, setType] = useState(filters.type ?? 'employees');
    const [objectId, setObjectId] = useState(filters.object_id ? String(filters.object_id) : '');

    const applyFilters = (event) => {
        event.preventDefault();
        router.get(
            route('manager.reports.index'),
            { from, to, type, object_id: type === 'object' ? objectId : undefined },
            { preserveState: true, preserveScroll: true },
        );
    };

    const queryString = () => {
        const params = new URLSearchParams({
            from: from || '',
            to: to || '',
            type,
        });
        if (type === 'object' && objectId) {
            params.set('object_id', objectId);
        }
        return params.toString();
    };

    const exportUrl = () => `${route('manager.reports.export')}?${queryString()}`;
    const pdfUrl = () => `${route('manager.reports.pdf')}?${queryString()}`;

    const cards = [
        {
            label: type === 'brigades' ? 'Бригад' : 'Сотрудников',
            value:
                type === 'brigades'
                    ? summary.totalBrigades ?? 0
                    : summary.totalEmployees ?? 0,
            icon: Users,
        },
        {
            label: 'Часов за период',
            value: formatHours(summary.totalHours ?? 0),
            icon: Clock,
        },
        {
            label: 'Заработано',
            value: formatMoney(summary.totalAccrued ?? 0),
            icon: CurrencyCircleDollar,
        },
        {
            label: 'Опоздания',
            value: summary.totalLates ?? 0,
            icon: WarningCircle,
        },
        {
            label: 'Остаток',
            value: formatMoney(summary.totalRemaining ?? 0),
            icon: Wallet,
        },
    ];

    const ranking = useMemo(() => {
        return [...reports]
            .map((row) => ({
                ...row,
                score: Number(row.accrued ?? 0),
                minutes: Number(row.hours ?? 0),
                days: Number(row.days ?? 0),
                employee: row.employee ?? row.brigade ?? '—',
            }))
            .sort((a, b) => {
                if (b.score !== a.score) {
                    return b.score - a.score;
                }
                return b.minutes - a.minutes;
            });
    }, [reports]);

    const top = ranking[0] ?? null;
    const maxScore = Math.max(...ranking.map((r) => r.score), 1);

    useEffect(() => {
        if (!chartOpen) {
            return undefined;
        }
        document.body.classList.add('menu-locked');
        return () => document.body.classList.remove('menu-locked');
    }, [chartOpen]);

    return (
        <AppLayout>
            <Head title="Отчёты" />

            <PageHeader
                eyebrow="Аналитика"
                title="Отчёты"
                subtitle="Сводные данные по персоналу и финансам"
                leading={
                    <button
                        type="button"
                        onClick={() => setChartOpen(true)}
                        aria-label="Рейтинг сотрудников"
                        title="Рейтинг сотрудников"
                        className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--surface)] text-[var(--ink)] shadow-soft ring-1 ring-[var(--bezel-ring)] transition-fluid hover:shadow-lift active:scale-[0.96] sm:h-14 sm:w-14"
                    >
                        <ChartBar size={22} weight="light" className="sm:hidden" />
                        <ChartBar size={24} weight="light" className="hidden sm:block" />
                    </button>
                }
                actions={
                    <div className="flex flex-wrap gap-2">
                        <a
                            href={pdfUrl()}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-2 rounded-full bg-[var(--surface)] px-5 py-2.5 text-sm font-semibold text-[var(--ink)] ring-1 ring-[var(--bezel-ring)] transition-fluid hover:bg-[var(--surface-muted)]"
                        >
                            PDF
                        </a>
                        <a
                            href={exportUrl()}
                            className="inline-flex items-center gap-2 rounded-full bg-[var(--accent)] px-5 py-2.5 text-sm font-semibold text-[var(--bg)] shadow-soft transition-fluid hover:opacity-90"
                        >
                            <DownloadSimple size={18} weight="light" />
                            Excel
                        </a>
                    </div>
                }
            />

            <BezelCard className="mb-6" padding="p-4 sm:p-5">
                <form
                    onSubmit={applyFilters}
                    className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5"
                >
                    <div>
                        <label className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
                            С
                        </label>
                        <SoftDatePicker value={from} onChange={setFrom} />
                    </div>
                    <div>
                        <label className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
                            По
                        </label>
                        <SoftDatePicker value={to} onChange={setTo} />
                    </div>
                    <div>
                        <label className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
                            Тип
                        </label>
                        <SoftSelect
                            value={type}
                            onChange={setType}
                            options={[
                                { value: 'employees', label: 'Сотрудники' },
                                { value: 'brigades', label: 'Бригады' },
                                { value: 'object', label: 'Объект' },
                                { value: 'owed', label: 'Кому должны' },
                            ]}
                        />
                    </div>
                    {type === 'object' ? (
                        <div>
                            <label className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
                                Объект
                            </label>
                            <SoftSelect
                                value={objectId}
                                onChange={setObjectId}
                                placeholder="Выберите"
                                options={[
                                    { value: '', label: 'Выберите' },
                                    ...objects.map((object) => ({
                                        value: object.id,
                                        label: object.name,
                                    })),
                                ]}
                            />
                        </div>
                    ) : (
                        <div className="hidden lg:block" />
                    )}
                    <div className="flex items-end">
                        <button
                            type="submit"
                            className="w-full rounded-full bg-[var(--surface)] px-4 py-3 text-sm font-semibold ring-1 ring-[var(--bezel-ring)]"
                        >
                            Применить
                        </button>
                    </div>
                </form>
            </BezelCard>

            <div className="mb-8 grid grid-cols-2 gap-3 md:grid-cols-5">
                {cards.map((card, i) => (
                    <motion.div
                        key={card.label}
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                            delay: i * 0.05,
                            duration: 0.7,
                            ease: [0.32, 0.72, 0, 1],
                        }}
                    >
                        <BezelCard padding="p-5">
                            <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                    <p className="text-[10px] uppercase tracking-[0.15em] text-[var(--muted)]">
                                        {card.label}
                                    </p>
                                    <p className="mt-1 break-words text-base font-bold leading-tight text-[var(--ink)] sm:text-xl">
                                        {card.value}
                                    </p>
                                </div>
                                <card.icon
                                    size={22}
                                    weight="light"
                                    className="text-[var(--accent)]"
                                />
                            </div>
                        </BezelCard>
                    </motion.div>
                ))}
            </div>

            <BezelCard padding="p-0">
                <div className="border-b border-[var(--bezel-ring)] px-4 py-4 sm:px-6">
                    <h2 className="font-bold text-[var(--ink)]">
                        {type === 'brigades'
                            ? 'Детализация по бригадам'
                            : type === 'object'
                              ? 'Детализация по объекту'
                              : type === 'owed'
                                ? 'Кому должны зарплату'
                                : 'Детализация по сотрудникам'}
                    </h2>
                    <p className="mt-1 text-sm text-[var(--muted)]">
                        {type === 'brigades'
                            ? 'Сводка начислений и выплат по бригадам'
                            : type === 'object'
                              ? 'Сотрудники с временем на выбранном объекте'
                              : 'Нажмите на сотрудника для подробного отчёта'}
                    </p>
                </div>
                {type === 'object' ? (
                    <ReportTable
                        rows={reports}
                        nameKey="employee"
                        nameLabel="Сотрудник"
                        secondaryKey="object"
                        secondaryLabel="Объект"
                        empty="Выберите объект и нажмите «Применить»"
                    />
                ) : type === 'brigades' ? (
                    <ReportTable
                        rows={reports}
                        nameKey="brigade"
                        nameLabel="Бригада"
                        secondaryKey="members"
                        secondaryLabel="Сотрудников"
                    />
                ) : (
                    <EmployeeReportList
                        reports={reports}
                        showRouteName="manager.reports.show"
                    />
                )}
            </BezelCard>

            <AnimatePresence>
                {chartOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{
                            duration: 0.35,
                            ease: [0.32, 0.72, 0, 1],
                        }}
                        className="fixed inset-0 z-50 flex items-end justify-center bg-[var(--overlay)] px-3 pb-[max(1rem,var(--safe-bottom))] backdrop-blur-sm sm:items-center sm:px-4 sm:pb-4"
                        onClick={() => setChartOpen(false)}
                    >
                        <motion.div
                            initial={{ opacity: 0, y: 40, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 24, scale: 0.98 }}
                            transition={{
                                duration: 0.45,
                                ease: [0.32, 0.72, 0, 1],
                            }}
                            className="w-full max-w-2xl rounded-[1.75rem] bg-[var(--bezel)] p-1.5 shadow-lift sm:rounded-[2rem]"
                            onClick={(e) => e.stopPropagation()}
                            role="dialog"
                            aria-modal="true"
                            aria-labelledby="ranking-title"
                        >
                            <div className="max-h-[min(85dvh,40rem)] overflow-y-auto rounded-[calc(1.75rem-0.375rem)] bg-[var(--surface)] p-5 sm:rounded-[calc(2rem-0.375rem)] sm:p-7">
                                <div className="mb-5 flex items-start justify-between gap-3">
                                    <div>
                                        <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[var(--muted)]">
                                            Рейтинг
                                        </p>
                                        <h2
                                            id="ranking-title"
                                            className="mt-1 text-xl font-extrabold tracking-tight text-[var(--ink)] sm:text-2xl"
                                        >
                                            Лучшие сотрудники
                                        </h2>
                                        <p className="mt-1 text-sm text-[var(--muted)]">
                                            По начислению за текущий период
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setChartOpen(false)}
                                        aria-label="Закрыть"
                                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--bezel)] text-[var(--muted)] transition-fluid hover:text-[var(--ink)]"
                                    >
                                        <X size={18} weight="light" />
                                    </button>
                                </div>

                                {top ? (
                                    <div className="mb-6 rounded-[1.5rem] bg-[var(--ink)] p-5 text-[var(--bg)] sm:p-6">
                                        <div className="flex items-start gap-3">
                                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--bg)]/15">
                                                <Trophy size={22} weight="light" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[var(--bg)]/60">
                                                    №1 · Лучший
                                                </p>
                                                <p className="mt-1 truncate text-xl font-extrabold tracking-tight sm:text-2xl">
                                                    {top.employee}
                                                </p>
                                                <p className="mt-1 text-sm text-[var(--bg)]/70">
                                                    {[
                                                        top.brigade,
                                                        `${top.days} смен`,
                                                        formatHours(top.minutes),
                                                    ]
                                                        .filter(Boolean)
                                                        .join(' · ')}
                                                </p>
                                                <p className="mt-3 text-2xl font-extrabold tracking-tight">
                                                    {formatMoney(top.score)}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <p className="mb-6 text-center text-[var(--muted)]">
                                        Пока нет данных для рейтинга
                                    </p>
                                )}

                                <div className="space-y-3">
                                    {ranking.map((row, i) => {
                                        const width = Math.max(
                                            6,
                                            (row.score / maxScore) * 100,
                                        );
                                        const isTop = i === 0;

                                        return (
                                            <div key={row.id ?? `${row.employee}-${i}`}>
                                                <div className="mb-1.5 flex items-baseline justify-between gap-3">
                                                    <p className="min-w-0 truncate text-sm font-semibold text-[var(--ink)]">
                                                        <span className="mr-2 text-[var(--muted)]">
                                                            {i + 1}.
                                                        </span>
                                                        {row.employee}
                                                    </p>
                                                    <p className="shrink-0 text-sm font-bold text-[var(--ink)]">
                                                        {formatMoney(row.score)}
                                                    </p>
                                                </div>
                                                <div className="h-2.5 overflow-hidden rounded-full bg-[var(--surface-muted)]">
                                                    <motion.div
                                                        initial={{
                                                            width: 0,
                                                            opacity: 0.4,
                                                        }}
                                                        animate={{
                                                            width: `${width}%`,
                                                            opacity: 1,
                                                        }}
                                                        transition={{
                                                            delay: 0.08 + i * 0.04,
                                                            duration: 0.8,
                                                            ease: [0.32, 0.72, 0, 1],
                                                        }}
                                                        className={`h-full rounded-full ${
                                                            isTop
                                                                ? 'bg-[var(--accent)]'
                                                                : 'bg-[var(--ink)]/35'
                                                        }`}
                                                    />
                                                </div>
                                                <p className="mt-1 text-[11px] text-[var(--muted)]">
                                                    {row.days ?? 0} смен ·{' '}
                                                    {formatHours(row.minutes)}
                                                </p>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </AppLayout>
    );
}
