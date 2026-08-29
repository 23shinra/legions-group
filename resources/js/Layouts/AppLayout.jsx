import BrandLogo from '@/Components/BrandLogo';
import NotificationBell from '@/Components/NotificationBell';
import { Link, router, usePage } from '@inertiajs/react';
import { AnimatePresence, motion } from 'framer-motion';
import {
    Buildings,
    Calculator,
    CalendarBlank,
    ChartBar,
    Clock,
    CurrencyCircleDollar,
    FileText,
    GearSix,
    House,
    SignOut,
    Users,
    UsersThree,
    Wallet,
} from '@phosphor-icons/react';
import { useEffect, useState } from 'react';

const ROLE_LINKS = {
    worker: [
        { href: 'worker.home', label: 'Главная', icon: House },
        { href: 'worker.salary', label: 'Зарплата', icon: Wallet },
        { href: 'worker.advances', label: 'Авансы', icon: CurrencyCircleDollar },
        { href: 'worker.hours', label: 'Часы', icon: Clock },
    ],
    brigadier: [
        { href: 'brigadier.home', label: 'Бригада', icon: UsersThree },
        { href: 'brigadier.advances.index', label: 'Авансы', icon: CurrencyCircleDollar },
    ],
    manager: [
        { href: 'manager.dashboard', label: 'Обзор', icon: ChartBar },
        { href: 'manager.employees.index', label: 'Сотрудники', icon: Users },
        { href: 'manager.brigades.index', label: 'Бригады', icon: UsersThree },
        { href: 'manager.objects.index', label: 'Объекты', icon: Buildings },
        { href: 'manager.schedule.index', label: 'График', icon: CalendarBlank },
        { href: 'manager.advances.index', label: 'Авансы', icon: CurrencyCircleDollar },
        { href: 'manager.reports.index', label: 'Отчёты', icon: FileText },
        { href: 'manager.activity.index', label: 'Журнал', icon: Clock },
    ],
    accountant: [
        { href: 'accountant.dashboard', label: 'Финансы', icon: Calculator },
        { href: 'accountant.advances.index', label: 'Авансы', icon: CurrencyCircleDollar },
        { href: 'accountant.payments.index', label: 'Выплаты', icon: Wallet },
        { href: 'accountant.reports.index', label: 'Отчёты', icon: FileText },
        { href: 'accountant.activity.index', label: 'Журнал', icon: Clock },
    ],
};

const ROLE_LABELS = {
    worker: 'Сотрудник',
    brigadier: 'Бригадир',
    manager: 'Руководитель',
    accountant: 'Бухгалтер',
};

function NavLinkItem({ href, label, icon: Icon, active, onClick }) {
    return (
        <Link
            href={route(href)}
            onClick={onClick}
            className={`flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[13px] font-medium transition-fluid xl:gap-2 xl:px-3.5 xl:py-2 xl:text-sm ${
                active
                    ? 'bg-[var(--accent)] text-[var(--bg)] shadow-soft'
                    : 'text-[var(--muted)] hover:bg-[var(--bezel)] hover:text-[var(--ink)]'
            }`}
        >
            <Icon size={16} weight="light" className="hidden xl:block" />
            <span>{label}</span>
        </Link>
    );
}

export default function AppLayout({ children, title }) {
    const { auth } = usePage().props;
    const user = auth?.user;
    const role = user?.role ?? 'worker';
    const links = ROLE_LINKS[role] ?? ROLE_LINKS.worker;
    const [menuOpen, setMenuOpen] = useState(false);
    const [logoutOpen, setLogoutOpen] = useState(false);
    const [loggingOut, setLoggingOut] = useState(false);

    useEffect(() => {
        const locked = menuOpen || logoutOpen;
        document.body.classList.toggle('menu-locked', locked);
        return () => document.body.classList.remove('menu-locked');
    }, [menuOpen, logoutOpen]);

    const isActive = (routeName) => {
        try {
            return route().current(routeName) || route().current(routeName.replace('.index', '.*'));
        } catch {
            return false;
        }
    };

    const settingsActive = (() => {
        try {
            return route().current('settings');
        } catch {
            return false;
        }
    })();

    const openLogout = () => {
        setMenuOpen(false);
        setLogoutOpen(true);
    };

    const confirmLogout = () => {
        setLoggingOut(true);
        router.post(route('logout'), {}, {
            onFinish: () => setLoggingOut(false),
        });
    };

    return (
        <div className="relative min-h-[100dvh] bg-[var(--bg)]">
            <div className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(ellipse_at_20%_0%,rgba(0,0,0,0.04),transparent_50%)]" />

            <nav className="fixed inset-x-0 top-0 z-40 px-2 pt-[max(0.5rem,var(--safe-top))] sm:px-3 sm:pt-4 lg:px-4 lg:pt-5">
                <div className="mx-auto flex w-full max-w-[1600px] items-center justify-between gap-2 lg:gap-3">
                    <Link
                        href={route(links[0]?.href ?? 'dashboard')}
                        className="block h-[52px] w-[60px] shrink-0 overflow-hidden rounded-full bg-black shadow-soft transition-fluid hover:opacity-90 sm:h-14 sm:w-16"
                    >
                        <BrandLogo variant="nav" />
                    </Link>

                    <div className="hidden min-w-0 flex-1 items-center justify-center lg:flex">
                        <div className="flex max-w-full items-center gap-0.5 overflow-x-auto rounded-full bg-[var(--nav-glass)] p-1 shadow-soft backdrop-blur-xl [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                            {links.map((link) => (
                                <NavLinkItem
                                    key={link.href}
                                    {...link}
                                    active={isActive(link.href)}
                                />
                            ))}
                        </div>
                    </div>

                    <div className="hidden min-w-0 shrink items-center gap-2 lg:flex">
                        <span
                            className="max-w-[11rem] truncate rounded-full bg-[var(--bezel)] px-3 py-1.5 text-xs font-medium text-[var(--muted)] xl:max-w-[16rem] 2xl:max-w-[22rem]"
                            title={user?.name ?? undefined}
                        >
                            {user?.name ?? ROLE_LABELS[role] ?? role}
                        </span>
                        <NotificationBell />
                        <Link
                            href={route('settings')}
                            aria-label="Настройки"
                            className={`flex h-10 w-10 items-center justify-center rounded-full shadow-soft backdrop-blur-xl transition-fluid ${
                                settingsActive
                                    ? 'bg-[var(--accent)] text-[var(--bg)]'
                                    : 'bg-[var(--nav-glass)] text-[var(--muted)] hover:text-[var(--ink)]'
                            }`}
                        >
                            <GearSix size={18} weight="light" />
                        </Link>
                    </div>

                    <div className="flex items-center gap-2 lg:hidden">
                        <NotificationBell />
                        <button
                            type="button"
                            onClick={() => setMenuOpen((o) => !o)}
                            className="relative z-50 flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--nav-glass)] shadow-soft backdrop-blur-xl transition-fluid"
                            aria-label={menuOpen ? 'Закрыть меню' : 'Открыть меню'}
                        >
                            <span
                                className={`absolute h-0.5 w-5 rounded-full bg-[var(--ink)] transition-fluid ${menuOpen ? 'translate-y-0 rotate-45' : '-translate-y-1.5'}`}
                            />
                            <span
                                className={`absolute h-0.5 w-5 rounded-full bg-[var(--ink)] transition-fluid ${menuOpen ? 'opacity-0' : ''}`}
                            />
                            <span
                                className={`absolute h-0.5 w-5 rounded-full bg-[var(--ink)] transition-fluid ${menuOpen ? 'translate-y-0 -rotate-45' : 'translate-y-1.5'}`}
                            />
                        </button>
                    </div>
                </div>
            </nav>

            <AnimatePresence>
                {menuOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
                        className="fixed inset-0 z-30 overflow-y-auto bg-[var(--surface)]/95 backdrop-blur-3xl lg:hidden"
                    >
                        <div className="flex min-h-[100dvh] flex-col px-5 pb-[max(1.5rem,var(--safe-bottom))] pt-24">
                            <div className="mb-6">
                                <p className="truncate text-base font-semibold text-[var(--ink)]">
                                    {user?.name}
                                </p>
                                <p className="mt-0.5 text-sm text-[var(--muted)]">
                                    {ROLE_LABELS[role] ?? role}
                                </p>
                            </div>

                            <nav className="flex flex-col gap-1">
                                {links.map((link, i) => (
                                    <motion.div
                                        key={link.href}
                                        initial={{ opacity: 0, y: 24 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{
                                            delay: 0.05 + i * 0.04,
                                            duration: 0.55,
                                            ease: [0.32, 0.72, 0, 1],
                                        }}
                                    >
                                        <Link
                                            href={route(link.href)}
                                            onClick={() => setMenuOpen(false)}
                                            className={`flex min-h-14 items-center gap-4 rounded-2xl px-4 py-3.5 text-xl font-bold transition-fluid active:scale-[0.99] ${
                                                isActive(link.href)
                                                    ? 'bg-[var(--accent)] text-[var(--bg)]'
                                                    : 'text-[var(--ink)] hover:bg-[var(--bezel)]'
                                            }`}
                                        >
                                            <link.icon size={24} weight="light" />
                                            {link.label}
                                        </Link>
                                    </motion.div>
                                ))}

                                <motion.div
                                    initial={{ opacity: 0, y: 24 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{
                                        delay: 0.05 + links.length * 0.04,
                                        duration: 0.55,
                                        ease: [0.32, 0.72, 0, 1],
                                    }}
                                >
                                    <Link
                                        href={route('settings')}
                                        onClick={() => setMenuOpen(false)}
                                        className={`flex min-h-14 items-center gap-4 rounded-2xl px-4 py-3.5 text-xl font-bold transition-fluid active:scale-[0.99] ${
                                            settingsActive
                                                ? 'bg-[var(--accent)] text-[var(--bg)]'
                                                : 'text-[var(--ink)] hover:bg-[var(--bezel)]'
                                        }`}
                                    >
                                        <GearSix size={24} weight="light" />
                                        Настройки
                                    </Link>
                                </motion.div>
                            </nav>

                            <div className="mt-auto pt-8">
                                <button
                                    type="button"
                                    onClick={openLogout}
                                    className="flex min-h-14 w-full items-center justify-center gap-2 rounded-full bg-[var(--accent)] px-6 py-4 text-base font-semibold text-[var(--bg)]"
                                >
                                    <SignOut size={18} weight="light" />
                                    Выйти
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {logoutOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.35, ease: [0.32, 0.72, 0, 1] }}
                        className="fixed inset-0 z-50 flex items-end justify-center bg-[var(--overlay)] px-4 pb-[max(1rem,var(--safe-bottom))] backdrop-blur-sm sm:items-center sm:pb-4"
                        onClick={() => !loggingOut && setLogoutOpen(false)}
                    >
                        <motion.div
                            initial={{ opacity: 0, y: 40, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 24, scale: 0.98 }}
                            transition={{ duration: 0.45, ease: [0.32, 0.72, 0, 1] }}
                            className="w-full max-w-sm rounded-[1.75rem] bg-[var(--bezel)] p-1.5 shadow-lift sm:rounded-[2rem]"
                            onClick={(e) => e.stopPropagation()}
                            role="dialog"
                            aria-modal="true"
                            aria-labelledby="logout-title"
                        >
                            <div className="rounded-[calc(1.75rem-0.375rem)] bg-[var(--surface)] p-5 sm:rounded-[calc(2rem-0.375rem)] sm:p-8">
                                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-[var(--bezel)] text-[var(--ink)] sm:mb-5 sm:h-12 sm:w-12">
                                    <SignOut size={22} weight="light" />
                                </div>
                                <h2
                                    id="logout-title"
                                    className="text-xl font-extrabold tracking-tight text-[var(--ink)] sm:text-2xl"
                                >
                                    Выйти из аккаунта?
                                </h2>
                                <p className="mt-2 text-sm text-[var(--muted)]">
                                    Сессия будет завершена. Чтобы продолжить работу, потребуется войти снова.
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

            <main className="relative z-10 mx-auto w-full max-w-[1600px] px-3 pb-[max(3rem,calc(1.5rem+var(--safe-bottom)))] pt-[calc(4.5rem+var(--safe-top))] sm:px-4 sm:pt-28 lg:px-5 lg:pt-28">
                {title && (
                    <p className="sr-only">{title}</p>
                )}
                {children}
            </main>
        </div>
    );
}
