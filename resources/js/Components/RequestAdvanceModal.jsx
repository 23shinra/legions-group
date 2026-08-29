import IslandButton from '@/Components/ui/IslandButton';
import { formatHours, formatMoney } from '@/lib/format';
import { ensurePushSubscription } from '@/lib/pwa';
import { useForm, usePage } from '@inertiajs/react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, Clock, WarningCircle, X } from '@phosphor-icons/react';
import { useEffect, useMemo } from 'react';

export default function RequestAdvanceModal({
    open,
    onClose,
    eligibility = {},
}) {
    const canRequest = Boolean(eligibility.can_request);
    const message =
        eligibility.message ||
        'У вас недостаточно отработанных смен на аванс';
    const maxAmount = Number(eligibility.available_for_advance ?? 0);
    const earned = Number(eligibility.accrued ?? 0);

    const vapidPublicKey = usePage().props.vapidPublicKey;
    const { data, setData, post, processing, errors, reset, clearErrors } =
        useForm({
            amount: '',
            comment: '',
        });

    const amountValue = Number(data.amount || 0);
    const clientError = useMemo(() => {
        if (!canRequest || !data.amount) {
            return null;
        }

        if (amountValue > earned) {
            return `Вы не можете запросить больше, чем заработали по факту (${formatMoney(earned)}).`;
        }

        if (maxAmount > 0 && amountValue > maxAmount) {
            return `Доступно к авансу не более ${formatMoney(maxAmount)}.`;
        }

        return null;
    }, [amountValue, canRequest, data.amount, earned, maxAmount]);

    useEffect(() => {
        if (!open) {
            return undefined;
        }

        document.body.classList.add('menu-locked');
        return () => document.body.classList.remove('menu-locked');
    }, [open]);

    useEffect(() => {
        if (!open) {
            reset();
            clearErrors();
        }
    }, [open]);

    const submit = async (e) => {
        e.preventDefault();
        if (!canRequest || clientError) {
            return;
        }

        await ensurePushSubscription(vapidPublicKey);

        post(route('worker.advances.store'), {
            preserveScroll: true,
            onSuccess: () => {
                reset();
                onClose();
            },
        });
    };

    return (
        <AnimatePresence>
            {open && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.35, ease: [0.32, 0.72, 0, 1] }}
                    className="fixed inset-0 z-50 flex items-end justify-center bg-[var(--overlay)] px-4 pb-[max(1rem,var(--safe-bottom))] backdrop-blur-sm sm:items-center sm:pb-4"
                    onClick={() => !processing && onClose()}
                >
                    <motion.div
                        initial={{ opacity: 0, y: 40, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 24, scale: 0.98 }}
                        transition={{
                            duration: 0.45,
                            ease: [0.32, 0.72, 0, 1],
                        }}
                        className="w-full max-w-md rounded-[1.75rem] bg-[var(--bezel)] p-1.5 shadow-lift sm:rounded-[2rem]"
                        onClick={(e) => e.stopPropagation()}
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="advance-modal-title"
                    >
                        <div className="rounded-[calc(1.75rem-0.375rem)] bg-[var(--surface)] p-5 sm:rounded-[calc(2rem-0.375rem)] sm:p-7">
                            <div className="mb-5 flex items-start justify-between gap-3">
                                <div>
                                    <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[var(--muted)]">
                                        Заявка
                                    </p>
                                    <h2
                                        id="advance-modal-title"
                                        className="mt-1.5 text-xl font-extrabold tracking-tight text-[var(--ink)] sm:text-2xl"
                                    >
                                        Запросить аванс
                                    </h2>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => !processing && onClose()}
                                    aria-label="Закрыть"
                                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--bezel)] text-[var(--muted)] transition-fluid hover:text-[var(--ink)]"
                                >
                                    <X size={18} weight="light" />
                                </button>
                            </div>

                            {!canRequest ? (
                                <div className="space-y-6">
                                    <div className="rounded-2xl bg-[var(--surface-muted)] p-4 ring-1 ring-[var(--bezel-ring)] sm:p-5">
                                        <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-[var(--bezel)] text-[var(--ink)]">
                                            <WarningCircle
                                                size={22}
                                                weight="light"
                                            />
                                        </div>
                                        <p className="text-base font-semibold leading-snug text-[var(--ink)] sm:text-lg">
                                            {message}
                                        </p>
                                        <p className="mt-2 flex items-center gap-2 text-sm text-[var(--muted)]">
                                            <Clock size={16} weight="light" />
                                            Отработано смен:{' '}
                                            {eligibility.worked_days ?? 0}
                                            {eligibility.required_days
                                                ? ` из ${eligibility.required_days}`
                                                : ''}
                                        </p>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={onClose}
                                        className="min-h-12 w-full rounded-full bg-[var(--accent)] px-5 py-3 text-base font-semibold text-[var(--bg)] transition-fluid hover:opacity-90 active:scale-[0.98]"
                                    >
                                        Понятно
                                    </button>
                                </div>
                            ) : (
                                <form onSubmit={submit} className="space-y-5">
                                    <div className="rounded-2xl bg-[var(--surface-muted)] p-4 ring-1 ring-[var(--bezel-ring)]">
                                        <div className="grid grid-cols-2 gap-3 text-sm">
                                            <div>
                                                <p className="text-[10px] uppercase tracking-[0.14em] text-[var(--muted)]">
                                                    Смен
                                                </p>
                                                <p className="mt-1 font-semibold text-[var(--ink)]">
                                                    {eligibility.worked_days ?? 0}
                                                    {eligibility.work_days
                                                        ? ` / ${eligibility.work_days}`
                                                        : ''}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] uppercase tracking-[0.14em] text-[var(--muted)]">
                                                    Часов
                                                </p>
                                                <p className="mt-1 font-semibold text-[var(--ink)]">
                                                    {formatHours(
                                                        eligibility.worked_minutes ?? 0,
                                                    )}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] uppercase tracking-[0.14em] text-[var(--muted)]">
                                                    Заработано
                                                </p>
                                                <p className="mt-1 font-semibold text-[var(--ink)]">
                                                    {formatMoney(
                                                        eligibility.accrued ?? 0,
                                                    )}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] uppercase tracking-[0.14em] text-[var(--muted)]">
                                                    Осталось смен
                                                </p>
                                                <p className="mt-1 font-semibold text-[var(--ink)]">
                                                    {eligibility.days_left ?? '—'}
                                                </p>
                                            </div>
                                        </div>
                                        <p className="mt-3 text-sm text-[var(--muted)]">
                                            Доступно к авансу:{' '}
                                            <span className="font-semibold text-[var(--ink)]">
                                                {formatMoney(maxAmount)}
                                            </span>
                                            {' '}
                                            из заработанных{' '}
                                            {formatMoney(earned)}
                                        </p>
                                        {maxAmount <= 0 && earned > 0 && (
                                            <ul className="mt-3 space-y-1 text-xs text-[var(--muted)]">
                                                {(eligibility.paid_salary ?? 0) > 0 && (
                                                    <li>
                                                        Выплачено зарплаты:{' '}
                                                        {formatMoney(eligibility.paid_salary)}
                                                    </li>
                                                )}
                                                {(eligibility.paid_advances ?? 0) > 0 && (
                                                    <li>
                                                        Выплачено авансов:{' '}
                                                        {formatMoney(eligibility.paid_advances)}
                                                    </li>
                                                )}
                                                {(eligibility.reserved_advances ?? 0) > 0 && (
                                                    <li>
                                                        В активных заявках:{' '}
                                                        {formatMoney(eligibility.reserved_advances)}
                                                    </li>
                                                )}
                                            </ul>
                                        )}
                                    </div>

                                    <div>
                                        <label
                                            htmlFor="advance-amount"
                                            className="mb-2 block text-xs font-semibold uppercase tracking-[0.15em] text-[var(--muted)]"
                                        >
                                            Сумма (₸)
                                        </label>
                                        <input
                                            id="advance-amount"
                                            type="number"
                                            min="1"
                                            max={maxAmount > 0 ? maxAmount : undefined}
                                            step="1"
                                            inputMode="numeric"
                                            value={data.amount}
                                            onChange={(e) =>
                                                setData(
                                                    'amount',
                                                    e.target.value,
                                                )
                                            }
                                            placeholder="50000"
                                            className="input-soft text-lg font-semibold"
                                            autoFocus
                                        />
                                        {(errors.amount || clientError) && (
                                            <p className="mt-2 text-sm font-medium text-red-600 [data-theme=dark]:text-red-400">
                                                {errors.amount || clientError}
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <label
                                            htmlFor="advance-comment"
                                            className="mb-2 block text-xs font-semibold uppercase tracking-[0.15em] text-[var(--muted)]"
                                        >
                                            Комментарий
                                        </label>
                                        <textarea
                                            id="advance-comment"
                                            rows={3}
                                            value={data.comment}
                                            onChange={(e) =>
                                                setData(
                                                    'comment',
                                                    e.target.value,
                                                )
                                            }
                                            placeholder="Причина запроса (необязательно)"
                                            className="input-soft resize-none"
                                        />
                                        {errors.comment && (
                                            <p className="mt-2 text-sm font-medium text-red-600 [data-theme=dark]:text-red-400">
                                                {errors.comment}
                                            </p>
                                        )}
                                    </div>

                                    <IslandButton
                                        type="submit"
                                        icon={ArrowRight}
                                        disabled={processing || Boolean(clientError)}
                                        className="w-full justify-center"
                                    >
                                        {processing
                                            ? 'Отправка…'
                                            : 'Отправить заявку'}
                                    </IslandButton>
                                </form>
                            )}
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
