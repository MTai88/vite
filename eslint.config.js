/**
 * ESLint flat config (ESLint 9+).
 *
 * Раньше был legacy `.eslintrc` (JSON), переехали на flat — это обязательное
 * направление в ESLint 10+. Конфиг в `eslint.config.js` — JavaScript-файл,
 * импорты через require() (CommonJS), чтобы не тянуть "type": "module"
 * в package.json (это сломало бы webpack.common.js и прочее).
 *
 * Состав:
 *   1) js.configs.recommended               — базовые JS-правила
 *   2) typescript-eslint recommended        — TS-специфика (no-undef, no-floating-promises...)
 *   3) eslint-plugin-vue flat/recommended  — Vue 3 правила для .vue SFC
 *   4) parser override: в .vue файлах — vue-eslint-parser + внутри него typescript-eslint
 *
 * ignores — это первый конфиг; ESLint применяет его ко всем file matching'ам.
 * Здесь dist/, node_modules/, coverage/.
 */
const js = require('@eslint/js');
const tseslint = require('typescript-eslint');

// eslint-plugin-vue в CommonJS экспортирует плагин через default.
// Подстраховка — на случай если в будущей версии поменяется формат.
const vue = require('eslint-plugin-vue').default || require('eslint-plugin-vue');
const vueParser = require('vue-eslint-parser');

module.exports = [
  // ── Global ignores ────────────────────────────────────────────────────────
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      'coverage/**',
      '*.min.js',
    ],
  },

  // ── JS baseline (eslint:recommended) ──────────────────────────────────────
  js.configs.recommended,

  // ── TypeScript recommended ────────────────────────────────────────────────
  ...tseslint.configs.recommended,

  // ── Vue 3 flat recommended ────────────────────────────────────────────────
  ...vue.configs['flat/recommended'],

  // ── Парсер для .vue: vue-eslint-parser → внутри typescript-eslint ────────
  {
    files: ['**/*.vue'],
    languageOptions: {
      parser: vueParser,
      parserOptions: {
        parser: tseslint.parser,
        // Позволяет parser'у понимать lang="ts" внутри <script> блоков Vue SFC.
        extraFileLanguages: ['ts'],
      },
    },
  },

  // ── Кастомные правила конкретно под base-сборку ──────────────────────────
  {
    rules: {
      // Это base-проект с примерами, не production — ослабляем несколько шумных правил.
      // В реальном проекте включай постепенно через overrides.

      // Vue: разрешаем одно-словные имена компонентов (Bitrix legacy: Header, Menu)
      'vue/multi-word-component-names': 'off',

      // TS: any допустим в тестовых примерах и при interop со сторонними .d.ts.
      '@typescript-eslint/no-explicit-any': 'off',

      // TS: 'any' в типизациях — см. выше.
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',

      // no-undef не нужен: TypeScript разруливает сам.
      'no-undef': 'off',
    },
  },
];
