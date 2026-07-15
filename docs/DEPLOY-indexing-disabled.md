# ⚠️ ИНДЕКСАЦИЯ САЙТА ОТКЛЮЧЕНА — НУЖНО ВКЛЮЧИТЬ ПЕРЕД ЗАПУСКОМ

**Дата отключения:** 2026-07-09
**Статус:** сайт закрыт от поисковиков (noindex + robots disallow-all).
**Причина:** по указанию владельца — держать закрытым до явной команды «включить».

## Что именно закрыто
1. `placement/src/app/layout.tsx` — в `metadata`:
   ```ts
   robots: { index: false, follow: false },
   ```
   → на каждой странице `<meta name="robots" content="noindex, nofollow">`.
2. `placement/src/app/robots.ts` — отдаёт `/robots.txt`:
   ```
   User-agent: *
   Disallow: /
   ```

## Как ВКЛЮЧИТЬ индексацию (когда владелец скажет)
1. Убрать строку `robots: { index: false, follow: false },` из `layout.tsx` metadata
   (или заменить на `robots: { index: true, follow: true }`).
2. В `app/robots.ts` заменить `disallow: "/"` на `allow: "/"` (и по желанию
   добавить `sitemap`).
3. Пересобрать и задеплоить.
4. (Опц.) В Google Search Console запросить переиндексацию.

**НЕ включать без прямого разрешения владельца.**
