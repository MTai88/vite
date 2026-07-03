/**
 * PostCSS config.
 *
 * Pipeline применяется ко всем CSS-файлам (включая .css внутри <style> блоков .vue SFC).
 *
 * - postcss-import: резолвит @import './foo.css' относительно файла.
 *   Webpack alias (@styles, @components и т.п.) PostCSS сам не понимает — для
 *   алиасов в CSS оставляем относительные пути. Если нужен alias в стилях,
 *   используй `postcss-import` опцию path (см. https://github.com/postcss/postcss-import).
 * - tailwindcss: JIT-компиляция Tailwind, разбирает директивы @tailwind base/components/utilities.
 *   Содержимое классов берётся из tailwind.config.js (content globs).
 * - postcss-nested: нативный CSS nesting (& селекторы), спецификация W3C.
 * - autoprefixer: префиксы по browserslist (см. поле в package.json).
 * - cssnano: минификация только в продакшене (webpack.mode = production → NODE_ENV=production).
 *
 * Плагин `cssnano` подключается динамически — в dev его быть не должно,
 * иначе source-maps и HMR ломаются.
 */
const isProd = process.env.NODE_ENV === 'production';

module.exports = {
  plugins: [
    require('postcss-import'),
    require('tailwindcss'),
    require('postcss-nested'),
    require('autoprefixer'),
    ...(isProd ? [require('cssnano')({ preset: 'default' })] : []),
  ],
};
