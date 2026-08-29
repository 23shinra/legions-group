import BezelCard from '@/Components/ui/BezelCard';
import IslandButton from '@/Components/ui/IslandButton';
import PageHeader from '@/Components/ui/PageHeader';
import StatusBadge from '@/Components/ui/StatusBadge';
import AppLayout from '@/Layouts/AppLayout';
import { Head, Link, router } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { ArrowLeft, MagnifyingGlass, UsersThree } from '@phosphor-icons/react';
import { useMemo, useState } from 'react';

const ROLE_LABELS = {
    worker: 'Строитель',
    brigadier: 'Бригадир',
    manager: 'Руководитель',
    accountant: 'Бухгалтер',
};

export default function Index({ accounts = [], filters = {}, status }) {
    const [query, setQuery] = useState(filters.q ?? '');

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();

        if (!q) {
            return accounts;
        }

        return accounts.filter((account) => {
            const haystack = [
                account.name,
                account.email,
                account.first_name,
                account.last_name,
                account.phone,
                account.role_label,
            ]
                .filter(Boolean)
                .join(' ')
                .toLowerCase();

            return haystack.includes(q);
        });
    }, [accounts, query]);

    const applySearch = (e) => {
        e.preventDefault();
        router.get(
            route('manager.accounts.index'),
            { q: query.trim() || undefined },
            { preserveState: true, replace: true },
        );
    };

    return (
        <AppLayout title="Менеджер аккаунтов">
            <Head title="Менеджер аккаунтов" />

            <PageHeader
                eyebrow="Настройки"
                title="Менеджер аккаунтов"
                subtitle="Логины, роли, активность и пароли всех пользователей"
                actions={
                    <IslandButton
                        href={route('settings')}
                        variant="secondary"
                        icon={ArrowLeft}
                    >
                        Назад
                    </IslandButton>
                }
            />

            {status === 'account-updated' && (
                <div className="mb-5 rounded-2xl bg-[var(--surface-muted)] px-4 py-3 text-sm font-medium text-[var(--ink)] ring-1 ring-[var(--bezel-ring)]">
                    Изменения сохранены
                </div>
            )}

            <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, ease: [0.32, 0.72, 0, 1] }}
            >
                <BezelCard padding="p-5 sm:p-7">
                    <form
                        onSubmit={applySearch}
                        className="mb-6 flex flex-col gap-3 sm:flex-row"
                    >
                        <div className="relative flex-1">
                            <MagnifyingGlass
                                size={18}
                                weight="light"
                                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[var(--muted)]"
                            />
                            <input
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Поиск по имени или логину"
                                className="w-full rounded-2xl border-0 bg-[var(--surface-muted)] py-3.5 pl-11 pr-4 text-[var(--ink)] outline-none ring-1 ring-[var(--bezel-ring)] transition-fluid focus:ring-2 focus:ring-[var(--accent)]"
                            />
                        </div>
                        <IslandButton type="submit" className="justify-center">
                            Найти
                        </IslandButton>
                    </form>

                    <div className="divide-y divide-[var(--bezel-ring)]">
                        {filtered.map((account) => (
                            <Link
                                key={account.id}
                                href={route('manager.accounts.edit', account.id)}
                                className="flex items-center gap-4 py-4 transition-fluid first:pt-0 last:pb-0 hover:opacity-80"
                            >
                                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--bezel)] text-[var(--ink)]">
                                    <UsersThree size={20} weight="light" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="truncate font-semibold text-[var(--ink)]">
                                        {account.name}
                                    </p>
                                    <p className="mt-0.5 truncate text-sm text-[var(--muted)]">
                                        {account.email}
                                        {account.phone ? ` · ${account.phone}` : ''}
                                    </p>
                                </div>
                                <div className="flex shrink-0 flex-col items-end gap-1.5">
                                    <span className="text-xs font-medium uppercase tracking-[0.12em] text-[var(--muted)]">
                                        {ROLE_LABELS[account.role] ??
                                            account.role_label}
                                    </span>
                                    {!account.is_active && (
                                        <StatusBadge
                                            status="closed"
                                            label="Неактивен"
                                        />
                                    )}
                                </div>
                            </Link>
                        ))}

                        {filtered.length === 0 && (
                            <p className="py-8 text-center text-sm text-[var(--muted)]">
                                Никого не найдено
                            </p>
                        )}
                    </div>
                </BezelCard>
            </motion.div>
        </AppLayout>
    );
}
