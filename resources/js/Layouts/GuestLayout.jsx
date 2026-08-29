import ApplicationLogo from '@/Components/ApplicationLogo';
import { Link } from '@inertiajs/react';

export default function GuestLayout({ children }) {
    return (
        <div className="flex min-h-screen flex-col items-center bg-[var(--bg)] px-4 pt-6 sm:justify-center sm:pt-0">
            <div>
                <Link href="/">
                    <ApplicationLogo className="h-20 w-20" />
                </Link>
            </div>

            <div className="mt-6 w-full overflow-hidden bg-[var(--surface)] px-6 py-4 shadow-soft ring-1 ring-[var(--bezel-ring)] sm:max-w-md sm:rounded-2xl">
                {children}
            </div>
        </div>
    );
}
