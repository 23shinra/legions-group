import BezelCard from '@/Components/ui/BezelCard';
import IslandButton from '@/Components/ui/IslandButton';
import PageHeader from '@/Components/ui/PageHeader';
import StatusBadge from '@/Components/ui/StatusBadge';
import AppLayout from '@/Layouts/AppLayout';
import { Head, Link, router } from '@inertiajs/react';
import { motion } from 'framer-motion';
import {
    ArrowLeft,
    Buildings,
    Phone,
    User,
    UsersThree,
} from '@phosphor-icons/react';

export default function Show({ brigade, members = [] }) {
    return (
        <AppLayout>
            <Head title={brigade?.name ?? 'Бригада'} />

            <PageHeader
                eyebrow="Бригада"
                title={brigade?.name ?? '—'}
                subtitle={
                    brigade?.object
                        ? `Объект: ${brigade.object.name}`
                        : 'Объект не назначен'
                }
                actions={
                    <IslandButton
                        href={route('manager.brigades.index')}
                        icon={ArrowLeft}
                        variant="secondary"
                    >
                        Назад
                    </IslandButton>
                }
            />

            <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
                <BezelCard padding="p-5">
                    <p className="text-[10px] uppercase tracking-[0.15em] text-[var(--muted)]">
                        Участников
                    </p>
                    <p className="mt-1 text-3xl font-extrabold">
                        {brigade?.members_count ?? members.length}
                    </p>
                </BezelCard>
                <BezelCard padding="p-5">
                    <p className="text-[10px] uppercase tracking-[0.15em] text-[var(--muted)]">
                        На объекте
                    </p>
                    <p className="mt-1 text-3xl font-extrabold text-[var(--accent)]">
                        {brigade?.at_work ?? 0}
                    </p>
                </BezelCard>
                <BezelCard padding="p-5">
                    <div className="flex items-start gap-3">
                        <Buildings size={22} weight="light" className="mt-0.5 shrink-0 text-[var(--accent)]" />
                        <div className="min-w-0">
                            <p className="text-[10px] uppercase tracking-[0.15em] text-[var(--muted)]">
                                Объект
                            </p>
                            <p className="mt-1 truncate font-semibold">
                                {brigade?.object?.name ?? '—'}
                            </p>
                            {brigade?.object?.address && (
                                <p className="mt-0.5 truncate text-sm text-[var(--muted)]">
                                    {brigade.object.address}
                                </p>
                            )}
                        </div>
                    </div>
                </BezelCard>
            </div>

            <BezelCard className="mb-6" padding="p-5 sm:p-6">
                <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-neutral-100">
                        <User size={24} weight="light" />
                    </div>
                    <div className="min-w-0">
                        <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[var(--muted)]">
                            Ответственный
                        </p>
                        <p className="mt-1 text-xl font-extrabold tracking-tight">
                            {brigade?.brigadier?.name ?? 'Не назначен'}
                        </p>
                        {brigade?.brigadier?.phone && (
                            <p className="mt-1 flex items-center gap-2 text-sm text-[var(--muted)]">
                                <Phone size={14} weight="light" />
                                {brigade.brigadier.phone}
                            </p>
                        )}
                        {brigade?.brigadier?.id && (
                            <Link
                                href={route('manager.employees.show', brigade.brigadier.id)}
                                className="mt-3 inline-flex text-sm font-semibold text-[var(--accent)] transition-fluid hover:opacity-70"
                            >
                                Открыть профиль
                            </Link>
                        )}
                    </div>
                </div>
            </BezelCard>

            <BezelCard padding="p-0">
                <div className="flex items-center gap-2 border-b border-[var(--bezel-ring)] px-5 py-4 sm:px-6">
                    <UsersThree size={20} weight="light" className="text-[var(--accent)]" />
                    <h2 className="font-bold">Состав бригады</h2>
                </div>

                <ul className="divide-y divide-[var(--bezel-ring)]">
                    {members.length === 0 ? (
                        <li className="px-5 py-10 text-center text-[var(--muted)] sm:px-6">
                            Нет участников
                        </li>
                    ) : (
                        members.map((member, i) => (
                            <motion.li
                                key={member.id}
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{
                                    delay: i * 0.03,
                                    duration: 0.55,
                                    ease: [0.32, 0.72, 0, 1],
                                }}
                                onClick={() =>
                                    router.visit(route('manager.employees.show', member.id))
                                }
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                        e.preventDefault();
                                        router.visit(route('manager.employees.show', member.id));
                                    }
                                }}
                                tabIndex={0}
                                role="link"
                                className="flex cursor-pointer items-center justify-between gap-4 px-5 py-4 transition-fluid hover:bg-neutral-50 active:bg-neutral-100 sm:px-6"
                            >
                                <div className="min-w-0">
                                    <p className="truncate font-semibold text-[var(--ink)]">
                                        {member.name}
                                    </p>
                                    <p className="truncate text-sm text-[var(--muted)]">
                                        {member.position ?? 'Рабочий'}
                                        {member.phone ? ` · ${member.phone}` : ''}
                                    </p>
                                </div>
                                <StatusBadge
                                    status={member.is_working ? 'working' : 'absent'}
                                />
                            </motion.li>
                        ))
                    )}
                </ul>
            </BezelCard>
        </AppLayout>
    );
}
