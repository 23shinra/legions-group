import BezelCard from '@/Components/ui/BezelCard';
import IslandButton from '@/Components/ui/IslandButton';
import AccountManagerSettings from '@/Components/AccountManagerSettings';
import ManagerEmployeesSettings from '@/Components/ManagerEmployeesSettings';
import PageHeader from '@/Components/ui/PageHeader';
import useNotificationPermission from '@/hooks/useNotificationPermission';
import useTheme from '@/hooks/useTheme';
import AppLayout from '@/Layouts/AppLayout';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import { AnimatePresence, motion } from 'framer-motion';
import {
    Bell,
    BellRinging,
    BellSlash,
    Check,
    Key,
    Moon,
    SignOut,
    Sun,
    UserCircle,
    WarningCircle,
} from '@phosphor-icons/react';
import { useRef, useState } from 'react';

const ROLE_LABELS = {
    worker: 'Сотрудник',
    brigadier: 'Бригадир',
    manager: 'Руководитель',
    accountant: 'Бухгалтер',
};

const fadeUp = {
    initial: { opacity: 0, y: 24 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.7, ease: [0.32, 0.72, 0, 1] },
};

export default function Index({ status, brigades = [], payTypes = [] }) {
    const { auth } = usePage().props;
    const user = auth?.user;
    const { theme, setTheme } = useTheme();
    const {
        busy: notifBusy,
        error: notifError,
        supported: notifSupported,
        isGranted,
        isDenied,
        requestPermission,
    } = useNotificationPermission();
    const [logoutOpen, setLogoutOpen] = useState(false);
    const [loggingOut, setLoggingOut] = useState(false);
    const passwordInput = useRef(null);
    const currentPasswordInput = useRef(null);

    const { data, setData, put, errors, processing, recentlySuccessful, reset } =
        useForm({
            current_password: '',
            password: '',
            password_confirmation: '',
        });

    const submitPassword = (e) => {
        e.preventDefault();
        put(route('password.update'), {
            preserveScroll: true,
            onSuccess: () => reset(),
            onError: (errs) => {
                if (errs.password) {
                    reset('password', 'password_confirmation');
                    passwordInput.current?.focus();
                }
                if (errs.current_password) {
                    reset('current_password');
                    currentPasswordInput.current?.focus();
                }
            },
        });
    };

    const confirmLogout = () => {
        setLoggingOut(true);
        router.post(route('logout'), {}, {
            onFinish: () => setLoggingOut(false),
        });
    };

    return (
        <AppLayout title="Настройки">
            <Head title="Настройки" />

            <PageHeader
                eyebrow="Аккаунт"
                title="Настройки"
                subtitle={
                    user?.role === 'manager'
                        ? 'Аккаунты, сотрудники, тема, уведомления, пароль и выход'
                        : 'Тема, уведомления, пароль и выход'
                }
            />

            {user?.role === 'manager' && (
                <>
                    <AccountManagerSettings />
                    <ManagerEmployeesSettings
                        brigades={brigades}
                        payTypes={payTypes}
                        status={status}
                    />
                </>
            )}

            <div className="grid gap-5 sm:gap-6 lg:grid-cols-12 lg:gap-8">
                <motion.div
                    {...fadeUp}
                    transition={{ ...fadeUp.transition, delay: 0.05 }}
                    className="lg:col-span-5"
                >
                    <BezelCard padding="p-5 sm:p-7">
                        <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--bezel)] text-[var(--ink)]">
                            <UserCircle size={24} weight="light" />
                        </div>
                        <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[var(--muted)]">
                            Профиль
                        </p>
                        <h2 className="mt-2 truncate text-2xl font-extrabold tracking-tight text-[var(--ink)]">
                            {user?.name}
                        </h2>
                        <p className="mt-1 text-sm text-[var(--muted)]">
                            {ROLE_LABELS[user?.role] ?? user?.role}
                        </p>
                    </BezelCard>
                </motion.div>

                <motion.div
                    {...fadeUp}
                    transition={{ ...fadeUp.transition, delay: 0.1 }}
                    className="lg:col-span-7"
                >
                    <BezelCard padding="p-5 sm:p-7">
                        <div className="mb-5 flex items-start justify-between gap-4">
                            <div>
                                <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[var(--muted)]">
                                    Оформление
                                </p>
                                <h2 className="mt-2 text-xl font-extrabold tracking-tight text-[var(--ink)] sm:text-2xl">
                                    Тема интерфейса
                                </h2>
                                <p className="mt-1.5 text-sm text-[var(--muted)]">
                                    Светлая или тёмная — на ваш выбор
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
                            {[
                                {
                                    id: 'light',
                                    label: 'Светлая',
                                    icon: Sun,
                                },
                                {
                                    id: 'dark',
                                    label: 'Тёмная',
                                    icon: Moon,
                                },
                            ].map(({ id, label, icon: Icon }) => {
                                const active = theme === id;
                                return (
                                    <button
                                        key={id}
                                        type="button"
                                        onClick={() => setTheme(id)}
                                        className={`flex min-h-14 items-center gap-3 rounded-2xl px-4 py-3.5 text-left transition-fluid active:scale-[0.98] ${
                                            active
                                                ? 'bg-[var(--accent)] text-[var(--bg)] shadow-soft'
                                                : 'bg-[var(--surface-muted)] text-[var(--ink)] ring-1 ring-[var(--bezel-ring)] hover:bg-[var(--bezel)]'
                                        }`}
                                    >
                                        <span
                                            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                                                active
                                                    ? 'bg-[var(--bg)]/15'
                                                    : 'bg-[var(--bezel)]'
                                            }`}
                                        >
                                            <Icon size={18} weight="light" />
                                        </span>
                                        <span className="flex-1 text-sm font-semibold">
                                            {label}
                                        </span>
                                        {active && (
                                            <Check size={18} weight="light" />
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </BezelCard>
                </motion.div>

                <motion.div
                    {...fadeUp}
                    transition={{ ...fadeUp.transition, delay: 0.12 }}
                    className="lg:col-span-12"
                >
                    <BezelCard padding="p-5 sm:p-6">
                        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex min-w-0 items-start gap-3">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--bezel)] text-[var(--ink)]">
                                    {isGranted ? (
                                        <BellRinging size={20} weight="light" />
                                    ) : isDenied ? (
                                        <BellSlash size={20} weight="light" />
                                    ) : (
                                        <Bell size={20} weight="light" />
                                    )}
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[var(--muted)]">
                                        PWA
                                    </p>
                                    <h2 className="mt-0.5 text-lg font-extrabold tracking-tight text-[var(--ink)] sm:text-xl">
                                        Уведомления
                                    </h2>
                                    <p className="mt-1.5 text-sm text-[var(--muted)]">
                                        {!notifSupported
                                            ? 'Браузер не поддерживает уведомления'
                                            : isGranted
                                              ? 'Разрешены — авансы и другие события придут даже если приложение закрыто'
                                              : isDenied
                                                ? 'Заблокированы. Откройте установленное приложение → настройки сайта → уведомления'
                                                : 'Разрешите уведомления в установленном приложении Legionis'}
                                    </p>
                                    {notifError && (
                                        <p className="mt-2 flex items-center gap-1.5 text-sm text-[var(--muted)]">
                                            <WarningCircle
                                                size={16}
                                                weight="light"
                                            />
                                            {notifError}
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="flex shrink-0 flex-col items-stretch gap-2 sm:items-end">
                                <span
                                    className={`inline-flex w-fit items-center rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] ring-1 ${
                                        isGranted
                                            ? 'bg-emerald-500/15 text-emerald-700 ring-emerald-500/30'
                                            : isDenied
                                              ? 'bg-red-500/15 text-red-700 ring-red-500/30'
                                              : 'bg-[var(--bezel)] text-[var(--muted)] ring-[var(--bezel-ring)]'
                                    }`}
                                >
                                    {!notifSupported
                                        ? 'Недоступно'
                                        : isGranted
                                          ? 'Включены'
                                          : isDenied
                                            ? 'Запрещены'
                                            : 'Выкл'}
                                </span>

                                {notifSupported && !isGranted && !isDenied && (
                                    <IslandButton
                                        icon={BellRinging}
                                        onClick={requestPermission}
                                        disabled={notifBusy}
                                        className="justify-center"
                                    >
                                        {notifBusy
                                            ? 'Запрос…'
                                            : 'Разрешить уведомления'}
                                    </IslandButton>
                                )}

                                {notifSupported && isDenied && (
                                    <p className="max-w-[16rem] text-right text-xs text-[var(--muted)]">
                                        Откройте замок в адресной строке →
                                        Уведомления → Разрешить
                                    </p>
                                )}
                            </div>
                        </div>
                    </BezelCard>
                </motion.div>

                <motion.div
                    {...fadeUp}
                    transition={{ ...fadeUp.transition, delay: 0.15 }}
                    className="lg:col-span-7"
                >
                    <BezelCard padding="p-5 sm:p-6">
                        <div className="mb-4 flex items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--bezel)] text-[var(--ink)]">
                                <Key size={20} weight="light" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[var(--muted)]">
                                    Безопасность
                                </p>
                                <h2 className="mt-0.5 text-lg font-extrabold tracking-tight text-[var(--ink)] sm:text-xl">
                                    Смена пароля
                                </h2>
                            </div>
                        </div>

                        <form
                            onSubmit={submitPassword}
                            className="grid gap-3 sm:grid-cols-2 sm:gap-3.5"
                        >
                            <div className="sm:col-span-2">
                                <label
                                    htmlFor="current_password"
                                    className="mb-1.5 block text-sm font-medium text-[var(--muted)]"
                                >
                                    Текущий пароль
                                </label>
                                <input
                                    id="current_password"
                                    ref={currentPasswordInput}
                                    type="password"
                                    value={data.current_password}
                                    onChange={(e) =>
                                        setData(
                                            'current_password',
                                            e.target.value,
                                        )
                                    }
                                    autoComplete="current-password"
                                    className="input-soft"
                                />
                                {errors.current_password && (
                                    <p className="mt-1.5 text-sm text-[var(--muted)]">
                                        {errors.current_password}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label
                                    htmlFor="password"
                                    className="mb-1.5 block text-sm font-medium text-[var(--muted)]"
                                >
                                    Новый пароль
                                </label>
                                <input
                                    id="password"
                                    ref={passwordInput}
                                    type="password"
                                    value={data.password}
                                    onChange={(e) =>
                                        setData('password', e.target.value)
                                    }
                                    autoComplete="new-password"
                                    className="input-soft"
                                />
                                {errors.password && (
                                    <p className="mt-1.5 text-sm text-[var(--muted)]">
                                        {errors.password}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label
                                    htmlFor="password_confirmation"
                                    className="mb-1.5 block text-sm font-medium text-[var(--muted)]"
                                >
                                    Повтор пароля
                                </label>
                                <input
                                    id="password_confirmation"
                                    type="password"
                                    value={data.password_confirmation}
                                    onChange={(e) =>
                                        setData(
                                            'password_confirmation',
                                            e.target.value,
                                        )
                                    }
                                    autoComplete="new-password"
                                    className="input-soft"
                                />
                                {errors.password_confirmation && (
                                    <p className="mt-1.5 text-sm text-[var(--muted)]">
                                        {errors.password_confirmation}
                                    </p>
                                )}
                            </div>

                            <div className="flex flex-wrap items-center gap-3 pt-1 sm:col-span-2">
                                <IslandButton
                                    type="submit"
                                    disabled={processing}
                                    icon={Check}
                                >
                                    {processing
                                        ? 'Сохранение…'
                                        : 'Сохранить пароль'}
                                </IslandButton>
                                {(recentlySuccessful ||
                                    status === 'password-updated') && (
                                    <span className="text-sm font-medium text-[var(--muted)]">
                                        Пароль обновлён
                                    </span>
                                )}
                            </div>
                        </form>
                    </BezelCard>
                </motion.div>

                <motion.div
                    {...fadeUp}
                    transition={{ ...fadeUp.transition, delay: 0.2 }}
                    className="lg:col-span-5"
                >
                    <BezelCard
                        padding="p-5 sm:p-6"
                        className="h-full"
                        innerClassName="flex h-full flex-col justify-between gap-6"
                    >
                        <div className="min-w-0">
                            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-[var(--bezel)] text-[var(--ink)]">
                                <SignOut size={20} weight="light" />
                            </div>
                            <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[var(--muted)]">
                                Сессия
                            </p>
                            <h2 className="mt-1 text-lg font-extrabold tracking-tight text-[var(--ink)] sm:text-xl">
                                Выход из аккаунта
                            </h2>
                            <p className="mt-1.5 text-sm text-[var(--muted)]">
                                Завершить текущую сессию на этом устройстве
                            </p>
                        </div>
                        <IslandButton
                            variant="danger"
                            icon={SignOut}
                            onClick={() => setLogoutOpen(true)}
                            className="w-full justify-center"
                        >
                            Выйти
                        </IslandButton>
                    </BezelCard>
                </motion.div>
            </div>

            <AnimatePresence>
                {logoutOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{
                            duration: 0.35,
                            ease: [0.32, 0.72, 0, 1],
                        }}
                        className="fixed inset-0 z-50 flex items-end justify-center bg-[var(--overlay)] px-4 pb-[max(1rem,var(--safe-bottom))] backdrop-blur-sm sm:items-center sm:pb-4"
                        onClick={() => !loggingOut && setLogoutOpen(false)}
                    >
                        <motion.div
                            initial={{ opacity: 0, y: 40, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 24, scale: 0.98 }}
                            transition={{
                                duration: 0.45,
                                ease: [0.32, 0.72, 0, 1],
                            }}
                            className="w-full max-w-sm rounded-[1.75rem] bg-[var(--bezel)] p-1.5 shadow-lift sm:rounded-[2rem]"
                            onClick={(e) => e.stopPropagation()}
                            role="dialog"
                            aria-modal="true"
                            aria-labelledby="settings-logout-title"
                        >
                            <div className="rounded-[calc(1.75rem-0.375rem)] bg-[var(--surface)] p-5 sm:rounded-[calc(2rem-0.375rem)] sm:p-8">
                                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-[var(--bezel)] text-[var(--ink)] sm:mb-5 sm:h-12 sm:w-12">
                                    <SignOut size={22} weight="light" />
                                </div>
                                <h2
                                    id="settings-logout-title"
                                    className="text-xl font-extrabold tracking-tight text-[var(--ink)] sm:text-2xl"
                                >
                                    Выйти из аккаунта?
                                </h2>
                                <p className="mt-2 text-sm text-[var(--muted)]">
                                    Сессия будет завершена. Чтобы продолжить
                                    работу, потребуется войти снова.
                                </p>

                                <div className="mt-6 flex flex-col gap-2.5 sm:mt-8 sm:flex-row-reverse sm:gap-3">
                                    <button
                                        type="button"
                                        onClick={confirmLogout}
                                        disabled={loggingOut}
                                        className="min-h-12 flex-1 rounded-full bg-[var(--accent)] px-5 py-3 text-base font-semibold text-[var(--bg)] transition-fluid hover:opacity-90 active:scale-[0.98] disabled:opacity-60"
                                    >
                                        {loggingOut ? 'Выход…' : 'Да, выйти'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setLogoutOpen(false)}
                                        disabled={loggingOut}
                                        className="min-h-12 flex-1 rounded-full bg-[var(--surface)] px-5 py-3 text-base font-semibold text-[var(--ink)] ring-1 ring-[var(--bezel-ring)] transition-fluid hover:bg-[var(--surface-muted)] active:scale-[0.98] disabled:opacity-60"
                                    >
                                        Отмена
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </AppLayout>
    );
}
