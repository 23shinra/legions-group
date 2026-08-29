import BezelCard from '@/Components/ui/BezelCard';
import MarkAdvancePaidModal from '@/Components/MarkAdvancePaidModal';
import PageHeader from '@/Components/ui/PageHeader';
import SoftDatePicker from '@/Components/ui/SoftDatePicker';
import Pagination from '@/Components/ui/Pagination';
import StatusBadge from '@/Components/ui/StatusBadge';
import AppLayout from '@/Layouts/AppLayout';
import { formatDate, formatDateTime, formatMoney } from '@/lib/format';
import { Head, router } from '@inertiajs/react';
import { motion } from 'framer-motion';
import {
    Check,
    CurrencyCircleDollar,
    DownloadSimple,
} from '@phosphor-icons/react';
import { useEffect, useState } from 'react';

const PER_PAGE = 10;

function paginateItems(items, page) {
    const start = (page - 1) * PER_PAGE;

    return items.slice(start, start + PER_PAGE);
}

function totalPagesFor(items) {
    return Math.max(1, Math.ceil(items.length / PER_PAGE));
}

function paymentMethodShort(method) {
    if (method === 'cash') {
        return 'Нал';
    }

    if (method === 'transfer') {
        return 'Карта';
    }

    return null;
}

function ReceiptButton({ href, enabled }) {
    const className =
        'inline-flex h-10 w-10 items-center justify-center rounded-full bg-[var(--surface-muted)] text-[var(--ink)] ring-1 ring-[var(--bezel-ring)] transition-fluid';

    if (enabled && href) {
        return (
            <a
                href={href}
                target="_blank"
                rel="noreferrer"
                title="Скачать квитанцию"
                className={`${className} hover:ring-[var(--accent)]`}
            >
                <DownloadSimple size={18} weight="light" />
            </a>
        );
    }

    return (
        <span
            title="Квитанция не прикреплена"
            className={`${className} cursor-not-allowed opacity-35`}
            aria-disabled="true"
        >
            <DownloadSimple size={18} weight="light" />
        </span>
    );
}

function AdvanceRow({ advance, action }) {
    const isPaid = advance.status === 'paid';
    const methodLabel = paymentMethodShort(advance.payment_method);
    const hasReceipt = Boolean(advance.payment_receipt_url);

    return (
        <div className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-[var(--ink)]">
                        {advance.user?.name ?? '—'}
                    </p>
                    <StatusBadge status={advance.status} />
                    {isPaid && methodLabel ? (
                        <span className="inline-flex rounded-full bg-[var(--bezel)] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
                            {methodLabel}
                        </span>
                    ) : null}
                </div>
                <p className="mt-1.5 text-base font-medium text-[var(--ink)]">
                    {advance.user?.position ?? '—'}
                </p>
                {advance.comment && (
                    <p className="mt-1.5 text-base text-[var(--ink)]/75">
                        {advance.comment}
                    </p>
                )}
                {isPaid && (advance.payment_note || advance.paid_at) ? (
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-[var(--muted)]">
                        {advance.payment_note && <span>{advance.payment_note}</span>}
                        {advance.paid_at && (
                            <span>{formatDateTime(advance.paid_at)}</span>
                        )}
                    </div>
                ) : null}
            </div>
            <div className="flex shrink-0 items-center gap-3">
                <p className="text-lg font-bold text-[var(--accent)]">
                    {formatMoney(advance.amount)}
                </p>
                {isPaid ? (
                    <ReceiptButton
                        href={advance.payment_receipt_url}
                        enabled={hasReceipt}
                    />
                ) : null}
                {action}
            </div>
        </div>
    );
}

export default function Advances({
    pendingAdvances = [],
    paidAdvances = [],
    filters = {},
}) {
    const [tab, setTab] = useState('pending');
    const [month, setMonth] = useState(filters.month ?? '');
    const [selectedAdvance, setSelectedAdvance] = useState(null);
    const [pendingPage, setPendingPage] = useState(1);
    const [historyPage, setHistoryPage] = useState(1);

    const pendingTotalPages = totalPagesFor(pendingAdvances);
    const historyTotalPages = totalPagesFor(paidAdvances);
    const visiblePendingAdvances = paginateItems(pendingAdvances, pendingPage);
    const visiblePaidAdvances = paginateItems(paidAdvances, historyPage);

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
            <Head title="Авансы" />

            <PageHeader
                eyebrow="Выплаты"
                title="Авансы"
            />

            <BezelCard className="mb-5" padding="p-4 sm:p-5">
                <form
                    onSubmit={(event) => {
                        event.preventDefault();
                        router.get(
                            route('accountant.advances.index'),
                            { month },
                            { preserveState: true, preserveScroll: true },
                        );
                        setTab('history');
                    }}
                    className="grid gap-3 sm:grid-cols-3"
                >
                    <div>
                        <label className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
                            Месяц выплат
                        </label>
                        <SoftDatePicker
                            mode="month"
                            value={month}
                            onChange={setMonth}
                        />
                    </div>
                    <div className="flex items-end sm:col-span-2">
                        <button
                            type="submit"
                            className="rounded-full bg-[var(--surface)] px-5 py-3 text-sm font-semibold ring-1 ring-[var(--bezel-ring)]"
                        >
                            Показать выплаченные
                        </button>
                    </div>
                </form>
            </BezelCard>

            <div className="mb-5 grid grid-cols-2 gap-2 rounded-2xl bg-[var(--surface-muted)] p-1 ring-1 ring-[var(--bezel-ring)] sm:max-w-md">
                {[
                    {
                        id: 'pending',
                        label: 'К выплате',
                        count: pendingAdvances.length,
                    },
                    {
                        id: 'history',
                        label: 'История',
                        count: paidAdvances.length,
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
                            Нет авансов, ожидающих выплаты
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
                                        ease: [0.32, 0.72, 0, 1],
                                    }}
                                >
                                    <AdvanceRow
                                        advance={advance}
                                        action={
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setSelectedAdvance(advance)
                                                }
                                                className="inline-flex items-center gap-1 rounded-full bg-[var(--accent)] px-4 py-2 text-xs font-semibold text-[var(--bg)] transition-fluid hover:opacity-90 active:scale-[0.98]"
                                            >
                                                <Check
                                                    size={14}
                                                    weight="light"
                                                />
                                                Выплатить
                                            </button>
                                        }
                                    />
                                    <p className="px-4 pb-3 text-xs font-medium text-emerald-700 [data-theme=dark]:text-emerald-400 sm:px-6">
                                        Одобрено{' '}
                                        {advance.reviewed_at
                                            ? formatDate(advance.reviewed_at)
                                            : '—'}
                                    </p>
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
                ) : paidAdvances.length === 0 ? (
                    <div className="px-6 py-12 text-center text-[var(--muted)]">
                        История выплат пока пуста
                    </div>
                ) : (
                    <>
                        <ul className="divide-y divide-[var(--bezel-ring)]">
                            {visiblePaidAdvances.map((advance, i) => (
                            <motion.li
                                key={advance.id}
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{
                                    delay: i * 0.03,
                                    duration: 0.6,
                                    ease: [0.32, 0.72, 0, 1],
                                }}
                            >
                                <AdvanceRow advance={advance} />
                            </motion.li>
                            ))}
                        </ul>
                        <Pagination
                            currentPage={historyPage}
                            totalPages={historyTotalPages}
                            onPageChange={setHistoryPage}
                        />
                    </>
                )}
            </BezelCard>

            <MarkAdvancePaidModal
                open={selectedAdvance !== null}
                onClose={() => setSelectedAdvance(null)}
                advance={selectedAdvance}
            />
        </AppLayout>
    );
}
