import BezelCard from '@/Components/ui/BezelCard';
import BrandLogo from '@/Components/BrandLogo';
import IslandButton from '@/Components/ui/IslandButton';
import { Head, useForm } from '@inertiajs/react';
import {
    ArrowRight,
    Eye,
    EyeSlash,
} from '@phosphor-icons/react';
import { useState } from 'react';

export default function Login({ status }) {
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

    return (
        <>
            <Head title="Вход" />

            <div className="relative flex min-h-[100dvh] items-center justify-center overflow-x-hidden bg-[var(--bg)] px-4 py-10 sm:py-16">
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,rgba(0,0,0,0.05),transparent_55%)]" />

                <div className="relative w-full max-w-md animate-[fadeInUp_0.6s_ease-out_both] pb-[max(1rem,var(--safe-bottom))] pt-[max(0.5rem,var(--safe-top))]">
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
                            {(errors.email || errors.password) && (
                                <div
                                    role="alert"
                                    className="rounded-2xl border border-red-500/35 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-700 ring-1 ring-red-500/20 [data-theme=dark]:text-red-300"
                                >
                                    {errors.email || errors.password}
                                </div>
                            )}

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
                                    placeholder="логин"
                                    onChange={(e) => setData('email', e.target.value)}
                                    className="input-soft"
                                />
                                {errors.email && (
                                    <p className="mt-2 text-sm font-medium text-red-600 [data-theme=dark]:text-red-400">{errors.email}</p>
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
                                        placeholder="пароль"
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
                                    <p className="mt-2 text-sm font-medium text-red-600 [data-theme=dark]:text-red-400">{errors.password}</p>
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
                </div>
            </div>
        </>
    );
}
