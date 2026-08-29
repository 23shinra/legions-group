import { Link } from '@inertiajs/react';
import { motion } from 'framer-motion';

export default function StatPill({
    label,
    value,
    icon: Icon,
    accent = false,
    className = '',
    delay = 0,
    href,
}) {
    const content = (
        <div className="flex items-start justify-between gap-2 sm:gap-3">
            <div className="min-w-0">
                <p className="text-[10px] font-medium uppercase tracking-[0.15em] text-[var(--muted)] sm:tracking-[0.2em]">
                    {label}
                </p>
                <p
                    className={`mt-1 break-words text-lg font-bold tracking-tight sm:mt-1.5 sm:text-2xl ${accent ? 'text-[var(--accent)]' : 'text-[var(--ink)]'}`}
                >
                    {value}
                </p>
            </div>
            {Icon && (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--bezel)] sm:h-10 sm:w-10">
                    <Icon
                        size={18}
                        weight="light"
                        className="text-[var(--accent)] sm:hidden"
                    />
                    <Icon
                        size={20}
                        weight="light"
                        className="hidden text-[var(--accent)] sm:block"
                    />
                </div>
            )}
        </div>
    );

    const shellClass =
        'rounded-[1.25rem] bg-[var(--surface-muted)] px-3.5 py-3.5 shadow-soft transition-fluid sm:px-5 sm:py-4 md:hover:bg-[var(--bezel)] md:hover:shadow-lift md:hover:ring-1 md:hover:ring-[var(--bezel-ring)]';

    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay, ease: [0.32, 0.72, 0, 1] }}
            className={className}
        >
            {href ? (
                <Link
                    href={href}
                    className={`block md:cursor-pointer md:active:scale-[0.99] ${shellClass}`}
                >
                    {content}
                </Link>
            ) : (
                <div className={`md:cursor-default ${shellClass}`}>
                    {content}
                </div>
            )}
        </motion.div>
    );
}
