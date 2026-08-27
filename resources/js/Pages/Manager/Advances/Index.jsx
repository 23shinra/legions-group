import BezelCard from '@/Components/ui/BezelCard';
import PageHeader from '@/Components/ui/PageHeader';
import StatusBadge from '@/Components/ui/StatusBadge';
import AppLayout from '@/Layouts/AppLayout';
import { formatDate, formatMoney } from '@/lib/format';
import { Head, Link, router } from '@inertiajs/react';
import { motion } from 'framer-motion';
import {
    Check,
    Clock,
    CurrencyCircleDollar,
    X,
} from '@phosphor-icons/react';
import { useState } from 'react';

export default function Index({ advances = [] }) {
    const [busyId, setBusyId] = useState(null);

    const handleApprove = (id) => {
        setBusyId(id);
        router.post(
            route('manager.advances.approve', id),
            {},
            { onFinish: () => setBusyId(null) },
        );
    };

    const handleReject = (id) => {
        setBusyId(id);
        router.post(
            route('manager.advances.reject', id),
            {},
            { onFinish: () => setBusyId(null) },
        );
    };

    const pending = advances.filter((a) => a.status === 'pending');
    const others = advances.filter((a) => a.status !== 'pending');

    return (
        <AppLayout>
            <Head title="Заявки на аванс" />

            <PageHeader
                eyebrow="Согласование"
                title="Заявки на аванс"
                subtitle={`${pending.length} ожидают решения`}
            />

            {pending.length === 0 && advances.length === 0 ? (
                <BezelCard padding="p-12">
                    <div className="text-center">
                        <CurrencyCircleDollar
                            size={36}
                            weight="light"
                            className="mx-auto mb-3 text-[var(--muted)] opacity-40"
                        />
                        <p className="text-[var(--muted)]">Заявок пока нет</p>
                    </div>
                </BezelCard>
            ) : (
                <div className="space-y-8">
                    {pending.length > 0 && (
                        <section>
                            <p className="mb-4 text-[10px] font-medium uppercase tracking-[0.2em] text-[var(--muted)]">
                                Ожидают решения
                            </p>
                            <div className="space-y-3">
                                {pending.map((advance, i) => (
                                    <AdvanceRow
                                        key={advance.id}
                                        advance={advance}
                                        delay={i * 0.04}
                                        busy={busyId === advance.id}
                                        onApprove={() =>
                                            handleApprove(advance.id)
                                        }
                                        onReject={() =>
                                            handleReject(advance.id)
                                        }
                                    />
                                ))}
                            </div>
                        </section>
                    )}

                    {others.length > 0 && (
                        <section>
                            <p className="mb-4 text-[10px] font-medium uppercase tracking-[0.2em] text-[var(--muted)]">
                                История
                            </p>
                            <div className="space-y-3">
                                {others.map((advance, i) => (
                                    <AdvanceRow
                                        key={advance.id}
                                        advance={advance}
                                        delay={i * 0.03}
                                        readOnly
                                    />
                                ))}
                            </div>
                        </section>
                    )}
                </div>
            )}
        </AppLayout>
    );
}

function AdvanceRow({
    advance,
    delay = 0,
    busy = false,
    readOnly = false,
    onApprove,
    onReject,
}) {
    const canAct = !readOnly && advance.status === 'pending';

    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay, duration: 0.65, ease: [0.32, 0.72, 0, 1] }}
        >
            <BezelCard padding="p-0" innerClassName="p-0 overflow-hidden">
                <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:gap-5 sm:p-5">
                    <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                            {advance.user?.id ? (
                                <Link
                                    href={route(
                                        'manager.employees.show',
                                        advance.user.id,
                                    )}
                                    className="truncate text-base font-extrabold tracking-tight text-[var(--ink)] transition-fluid hover:opacity-70 sm:text-lg"
                                >
                                    {advance.user.name}
                                </Link>
                            ) : (
                                <p className="truncate text-base font-extrabold text-[var(--ink)] sm:text-lg">
                                    —
                                </p>
                            )}
                            <StatusBadge status={advance.status} />
                        </div>
                        <p className="mt-1 text-xs text-[var(--muted)] sm:text-sm">
                            {[
                                advance.user?.brigade,
                                advance.user?.position,
                                formatDate(advance.created_at),
                            ]
                                .filter(Boolean)
                                .join(' · ')}
                        </p>
                        {advance.comment && (
                            <p className="mt-2 line-clamp-2 text-sm text-[var(--muted)]">
                                {advance.comment}
                            </p>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-2 sm:flex sm:shrink-0 sm:items-center sm:gap-3">
                        <div className="rounded-2xl bg-[var(--surface-muted)] px-3.5 py-2.5 sm:min-w-[8.5rem]">
                            <p className="text-[10px] uppercase tracking-[0.14em] text-[var(--muted)]">
                                Запрос
                            </p>
                            <p className="mt-0.5 text-base font-extrabold tracking-tight text-[var(--ink)] sm:text-lg">
                                {formatMoney(advance.amount)}
                            </p>
                        </div>
                        <div className="rounded-2xl bg-[var(--surface-muted)] px-3.5 py-2.5 sm:min-w-[9.5rem]">
                            <p className="flex items-center gap-1 text-[10px] uppercase tracking-[0.14em] text-[var(--muted)]">
                                <Clock size={12} weight="light" />
                                Смены
                            </p>
                            <p className="mt-0.5 text-base font-extrabold tracking-tight text-[var(--ink)] sm:text-lg">
                                {advance.worked_days ?? 0}
                                <span className="ml-1 text-sm font-semibold text-[var(--muted)]">
                                    = {formatMoney(advance.accrued ?? 0)}
                                </span>
                            </p>
                        </div>
                    </div>

                    {canAct ? (
                        <div className="flex shrink-0 items-center gap-2 self-end sm:self-center">
                            <button
                                type="button"
                                onClick={onApprove}
                                disabled={busy}
                                aria-label="Одобрить"
                                title="Одобрить"
                                className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-700 ring-1 ring-emerald-500/30 transition-fluid hover:bg-emerald-500/25 active:scale-[0.96] disabled:opacity-50"
                            >
                                <Check size={20} weight="light" />
                            </button>
                            <button
                                type="button"
                                onClick={onReject}
                                disabled={busy}
                                aria-label="Отклонить"
                                title="Отклонить"
                                className="flex h-11 w-11 items-center justify-center rounded-full bg-red-500/15 text-red-700 ring-1 ring-red-500/30 transition-fluid hover:bg-red-500/25 active:scale-[0.96] disabled:opacity-50"
                            >
                                <X size={20} weight="light" />
                            </button>
                        </div>
                    ) : (
                        <div className="hidden w-[6.25rem] shrink-0 sm:block" />
                    )}
                </div>
            </BezelCard>
        </motion.div>
    );
}
