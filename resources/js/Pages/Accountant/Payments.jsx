import BezelCard from '@/Components/ui/BezelCard';
import IslandButton from '@/Components/ui/IslandButton';
import PageHeader from '@/Components/ui/PageHeader';
import AppLayout from '@/Layouts/AppLayout';
import { formatDate, formatMoney } from '@/lib/format';
import { Head, useForm } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { ArrowRight, Wallet } from '@phosphor-icons/react';

export default function Payments({ employees = [], payments = [] }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        user_id: '',
        amount: '',
        period: '',
        comment: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('accountant.payments.store'), {
            onSuccess: () => reset(),
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
                                <select
                                    value={data.user_id}
                                    onChange={(e) => setData('user_id', e.target.value)}
                                    className="w-full rounded-2xl border-0 bg-[var(--surface-muted)] px-4 py-3.5 text-[var(--ink)] outline-none ring-1 ring-[var(--bezel-ring)] transition-fluid focus:ring-2 focus:ring-[var(--accent)]"
                                >
                                    <option value="">Выберите сотрудника</option>
                                    {employees.map((emp) => (
                                        <option key={emp.id} value={emp.id}>
                                            {emp.name}
                                        </option>
                                    ))}
                                </select>
                                {errors.user_id && (
                                    <p className="mt-2 text-sm text-neutral-600">{errors.user_id}</p>
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
                                    <p className="mt-2 text-sm text-neutral-600">{errors.amount}</p>
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
                                    <p className="mt-2 text-sm text-neutral-600">{errors.period}</p>
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
                        <div className="border-b border-[var(--bezel-ring)] px-6 py-4">
                            <h2 className="font-bold">История выплат</h2>
                        </div>
                        <div className="table-scroll">
                            <table className="w-full min-w-[480px] text-left text-sm">
                                <thead>
                                    <tr className="border-b border-[var(--bezel-ring)] bg-[var(--surface-muted)]">
                                        <th className="px-6 py-4 text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--muted)]">
                                            Дата
                                        </th>
                                        <th className="px-6 py-4 text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--muted)]">
                                            Сотрудник
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
                                            <td colSpan={4} className="px-6 py-12 text-center text-[var(--muted)]">
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
                                                <td className="px-6 py-4">{formatDate(payment.created_at)}</td>
                                                <td className="px-6 py-4 font-semibold">
                                                    {payment.user?.name ?? '—'}
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
