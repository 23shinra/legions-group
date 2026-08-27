export default function BezelCard({
    children,
    className = '',
    innerClassName = '',
    padding = 'p-4 sm:p-6',
    as: Component = 'div',
    ...props
}) {
    return (
        <Component
            className={`rounded-[1.5rem] bg-[var(--bezel)] p-1 ring-1 ring-bezel sm:rounded-[2rem] sm:p-1.5 ${className}`}
            {...props}
        >
            <div
                className={`rounded-[calc(1.5rem-0.25rem)] bg-[var(--surface)] shadow-soft shadow-[inset_0_1px_1px_rgba(255,255,255,0.12)] sm:rounded-[calc(2rem-0.375rem)] ${padding} ${innerClassName}`}
            >
                {children}
            </div>
        </Component>
    );
}
