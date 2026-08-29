import BezelCard from '@/Components/ui/BezelCard';
import PageHeader from '@/Components/ui/PageHeader';
import Pagination from '@/Components/ui/Pagination';
import SoftDatePicker from '@/Components/ui/SoftDatePicker';
import SoftSelect from '@/Components/ui/SoftSelect';
import StatusBadge from '@/Components/ui/StatusBadge';
import AppLayout from '@/Layouts/AppLayout';
import { formatDate, formatHours, formatMoney } from '@/lib/format';
import { Head, router } from '@inertiajs/react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, CurrencyCircleDollar, DownloadSimple, X } from '@phosphor-icons/react';
import { useEffect, useRef, useState } from 'react';

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
            className:
                'text-emerald-700 [data-theme=dark]:text-emerald-400',
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
            className:
                'text-emerald-700 [data-theme=dark]:text-emerald-400',
        };
    }

    return null;
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

function Fact({ label, value, accent = false }) {
    return (
        <div className="min-w-0 rounded-2xl bg-[var(--surface-muted)] px-3 py-2.5 ring-1 ring-[var(--bezel-ring)]">
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
                {label}
            </p>
            <p
                className={`mt-1 truncate text-sm font-bold sm:text-base ${
                    accent ? 'text-[var(--accent)]' : 'text-[var(--ink)]'
                }`}
            >
                {value}
            </p>
        </div>
    );
}

function AdvanceFacts({ advance }) {
    const remaining = Number(advance.remaining ?? 0);
    const amount = Number(advance.amount ?? 0);
    const leftover = remaining - amount;
    const isPending = advance.status === 'pending';
    const overAsk = isPending && amount > remaining;

    return (
        <div className="mt-3 space-y-2.5">
            <div className="grid grid-cols-2 gap-2">
                <Fact
                    label="Часов"
                    value={formatHours(advance.worked_minutes ?? 0)}
                />
                <Fact
                    label="Смен"
                    value={String(advance.worked_days ?? 0)}
                />
                <Fact
                    label="Заработано"
                    value={formatMoney(advance.accrued ?? 0)}
                    accent
                />
                <Fact
                    label="Есть сейчас"
                    value={formatMoney(remaining)}
                    accent
                />
            </div>
            {isPending ? (
                <p
                    className={`text-xs font-medium sm:text-sm ${
                        overAsk
                            ? 'text-red-600 [data-theme=dark]:text-red-400'
                            : remaining <= 0
                              ? 'text-amber-700 [data-theme=dark]:text-amber-300'
                              : 'text-emerald-700 [data-theme=dark]:text-emerald-400'
                    }`}
                >
                    {overAsk
                        ? `Запросил больше, чем есть. Не хватает ${formatMoney(amount - remaining)}.`
                        : remaining <= 0
                          ? 'По факту зарплаты нет — аванс лучше не давать.'
                          : `После аванса останется ${formatMoney(leftover)}.`}
                </p>
            ) : (
                <p className="text-xs text-[var(--muted)] sm:text-sm">
                    Выдано авансами {formatMoney(advance.advances ?? 0)}
                    {Number(advance.paid ?? 0) > 0
                        ? ` · выплачено ${formatMoney(advance.paid)}`
                        : ''}
                </p>
            )}
        </div>
    );
}

function AdvanceRow({ advance, action }) {
    const isPaid = advance.status === 'paid';
    const methodLabel = paymentMethodShort(advance.payment_method);
    const hasReceipt = Boolean(advance.payment_receipt_url);

    return (
        <div className="flex flex-col gap-4 px-4 py-4 sm:px-6">
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                        <p className="text-base font-semibold text-[var(--ink)]">
                            {advance.user?.name ?? '—'}
                        </p>
                        <StatusBadge status={advance.status} />
                        {isPaid && methodLabel ? (
                            <span className="inline-flex rounded-full bg-[var(--bezel)] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
                                {methodLabel}
                            </span>
                        ) : null}
                    </div>
                    <p className="mt-1 text-sm text-[var(--muted)]">
                        {[advance.user?.position, advance.user?.brigade]
                            .filter(Boolean)
                            .join(' · ') || '—'}
                    </p>
                    {advance.comment && (
                        <p className="mt-1.5 text-sm text-[var(--ink)]/80">
                            {advance.comment}
                        </p>
                    )}
                </div>
                <div className="shrink-0 text-right">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
                        Запросил
                    </p>
                    <p className="mt-1 text-lg font-bold text-[var(--accent)]">
                        {formatMoney(advance.amount)}
                    </p>
                    <p className="mt-0.5 text-xs text-[var(--muted)]">
                        {formatDate(advance.created_at)}
                    </p>
                </div>
            </div>

            <AdvanceFacts advance={advance} />

            {(action || isPaid) && (
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
                    {isPaid ? (
                        <div className="flex justify-end">
                            <ReceiptButton
                                href={advance.payment_receipt_url}
                                enabled={hasReceipt}
                            />
                        </div>
                    ) : null}
                    {action}
                </div>
            )}
        </div>
    );
}

export default function Index({
    pendingAdvances = [],
    historyAdvances = [],
    filters = {},
}) {
    const [tab, setTab] = useState('pending');
    const [month, setMonth] = useState(filters.month ?? '');
    const [status, setStatus] = useState(filters.status ?? '');
    const [busyId, setBusyId] = useState(null);
    const [pendingPage, setPendingPage] = useState(1);
    const [historyPage, setHistoryPage] = useState(1);
    const [toast, setToast] = useState(null);
    const toastTimer = useRef(null);

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
        return () => {
            if (toastTimer.current) {
                clearTimeout(toastTimer.current);
            }
        };
    }, []);

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

    const showToast = (tone, label) => {
        if (toastTimer.current) {
            clearTimeout(toastTimer.current);
        }
        setToast({ tone, label });
        toastTimer.current = setTimeout(() => setToast(null), 2600);
    };

    const decide = (id, decision) => {
        if (busyId) {
            return;
        }

        setBusyId(id);

        const routeName =
            decision === 'approve'
                ? 'manager.advances.approve'
                : 'manager.advances.reject';

        router.post(
            route(routeName, id),
            {},
            {
                preserveScroll: true,
                onSuccess: () => {
                    showToast(
                        decision === 'approve' ? 'success' : 'danger',
                        decision === 'approve' ? 'Одобрено' : 'Отклонено',
                    );
                },
                onFinish: () => setBusyId(null),
            },
        );
    };

    return (
        <AppLayout>
            <Head title="Заявки на аванс" />

            <PageHeader
                eyebrow="Согласование"
                title="Заявки на аванс"
                subtitle="Часы и зарплата по факту — чтобы решить, давать аванс или нет"
            />

            <BezelCard className="mb-5" padding="p-4 sm:p-5">
                <form
                    onSubmit={(event) => {
                        event.preventDefault();
                        router.get(
                            route('manager.advances.index'),
                            { month, status },
                            { preserveState: true, preserveScroll: true },
                        );
                        setTab('history');
                    }}
                    className="grid gap-3 sm:grid-cols-3"
                >
                    <div>
                        <label className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
                            Месяц
                        </label>
                        <SoftDatePicker
                            mode="month"
                            value={month}
                            onChange={setMonth}
                        />
                    </div>
                    <div>
                        <label className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
                            Статус
                        </label>
                        <SoftSelect
                            value={status}
                            onChange={setStatus}
                            options={[
                                { value: '', label: 'Все в истории' },
                                { value: 'approved', label: 'Одобрено' },
                                { value: 'rejected', label: 'Отклонено' },
                                { value: 'paid', label: 'Выплачено' },
                            ]}
                        />
                    </div>
                    <div className="flex items-end">
                        <button
                            type="submit"
                            className="min-h-12 w-full rounded-full bg-[var(--surface)] px-4 py-3 text-sm font-semibold ring-1 ring-[var(--bezel-ring)]"
                        >
                            Найти в истории
                        </button>
                    </div>
                </form>
            </BezelCard>

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
                            Нет заявок, ожидающих решения
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
                                        <AdvanceRow
                                            advance={advance}
                                            action={
                                                <div className="grid w-full grid-cols-2 gap-2 sm:w-auto sm:flex">
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            decide(
                                                                advance.id,
                                                                'approve',
                                                            )
                                                        }
                                                        disabled={
                                                            busyId ===
                                                            advance.id
                                                        }
                                                        className="inline-flex min-h-12 items-center justify-center gap-1.5 rounded-full bg-[var(--accent)] px-4 py-3 text-sm font-semibold text-[var(--bg)] transition-fluid hover:opacity-90 active:scale-[0.98] disabled:opacity-50 sm:min-h-0 sm:px-5 sm:py-2.5"
                                                    >
                                                        <Check
                                                            size={16}
                                                            weight="light"
                                                        />
                                                        Одобрить
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            decide(
                                                                advance.id,
                                                                'reject',
                                                            )
                                                        }
                                                        disabled={
                                                            busyId ===
                                                            advance.id
                                                        }
                                                        className="inline-flex min-h-12 items-center justify-center gap-1.5 rounded-full bg-[var(--bezel)] px-4 py-3 text-sm font-semibold text-[var(--muted)] transition-fluid hover:text-[var(--ink)] active:scale-[0.98] disabled:opacity-50 sm:min-h-0 sm:px-5 sm:py-2.5"
                                                    >
                                                        <X
                                                            size={16}
                                                            weight="light"
                                                        />
                                                        Отклонить
                                                    </button>
                                                </div>
                                            }
                                        />
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

            <AnimatePresence>
                {toast && (
                    <motion.div
                        key={toast.label}
                        role="status"
                        aria-live="polite"
                        initial={{ opacity: 0, y: 28, scale: 0.94 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 16, scale: 0.96 }}
                        transition={{ duration: 0.5, ease: EASE }}
                        className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex justify-center px-4 pb-[max(1.25rem,calc(0.75rem+var(--safe-bottom)))]"
                    >
                        <div className="pointer-events-auto flex items-center gap-2.5 rounded-full bg-[var(--ink)] px-5 py-3.5 text-[var(--bg)] shadow-lift ring-1 ring-white/10 backdrop-blur-xl">
                            <span
                                className={[
                                    'flex h-8 w-8 items-center justify-center rounded-full',
                                    toast.tone === 'success'
                                        ? 'bg-emerald-400/20 text-emerald-300'
                                        : 'bg-red-400/20 text-red-300',
                                ].join(' ')}
                            >
                                {toast.tone === 'success' ? (
                                    <Check size={18} weight="light" />
                                ) : (
                                    <X size={18} weight="light" />
                                )}
                            </span>
                            <span className="pr-1 text-sm font-semibold tracking-tight">
                                {toast.label}
                            </span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </AppLayout>
    );
}
