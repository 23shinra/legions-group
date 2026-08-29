import BezelCard from '@/Components/ui/BezelCard';
import IslandButton from '@/Components/ui/IslandButton';
import PageHeader from '@/Components/ui/PageHeader';
import StatPill from '@/Components/ui/StatPill';
import AppLayout from '@/Layouts/AppLayout';
import { formatMoney } from '@/lib/format';
import { Head, Link } from '@inertiajs/react';
import { motion } from 'framer-motion';
import {
    ArrowRight,
    Clock,
    CurrencyCircleDollar,
    Wallet,
} from '@phosphor-icons/react';

export default function Dashboard({
    stats = {},
    pendingAdvances = [],
    recentPayments = [],
}) {
    return (
        <AppLayout>
            <Head title="Финансы" />

            <PageHeader
                eyebrow="Бухгалтерия"
                title="Финансовый обзор"
                subtitle="Контроль авансов, выплат и начислений"
            />

            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                <StatPill
                    label="К выплате"
                    value={formatMoney(stats.totalRemaining ?? 0)}
                    icon={Wallet}
                    accent
                    delay={0}
                    href={route('accountant.payments.index')}
                />
                <StatPill
                    label="Ожидают выплаты"
                    value={stats.pendingAdvancesCount ?? 0}
                    icon={CurrencyCircleDollar}
                    delay={0.05}
                    href={route('accountant.advances.index')}
                />
                <StatPill
                    label="Сумма авансов"
                    value={formatMoney(stats.pendingAdvancesSum ?? 0)}
                    icon={CurrencyCircleDollar}
                    delay={0.1}
                    href={route('accountant.advances.index')}
                />
                <StatPill
                    label="Выплачено (мес.)"
                    value={formatMoney(stats.paidThisMonth ?? 0)}
                    icon={Clock}
                    delay={0.15}
                    href={route('accountant.payments.index')}
                />
            </div>

            <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
                <BezelCard padding="p-0">
                    <div className="flex items-center justify-between border-b border-[var(--bezel-ring)] px-6 py-4">
                        <h2 className="font-bold">Одобренные авансы</h2>
                        <Link
                            href={route('accountant.advances.index')}
                            className="inline-flex items-center gap-1 text-sm font-semibold text-[var(--accent)]"
                        >
                            Все
                            <ArrowRight size={14} weight="light" />
                        </Link>
                    </div>
                    <ul className="divide-y divide-[var(--bezel-ring)]">
                        {pendingAdvances.length === 0 ? (
                            <li className="px-6 py-8 text-center text-[var(--muted)]">
                                Нет ожидающих выплат
                            </li>
                        ) : (
                            pendingAdvances.slice(0, 5).map((advance, i) => (
                                <motion.li
                                    key={advance.id}
                                    initial={{ opacity: 0, y: 12 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.04, duration: 0.6, ease: [0.32, 0.72, 0, 1] }}
                                    className="flex items-center justify-between px-6 py-4"
                                >
                                    <div>
                                        <p className="font-semibold">{advance.user?.name}</p>
                                        <p className="text-sm text-[var(--muted)]">{advance.comment || '—'}</p>
                                    </div>
                                    <p className="font-bold text-[var(--accent)]">
                                        {formatMoney(advance.amount)}
                                    </p>
                                </motion.li>
                            ))
                        )}
                    </ul>
                </BezelCard>

                <BezelCard padding="p-0">
                    <div className="flex items-center justify-between border-b border-[var(--bezel-ring)] px-6 py-4">
                        <h2 className="font-bold">Последние выплаты</h2>
                        <Link
                            href={route('accountant.payments.index')}
                            className="inline-flex items-center gap-1 text-sm font-semibold text-[var(--accent)]"
                        >
                            Все
                            <ArrowRight size={14} weight="light" />
                        </Link>
                    </div>
                    <ul className="divide-y divide-[var(--bezel-ring)]">
                        {recentPayments.length === 0 ? (
                            <li className="px-6 py-8 text-center text-[var(--muted)]">
                                Выплат пока нет
                            </li>
                        ) : (
                            recentPayments.slice(0, 5).map((payment, i) => (
                                <motion.li
                                    key={payment.id}
                                    initial={{ opacity: 0, y: 12 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.04, duration: 0.6, ease: [0.32, 0.72, 0, 1] }}
                                    className="flex items-center justify-between px-6 py-4"
                                >
                                    <div>
                                        <p className="font-semibold">{payment.user?.name}</p>
                                        <p className="text-sm text-[var(--muted)]">{payment.period ?? '—'}</p>
                                    </div>
                                    <p className="font-bold">{formatMoney(payment.amount)}</p>
                                </motion.li>
                            ))
                        )}
                    </ul>
                </BezelCard>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
                <IslandButton href={route('accountant.advances.index')}>
                    Выплатить авансы
                </IslandButton>
                <Link
                    href={route('accountant.payments.index')}
                    className="rounded-full bg-[var(--surface)] px-5 py-2.5 text-sm font-semibold text-[var(--ink)] shadow-soft ring-1 ring-[var(--bezel-ring)] transition-fluid hover:shadow-lift"
                >
                    Выплата зарплаты
                </Link>
                <Link
                    href={route('accountant.reports.index')}
                    className="rounded-full bg-[var(--surface)] px-5 py-2.5 text-sm font-semibold text-[var(--ink)] shadow-soft ring-1 ring-[var(--bezel-ring)] transition-fluid hover:shadow-lift"
                >
                    Отчёты
                </Link>
            </div>
        </AppLayout>
    );
}
