import BezelCard from '@/Components/ui/BezelCard';
import PageHeader from '@/Components/ui/PageHeader';
import Pagination from '@/Components/ui/Pagination';
import StatusBadge from '@/Components/ui/StatusBadge';
import AppLayout from '@/Layouts/AppLayout';
import { formatDate, formatMoney } from '@/lib/format';
import { Head } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { CurrencyCircleDollar } from '@phosphor-icons/react';
import { useEffect, useState } from 'react';

const PER_PAGE = 10;
const EASE = [0.32, 0.72, 0, 1];

function paginateItems(items, page) {
    const start = (page - 1) * PER_PAGE;

    return items.slice(start, start + PER_PAGE);
}

function totalPagesFor(items) {
    return Math.max(1, Math.ceil(items.length / PER_PAGE));
}

function historyCaption(advance) {
    if (advance.status === 'approved') {
        return {
            label: 'Одобрено',
            className: 'text-emerald-700 [data-theme=dark]:text-emerald-400',
        };
    }

    if (advance.status === 'rejected') {
        return {
            label: 'Отклонено',
            className: 'text-[var(--muted)]',
        };
    }

    if (advance.status === 'paid') {
        return {
            label: 'Выплачено',
            className: 'text-emerald-700 [data-theme=dark]:text-emerald-400',
        };
    }

    return null;
}

function AdvanceRow({ advance }) {
    return (
        <div className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-[var(--ink)]">
                        {advance.user?.name ?? '—'}
                    </p>
                    <StatusBadge status={advance.status} />
                </div>
                <p className="mt-1.5 text-base font-medium text-[var(--ink)]">
                    {advance.user?.position ?? 'Строитель'}
                </p>
                {advance.comment && (
                    <p className="mt-1.5 text-base text-[var(--ink)]/75">
                        {advance.comment}
                    </p>
                )}
                <p className="mt-2 text-xs text-[var(--muted)]">
                    {advance.worked_days} смен · заработано{' '}
                    {formatMoney(advance.accrued)} · остаток{' '}
                    {formatMoney(advance.remaining)}
                </p>
            </div>
            <div className="flex shrink-0 items-center gap-3">
                <div className="text-right">
                    <p className="text-lg font-bold text-[var(--accent)]">
                        {formatMoney(advance.amount)}
                    </p>
                    <p className="mt-0.5 text-xs text-[var(--muted)]">
                        {formatDate(advance.created_at)}
                    </p>
                </div>
            </div>
        </div>
    );
}

export default function Advances({
    brigade,
    pendingAdvances = [],
    historyAdvances = [],
}) {
    const [tab, setTab] = useState('pending');
    const [pendingPage, setPendingPage] = useState(1);
    const [historyPage, setHistoryPage] = useState(1);

    const pendingTotalPages = totalPagesFor(pendingAdvances);
    const historyTotalPages = totalPagesFor(historyAdvances);
    const visiblePendingAdvances = paginateItems(
        pendingAdvances,
        pendingPage,
    );
    const visibleHistoryAdvances = paginateItems(
        historyAdvances,
        historyPage,
    );

    useEffect(() => {
        if (pendingPage > pendingTotalPages) {
            setPendingPage(pendingTotalPages);
        }
    }, [pendingPage, pendingTotalPages]);

    useEffect(() => {
        if (historyPage > historyTotalPages) {
            setHistoryPage(historyTotalPages);
        }
    }, [historyPage, historyTotalPages]);

    return (
        <AppLayout>
            <Head title="Авансы бригады" />

            <PageHeader
                eyebrow="Бригадир"
                title="Запросы на аванс"
                subtitle={
                    brigade?.name
                        ? `${brigade.name} · только просмотр`
                        : 'Заявки ваших строителей'
                }
            />

            <div className="mb-5 grid grid-cols-2 gap-2 rounded-2xl bg-[var(--surface-muted)] p-1 ring-1 ring-[var(--bezel-ring)] sm:max-w-md">
                {[
                    {
                        id: 'pending',
                        label: 'Ожидают',
                        count: pendingAdvances.length,
                    },
                    {
                        id: 'history',
                        label: 'История',
                        count: historyAdvances.length,
                    },
                ].map(({ id, label, count }) => (
                    <button
                        key={id}
                        type="button"
                        onClick={() => setTab(id)}
                        className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition-fluid ${
                            tab === id
                                ? 'bg-[var(--accent)] text-[var(--bg)]'
                                : 'text-[var(--muted)] hover:text-[var(--ink)]'
                        }`}
                    >
                        {label}
                        <span className="ml-1.5 opacity-80">({count})</span>
                    </button>
                ))}
            </div>

            <BezelCard padding="p-0">
                {tab === 'pending' ? (
                    pendingAdvances.length === 0 ? (
                        <div className="px-6 py-12 text-center text-[var(--muted)]">
                            <CurrencyCircleDollar
                                size={32}
                                weight="light"
                                className="mx-auto mb-3 opacity-40"
                            />
                            Нет активных запросов от ваших строителей
                        </div>
                    ) : (
                        <>
                            <ul className="divide-y divide-[var(--bezel-ring)]">
                                {visiblePendingAdvances.map((advance, i) => (
                                    <motion.li
                                        key={advance.id}
                                        initial={{ opacity: 0, y: 12 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{
                                            delay: i * 0.03,
                                            duration: 0.6,
                                            ease: EASE,
                                        }}
                                    >
                                        <AdvanceRow advance={advance} />
                                    </motion.li>
                                ))}
                            </ul>
                            <Pagination
                                currentPage={pendingPage}
                                totalPages={pendingTotalPages}
                                onPageChange={setPendingPage}
                            />
                        </>
                    )
                ) : historyAdvances.length === 0 ? (
                    <div className="px-6 py-12 text-center text-[var(--muted)]">
                        История заявок пока пуста
                    </div>
                ) : (
                    <>
                        <ul className="divide-y divide-[var(--bezel-ring)]">
                            {visibleHistoryAdvances.map((advance, i) => {
                                const caption = historyCaption(advance);

                                return (
                                    <motion.li
                                        key={advance.id}
                                        initial={{ opacity: 0, y: 12 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{
                                            delay: i * 0.03,
                                            duration: 0.6,
                                            ease: EASE,
                                        }}
                                    >
                                        <AdvanceRow advance={advance} />
                                        {caption && (
                                            <p
                                                className={`px-4 pb-3 text-xs font-medium sm:px-6 ${caption.className}`}
                                            >
                                                {caption.label}{' '}
                                                {advance.reviewed_at
                                                    ? formatDate(
                                                          advance.reviewed_at,
                                                      )
                                                    : advance.paid_at
                                                      ? formatDate(
                                                            advance.paid_at,
                                                        )
                                                      : '—'}
                                            </p>
                                        )}
                                    </motion.li>
                                );
                            })}
                        </ul>
                        <Pagination
                            currentPage={historyPage}
                            totalPages={historyTotalPages}
                            onPageChange={setHistoryPage}
                        />
                    </>
                )}
            </BezelCard>
        </AppLayout>
    );
}
