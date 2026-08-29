import EmployeeReportList from '@/Components/Reports/EmployeeReportList';
import BezelCard from '@/Components/ui/BezelCard';
import PageHeader from '@/Components/ui/PageHeader';
import SoftDatePicker from '@/Components/ui/SoftDatePicker';
import AppLayout from '@/Layouts/AppLayout';
import { formatHours, formatMoney } from '@/lib/format';
import { Head, router } from '@inertiajs/react';
import { motion } from 'framer-motion';
import {
    ChartBar,
    Clock,
    DownloadSimple,
    Wallet,
} from '@phosphor-icons/react';
import { useState } from 'react';

export default function Reports({ summary = {}, rows = [], filters = {} }) {
    const [from, setFrom] = useState(filters.from ?? '');
    const [to, setTo] = useState(filters.to ?? '');

    const cards = [
        { label: 'Часы', value: formatHours(summary.totalHours ?? 0), icon: Clock },
        { label: 'Заработано', value: formatMoney(summary.totalAccrued ?? 0), icon: Wallet },
        { label: 'Опоздания', value: summary.totalLates ?? 0, icon: ChartBar },
        { label: 'Остаток', value: formatMoney(summary.totalRemaining ?? 0), icon: Wallet },
    ];

    const apply = (event) => {
        event.preventDefault();
        router.get(
            route('accountant.reports.index'),
            { from, to },
            { preserveState: true, preserveScroll: true },
        );
    };

    const query = new URLSearchParams({
        from: from || '',
        to: to || '',
    }).toString();
    const exportHref = `${route('accountant.reports.export')}?${query}`;
    const pdfHref = `${route('accountant.reports.pdf')}?${query}`;

    return (
        <AppLayout>
            <Head title="Отчёты" />

            <PageHeader
                eyebrow="Финансы"
                title="Финансовые отчёты"
                subtitle={`Часов за период: ${formatHours(summary.totalHours ?? 0)}`}
                actions={
                    <div className="flex flex-wrap gap-2">
                        <a
                            href={pdfHref}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-2 rounded-full bg-[var(--surface)] px-5 py-2.5 text-sm font-semibold text-[var(--ink)] ring-1 ring-[var(--bezel-ring)]"
                        >
                            PDF
                        </a>
                        <a
                            href={exportHref}
                            className="inline-flex items-center gap-2 rounded-full bg-[var(--accent)] px-5 py-2.5 text-sm font-semibold text-[var(--bg)] shadow-soft transition-fluid hover:opacity-90"
                        >
                            <DownloadSimple size={18} weight="light" />
                            Excel
                        </a>
                    </div>
                }
            />

            <BezelCard className="mb-6" padding="p-4 sm:p-5">
                <form onSubmit={apply} className="grid gap-3 sm:grid-cols-3">
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

            <div className="mb-8 grid grid-cols-2 gap-3 md:grid-cols-4">
                {cards.map((card, i) => (
                    <motion.div
                        key={card.label}
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05, duration: 0.7, ease: [0.32, 0.72, 0, 1] }}
                    >
                        <BezelCard padding="p-5">
                            <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                    <p className="text-[10px] uppercase tracking-[0.15em] text-[var(--muted)]">
                                        {card.label}
                                    </p>
                                    <p className="mt-1 break-words text-base font-bold leading-tight sm:text-xl">
                                        {card.value}
                                    </p>
                                </div>
                                <card.icon size={22} weight="light" className="shrink-0 text-[var(--accent)]" />
                            </div>
                        </BezelCard>
                    </motion.div>
                ))}
            </div>

            <BezelCard padding="p-0">
                <div className="border-b border-[var(--bezel-ring)] px-4 py-4 sm:px-6">
                    <h2 className="font-bold">По сотрудникам</h2>
                    <p className="mt-1 text-sm text-[var(--muted)]">
                        Нажмите на сотрудника для подробного отчёта
                    </p>
                </div>
                <EmployeeReportList
                    reports={rows}
                    showRouteName="accountant.reports.show"
                />
            </BezelCard>
        </AppLayout>
    );
}
