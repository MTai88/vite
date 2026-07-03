/**
 * Tailwind CSS config.
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
 * (Tailwind-овский базовый reset) — у нас уже есть свой reset в src/scss/main.css.
 * Если хочешь дефолтный tailwind-reset — удали `corePlugins.preflight: false`.
 */
/** @type {import('tailwindcss').Config} */
module.exports = {
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
