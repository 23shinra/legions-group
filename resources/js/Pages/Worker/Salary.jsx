import BezelCard from '@/Components/ui/BezelCard';
import PageHeader from '@/Components/ui/PageHeader';
import StatPill from '@/Components/ui/StatPill';
import AppLayout from '@/Layouts/AppLayout';
import { formatHours, formatMoney } from '@/lib/format';
import { Head } from '@inertiajs/react';
import { motion } from 'framer-motion';
import {
    ArrowDown,
    ArrowUp,
    CheckCircle,
    MinusCircle,
    Wallet,
} from '@phosphor-icons/react';

export default function Salary({ balance = {} }) {
    const rows = [
        {
            label: 'Начислено',
            value: balance.accrued,
            icon: ArrowUp,
            accent: false,
        },
        {
            label: 'Авансы',
            value: balance.advances,
            icon: ArrowDown,
            accent: false,
        },
        {
            label: 'Выплачено',
            value: balance.paid,
            icon: CheckCircle,
            accent: false,
        },
        {
            label: 'К выплате',
            value: balance.remaining,
            icon: Wallet,
            accent: true,
        },
    ];

    return (
        <AppLayout>
            <Head title="Зарплата" />

            <PageHeader
                eyebrow="Финансы"
                title="Зарплата"
                subtitle="Детализация начислений, авансов и выплат"
            />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: [0.32, 0.72, 0, 1] }}
                className="mb-6 grid grid-cols-2 gap-3"
            >
                <StatPill
                    label="Смен"
                    value={
                        balance.work_days
                            ? `${balance.days ?? 0} / ${balance.work_days}`
                            : String(balance.days ?? 0)
                    }
                />
                <StatPill
                    label="Часов"
                    value={formatHours(balance.minutes ?? 0)}
                    icon={Wallet}
                />
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: [0.32, 0.72, 0, 1] }}
                className="grid grid-cols-1 gap-4 sm:grid-cols-2"
            >
                {rows.map((row, i) => (
                    <StatPill
                        key={row.label}
                        label={row.label}
                        value={formatMoney(row.value)}
                        icon={row.icon}
                        accent={row.accent}
                        delay={i * 0.05}
                    />
                ))}
            </motion.div>

            <BezelCard className="mt-6" padding="p-6 md:p-8">
                <h2 className="mb-6 text-lg font-bold text-[var(--ink)]">
                    Расчёт
                </h2>
                <dl className="space-y-4">
                    <div className="flex items-center justify-between gap-4 border-b border-[var(--bezel-ring)] pb-4">
                        <dt className="flex items-center gap-2 text-[var(--muted)]">
                            <ArrowUp size={18} weight="light" />
                            Начислено за период
                        </dt>
                        <dd className="font-bold text-[var(--ink)]">
                            {formatMoney(balance.accrued)}
                        </dd>
                    </div>
                    <div className="flex items-center justify-between gap-4 border-b border-[var(--bezel-ring)] pb-4">
                        <dt className="flex items-center gap-2 text-[var(--muted)]">
                            <MinusCircle size={18} weight="light" />
                            Удержано (авансы)
                        </dt>
                        <dd className="font-bold text-[var(--muted)]">
                            − {formatMoney(balance.advances)}
                        </dd>
                    </div>
                    <div className="flex items-center justify-between gap-4 border-b border-[var(--bezel-ring)] pb-4">
                        <dt className="flex items-center gap-2 text-[var(--muted)]">
                            <CheckCircle size={18} weight="light" />
                            Уже выплачено
                        </dt>
                        <dd className="font-bold text-[var(--ink)]">
                            {formatMoney(balance.paid)}
                        </dd>
                    </div>
                    <div className="flex items-center justify-between gap-4 pt-2">
                        <dt className="flex items-center gap-2 text-lg font-bold text-[var(--ink)]">
                            <Wallet size={20} weight="light" />
                            К выплате
                        </dt>
                        <dd className="text-2xl font-extrabold text-[var(--accent)]">
                            {formatMoney(balance.remaining)}
                        </dd>
                    </div>
                    {balance.days_left != null && (
                        <div className="mt-4 rounded-2xl bg-[var(--surface-muted)] p-4 text-sm text-[var(--muted)]">
                            Осталось смен на объекте:{' '}
                            <span className="font-semibold text-[var(--ink)]">
                                {balance.days_left}
                            </span>
                            {balance.projected_remaining > 0 && (
                                <>
                                    {' '}
                                    · ещё можно заработать{' '}
                                    <span className="font-semibold text-[var(--accent)]">
                                        {formatMoney(balance.projected_remaining)}
                                    </span>
                                </>
                            )}
                        </div>
                    )}
                </dl>
            </BezelCard>
        </AppLayout>
    );
}
