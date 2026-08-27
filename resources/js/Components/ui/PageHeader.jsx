import { motion } from 'framer-motion';

export default function PageHeader({
    eyebrow,
    title,
    subtitle,
    actions,
    leading,
    className = '',
}) {
    return (
        <motion.header
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.32, 0.72, 0, 1] }}
            className={`mb-5 flex flex-col gap-3 sm:mb-7 sm:gap-4 md:mb-8 md:flex-row md:items-end md:justify-between ${className}`}
        >
            <div className="flex min-w-0 items-start gap-3 sm:gap-4">
                {leading && <div className="shrink-0 pt-0.5 sm:pt-1">{leading}</div>}
                <div className="min-w-0">
                    {eyebrow && (
                        <span className="mb-2 inline-flex rounded-full bg-[var(--bezel)] px-3 py-1 text-[10px] font-medium uppercase tracking-[0.2em] text-[var(--muted)] sm:mb-3">
                            {eyebrow}
                        </span>
                    )}
                    <h1 className="break-words text-2xl font-extrabold tracking-tight text-[var(--ink)] sm:text-3xl lg:text-4xl">
                        {title}
                    </h1>
                    {subtitle && (
                        <p className="mt-1.5 max-w-3xl text-sm text-[var(--muted)] sm:mt-2 sm:text-base">
                            {subtitle}
                        </p>
                    )}
                </div>
            </div>
            {actions && (
                <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:gap-3">
                    {actions}
                </div>
            )}
        </motion.header>
    );
}
