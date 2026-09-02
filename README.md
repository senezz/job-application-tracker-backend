# Jobtrace backend

Backend для трекера вакансий: хранит отклики (company, role, status, dates),
привязанные к ним письма из Gmail и пользователей с email+password
авторизацией. Отдельный сервис, фронтенд (React + Vite) живёт в другом
репозитории.

Стек: Node.js + TypeScript, Express, Prisma, PostgreSQL, zod, JWT + bcrypt.

## Требования

- Node.js 20+
- Docker (для локального Postgres) или своя PostgreSQL-инстанция

## Запуск

```bash
git clone <repo-url>
cd job-application-tracker-backend
cp .env.example .env
```

Заполнить `.env` (см. ниже про `JWT_SECRET` и Google-креды).

```bash
docker run --name jobtrace-db -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=jobtrace -p 5432:5432 -d postgres:16

npm install
npm run prisma:migrate
npm run dev
```

Сервер поднимается на `http://localhost:4000` (см. `PORT` в `.env`).

## Эндпоинты

**Auth**
- `POST /auth/register` — регистрация (email + password)
- `POST /auth/login` — логин, возвращает JWT
- `GET /auth/me` — данные текущего пользователя (нужен токен)

**Jobs**
- `GET /jobs` — список заявок текущего пользователя
- `POST /jobs` — создать заявку
- `PATCH /jobs/:id` — обновить заявку (только владелец)
- `DELETE /jobs/:id` — удалить заявку (только владелец)

**Responses**
- `GET /jobs/:jobId/responses` — письма по заявке
- `POST /jobs/:jobId/responses` — добавить письмо к заявке
- `DELETE /responses/:id` — удалить письмо (только владелец заявки)

**Gmail**
- `GET /gmail/connect` — вернуть ссылку на Google OAuth consent (нужен токен)
- `GET /gmail/callback` — callback для Google, обменивает code на токены
- `GET /gmail/token` — статус подключения Gmail-аккаунта

Все эндпоинты, кроме `/auth/register`, `/auth/login` и `/gmail/callback`,
требуют заголовок `Authorization: Bearer <token>`.

## Настройка Gmail OAuth (Google Cloud Console)

1. Создать проект на console.cloud.google.com
2. Включить Gmail API (APIs & Services → Library)
3. Настроить OAuth consent screen (External, добавить себя в test users,
   пока приложение не верифицировано)
4. Создать OAuth 2.0 Client ID (Web application), redirect URI —
   `http://localhost:4000/gmail/callback`
5. Вписать `Client ID` и `Client secret` в `.env`
   (`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`)
