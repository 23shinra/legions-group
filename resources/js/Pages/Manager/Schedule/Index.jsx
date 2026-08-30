import BezelCard from '@/Components/ui/BezelCard';
import PageHeader from '@/Components/ui/PageHeader';
import SoftDatePicker from '@/Components/ui/SoftDatePicker';
import SoftSelect from '@/Components/ui/SoftSelect';
import AppLayout from '@/Layouts/AppLayout';
import { brigadeTitle } from '@/lib/format';
import { Head, router } from '@inertiajs/react';
import { CalendarBlank } from '@phosphor-icons/react';
import { useMemo, useState } from 'react';

export default function Index({
    date,
    employees = [],
    objects = [],
    brigades = [],
}) {
    const [workDate, setWorkDate] = useState(date);
    const [rows, setRows] = useState(() =>
        employees.map((employee) => ({
            user_id: employee.id,
            work_object_id: employee.work_object_id ? String(employee.work_object_id) : '',
        })),
    );
    const [brigadeId, setBrigadeId] = useState('');
    const [bulkObjectId, setBulkObjectId] = useState('');
    const [saving, setSaving] = useState(false);

    const objectOptions = useMemo(
        () => [
            { value: '', label: 'Не назначен' },
            ...objects.map((object) => ({
                value: object.id,
                label: object.name,
            })),
        ],
        [objects],
    );

    const changeDate = (next) => {
        setWorkDate(next);
        router.get(route('manager.schedule.index'), { date: next }, { preserveState: false });
    };

    const setObject = (userId, objectId) => {
        setRows((current) =>
            current.map((row) =>
                Number(row.user_id) === Number(userId)
                    ? { ...row, work_object_id: objectId }
                    : row,
            ),
        );
    };

    const applyBrigade = () => {
        if (!brigadeId) {
            return;
        }

        const ids = new Set(
            employees
                .filter((employee) => String(employee.brigade_id) === String(brigadeId))
                .map((employee) => Number(employee.id)),
        );

        setRows((current) =>
            current.map((row) =>
                ids.has(Number(row.user_id))
                    ? { ...row, work_object_id: bulkObjectId }
                    : row,
            ),
        );
    };

    const save = () => {
        setSaving(true);
        router.post(
            route('manager.schedule.store'),
            { date: workDate, assignments: rows },
            { preserveScroll: true, onFinish: () => setSaving(false) },
        );
    };

    return (
        <AppLayout>
            <Head title="График смен" />

            <PageHeader
                eyebrow="Смены"
                title="График"
                subtitle="Назначьте объект на дату — сотрудники увидят его у себя"
            />

            <BezelCard className="mb-6" padding="p-4 sm:p-5">
                <div className="grid gap-3 lg:grid-cols-4">
                    <div>
                        <label className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
                            Дата
                        </label>
                        <SoftDatePicker value={workDate} onChange={changeDate} />
                    </div>
                    <div>
                        <label className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
                            Бригада
                        </label>
                        <SoftSelect
                            value={brigadeId}
                            onChange={setBrigadeId}
                            options={[
                                { value: '', label: 'Выберите бригаду' },
                                ...brigades.map((brigade) => ({
                                    value: brigade.id,
                                    label: brigadeTitle(brigade),
                                })),
                            ]}
                        />
                    </div>
                    <div>
                        <label className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
                            Объект для бригады
                        </label>
                        <SoftSelect
                            value={bulkObjectId}
                            onChange={setBulkObjectId}
                            options={objectOptions}
                        />
                    </div>
                    <div className="flex items-end">
                        <button
                            type="button"
                            onClick={applyBrigade}
                            className="w-full rounded-full bg-[var(--surface)] px-4 py-3 text-sm font-semibold ring-1 ring-[var(--bezel-ring)]"
                        >
                            Проставить бригаде
                        </button>
                    </div>
                </div>
            </BezelCard>

            <BezelCard padding="p-0">
                <div className="flex items-center justify-between gap-3 border-b border-[var(--bezel-ring)] px-5 py-4 sm:px-6">
                    <div className="flex items-center gap-2">
                        <CalendarBlank size={18} weight="light" className="text-[var(--accent)]" />
                        <h2 className="font-bold">Кто куда выходит</h2>
                    </div>
                    <button
                        type="button"
                        onClick={save}
                        disabled={saving}
                        className="rounded-full bg-[var(--accent)] px-5 py-2.5 text-sm font-semibold text-[var(--bg)] disabled:opacity-50"
                    >
                        {saving ? 'Сохранение…' : 'Сохранить график'}
                    </button>
                </div>

                <ul className="divide-y divide-[var(--bezel-ring)]">
                    {employees.map((employee) => {
                        const row = rows.find((item) => Number(item.user_id) === Number(employee.id));

                        return (
                            <li
                                key={employee.id}
                                className="grid gap-3 px-5 py-4 sm:grid-cols-[1fr_16rem] sm:items-center sm:px-6"
                            >
                                <div className="min-w-0">
                                    <p className="font-semibold text-[var(--ink)]">{employee.name}</p>
                                    <p className="text-sm text-[var(--muted)]">
                                        {[employee.position, employee.brigade]
                                            .filter(Boolean)
                                            .join(' · ') || 'Без бригады'}
                                    </p>
                                </div>
                                <SoftSelect
                                    value={row?.work_object_id ?? ''}
                                    onChange={(next) => setObject(employee.id, next)}
                                    options={objectOptions}
                                />
                            </li>
                        );
                    })}
                </ul>
            </BezelCard>
        </AppLayout>
    );
}
