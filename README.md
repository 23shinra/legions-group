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

После `migrate:fresh --seed` у всех аккаунтов стартовый пароль задаётся в сидере (локально — см. `RosterInstaller::INITIAL_PASSWORD`). Логины — `имя.фамилия` в транслите, например:

| Роль | Логин | Имя |
|------|-------|-----|
| Руководитель | `islam.ashirov` | Аширов Ислам |
| Бухгалтер | `ramilya.parhatova` | Пархатова Рамиля |
| Бригадир | `abdykahar.kadyrov`, `ilyar.abdurashitov`, `alizhan.nurmatov`, `tursun.kadyrov` | см. сидер |
| Строитель | `dilmurat.ashirov`, … `roma`, … | актуальный состав бригад |

Руководитель управляет логинами, ролями и паролями в **Настройки → Менеджер аккаунтов**.

## MVP

- Роли: рабочий / бригадир / руководитель / бухгалтер
- Приход/уход, учёт часов
- Индивидуальные ставки и авторасчёт зарплаты
- Запрос / одобрение / выплата авансов
- Выплаты зарплаты
- Закрытие объекта с итоговым расчётом
- Отчёты + экспорт Excel
- Уведомления в БД
