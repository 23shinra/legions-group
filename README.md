# RPM — Legionis Group

Внутренняя система учёта смен, объектов, зарплат и авансов для **Legionis Group**.

## Стек

- Laravel 13 + Inertia + React + Tailwind
- SQLite (по умолчанию)
- Maatwebsite Excel (экспорт отчётов)
- UI: Taste Skill `high-end-visual-design` (soft-skill)

## Запуск

```bash
composer install
cp .env.example .env   # если нужно
php artisan key:generate
touch database/database.sqlite
php artisan migrate:fresh --seed
npm install --legacy-peer-deps
npm run build
php artisan serve
```

Открыть: http://127.0.0.1:8000

## Вход

Пароль у всех на старте: `123`

| Роль | Логин | Имя |
|------|-------|-----|
| Руководитель | `manager` | Аширов Ислам |
| Бухгалтер | `accountant` | Пархатова Рамиля |
| Бригадир | `brigadier1` … `brigadier4` | Кадыров Абдыкахар, Абдурашитов Ильяр, Нурматов Алижан, Кадыров Турсун |
| Строитель | `worker1` … `worker13` | актуальный состав бригад |

## MVP

- Роли: рабочий / бригадир / руководитель / бухгалтер
- Приход/уход, учёт часов
- Индивидуальные ставки и авторасчёт зарплаты
- Запрос / одобрение / выплата авансов
- Выплаты зарплаты
- Закрытие объекта с итоговым расчётом
- Отчёты + экспорт Excel
- Уведомления в БД
