import ReportTable from '@/Components/Reports/ReportTable';

export default function EmployeeReportList({ reports = [], showRouteName }) {
    return (
        <ReportTable
            rows={reports}
            nameKey="employee"
            nameLabel="Сотрудник"
            secondaryKey="brigade"
            secondaryLabel="Бригада"
            showRouteName={showRouteName}
        />
    );
}
