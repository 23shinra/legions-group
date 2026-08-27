import BezelCard from '@/Components/ui/BezelCard';
import PageHeader from '@/Components/ui/PageHeader';
import StatusBadge from '@/Components/ui/StatusBadge';
import AppLayout from '@/Layouts/AppLayout';
import { formatDate, formatMoney } from '@/lib/format';
import { Head, router } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { Check, CurrencyCircleDollar } from '@phosphor-icons/react';

export default function Advances({ advances = [] }) {
    const handleMarkPaid = (id) => {
        router.post(route('accountant.advances.paid', id));
    };

    const approved = advances.filter((a) => a.status === 'approved');

    return (
        <AppLayout>
            <Head title="Авансы" />

            <PageHeader
                eyebrow="Выплаты"
                title="Авансы к выплате"
                subtitle={`${approved.length} одобрено, ожидают выплаты`}
            />

            <BezelCard padding="p-0">
                <div className="table-scroll">
                    <table className="w-full min-w-[560px] text-left text-sm">
                        <thead>
                            <tr className="border-b border-[var(--bezel-ring)] bg-[var(--surface-muted)]">
                                <th className="px-6 py-4 text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--muted)]">
                                    Дата
                                </th>
                                <th className="px-6 py-4 text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--muted)]">
                                    Сотрудник
                                </th>
                                <th className="px-6 py-4 text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--muted)]">
                                    Сумма
                                </th>
                                <th className="px-6 py-4 text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--muted)]">
                                    Статус
                                </th>
                                <th className="px-6 py-4 text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--muted)]">
                                    Действие
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {advances.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-[var(--muted)]">
                                        <CurrencyCircleDollar size={32} weight="light" className="mx-auto mb-3 opacity-40" />
                                        Авансов нет
                                    </td>
                                </tr>
                            ) : (
                                advances.map((advance, i) => (
                                    <motion.tr
                                        key={advance.id}
                                        initial={{ opacity: 0, y: 12 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.03, duration: 0.6, ease: [0.32, 0.72, 0, 1] }}
                                        className="border-b border-[var(--bezel-ring)] last:border-0"
                                    >
                                        <td className="px-6 py-4">{formatDate(advance.created_at)}</td>
                                        <td className="px-6 py-4 font-semibold">
                                            {advance.user?.name ?? '—'}
                                        </td>
                                        <td className="px-6 py-4 font-bold text-[var(--accent)]">
                                            {formatMoney(advance.amount)}
                                        </td>
                                        <td className="px-6 py-4">
                                            <StatusBadge status={advance.status} />
                                        </td>
                                        <td className="px-6 py-4">
                                            {advance.status === 'approved' ? (
                                                <button
                                                    type="button"
                                                    onClick={() => handleMarkPaid(advance.id)}
                                                    className="inline-flex items-center gap-1 rounded-full bg-[var(--accent)] px-4 py-2 text-xs font-semibold text-white transition-fluid hover:bg-[var(--accent-light)] active:scale-[0.98]"
                                                >
                                                    <Check size={14} weight="light" />
                                                    Отметить выплаченным
                                                </button>
                                            ) : (
                                                <span className="text-xs text-[var(--muted)]">—</span>
                                            )}
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
