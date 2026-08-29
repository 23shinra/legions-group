import BezelCard from '@/Components/ui/BezelCard';
import IslandButton from '@/Components/ui/IslandButton';
import SoftDatePicker from '@/Components/ui/SoftDatePicker';
import SoftSelect from '@/Components/ui/SoftSelect';
import { useForm, usePage } from '@inertiajs/react';
import { motion } from 'framer-motion';
import {
    ArrowRight,
    DownloadSimple,
    FileXls,
    UserPlus,
} from '@phosphor-icons/react';
import { useRef, useState } from 'react';

const ROLE_OPTIONS = [
    { value: 'worker', label: 'Сотрудник' },
    { value: 'brigadier', label: 'Бригадир' },
];

const fieldClass =
    'w-full rounded-2xl border-0 bg-[var(--surface-muted)] px-4 py-3.5 text-[var(--ink)] outline-none ring-1 ring-[var(--bezel-ring)] transition-fluid focus:ring-2 focus:ring-[var(--accent)]';

const labelClass =
    'mb-2 block text-xs font-semibold uppercase tracking-[0.15em] text-[var(--muted)]';

export default function ManagerEmployeesSettings({
    brigades = [],
    payTypes = [],
    status,
}) {
    const [mode, setMode] = useState('manual');
    const fileInputRef = useRef(null);
    const payroll = usePage().props.payroll ?? {};
    const defaultHourly = payroll.hourly_rate ?? 1800;

    const manualForm = useForm({
        name: '',
        email: '',
        password: '123',
        phone: '',
        role: 'worker',
        brigade_id: '',
        position: 'Подсобник',
        pay_type: 'hourly',
        rate: String(defaultHourly),
        max_advance: '',
        hired_at: new Date().toISOString().slice(0, 10),
    });

    const importForm = useForm({
        file: null,
    });

    const submitManual = (e) => {
        e.preventDefault();
        manualForm.post(route('manager.employees.store'), {
            preserveScroll: true,
            onSuccess: () =>
                manualForm.reset(
                    'name',
                    'email',
                    'password',
                    'phone',
                    'position',
                    'max_advance',
                ),
        });
    };

    const submitImport = (e) => {
        e.preventDefault();
        importForm.post(route('manager.employees.import'), {
            preserveScroll: true,
            forceFormData: true,
            onSuccess: () => {
                importForm.reset();
                if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                }
            },
        });
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.32, 0.72, 0, 1], delay: 0.08 }}
            className="lg:col-span-12"
        >
            <BezelCard padding="p-5 sm:p-7">
                {(status === 'employee-created' ||
                    (status && status.startsWith('Добавлено'))) && (
                    <div className="mb-5 rounded-2xl bg-[var(--surface-muted)] px-4 py-3 text-sm font-medium text-[var(--ink)] ring-1 ring-[var(--bezel-ring)]">
                        {status === 'employee-created'
                            ? 'Сотрудник успешно добавлен'
                            : status}
                    </div>
                )}

                <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                        <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-[var(--bezel)] text-[var(--ink)]">
                            <UserPlus size={20} weight="light" />
                        </div>
                        <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[var(--muted)]">
                            Персонал
                        </p>
                        <h2 className="mt-1 text-xl font-extrabold tracking-tight text-[var(--ink)] sm:text-2xl">
                            Добавление сотрудников
                        </h2>
                        <p className="mt-1.5 text-sm text-[var(--muted)]">
                            Вручную или загрузкой Excel-файла
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 rounded-2xl bg-[var(--surface-muted)] p-1 ring-1 ring-[var(--bezel-ring)] sm:w-auto">
                        {[
                            { id: 'manual', label: 'Вручную' },
                            { id: 'excel', label: 'Excel' },
                        ].map(({ id, label }) => (
                            <button
                                key={id}
                                type="button"
                                onClick={() => setMode(id)}
                                className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition-fluid ${
                                    mode === id
                                        ? 'bg-[var(--accent)] text-[var(--bg)]'
                                        : 'text-[var(--muted)] hover:text-[var(--ink)]'
                                }`}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                </div>

                {mode === 'manual' ? (
                    <form
                        onSubmit={submitManual}
                        className="grid gap-4 sm:grid-cols-2"
                    >
                        <div className="sm:col-span-2">
                            <label htmlFor="emp_name" className={labelClass}>
                                ФИО
                            </label>
                            <input
                                id="emp_name"
                                value={manualForm.data.name}
                                onChange={(e) =>
                                    manualForm.setData('name', e.target.value)
                                }
                                className={fieldClass}
                                placeholder="Иван Петров"
                            />
                            {manualForm.errors.name && (
                                <p className="mt-1.5 text-sm text-[var(--muted)]">
                                    {manualForm.errors.name}
                                </p>
                            )}
                        </div>

                        <div>
                            <label htmlFor="emp_email" className={labelClass}>
                                Логин
                            </label>
                            <input
                                id="emp_email"
                                value={manualForm.data.email}
                                onChange={(e) =>
                                    manualForm.setData('email', e.target.value)
                                }
                                className={fieldClass}
                                placeholder="ivan.petrov"
                            />
                            {manualForm.errors.email && (
                                <p className="mt-1.5 text-sm text-[var(--muted)]">
                                    {manualForm.errors.email}
                                </p>
                            )}
                        </div>

                        <div>
                            <label htmlFor="emp_password" className={labelClass}>
                                Пароль
                            </label>
                            <input
                                id="emp_password"
                                type="text"
                                value={manualForm.data.password}
                                onChange={(e) =>
                                    manualForm.setData('password', e.target.value)
                                }
                                className={fieldClass}
                            />
                            {manualForm.errors.password && (
                                <p className="mt-1.5 text-sm text-[var(--muted)]">
                                    {manualForm.errors.password}
                                </p>
                            )}
                        </div>

                        <div>
                            <label htmlFor="emp_phone" className={labelClass}>
                                Телефон
                            </label>
                            <input
                                id="emp_phone"
                                value={manualForm.data.phone}
                                onChange={(e) =>
                                    manualForm.setData('phone', e.target.value)
                                }
                                className={fieldClass}
                                placeholder="+77001234567"
                            />
                            {manualForm.errors.phone && (
                                <p className="mt-1.5 text-sm text-[var(--muted)]">
                                    {manualForm.errors.phone}
                                </p>
                            )}
                        </div>

                        <div>
                            <label htmlFor="emp_role" className={labelClass}>
                                Роль
                            </label>
                            <SoftSelect
                                id="emp_role"
                                value={manualForm.data.role}
                                onChange={(next) => manualForm.setData('role', next)}
                                options={ROLE_OPTIONS}
                            />
                            {manualForm.errors.role && (
                                <p className="mt-1.5 text-sm text-[var(--muted)]">
                                    {manualForm.errors.role}
                                </p>
                            )}
                        </div>

                        <div>
                            <label htmlFor="emp_brigade" className={labelClass}>
                                Бригада
                            </label>
                            <SoftSelect
                                id="emp_brigade"
                                value={manualForm.data.brigade_id}
                                onChange={(next) =>
                                    manualForm.setData('brigade_id', next)
                                }
                                options={[
                                    { value: '', label: 'Без бригады' },
                                    ...brigades.map((brigade) => ({
                                        value: brigade.id,
                                        label: brigade.name,
                                    })),
                                ]}
                            />
                            {manualForm.errors.brigade_id && (
                                <p className="mt-1.5 text-sm text-[var(--muted)]">
                                    {manualForm.errors.brigade_id}
                                </p>
                            )}
                        </div>

                        <div>
                            <label htmlFor="emp_position" className={labelClass}>
                                Должность
                            </label>
                            <input
                                id="emp_position"
                                value={manualForm.data.position}
                                onChange={(e) =>
                                    manualForm.setData('position', e.target.value)
                                }
                                className={fieldClass}
                                placeholder="Подсобник"
                            />
                            {manualForm.errors.position && (
                                <p className="mt-1.5 text-sm text-[var(--muted)]">
                                    {manualForm.errors.position}
                                </p>
                            )}
                        </div>

                        <div>
                            <label htmlFor="emp_pay_type" className={labelClass}>
                                Тип оплаты
                            </label>
                            <SoftSelect
                                id="emp_pay_type"
                                value={manualForm.data.pay_type}
                                onChange={(next) => {
                                    manualForm.setData('pay_type', next);
                                    if (next === 'daily') {
                                        manualForm.setData(
                                            'rate',
                                            String(payroll.daily_rate ?? 18000),
                                        );
                                    } else if (next === 'hourly' || next === 'custom') {
                                        manualForm.setData('rate', String(defaultHourly));
                                    }
                                }}
                                options={payTypes.map((type) => ({
                                    value: type.value,
                                    label: type.label,
                                }))}
                            />
                            {manualForm.errors.pay_type && (
                                <p className="mt-1.5 text-sm text-[var(--muted)]">
                                    {manualForm.errors.pay_type}
                                </p>
                            )}
                        </div>

                        <div>
                            <label htmlFor="emp_rate" className={labelClass}>
                                Ставка (₸)
                            </label>
                            <input
                                id="emp_rate"
                                type="number"
                                min="0"
                                step="0.01"
                                value={manualForm.data.rate}
                                onChange={(e) =>
                                    manualForm.setData('rate', e.target.value)
                                }
                                className={fieldClass}
                            />
                            <p className="mt-1.5 text-xs text-[var(--muted)]">
                                Стандарт: {payroll.daily_rate ?? 18000} ₸ за{' '}
                                {payroll.workday_hours ?? 10} ч (
                                {defaultHourly} ₸/ч). Переработка —{' '}
                                {payroll.overtime_rate ?? 1500} ₸/ч.
                            </p>
                            {manualForm.errors.rate && (
                                <p className="mt-1.5 text-sm text-[var(--muted)]">
                                    {manualForm.errors.rate}
                                </p>
                            )}
                        </div>

                        <div>
                            <label htmlFor="emp_max_advance" className={labelClass}>
                                Лимит аванса (₸)
                            </label>
                            <input
                                id="emp_max_advance"
                                type="number"
                                min="0"
                                step="0.01"
                                value={manualForm.data.max_advance}
                                onChange={(e) =>
                                    manualForm.setData(
                                        'max_advance',
                                        e.target.value,
                                    )
                                }
                                className={fieldClass}
                            />
                            {manualForm.errors.max_advance && (
                                <p className="mt-1.5 text-sm text-[var(--muted)]">
                                    {manualForm.errors.max_advance}
                                </p>
                            )}
                        </div>

                        <div>
                            <label htmlFor="emp_hired_at" className={labelClass}>
                                Дата приёма
                            </label>
                            <SoftDatePicker
                                id="emp_hired_at"
                                value={manualForm.data.hired_at}
                                onChange={(next) =>
                                    manualForm.setData('hired_at', next)
                                }
                            />
                            {manualForm.errors.hired_at && (
                                <p className="mt-1.5 text-sm text-[var(--muted)]">
                                    {manualForm.errors.hired_at}
                                </p>
                            )}
                        </div>

                        <div className="sm:col-span-2">
                            <IslandButton
                                type="submit"
                                icon={ArrowRight}
                                disabled={manualForm.processing}
                                className="w-full justify-center sm:w-auto"
                            >
                                {manualForm.processing
                                    ? 'Добавление…'
                                    : 'Добавить сотрудника'}
                            </IslandButton>
                        </div>
                    </form>
                ) : (
                    <div className="space-y-5">
                        <div className="rounded-2xl bg-[var(--surface-muted)] p-4 ring-1 ring-[var(--bezel-ring)] sm:p-5">
                            <div className="flex items-start gap-3">
                                <FileXls
                                    size={24}
                                    weight="light"
                                    className="mt-0.5 shrink-0 text-[var(--accent)]"
                                />
                                <div className="min-w-0">
                                    <p className="font-semibold text-[var(--ink)]">
                                        Шаблон Excel
                                    </p>
                                    <p className="mt-1 text-sm text-[var(--muted)]">
                                        Скачайте шаблон, заполните строки и
                                        загрузите файл. Колонки: имя, логин,
                                        телефон, роль, бригада, должность, тип
                                        оплаты, ставка, лимит аванса, дата
                                        приёма, пароль.
                                    </p>
                                    <a
                                        href={route(
                                            'manager.employees.import-template',
                                        )}
                                        className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-[var(--ink)] underline-offset-4 hover:underline"
                                    >
                                        <DownloadSimple
                                            size={16}
                                            weight="light"
                                        />
                                        Скачать шаблон
                                    </a>
                                </div>
                            </div>
                        </div>

                        <form onSubmit={submitImport} className="space-y-4">
                            <div>
                                <label htmlFor="emp_file" className={labelClass}>
                                    Файл Excel
                                </label>
                                <input
                                    id="emp_file"
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".xlsx,.xls,.csv"
                                    onChange={(e) =>
                                        importForm.setData(
                                            'file',
                                            e.target.files[0] ?? null,
                                        )
                                    }
                                    className="block w-full text-sm text-[var(--muted)] file:mr-4 file:rounded-full file:border-0 file:bg-[var(--bezel)] file:px-4 file:py-2.5 file:text-sm file:font-semibold file:text-[var(--ink)]"
                                />
                                {importForm.errors.file && (
                                    <p className="mt-1.5 text-sm text-[var(--muted)]">
                                        {importForm.errors.file}
                                    </p>
                                )}
                            </div>

                            <IslandButton
                                type="submit"
                                icon={ArrowRight}
                                disabled={
                                    importForm.processing || !importForm.data.file
                                }
                                className="w-full justify-center sm:w-auto"
                            >
                                {importForm.processing
                                    ? 'Импорт…'
                                    : 'Импортировать сотрудников'}
                            </IslandButton>
                        </form>
                    </div>
                )}
            </BezelCard>
        </motion.div>
    );
}
