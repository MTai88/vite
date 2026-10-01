/**
 * ESLint flat config (ESLint 9+, ESM — под "type": "module" в package.json;
 * require()-вариант в ESM-пакете падает «module is not defined»).
 *
 * Раньше был legacy `.eslintrc` (JSON), переехали на flat — это обязательное
 * направление в ESLint 10+.
 *
 * Состав:
 *   1) js.configs.recommended               — базовые JS-правила
 *   2) typescript-eslint recommended        — TS-специфика
 *   3) eslint-plugin-vue flat/recommended   — Vue 3 правила для .vue SFC
 *   4) parser override: в .vue — vue-eslint-parser, внутри — tseslint.parser
 *
 * ignores — это первый конфиг; ESLint применяет его ко всем file matching'ам.
 * Здесь dist/, node_modules/, coverage/.
 */
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import vue from 'eslint-plugin-vue';
import vueParser from 'vue-eslint-parser';

export default [
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
