import RequestAdvanceModal from '@/Components/RequestAdvanceModal';
import BezelCard from '@/Components/ui/BezelCard';
import IslandButton from '@/Components/ui/IslandButton';
import PageHeader from '@/Components/ui/PageHeader';
import StatPill from '@/Components/ui/StatPill';
import StatusBadge from '@/Components/ui/StatusBadge';
import AppLayout from '@/Layouts/AppLayout';
import { formatDate, formatMoney } from '@/lib/format';
import { Head } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { ArrowRight, CurrencyCircleDollar } from '@phosphor-icons/react';
import { useState } from 'react';

export default function Advances({
    advances = [],
    total = 0,
    advanceEligibility = {},
}) {
    const [modalOpen, setModalOpen] = useState(false);

    return (
        <AppLayout>
            <Head title="Авансы" />

            <PageHeader
                eyebrow="История"
                title="Авансы"
                subtitle="Все запросы и выплаты авансов"
                actions={
                    <IslandButton
                        icon={ArrowRight}
                        onClick={() => setModalOpen(true)}
                    >
                        Запросить
                    </IslandButton>
                }
            />

            <StatPill
                label="Всего получено"
                value={formatMoney(total)}
                icon={CurrencyCircleDollar}
                accent
                className="mb-6"
            />

            <BezelCard padding="p-0">
                <div className="table-scroll">
                    <table className="w-full min-w-[480px] text-left text-sm">
                        <thead>
                            <tr className="border-b border-[var(--bezel-ring)] bg-[var(--surface-muted)]">
                                <th className="px-6 py-4 text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--muted)]">
                                    Дата
                                </th>
                                <th className="px-6 py-4 text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--muted)]">
                                    Сумма
                                </th>
                                <th className="px-6 py-4 text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--muted)]">
                                    Комментарий
                                </th>
                                <th className="px-6 py-4 text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--muted)]">
                                    Статус
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {advances.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={4}
                                        className="px-6 py-12 text-center text-[var(--muted)]"
                                    >
                                        Авансов пока нет
                                    </td>
                                </tr>
                            ) : (
                                advances.map((advance, i) => (
                                    <motion.tr
                                        key={advance.id}
                                        initial={{ opacity: 0, y: 12 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{
                                            delay: i * 0.04,
                                            duration: 0.6,
                                            ease: [0.32, 0.72, 0, 1],
                                        }}
                                        className="border-b border-[var(--bezel-ring)] last:border-0"
                                    >
                                        <td className="px-6 py-4 text-[var(--ink)]">
                                            {formatDate(advance.created_at)}
                                        </td>
                                        <td className="px-6 py-4 font-semibold text-[var(--ink)]">
                                            {formatMoney(advance.amount)}
                                        </td>
                                        <td className="max-w-[200px] truncate px-6 py-4 text-[var(--muted)]">
                                            {advance.comment || '—'}
                                        </td>
                                        <td className="px-6 py-4">
                                            <StatusBadge status={advance.status} />
                                        </td>
                                    </motion.tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </BezelCard>

            <RequestAdvanceModal
                open={modalOpen}
                onClose={() => setModalOpen(false)}
                eligibility={advanceEligibility}
            />
        </AppLayout>
    );
}
