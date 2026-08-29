import EmployeeReportDetail from '@/Components/Reports/EmployeeReportDetail';
import PageHeader from '@/Components/ui/PageHeader';
import AppLayout from '@/Layouts/AppLayout';
import { Head, Link } from '@inertiajs/react';
import { ArrowLeft } from '@phosphor-icons/react';

export default function Show({ report = {} }) {
    return (
        <AppLayout>
            <Head title={report.employee ?? 'Отчёт'} />

            <Link
                href={route('manager.reports.index')}
                className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--muted)] transition-fluid hover:text-[var(--ink)]"
            >
                <ArrowLeft size={16} weight="bold" />
                К списку
            </Link>

            <PageHeader
                eyebrow="Сотрудник"
                title={report.employee ?? '—'}
                subtitle={report.brigade ?? undefined}
            />

            <EmployeeReportDetail report={report} />
        </AppLayout>
    );
}
