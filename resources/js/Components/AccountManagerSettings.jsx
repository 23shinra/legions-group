import BezelCard from '@/Components/ui/BezelCard';
import IslandButton from '@/Components/ui/IslandButton';
import { Link } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { ArrowRight, IdentificationCard } from '@phosphor-icons/react';

export default function AccountManagerSettings() {
    return (
        <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.32, 0.72, 0, 1] }}
            className="mb-5 lg:col-span-12 sm:mb-6"
        >
            <BezelCard padding="p-5 sm:p-7">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                        <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-[var(--bezel)] text-[var(--ink)]">
                            <IdentificationCard size={20} weight="light" />
                        </div>
                        <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[var(--muted)]">
                            Доступ
                        </p>
                        <h2 className="mt-1 text-xl font-extrabold tracking-tight text-[var(--ink)] sm:text-2xl">
                            Менеджер аккаунтов
                        </h2>
                        <p className="mt-1.5 text-sm text-[var(--muted)]">
                            Логины, роли, активность и пароли всех пользователей
                        </p>
                    </div>

                    <IslandButton
                        href={route('manager.accounts.index')}
                        icon={ArrowRight}
                        className="justify-center"
                    >
                        Открыть список
                    </IslandButton>
                </div>
            </BezelCard>
        </motion.div>
    );
}
