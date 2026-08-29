import BezelCard from '@/Components/ui/BezelCard';
import IslandButton from '@/Components/ui/IslandButton';
import PageHeader from '@/Components/ui/PageHeader';
import SoftDatePicker from '@/Components/ui/SoftDatePicker';
import SoftSelect from '@/Components/ui/SoftSelect';
import AppLayout from '@/Layouts/AppLayout';
import { formatDate, formatMoney } from '@/lib/format';
import { ensurePushSubscription } from '@/lib/pwa';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { ArrowRight, Wallet } from '@phosphor-icons/react';
import { useState } from 'react';

function todayInputValue() {
    const now = new Date();

    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

export default function Payments({ employees = [], payments = [], closedObjects = [] }) {
    const vapidPublicKey = usePage().props.vapidPublicKey;
    const [settlementId, setSettlementId] = useState('');
    const [settlementBusy, setSettlementBusy] = useState(false);
    const { data, setData, post, processing, errors, reset } = useForm({
        user_id: '',
        amount: '',
        period: '',
        comment: '',
        paid_on: todayInputValue(),
    });

    const submit = async (e) => {
        e.preventDefault();
        await ensurePushSubscription(vapidPublicKey);
        post(route('accountant.payments.store'), {
            onSuccess: () =>
                reset({
                    user_id: '',
                    amount: '',
                    period: '',
                    comment: '',
                    paid_on: todayInputValue(),
                }),
        });
    };

    return (
        <AppLayout>
            <Head title="Выплаты" />

            <PageHeader
                eyebrow="Зарплата"
                title="Выплаты"
                subtitle="Оформление выплат и история"
            />

            {closedObjects.length > 0 && (
                <BezelCard className="mb-6" padding="p-5">
                    <h2 className="mb-3 font-bold">Выплатить остатки по закрытому объекту</h2>
                    <div className="flex flex-col gap-3 sm:flex-row">
                        <SoftSelect
                            className="flex-1"
                            value={settlementId}
                            onChange={setSettlementId}
                            placeholder="Выберите объект"
                            options={[
                                { value: '', label: 'Выберите объект' },
                                ...closedObjects.map((object) => ({
                                    value: object.id,
                                    label: `${object.name}${
                                        object.settlement?.total_remaining != null
                                            ? ` · ${formatMoney(object.settlement.total_remaining)}`
                                            : ''
                                    }`,
                                })),
                            ]}
                        />
                        <button
                            type="button"
                            disabled={!settlementId || settlementBusy}
                            onClick={async () => {
                                setSettlementBusy(true);
                                await ensurePushSubscription(vapidPublicKey);
                                router.post(
                                    route(
                                        'accountant.objects.pay-settlement',
                                        settlementId,
                                    ),
                                    {},
                                    {
                                        preserveScroll: true,
                                        onFinish: () => setSettlementBusy(false),
                                    },
                                );
                            }}
                            className="rounded-full bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-[var(--bg)] disabled:opacity-50"
                        >
                            {settlementBusy ? 'Выплата…' : 'Выплатить остатки'}
                        </button>
                    </div>
                </BezelCard>
            )}

            <div className="grid grid-cols-1 gap-8 lg:grid-cols-5">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: [0.32, 0.72, 0, 1] }}
                    className="lg:col-span-2"
                >
                    <BezelCard padding="p-6 md:p-8">
                        <div className="mb-6 flex items-center gap-2">
                            <Wallet size={22} weight="light" className="text-[var(--accent)]" />
                            <h2 className="text-lg font-bold">Новая выплата</h2>
                        </div>

                        <form onSubmit={submit} className="space-y-5">
                            <div>
                                <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.15em] text-[var(--muted)]">
                                    Сотрудник
                                </label>
                                <SoftSelect
                                    value={data.user_id}
                                    onChange={(next) => setData('user_id', next)}
                                    placeholder="Выберите сотрудника"
                                    options={[
                                        { value: '', label: 'Выберите сотрудника' },
                                        ...employees.map((emp) => ({
                                            value: emp.id,
                                            label: emp.name,
                                        })),
                                    ]}
                                />
                                {errors.user_id && (
                                    <p className="mt-2 text-sm text-[var(--muted)]">{errors.user_id}</p>
                                )}
                            </div>

                            <div>
                                <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.15em] text-[var(--muted)]">
                                    Сумма (₸)
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    value={data.amount}
                                    onChange={(e) => setData('amount', e.target.value)}
                                    className="w-full rounded-2xl border-0 bg-[var(--surface-muted)] px-4 py-3.5 text-lg font-semibold outline-none ring-1 ring-[var(--bezel-ring)] transition-fluid focus:ring-2 focus:ring-[var(--accent)]"
                                />
                                {errors.amount && (
                                    <p className="mt-2 text-sm text-[var(--muted)]">{errors.amount}</p>
                                )}
                            </div>

                            <div>
                                <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.15em] text-[var(--muted)]">
                                    Дата выплаты
                                </label>
                                <SoftDatePicker
                                    value={data.paid_on}
                                    onChange={(next) => setData('paid_on', next)}
                                />
                                {errors.paid_on && (
                                    <p className="mt-2 text-sm text-[var(--muted)]">{errors.paid_on}</p>
                                )}
                            </div>

                            <div>
                                <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.15em] text-[var(--muted)]">
                                    Период
                                </label>
                                <input
                                    type="text"
                                    value={data.period}
                                    onChange={(e) => setData('period', e.target.value)}
                                    placeholder="Август 2026"
                                    className="w-full rounded-2xl border-0 bg-[var(--surface-muted)] px-4 py-3.5 outline-none ring-1 ring-[var(--bezel-ring)] transition-fluid focus:ring-2 focus:ring-[var(--accent)]"
                                />
                                {errors.period && (
                                    <p className="mt-2 text-sm text-[var(--muted)]">{errors.period}</p>
                                )}
                            </div>

                            <div>
                                <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.15em] text-[var(--muted)]">
                                    Комментарий
                                </label>
                                <textarea
                                    rows={3}
                                    value={data.comment}
                                    onChange={(e) => setData('comment', e.target.value)}
                                    className="w-full resize-none rounded-2xl border-0 bg-[var(--surface-muted)] px-4 py-3.5 outline-none ring-1 ring-[var(--bezel-ring)] transition-fluid focus:ring-2 focus:ring-[var(--accent)]"
                                />
                            </div>

                            <IslandButton
                                type="submit"
                                icon={ArrowRight}
                                disabled={processing}
                                className="w-full justify-center"
                            >
                                {processing ? 'Оформление…' : 'Выплатить'}
                            </IslandButton>
                        </form>
                    </BezelCard>
                </motion.div>

                <div className="lg:col-span-3">
                    <BezelCard padding="p-0">
                        <div className="flex items-center justify-between gap-3 border-b border-[var(--bezel-ring)] px-6 py-4">
                            <h2 className="font-bold">История выплат</h2>
                            <Link
                                href={route('accountant.payments.history')}
                                className="inline-flex items-center gap-2 rounded-full bg-[var(--surface-muted)] px-3.5 py-2 text-xs font-semibold text-[var(--ink)] ring-1 ring-[var(--bezel-ring)] transition-fluid hover:ring-[var(--accent)]"
                            >
                                Все выплаты
                                <ArrowRight size={14} weight="bold" />
                            </Link>
                        </div>
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
                                            Кто выплатил
                                        </th>
                                        <th className="px-6 py-4 text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--muted)]">
                                            Период
                                        </th>
                                        <th className="px-6 py-4 text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--muted)]">
                                            Сумма
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {payments.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-12 text-center text-[var(--muted)]">
                                                История пуста
                                            </td>
                                        </tr>
                                    ) : (
                                        payments.map((payment, i) => (
                                            <motion.tr
                                                key={payment.id}
                                                initial={{ opacity: 0, y: 12 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: i * 0.03, duration: 0.6, ease: [0.32, 0.72, 0, 1] }}
                                                className="border-b border-[var(--bezel-ring)] last:border-0"
                                            >
                                                <td className="px-6 py-4">
                                                    {formatDate(payment.paid_on ?? payment.created_at)}
                                                </td>
                                                <td className="px-6 py-4 font-semibold">
                                                    {payment.user?.name ?? '—'}
                                                </td>
                                                <td className="px-6 py-4 text-[var(--muted)]">
                                                    {payment.payer?.name ?? '—'}
                                                </td>
                                                <td className="px-6 py-4 text-[var(--muted)]">
                                                    {payment.period ?? '—'}
                                                </td>
                                                <td className="px-6 py-4 font-bold text-[var(--accent)]">
                                                    {formatMoney(payment.amount)}
                                                </td>
                                            </motion.tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </BezelCard>
                </div>
            </div>
        </AppLayout>
    );
}
