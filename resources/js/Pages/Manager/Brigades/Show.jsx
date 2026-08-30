import BezelCard from '@/Components/ui/BezelCard';
import IslandButton from '@/Components/ui/IslandButton';
import PageHeader from '@/Components/ui/PageHeader';
import SoftSelect from '@/Components/ui/SoftSelect';
import StatusBadge from '@/Components/ui/StatusBadge';
import AppLayout from '@/Layouts/AppLayout';
import { brigadeTitle } from '@/lib/format';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { motion } from 'framer-motion';
import {
    ArrowLeft,
    Buildings,
    Phone,
    Plus,
    Trash,
    User,
    UsersThree,
} from '@phosphor-icons/react';
import { useState } from 'react';

export default function Show({
    brigade,
    members = [],
    availableWorkers = [],
    brigadiers = [],
}) {
    const flash = usePage().props.flash ?? {};
    const [memberId, setMemberId] = useState('');
    const { data, setData, patch, processing, errors } = useForm({
        name: brigade?.name ?? '',
        brigadier_id: brigade?.brigadier_id ?? '',
    });

    const save = (e) => {
        e.preventDefault();
        patch(route('manager.brigades.update', brigade.id), {
            preserveScroll: true,
        });
    };

    const addMember = (e) => {
        e.preventDefault();
        if (!memberId) {
            return;
        }

        router.post(
            route('manager.brigades.members.store', brigade.id),
            { user_id: memberId },
            {
                preserveScroll: true,
                onSuccess: () => setMemberId(''),
            },
        );
    };

    const removeMember = (event, member) => {
        event.stopPropagation();
        event.preventDefault();

        if (!confirm(`Убрать ${member.name} из бригады?`)) {
            return;
        }

        router.delete(
            route('manager.brigades.members.destroy', [brigade.id, member.id]),
            { preserveScroll: true },
        );
    };

    return (
        <AppLayout>
            <Head title={brigadeTitle(brigade)} />

            <PageHeader
                eyebrow="Бригада"
                title={brigadeTitle(brigade)}
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

            {flash.success && (
                <div className="mb-4 rounded-2xl bg-[var(--surface-muted)] px-4 py-3 text-sm font-medium ring-1 ring-[var(--bezel-ring)]">
                    {flash.success}
                </div>
            )}

            <BezelCard className="mb-6" padding="p-5 sm:p-6">
                <h2 className="mb-4 font-bold">Параметры</h2>
                <form onSubmit={save} className="grid gap-4 sm:grid-cols-2">
                    <div>
                        <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.15em] text-[var(--muted)]">
                            Название
                        </label>
                        <input
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                            className="input-soft"
                        />
                        {errors.name && (
                            <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                        )}
                    </div>
                    <div>
                        <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.15em] text-[var(--muted)]">
                            Бригадир
                        </label>
                        <SoftSelect
                            value={data.brigadier_id}
                            onChange={(next) => setData('brigadier_id', next)}
                            options={[
                                { value: '', label: 'Не назначен' },
                                ...brigadiers.map((user) => ({
                                    value: user.id,
                                    label: user.name,
                                })),
                            ]}
                        />
                    </div>
                    <div className="sm:col-span-2">
                        <button
                            type="submit"
                            disabled={processing}
                            className="rounded-full bg-[var(--accent)] px-6 py-3 text-sm font-semibold text-[var(--bg)] disabled:opacity-50"
                        >
                            {processing ? 'Сохранение…' : 'Сохранить'}
                        </button>
                    </div>
                </form>
            </BezelCard>

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
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[var(--bezel)]">
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

                <form
                    onSubmit={addMember}
                    className="flex flex-col gap-3 border-b border-[var(--bezel-ring)] px-5 py-4 sm:flex-row sm:items-end sm:px-6"
                >
                    <div className="min-w-0 flex-1">
                        <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.15em] text-[var(--muted)]">
                            Добавить сотрудника
                        </label>
                        <SoftSelect
                            value={memberId}
                            onChange={setMemberId}
                            options={[
                                { value: '', label: 'Выберите сотрудника' },
                                ...availableWorkers.map((worker) => ({
                                    value: worker.id,
                                    label: worker.position
                                        ? `${worker.name} · ${worker.position}`
                                        : worker.name,
                                })),
                            ]}
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={!memberId}
                        className="inline-flex items-center justify-center gap-2 rounded-full bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-[var(--bg)] disabled:opacity-50"
                    >
                        <Plus size={16} weight="light" />
                        Добавить
                    </button>
                </form>

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
                                className="flex cursor-pointer items-center justify-between gap-4 px-5 py-4 transition-fluid hover:bg-[var(--surface-muted)] active:bg-[var(--bezel)] sm:px-6"
                            >
                                <div className="min-w-0">
                                    <p className="truncate font-semibold text-[var(--ink)]">
                                        {member.name}
                                    </p>
                                    <p className="truncate text-sm text-[var(--muted)]">
                                        {member.position ?? 'Строитель'}
                                        {member.phone ? ` · ${member.phone}` : ''}
                                    </p>
                                </div>
                                <div className="flex shrink-0 items-center gap-2">
                                    <StatusBadge
                                        status={member.is_working ? 'working' : 'absent'}
                                    />
                                    <button
                                        type="button"
                                        onClick={(event) =>
                                            removeMember(event, member)
                                        }
                                        className="rounded-full p-2 text-[var(--muted)] hover:bg-red-500/10 hover:text-red-600"
                                        aria-label="Убрать из бригады"
                                    >
                                        <Trash size={16} weight="light" />
                                    </button>
                                </div>
                            </motion.li>
                        ))
                    )}
                </ul>
            </BezelCard>
        </AppLayout>
    );
}
