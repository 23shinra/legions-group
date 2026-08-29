import IslandButton from '@/Components/ui/IslandButton';
import { formatMoney } from '@/lib/format';
import { ensurePushSubscription } from '@/lib/pwa';
import { useForm, usePage } from '@inertiajs/react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, Bank, Money, X } from '@phosphor-icons/react';
import { useEffect } from 'react';

export default function MarkAdvancePaidModal({ open, onClose, advance }) {
    const vapidPublicKey = usePage().props.vapidPublicKey;
    const { data, setData, post, processing, errors, reset, clearErrors } =
        useForm({
            payment_method: 'transfer',
            receipt: null,
            payment_note: '',
        });

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
    }, [open, reset, clearErrors]);

    const submit = async (e) => {
        e.preventDefault();
        if (!advance?.id) {
            return;
        }

        await ensurePushSubscription(vapidPublicKey);
        post(route('accountant.advances.paid', advance.id), {
            preserveScroll: true,
            forceFormData: true,
            onSuccess: () => {
                reset();
                onClose();
            },
        });
    };

    const isCash = data.payment_method === 'cash';

    return (
        <AnimatePresence>
            {open && advance && (
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
                    >
                        <div className="rounded-[calc(1.75rem-0.375rem)] bg-[var(--surface)] p-5 sm:rounded-[calc(2rem-0.375rem)] sm:p-7">
                            <div className="mb-5 flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                    <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[var(--muted)]">
                                        Выплата аванса
                                    </p>
                                    <h2 className="mt-1 text-xl font-extrabold tracking-tight text-[var(--ink)]">
                                        {advance.user?.name}
                                    </h2>
                                    <p className="mt-1 text-sm text-[var(--muted)]">
                                        {formatMoney(advance.amount)}
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={onClose}
                                    disabled={processing}
                                    className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--bezel)] text-[var(--ink)]"
                                >
                                    <X size={18} weight="light" />
                                </button>
                            </div>

                            <form onSubmit={submit} className="space-y-4">
                                <div className="grid grid-cols-2 gap-2">
                                    {[
                                        {
                                            id: 'transfer',
                                            label: 'Перевод',
                                            icon: Bank,
                                        },
                                        {
                                            id: 'cash',
                                            label: 'Наличные',
                                            icon: Money,
                                        },
                                    ].map(({ id, label, icon: Icon }) => {
                                        const active = data.payment_method === id;
                                        return (
                                            <button
                                                key={id}
                                                type="button"
                                                onClick={() =>
                                                    setData('payment_method', id)
                                                }
                                                className={`flex min-h-14 items-center justify-center gap-2 rounded-2xl px-3 py-3 text-sm font-semibold transition-fluid ${
                                                    active
                                                        ? 'bg-[var(--accent)] text-[var(--bg)]'
                                                        : 'bg-[var(--surface-muted)] text-[var(--ink)] ring-1 ring-[var(--bezel-ring)]'
                                                }`}
                                            >
                                                <Icon size={18} weight="light" />
                                                {label}
                                            </button>
                                        );
                                    })}
                                </div>

                                {!isCash ? (
                                    <div>
                                        <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.15em] text-[var(--muted)]">
                                            Чек перевода
                                        </label>
                                        <input
                                            type="file"
                                            accept=".jpg,.jpeg,.png,.pdf,.webp,image/*"
                                            onChange={(e) =>
                                                setData(
                                                    'receipt',
                                                    e.target.files[0] ?? null,
                                                )
                                            }
                                            className="block w-full text-sm text-[var(--muted)] file:mr-4 file:rounded-full file:border-0 file:bg-[var(--bezel)] file:px-4 file:py-2.5 file:text-sm file:font-semibold file:text-[var(--ink)]"
                                        />
                                        {(errors.receipt || errors.payment_method) && (
                                            <p className="mt-2 text-sm text-[var(--muted)]">
                                                {errors.receipt ||
                                                    errors.payment_method}
                                            </p>
                                        )}
                                    </div>
                                ) : (
                                    <div>
                                        <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.15em] text-[var(--muted)]">
                                            Комментарий
                                        </label>
                                        <input
                                            type="text"
                                            value={data.payment_note}
                                            onChange={(e) =>
                                                setData(
                                                    'payment_note',
                                                    e.target.value,
                                                )
                                            }
                                            placeholder="Выдан нал"
                                            className="input-soft"
                                        />
                                        <p className="mt-2 text-xs text-[var(--muted)]">
                                            Если оставить пустым — запишется
                                            «Выдан нал»
                                        </p>
                                    </div>
                                )}

                                {errors.status && (
                                    <p className="text-sm text-[var(--muted)]">
                                        {errors.status}
                                    </p>
                                )}

                                <IslandButton
                                    type="submit"
                                    icon={ArrowRight}
                                    disabled={processing}
                                    className="w-full justify-center"
                                >
                                    {processing
                                        ? 'Сохранение…'
                                        : 'Подтвердить выплату'}
                                </IslandButton>
                            </form>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
