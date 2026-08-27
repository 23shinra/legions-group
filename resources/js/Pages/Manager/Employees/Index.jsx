import BezelCard from '@/Components/ui/BezelCard';
import PageHeader from '@/Components/ui/PageHeader';
import StatusBadge from '@/Components/ui/StatusBadge';
import AppLayout from '@/Layouts/AppLayout';
import { Head, router } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { Users } from '@phosphor-icons/react';

export default function Index({ employees = [] }) {
    const openEmployee = (id) => {
        router.visit(route('manager.employees.show', id));
    };

    return (
        <AppLayout>
            <Head title="Сотрудники" />

            <PageHeader
                eyebrow="Персонал"
                title="Сотрудники"
                subtitle={`${employees.length} человек в системе`}
            />

            <BezelCard padding="p-0">
                <div className="table-scroll">
                    <table className="w-full min-w-[520px] text-left text-sm">
                        <thead>
                            <tr className="border-b border-[var(--bezel-ring)] bg-[var(--surface-muted)]">
                                <th className="px-6 py-4 text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--muted)]">
                                    Имя
                                </th>
                                <th className="px-6 py-4 text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--muted)]">
                                    Бригада
                                </th>
                                <th className="px-6 py-4 text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--muted)]">
                                    Должность
                                </th>
                                <th className="px-6 py-4 text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--muted)]">
                                    Статус
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {employees.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-[var(--muted)]">
                                        <Users size={32} weight="light" className="mx-auto mb-3 opacity-40" />
                                        Сотрудники не найдены
                                    </td>
                                </tr>
                            ) : (
                                employees.map((employee, i) => (
                                    <motion.tr
                                        key={employee.id}
                                        initial={{ opacity: 0, y: 12 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.03, duration: 0.6, ease: [0.32, 0.72, 0, 1] }}
                                        onClick={() => openEmployee(employee.id)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' || e.key === ' ') {
                                                e.preventDefault();
                                                openEmployee(employee.id);
                                            }
                                        }}
                                        tabIndex={0}
                                        role="link"
                                        className="cursor-pointer border-b border-[var(--bezel-ring)] transition-fluid last:border-0 hover:bg-neutral-50 active:bg-neutral-100"
                                    >
                                        <td className="px-6 py-4 font-semibold text-[var(--ink)]">
                                            {employee.name}
                                        </td>
                                        <td className="px-6 py-4 text-[var(--muted)]">
                                            {employee.brigade?.name ?? '—'}
                                        </td>
                                        <td className="px-6 py-4 text-[var(--muted)]">
                                            {employee.position ?? '—'}
                                        </td>
                                        <td className="px-6 py-4">
                                            <StatusBadge
                                                status={
                                                    employee.is_working ? 'working' : 'absent'
                                                }
                                            />
                                        </td>
                                    </motion.tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </BezelCard>
        </AppLayout>
    );
}
