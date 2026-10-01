/**
 * PostCSS config (ESM: package.json содержит "type": "module",
 * CommonJS-вариант с require()/module.exports Vite 6 не загружает —
 * «module is not defined in ES module scope»).
 *
 * Pipeline применяется ко всем CSS-файлам (включая <style> блоки .vue SFC).
 *
 * - postcss-import: резолвит @import './foo.css' относительно файла.
 *   Webpack alias (@styles, @components и т.п.) PostCSS сам не понимает — для
 *   алиасов в CSS оставляем относительные пути.
 * - tailwindcss: JIT-компиляция Tailwind, разбирает директивы @tailwind base/components/utilities.
 *   Содержимое классов берётся из tailwind.config.js (content globs).
 * - postcss-nested: нативный CSS nesting (& селектор), спецификация W3C.
 * - autoprefixer: префиксы по browserslist (см. поле в package.json).
 * - cssnano: минификация только в продакшене (vite build → mode=production).
 *
 * Плагин `cssnano` подключается условно — в dev его быть не должно,
 * иначе source-maps и HMR ломаются.
 */
import postcssImport from 'postcss-import';
import tailwindcss from 'tailwindcss';
import postcssNested from 'postcss-nested';
import autoprefixer from 'autoprefixer';
import cssnano from 'cssnano';

const isProd = process.env.NODE_ENV === 'production';

export default {
  plugins: [
    postcssImport,
    tailwindcss,
    postcssNested,
    autoprefixer,
    ...(isProd ? [cssnano({ preset: 'default' })] : []),
  ],
};
