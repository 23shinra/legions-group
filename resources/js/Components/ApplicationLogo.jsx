export default function ApplicationLogo({ className = '', ...props }) {
    return (
        <img
            src="/icon-192.png?v=3"
            alt="Legionis Group"
            className={`rounded-2xl object-cover ${className}`}
            {...props}
        />
    );
}
