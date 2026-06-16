# Деплой — AD PLACEMENT (Hostinger Business, Node.js + MySQL)

## 0. Требования

- Тариф Hostinger с поддержкой **Node.js** (Business / Cloud / VPS). Shared без Node не запустит Next SSR.
- MySQL база (создаётся в hPanel → Базы данных MySQL).
- Домен + SSL (HTTPS).

## 1. База данных

1. В hPanel создать БД MySQL + пользователя, выдать все привилегии.
2. Записать строку подключения в `DATABASE_URL` (см. ниже).

## 2. Переменные окружения

Скопировать `.env.example` → `.env` и заполнить:

- `DATABASE_URL` — `mysql://USER:PASSWORD@HOST:3306/DBNAME` (данные из hPanel).
- `ADMIN_PASSWORD` — стартовый пароль админа (сменить после входа).
- `SESSION_SECRET` — длинная случайная строка (напр. `openssl rand -base64 48`).
- `SMTP_*` + `NOTIFY_EMAIL` — почта Hostinger для уведомлений о заявках.
- `NEXT_PUBLIC_SITE_URL` — `https://ваш-домен`.

## 3. Сборка и миграции

```bash
npm install                 # postinstall сам сделает prisma generate
npx prisma migrate deploy   # применить миграции к прод-БД
npm run db:seed             # (один раз) наполнить демо-данными + хэш пароля
npm run build
npm run start               # next start (порт из окружения Hostinger)
```

> Если в Node-приложении Hostinger задаётся стартовая команда — указать `npm run start`,
> а сборку (`npm run build`) выполнять при деплое.

## 4. Загрузки и медиа

- Картинки пишутся в `public/uploads/<тип>/`. На постоянном диске сохраняются между перезапусками.
- Тяжёлые видео — только YouTube-embed (на сервере не хранить).
- Бэкап: периодически сохранять `public/uploads/` и дамп MySQL (hPanel → экспорт).

## 5. Безопасность (проверить перед запуском)

- [x] Пароль админа — bcrypt-хэш в БД (не хранится в открытом виде).
- [x] Сессия — httpOnly + `secure` в проде (HTTPS обязателен).
- [x] Rate-limit: логин (5/10 мин) и форма заявки (5/10 мин) по IP.
- [x] Honeypot + серверная валидация формы.
- [x] `/admin/*` закрыт middleware; upload-роут проверяет сессию.
- [ ] Сменить `ADMIN_PASSWORD` после первого входа.
- [ ] Задать сильный `SESSION_SECRET`.
- [ ] **Ротировать засветившиеся в чате секреты** (Google API ключ, пароль kinodaran).
- [ ] Включить регулярные бэкапы БД.

## 6. SEO

- `sitemap.xml` и `robots.txt` генерируются автоматически (на основе `NEXT_PUBLIC_SITE_URL`).
- Open Graph / Twitter-теги — в корневом `metadata`.
- `/admin` и `/api` закрыты от индексации.
- hreflang для RU/EN/HY не реализован (язык через cookie, без URL-сегментов) — при необходимости перейти на `/[locale]`-роутинг.

## 7. Обновление контента

Весь контент правится в админке (`/admin`): проекты, портфолио, партнёры, тексты, контакты, заявки. Разработчик для контента не нужен.
