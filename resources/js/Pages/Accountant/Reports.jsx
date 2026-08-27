import BezelCard from '@/Components/ui/BezelCard';
import PageHeader from '@/Components/ui/PageHeader';
import AppLayout from '@/Layouts/AppLayout';
import { formatHours, formatMoney } from '@/lib/format';
import { Head } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { ChartBar, CurrencyCircleDollar, Wallet } from '@phosphor-icons/react';

export default function Reports({ summary = {}, rows = [] }) {
    const cards = [
        { label: 'Начислено', value: formatMoney(summary.totalAccrued ?? 0), icon: Wallet },
        { label: 'Авансы', value: formatMoney(summary.totalAdvances ?? 0), icon: CurrencyCircleDollar },
        { label: 'Выплачено', value: formatMoney(summary.totalPaid ?? 0), icon: ChartBar },
        { label: 'К выплате', value: formatMoney(summary.totalRemaining ?? 0), icon: Wallet },
    ];

    return (
        <AppLayout>
            <Head title="Отчёты" />

            <PageHeader
                eyebrow="Финансы"
                title="Финансовые отчёты"
                subtitle={`Часов за период: ${formatHours(summary.totalHours ?? 0)}`}
            />

            <div className="mb-8 grid grid-cols-2 gap-3 md:grid-cols-4">
                {cards.map((card, i) => (
                    <motion.div
                        key={card.label}
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05, duration: 0.7, ease: [0.32, 0.72, 0, 1] }}
                    >
                        <BezelCard padding="p-5">
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="text-[10px] uppercase tracking-[0.15em] text-[var(--muted)]">
                                        {card.label}
                                    </p>
                                    <p className="mt-1 text-xl font-bold">{card.value}</p>
                                </div>
                                <card.icon size={22} weight="light" className="text-[var(--accent)]" />
                            </div>
                        </BezelCard>
                    </motion.div>
                ))}
            </div>

            <BezelCard padding="p-0">
                <div className="border-b border-[var(--bezel-ring)] px-6 py-4">
                    <h2 className="font-bold">По сотрудникам</h2>
                </div>
                <div className="table-scroll">
                    <table className="w-full min-w-[640px] text-left text-sm">
                        <thead>
                            <tr className="border-b border-[var(--bezel-ring)] bg-[var(--surface-muted)]">
                                <th className="px-6 py-4 text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--muted)]">
                                    Сотрудник
                                </th>
                                <th className="px-6 py-4 text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--muted)]">
                                    Часы
                                </th>
                                <th className="px-6 py-4 text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--muted)]">
                                    Начислено
                                </th>
                                <th className="px-6 py-4 text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--muted)]">
                                    Авансы
                                </th>
                                <th className="px-6 py-4 text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--muted)]">
                                    Выплачено
                                </th>
                                <th className="px-6 py-4 text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--muted)]">
                                    К выплате
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-[var(--muted)]">
                                        Нет данных
                                    </td>
                                </tr>
                            ) : (
                                rows.map((row, i) => (
                                    <motion.tr
                                        key={row.id ?? i}
                                        initial={{ opacity: 0, y: 12 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.03, duration: 0.6, ease: [0.32, 0.72, 0, 1] }}
                                        className="border-b border-[var(--bezel-ring)] last:border-0"
                                    >
                                        <td className="px-6 py-4 font-semibold">{row.user?.name ?? row.name}</td>
                                        <td className="px-6 py-4">{formatHours(row.hours ?? 0)}</td>
                                        <td className="px-6 py-4">{formatMoney(row.accrued ?? 0)}</td>
                                        <td className="px-6 py-4">{formatMoney(row.advances ?? 0)}</td>
                                        <td className="px-6 py-4">{formatMoney(row.paid ?? 0)}</td>
                                        <td className="px-6 py-4 font-bold text-[var(--accent)]">
                                            {formatMoney(row.remaining ?? 0)}
                                        </td>
                                    </motion.tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </BezelCard>
        </AppLayout>
    );
}
