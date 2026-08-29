import BezelCard from '@/Components/ui/BezelCard';
import PageHeader from '@/Components/ui/PageHeader';
import Pagination from '@/Components/ui/Pagination';
import SoftDatePicker from '@/Components/ui/SoftDatePicker';
import SoftSelect from '@/Components/ui/SoftSelect';
import AppLayout from '@/Layouts/AppLayout';
import { formatDate, formatMoney } from '@/lib/format';
import { Head, Link, router } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { ArrowLeft, Wallet } from '@phosphor-icons/react';
import { useState } from 'react';

export default function PaymentsHistory({
    payments = {},
    employees = [],
    filters = {},
    summary = {},
}) {
    const [from, setFrom] = useState(filters.from ?? '');
    const [to, setTo] = useState(filters.to ?? '');
    const [userId, setUserId] = useState(filters.user_id ?? '');
    const rows = payments.data ?? [];
    const currentPage = payments.current_page ?? 1;
    const lastPage = payments.last_page ?? 1;

    const query = () => ({
        from: from || undefined,
        to: to || undefined,
        user_id: userId || undefined,
    });

    const apply = (event) => {
        event.preventDefault();
        router.get(route('accountant.payments.history'), query(), {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const resetFilters = () => {
        setFrom('');
        setTo('');
        setUserId('');
        router.get(route('accountant.payments.history'), {}, { preserveState: true });
    };

    const goToPage = (page) => {
        router.get(
            route('accountant.payments.history'),
            { ...query(), page },
            { preserveState: true, preserveScroll: true },
        );
    };

    return (
        <AppLayout>
            <Head title="Все выплаты" />

            <PageHeader
                eyebrow="Зарплата"
                title="Все выплаты"
                subtitle="По 10 выплат на странице, фильтр по датам и сотруднику"
                leading={
                    <Link
                        href={route('accountant.payments.index')}
                        className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--surface)] text-[var(--ink)] shadow-soft ring-1 ring-[var(--bezel-ring)] transition-fluid hover:bg-[var(--surface-muted)]"
                    >
                        <ArrowLeft size={18} weight="bold" />
                    </Link>
                }
            />

            <div className="mb-6 grid grid-cols-2 gap-3">
                <BezelCard padding="p-5">
                    <p className="text-[10px] uppercase tracking-[0.15em] text-[var(--muted)]">
                        Выплат
                    </p>
                    <p className="mt-1 text-xl font-bold">{summary.count ?? 0}</p>
                </BezelCard>
                <BezelCard padding="p-5">
                    <p className="text-[10px] uppercase tracking-[0.15em] text-[var(--muted)]">
                        Сумма
                    </p>
                    <p className="mt-1 text-xl font-bold">{formatMoney(summary.total ?? 0)}</p>
                </BezelCard>
            </div>

            <BezelCard className="mb-6" padding="p-4 sm:p-5">
                <form onSubmit={apply} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                    <div className="lg:col-span-1">
                        <label className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
                            Сотрудник
                        </label>
                        <SoftSelect
                            value={userId}
                            onChange={setUserId}
                            placeholder="Все сотрудники"
                            options={[
                                { value: '', label: 'Все сотрудники' },
                                ...employees.map((employee) => ({
                                    value: employee.id,
                                    label: employee.name,
                                })),
                            ]}
                        />
                    </div>
                    <div>
                        <label className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
                            С
                        </label>
                        <SoftDatePicker value={from} onChange={setFrom} />
                    </div>
                    <div>
                        <label className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
                            По
                        </label>
                        <SoftDatePicker value={to} onChange={setTo} />
                    </div>
                    <div className="flex items-end">
                        <button
                            type="submit"
                            className="w-full rounded-full bg-[var(--accent)] px-4 py-3 text-sm font-semibold text-[var(--bg)]"
                        >
                            Применить
                        </button>
                    </div>
                    <div className="flex items-end">
                        <button
                            type="button"
                            onClick={resetFilters}
                            className="w-full rounded-full bg-[var(--surface)] px-4 py-3 text-sm font-semibold ring-1 ring-[var(--bezel-ring)]"
                        >
                            Сбросить
                        </button>
                    </div>
                </form>
            </BezelCard>

            <BezelCard padding="p-0">
                <div className="flex items-center gap-2 border-b border-[var(--bezel-ring)] px-6 py-4">
                    <Wallet size={20} weight="light" className="text-[var(--accent)]" />
                    <h2 className="font-bold">История выплат</h2>
                </div>
                <div className="table-scroll">
                    <table className="w-full min-w-[640px] text-left text-sm">
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
                            {rows.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-[var(--muted)]">
                                        Нет выплат за выбранный период
                                    </td>
                                </tr>
                            ) : (
                                rows.map((payment, i) => (
                                    <motion.tr
                                        key={payment.id}
                                        initial={{ opacity: 0, y: 12 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{
                                            delay: i * 0.02,
                                            duration: 0.5,
                                            ease: [0.32, 0.72, 0, 1],
                                        }}
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
                <Pagination
                    currentPage={currentPage}
                    totalPages={lastPage}
                    onPageChange={goToPage}
                />
            </BezelCard>
        </AppLayout>
    );
}
