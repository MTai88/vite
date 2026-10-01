/**
 * Tailwind CSS config (ESM — под "type": "module" в package.json;
 * CJS-вариант с module.exports здесь больше не работает, см. postcss.config.js).
 *
 * Префикс `tw-` ставим всем утилитам, чтобы не пересекаться с утилитами
 * Bitrix/admin-кита / Bootstrap и прочими сторонними CSS, которые могут
 * подгружаться на странице независимо. Использовать утилиты так: `tw-flex`,
 * `tw-bg-blue-500`, `tw-text-lg`.
 *
 * content globs — где Tailwind ищет классы. Не забывай добавить новые типы
 * файлов (например .html из статики), если такие появятся.
 *
 * corePlugins — по умолчанию включены все. Здесь отключён `preflight`
 * (Tailwind-овский базовый reset) — свой reset в src/scss/main.css
 * скоупится на .app-root: глобальный reset нельзя включать в страницу
 * Bitrix — он сносит стили портала.
 */
/** @type {import('tailwindcss').Config} */
export default {
  prefix: 'tw-',
  content: ['./src/**/*.{ts,tsx,js,jsx,vue,html}'],
  corePlugins: {
    preflight: false,
  },
  theme: {
    extend: {
      // Здесь расширения темы (colors, spacing, fontFamily и т.п.)
    },
  },
  plugins: [
    // Кастомные плагины — например @tailwindcss/forms, @tailwindcss/typography
  ],
};
