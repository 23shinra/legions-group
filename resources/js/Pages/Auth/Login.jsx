import BezelCard from '@/Components/ui/BezelCard';
import BrandLogo from '@/Components/BrandLogo';
import IslandButton from '@/Components/ui/IslandButton';
import { Head, router, useForm } from '@inertiajs/react';
import { motion } from 'framer-motion';
import {
    ArrowRight,
    Calculator,
    Eye,
    EyeSlash,
    HardHat,
    User,
    UsersThree,
} from '@phosphor-icons/react';
import { useState } from 'react';

const ROLE_ICONS = {
    manager: HardHat,
    accountant: Calculator,
    brigadier: UsersThree,
    worker: User,
};

export default function Login({ status, demoAccounts = [] }) {
    const [showPassword, setShowPassword] = useState(false);
    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: true,
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('login'), {
            onFinish: () => reset('password'),
        });
    };

    const quickLogin = (login) => {
        router.post(route('login'), {
            email: login,
            password: '123',
            remember: true,
        });
    };

    return (
        <>
            <Head title="Вход" />

            <div className="relative flex min-h-[100dvh] items-center justify-center overflow-x-hidden bg-[var(--bg)] px-4 py-10 sm:py-16">
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,rgba(0,0,0,0.05),transparent_55%)]" />

                <motion.div
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.9, ease: [0.32, 0.72, 0, 1] }}
                    className="relative w-full max-w-md pb-[max(1rem,var(--safe-bottom))] pt-[max(0.5rem,var(--safe-top))]"
                >
                    <div className="mb-6 text-center sm:mb-8">
                        <BrandLogo className="mb-4 sm:mb-5" />
                        <h1 className="text-2xl font-extrabold tracking-tight text-[var(--ink)] sm:text-3xl md:text-4xl">
                            Вход в систему
                        </h1>
                    </div>

                    <BezelCard padding="p-5 sm:p-8" className="mb-4 sm:mb-5">
                        {status && (
                            <div className="mb-5 rounded-2xl bg-[var(--surface-muted)] px-4 py-3 text-sm font-medium text-[var(--ink)] ring-1 ring-[var(--bezel-ring)] sm:mb-6">
                                {status}
                            </div>
                        )}

                        <form onSubmit={submit} className="space-y-4 sm:space-y-5">
                            <div>
                                <label
                                    htmlFor="email"
                                    className="mb-2 block text-xs font-semibold uppercase tracking-[0.15em] text-[var(--muted)]"
                                >
                                    Логин
                                </label>
                                <input
                                    id="email"
                                    type="text"
                                    name="email"
                                    value={data.email}
                                    autoComplete="username"
                                    autoFocus
                                    placeholder="worker1"
                                    onChange={(e) => setData('email', e.target.value)}
                                    className="input-soft"
                                />
                                {errors.email && (
                                    <p className="mt-2 text-sm text-[var(--muted)]">{errors.email}</p>
                                )}
                            </div>

                            <div>
                                <label
                                    htmlFor="password"
                                    className="mb-2 block text-xs font-semibold uppercase tracking-[0.15em] text-[var(--muted)]"
                                >
                                    Пароль
                                </label>
                                <div className="relative">
                                    <input
                                        id="password"
                                        type={showPassword ? 'text' : 'password'}
                                        name="password"
                                        value={data.password}
                                        autoComplete="current-password"
                                        placeholder="123"
                                        onChange={(e) => setData('password', e.target.value)}
                                        className="input-soft pr-12"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword((value) => !value)}
                                        className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-[var(--muted)] transition-fluid hover:text-[var(--ink)]"
                                        aria-label={showPassword ? 'Скрыть пароль' : 'Показать пароль'}
                                    >
                                        {showPassword ? (
                                            <EyeSlash size={20} weight="light" />
                                        ) : (
                                            <Eye size={20} weight="light" />
                                        )}
                                    </button>
                                </div>
                                {errors.password && (
                                    <p className="mt-2 text-sm text-[var(--muted)]">{errors.password}</p>
                                )}
                            </div>

                            <IslandButton
                                type="submit"
                                icon={ArrowRight}
                                disabled={processing}
                                className="w-full justify-center"
                            >
                                {processing ? 'Вход…' : 'Войти'}
                            </IslandButton>
                        </form>
                    </BezelCard>

                    <BezelCard padding="p-4 sm:p-5">
                        <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
                            Быстрый вход · пароль 123
                        </p>
                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                            {demoAccounts.map((account) => {
                                const Icon = ROLE_ICONS[account.role] ?? User;

                                return (
                                    <button
                                        key={account.login}
                                        type="button"
                                        onClick={() => quickLogin(account.login)}
                                        className="group flex min-h-14 items-center gap-3 rounded-2xl bg-[var(--surface-muted)] px-3 py-3 text-left transition-fluid hover:bg-[var(--surface)] hover:shadow-soft active:scale-[0.98]"
                                    >
                                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--bezel)] text-[var(--accent)] transition-fluid group-hover:bg-[var(--accent)] group-hover:text-[var(--bg)]">
                                            <Icon size={18} weight="light" />
                                        </span>
                                        <span className="min-w-0">
                                            <span className="block truncate text-sm font-semibold text-[var(--ink)]">
                                                {account.label}
                                            </span>
                                            <span className="block text-xs text-[var(--muted)]">
                                                {account.login}
                                            </span>
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </BezelCard>
                </motion.div>
            </div>
        </>
    );
}
