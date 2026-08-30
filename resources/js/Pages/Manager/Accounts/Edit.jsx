import BezelCard from '@/Components/ui/BezelCard';
import IslandButton from '@/Components/ui/IslandButton';
import PageHeader from '@/Components/ui/PageHeader';
import SoftSelect from '@/Components/ui/SoftSelect';
import AppLayout from '@/Layouts/AppLayout';
import { brigadeTitle } from '@/lib/format';
import { Head, Link, useForm } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { ArrowLeft, Check, Key } from '@phosphor-icons/react';

const fieldClass =
    'w-full rounded-2xl border-0 bg-[var(--surface-muted)] px-4 py-3.5 text-[var(--ink)] outline-none ring-1 ring-[var(--bezel-ring)] transition-fluid focus:ring-2 focus:ring-[var(--accent)]';

const labelClass =
    'mb-2 block text-xs font-semibold uppercase tracking-[0.15em] text-[var(--muted)]';

export default function Edit({ account, roles = [], status }) {
    const form = useForm({
        first_name: account.first_name ?? '',
        last_name: account.last_name ?? '',
        name: account.name ?? '',
        email: account.email ?? '',
        phone: account.phone ?? '',
        role: account.role ?? 'worker',
        is_active: account.is_active !== false,
    });

    const passwordForm = useForm({
        password: '',
        password_confirmation: '',
    });

    const submit = (e) => {
        e.preventDefault();
        form.patch(route('manager.accounts.update', account.id), {
            preserveScroll: true,
        });
    };

    const submitPassword = (e) => {
        e.preventDefault();
        passwordForm.patch(route('manager.accounts.password', account.id), {
            preserveScroll: true,
            onSuccess: () => passwordForm.reset(),
        });
    };

    return (
        <AppLayout title={account.name}>
            <Head title={account.name} />

            <PageHeader
                eyebrow="Аккаунт"
                title={account.name}
                subtitle={account.email}
                actions={
                    <IslandButton
                        href={route('manager.accounts.index')}
                        variant="secondary"
                        icon={ArrowLeft}
                    >
                        К списку
                    </IslandButton>
                }
            />

            {(status === 'account-updated' ||
                status === 'account-password-updated') && (
                <div className="mb-5 rounded-2xl bg-[var(--surface-muted)] px-4 py-3 text-sm font-medium text-[var(--ink)] ring-1 ring-[var(--bezel-ring)]">
                    {status === 'account-password-updated'
                        ? 'Пароль обновлён'
                        : 'Изменения сохранены'}
                </div>
            )}

            <div className="grid gap-5 lg:grid-cols-12 lg:gap-8">
                <motion.div
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, ease: [0.32, 0.72, 0, 1] }}
                    className="lg:col-span-7"
                >
                    <BezelCard padding="p-5 sm:p-7">
                        <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
                            <div>
                                <label htmlFor="first_name" className={labelClass}>
                                    Имя
                                </label>
                                <input
                                    id="first_name"
                                    value={form.data.first_name}
                                    onChange={(e) =>
                                        form.setData('first_name', e.target.value)
                                    }
                                    className={fieldClass}
                                />
                                {form.errors.first_name && (
                                    <p className="mt-1.5 text-sm text-[var(--muted)]">
                                        {form.errors.first_name}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label htmlFor="last_name" className={labelClass}>
                                    Фамилия
                                </label>
                                <input
                                    id="last_name"
                                    value={form.data.last_name}
                                    onChange={(e) =>
                                        form.setData('last_name', e.target.value)
                                    }
                                    className={fieldClass}
                                />
                                {form.errors.last_name && (
                                    <p className="mt-1.5 text-sm text-[var(--muted)]">
                                        {form.errors.last_name}
                                    </p>
                                )}
                            </div>

                            <div className="sm:col-span-2">
                                <label htmlFor="display_name" className={labelClass}>
                                    Отображаемое имя
                                </label>
                                <input
                                    id="display_name"
                                    value={form.data.name}
                                    onChange={(e) =>
                                        form.setData('name', e.target.value)
                                    }
                                    className={fieldClass}
                                />
                                {form.errors.name && (
                                    <p className="mt-1.5 text-sm text-[var(--muted)]">
                                        {form.errors.name}
                                    </p>
                                )}
                            </div>

                            <div className="sm:col-span-2">
                                <label htmlFor="email" className={labelClass}>
                                    Логин
                                </label>
                                <input
                                    id="email"
                                    value={form.data.email}
                                    onChange={(e) =>
                                        form.setData('email', e.target.value)
                                    }
                                    className={fieldClass}
                                    autoComplete="username"
                                />
                                {form.errors.email && (
                                    <p className="mt-1.5 text-sm text-[var(--muted)]">
                                        {form.errors.email}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label htmlFor="phone" className={labelClass}>
                                    Телефон
                                </label>
                                <input
                                    id="phone"
                                    value={form.data.phone}
                                    onChange={(e) =>
                                        form.setData('phone', e.target.value)
                                    }
                                    className={fieldClass}
                                />
                                {form.errors.phone && (
                                    <p className="mt-1.5 text-sm text-[var(--muted)]">
                                        {form.errors.phone}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label htmlFor="role" className={labelClass}>
                                    Роль
                                </label>
                                <SoftSelect
                                    id="role"
                                    value={form.data.role}
                                    onChange={(next) => form.setData('role', next)}
                                    options={roles.map((role) => ({
                                        value: role.value,
                                        label: role.label,
                                    }))}
                                />
                                {form.errors.role && (
                                    <p className="mt-1.5 text-sm text-[var(--muted)]">
                                        {form.errors.role}
                                    </p>
                                )}
                            </div>

                            <div className="sm:col-span-2">
                                <label className="flex cursor-pointer items-center gap-3 rounded-2xl bg-[var(--surface-muted)] px-4 py-3.5 ring-1 ring-[var(--bezel-ring)]">
                                    <input
                                        type="checkbox"
                                        checked={form.data.is_active}
                                        onChange={(e) =>
                                            form.setData(
                                                'is_active',
                                                e.target.checked,
                                            )
                                        }
                                        className="h-4 w-4 rounded border-[var(--bezel-ring)]"
                                    />
                                    <span className="text-sm font-medium text-[var(--ink)]">
                                        Аккаунт активен
                                    </span>
                                </label>
                                {form.errors.is_active && (
                                    <p className="mt-1.5 text-sm text-[var(--muted)]">
                                        {form.errors.is_active}
                                    </p>
                                )}
                            </div>

                            <div className="sm:col-span-2">
                                <IslandButton
                                    type="submit"
                                    disabled={form.processing}
                                    icon={Check}
                                >
                                    {form.processing
                                        ? 'Сохранение…'
                                        : 'Сохранить'}
                                </IslandButton>
                            </div>
                        </form>
                    </BezelCard>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                        duration: 0.7,
                        ease: [0.32, 0.72, 0, 1],
                        delay: 0.08,
                    }}
                    className="lg:col-span-5"
                >
                    <BezelCard padding="p-5 sm:p-7">
                        <div className="mb-5 flex h-10 w-10 items-center justify-center rounded-full bg-[var(--bezel)] text-[var(--ink)]">
                            <Key size={20} weight="light" />
                        </div>
                        <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[var(--muted)]">
                            Безопасность
                        </p>
                        <h2 className="mt-1 text-xl font-extrabold tracking-tight text-[var(--ink)]">
                            Новый пароль
                        </h2>
                        <p className="mt-1.5 text-sm text-[var(--muted)]">
                            Установите пароль для входа. Текущий пароль не
                            показывается.
                        </p>

                        <form
                            onSubmit={submitPassword}
                            className="mt-5 grid gap-4"
                        >
                            <div>
                                <label htmlFor="password" className={labelClass}>
                                    Пароль
                                </label>
                                <input
                                    id="password"
                                    type="password"
                                    value={passwordForm.data.password}
                                    onChange={(e) =>
                                        passwordForm.setData(
                                            'password',
                                            e.target.value,
                                        )
                                    }
                                    className={fieldClass}
                                    autoComplete="new-password"
                                />
                                {passwordForm.errors.password && (
                                    <p className="mt-1.5 text-sm text-[var(--muted)]">
                                        {passwordForm.errors.password}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label
                                    htmlFor="password_confirmation"
                                    className={labelClass}
                                >
                                    Повтор пароля
                                </label>
                                <input
                                    id="password_confirmation"
                                    type="password"
                                    value={
                                        passwordForm.data.password_confirmation
                                    }
                                    onChange={(e) =>
                                        passwordForm.setData(
                                            'password_confirmation',
                                            e.target.value,
                                        )
                                    }
                                    className={fieldClass}
                                    autoComplete="new-password"
                                />
                            </div>

                            <IslandButton
                                type="submit"
                                disabled={passwordForm.processing}
                                icon={Key}
                            >
                                {passwordForm.processing
                                    ? 'Сохранение…'
                                    : 'Установить пароль'}
                            </IslandButton>
                        </form>

                        {account.brigade && (
                            <p className="mt-6 text-sm text-[var(--muted)]">
                                Бригада:{' '}
                                <Link
                                    href={route(
                                        'manager.brigades.show',
                                        account.brigade.id,
                                    )}
                                    className="font-medium text-[var(--ink)] underline-offset-2 hover:underline"
                                >
                                    {brigadeTitle(account.brigade)}
                                </Link>
                            </p>
                        )}
                    </BezelCard>
                </motion.div>
            </div>
        </AppLayout>
    );
}
