# vite-base (Bitrix / Bitrix24)

Современная сборка клиента на **Vite 6** для интеграции в шаблоны Bitrix и Bitrix24.
Переписана по мотивам `webpack-base` (1.3.0) — тот же стек, та же структура `src/`,
та же интеграция в Bitrix через `manifest.json`.

**Стек:** TypeScript, Vue 3, PostCSS (Tailwind CSS, nested, autoprefixer, cssnano), esbuild (встроен в Vite), ESLint 9 (flat config).  
**Подключение:** сам vite-проект (с `src/`, `package.json`, конфигами) кладётся в `<bitrix>/local/client/`. После `npm run build` рядом появится `<bitrix>/local/client/dist/` — его и читает `header.php` через `manifest.json`. Ничего копировать вручную не нужно.

---

## Структура

```
vite.config.js                  # единый конфиг (аналог webpack.{common,dev,prod}.js)
index.html                      # entry для vite dev/build
postcss.config.js               # postcss-import → tailwind → nested → autoprefixer → cssnano (prod)
tailwind.config.js              # префикс tw-, content globs, пресеты
tsconfig.json                   # target es2020, isolatedModules, strict
eslint.config.js                # ESLint 9 flat config (js + ts + vue)

.github/workflows/test.yml      # GitHub Actions: lint + build на Node 20/22
.gitlab-ci.yml                  # GitLab CI: lint + build (если не GitHub — переименуй/удали)

src/
├── index.ts                    # entry (импортируется из index.html)
├── scss/
│   ├── main.css                # корневой CSS, @tailwind директивы + reset
│   ├── tailwind.css            # @tailwind base/components/utilities
│   ├── variables.css           # CSS custom properties (заготовка)
│   └── mixins.css              # утилиты (заготовка)
├── vue/                        # Vue 3 SFC компоненты
├── js/, ts/                    # прочий код
└── *.vue / *.ts                # по необходимости

dist/                           # результат сборки + manifest.json (после build)
```

## Команды

```bash
npm ci               # установка зависимостей (clean install)
npm run dev          # dev-сервер http://localhost:3000 с HMR
npm run build        # prod-сборка → dist/
npm run watch        # watch-режим build (без dev-сервера)
npm run preview      # локальный просмотр prod-сборки
npm run lint         # ESLint (flat config, рекурсивно по src/)
npm run lint:fix     # ESLint с авто-фиксом
```

## Стек сборки

| Слой        | Пакет                                    | Назначение |
|-------------|------------------------------------------|------------|
| Bundler     | vite 6                                   | основной сборщик (dev: esbuild, build: Rollup с esbuild-минификацией) |
| Vue SFC     | @vitejs/plugin-vue + vue 3               | single-file components (аналог vue-loader) |
| TS/JS       | esbuild (встроен в vite)                 | транспиляция TS/JS/JSX (dev — мгновенно, build — за секунды) |
| CSS         | vite (встроенный CSS-пайплайн)           | импорт и экстракция (аналог css-loader + MiniCssExtractPlugin) |
| PostCSS     | postcss-loader (внутри vite)             | применяется автоматически |
|             | → postcss-import                         | резолв `@import './foo.css'` в бандл |
|             | → tailwindcss (v3, JIT, prefix `tw-`)    | утилитарные классы: `tw-flex`, `tw-bg-blue-500` |
|             | → postcss-nested                         | нативный CSS nesting (`&` селектор) |
|             | → autoprefixer (browserslist из pkg)     | вендорные префиксы |
|             | → cssnano (только в prod)               | минификация CSS (комменты, пробелы, merge rules) |
| Manifest    | встроенный плагин `vite-manifest`        | `dist/manifest.json` для Bitrix (тот же формат, что был у webpack) |
| Env         | `loadEnv()` + `define`                   | `.env` опционально; работают как `import.meta.env.*`, так и `process.env.*` для обратной совместимости |
| Vendor chunk| `rollupOptions.output.manualChunks`      | `vendor` отдельно от main (аналог `splitChunks` в webpack) |

### Почему esbuild вместо swc-loader

Vite использует esbuild для транспиляции «под капотом» (как в dev через HTTP-сервер, так и в build через Rollup-плагин `@rollup/plugin-esbuild` или встроенный минификатор). esbuild написан на Go и сопоставим со swc по скорости (оба — нативные бинарники, в разы быстрее Babel/ts-loader). Поэтому отдельный `@swc/core + swc-loader` для Vite не нужен — это лишняя зависимость и лишний postinstall. Если нужна совместимость с `.swcrc` — можно добавить [`unplugin-swc`](https://github.com/unplugin/unplugin-swc), но в базовой конфигурации это избыточно.

### CSS: SCSS больше нет

`src/scss/*.scss` → `src/scss/*.css`. SCSS-only фичи (`@use`, `@mixin`, `@include`, `$variable`)
больше не нужны:

- переменные → **CSS custom properties** в `variables.css` (`--color-brand: #ff0000`)
- миксины → **повторяющиеся utility-классы** в `mixins.css` или **Tailwind `@apply`** в `components`-слое
- вложенность → **нативный CSS nesting** через `postcss-nested` (`&` селектор)
- модульность → **`@import './foo.css'`** через `postcss-import`

Если реально нужен SCSS-сахар (например, сложные вычисления, loops, function-like mixins) — можно добавить `sass` и `vite-plugin-sass` / `sass-embedded`, но для 90% задач PostCSS + Tailwind покрывает.

### Tailwind: используем с префиксом `tw-`

`tailwind.config.js` ставит `prefix: 'tw-'` всем утилитам. Это нужно, чтобы не
пересекаться с утилитами из Bitrix (`adm-`, `bx-`, `popup-`), Bootstrap (`btn`, `d-flex`),
или сторонних плагинов. Все утилиты пишем с `tw-`:

```html
<div class="tw-flex tw-gap-4 tw-bg-slate-100">
  <span class="tw-text-lg tw-font-bold">…</span>
</div>
```

### ESLint 9 flat config

Конфиг в `eslint.config.js` (JavaScript, импорты через `require()`). Структура:

1. Глобальные `ignores`: `dist/**`, `node_modules/**`, `coverage/**`
2. `js.configs.recommended` — базовые JS-правила из ESLint
3. `...tseslint.configs.recommended` — TypeScript-специфика
4. `...vue.configs['flat/recommended']` — Vue 3 правила для `.vue` SFC
5. Парсер для `.vue`: `vue-eslint-parser` → внутри `tseslint.parser` (для `<script lang="ts">` блоков)
6. Кастомные правила для base-сборки (`vue/multi-word-component-names: off`, и т.п.)

В реальном проекте ослабленные правила постепенно убирают и включают более строгие пресеты.

## Интеграция с Bitrix

Схема такая: сам vite-проект лежит в `<bitrix>/local/client/` (рядом с шаблонами, компонентами и т.д.). Копировать собранный `dist/` вручную **не нужно** — после `npm run build` (или деплоя) он появляется прямо там:

```
<bitrix>/local/client/
├── src/                     # исходники
├── index.html               # entry для vite
├── package.json             # манифест сборки
├── vite.config.js           # конфиг
├── postcss.config.js
├── tailwind.config.js
├── eslint.config.js
├── tsconfig.json
├── .env                     # переменные окружения (опц.)
└── dist/                    # ← результат npm run build
    ├── js/main.<hash>.js
    ├── js/vendor.<hash>.js  (если включён manualChunks)
    ├── js/vendor.<hash>.chunk.js
    ├── css/main.<hash>.css
    ├── index.html           # vite его тоже кладёт — Bitrix его НЕ использует
    └── manifest.json
```

Затем в `header.php` шаблона читается `manifest.json` и подключаются файлы:

```php
<?php
$manifestPath = $_SERVER['DOCUMENT_ROOT'] . '/local/client/dist/manifest.json';
if (file_exists($manifestPath)) {
    $manifest = json_decode(file_get_contents($manifestPath), true);
    $distBase = '/local/client/dist';
    if (!empty($manifest['main.css'])) {
        $this->addCss($distBase . '/' . $manifest['main.css']);
    }
    if (!empty($manifest['main.js'])) {
        $this->addJs($distBase . '/' . $manifest['main.js']);
    }
    // vendor chunk, если он появится:
    if (!empty($manifest['vendor.js'])) {
        $this->addJs($distBase . '/' . $manifest['vendor.js']);
    }
}
?>
```

### Деплой

Обычно в Bitrix-проекте сборку запускают локально или в CI и коммитят уже **только** `dist/` (через `git add dist/`), а исходники остаются в отдельной репе (или в `.gitignore`). Если деплоишь через composer / rsync — клади на сервер весь `local/client/`, на сервере `npm ci && npm run build` и готово.

## CI/CD

В проекте два готовых CI-конфига (выбери свой):

### GitHub Actions — `.github/workflows/test.yml`

Триггеры: push в `main`, любые pull request.  
Действия: `npm ci` → одобрить `esbuild` postinstall → `npm run lint` → `npm run build` на Node 20.x и 22.x.  
Артефакт `dist/` загружается на 7 дней.

### GitLab CI — `.gitlab-ci.yml`

Триггеры: merge request, push в default branch.  
Те же шаги, плюс кеш `node_modules/` через `cache:key:files: package-lock.json`.  
`npm_config_allow_scripts: 'esbuild'` выставлен env-переменной, чтобы npm 11+ не блокировал postinstall.

**Один из этих файлов** (`test.yml` или `.gitlab-ci.yml`) оставь, второй удали — они не конфликтуют по логике, но держать оба смысла нет.

Если нужен автодеплой `dist/` на сервер — добавь отдельный job с rsync через `appleboy/ssh-action` (GitHub) или `rsync` script-блок (GitLab).

## Troubleshooting

### `Error: It looks like you're trying to use 'tailwindcss' directly as a PostCSS plugin`

npm автоматически поставил Tailwind **v4**, а в нём PostCSS-плагин переехал в отдельный пакет `@tailwindcss/postcss` и конфиг стал CSS-based. Наш конфиг написан под **v3.x** (`tailwind.config.js`, `@tailwind` директивы). Фикс:

```bash
npm install --save-dev tailwindcss@^3.4.0
```

### esbuild не стартует — "Cannot find module esbuild native bindings"

npm 11+ ввёл allow-scripts — `postinstall.js` для `esbuild` блокируется по дефолту. esbuild идёт в составе `vite`, поэтому при `npm ci` он не успевает скачать нативные бинарники. Решение:

```bash
npm approve-scripts esbuild
npm rebuild esbuild
```

В CI это либо `npm approve-scripts esbuild`, либо `npm_config_allow_scripts` env.

### CSS в prod не минифицируется (`cssnano` не запускается)

`postcss.config.js` проверяет `process.env.NODE_ENV === 'production'`. Vite в режиме `vite build` (mode=production) выставляет `NODE_ENV=production` через `define`, но **postcss-loader запускается в отдельном процессе** и видит окружение самого Node. Vite выставляет `process.env.NODE_ENV` явно при `build`, но если ты вызываешь скрипт из кастомной обёртки — убедись, что `NODE_ENV=production` доходит до vite. Проще всего: запускать именно `npm run build` — он вызывает `vite build`, и vite сам ставит режим по `mode`.

Если всё равно не работает — добавь в свой shell-скрипт перед запуском:

```bash
NODE_ENV=production npm run build
```

### Vite dev-server стартует, но HMR не работает

Проверь, что в `vite.config.js` поле `server.host = '0.0.0.0'` (или твой конкретный хост) и `server.port = 3000`. По умолчанию vite слушает только `localhost`, и если ты заходишь по IP — WebSocket HMR не доходит.

При подключении через Bitrix-шаблон dev-server не нужен — он для standalone-разработки.

### PowerShell блокирует `npm.ps1` (ExecutionPolicy)

Запускай напрямую через `npm.cmd`:

```powershell
& "C:\Program Files\nodejs\npm.cmd" run build
```

### `@vitejs/plugin-vue` не компилирует `<script lang="ts">` блоки

Этот плагин **из коробки** понимает `<script setup lang="ts">` — esbuild транспилирует TS. Если что-то не работает, проверь:

1. `vue` версии 3.3+ (`^3.5.13` в `package.json` уже подходит);
2. в `tsconfig.json` стоит `"jsx": "preserve"` или `"jsx": "preserve"` для Vue JSX (если используешь);
3. в `vite.config.js` плагин `vue()` подключён **до** остальных плагинов.

### `process.env.NODE_ENV` в библиотеках (Vue, и пр.)

Vite автоматически заменяет `import.meta.env.MODE`, `import.meta.env.DEV` и т.д. Но многие npm-пакеты (включая Vue) проверяют `process.env.NODE_ENV` напрямую. В нашем `vite.config.js` через `define` подменяется и `process.env.NODE_ENV` — это работает для всех популярных библиотек.

## Требования

- Node.js >= 20
- npm >= 10
- Browserslist для autoprefixer: `> 0.5%, last 2 versions, Firefox ESR, not dead, not IE 11`
  (см. поле `browserslist` в `package.json`)

## Миграция с webpack-base

### webpack 1.3.x → vite 1.0.0

- **Удалено:** `webpack`, `webpack-cli`, `webpack-dev-server`, `webpack-manifest-plugin`, `webpack-merge`, `swc-loader`, `@swc/core`, `css-loader`, `mini-css-extract-plugin`, `dotenv-webpack`, `eslint-webpack-plugin`, `postcss-loader`, `.swcrc`, `webpack.{common,dev,prod}.js`
- **Добавлено:** `vite`, `@vitejs/plugin-vue`, `index.html` (entry)
- **Конфиги:** три webpack-конфига → один `vite.config.js` (defineConfig с mode-функцией)
- **Vue:** `vue-loader` → `@vitejs/plugin-vue`
- **TS/JS:** `swc-loader` → встроенный esbuild (dev мгновенный, build за секунды)
- **CSS:** `mini-css-extract-plugin` + `css-loader` → встроенный CSS-пайплайн vite; `postcss.config.js` подхватывается автоматически
- **Env:** `dotenv-webpack` → `loadEnv()` из vite; `.env` теперь **обязательно** начинается с `VITE_` для автоподхвата, но мы через `loadEnv(mode, cwd, '')` берём **все** переменные и прокидываем в `process.env.<NAME>` через `define` (полная обратная совместимость с webpack-стилем)
- **Define:** `webpack.DefinePlugin({ __BUILD_DATE__ })` → `define: { __BUILD_DATE__: ... }` в vite-конфиге
- **Split chunks:** `optimization.splitChunks: { vendor }` → `rollupOptions.output.manualChunks(id => id.includes('node_modules') ? 'vendor' : undefined)`
- **Source maps:** `devtool: 'eval-cheap-module-source-map'` → `build.sourcemap: true`; `'hidden-source-map'` → `build.sourcemap: 'hidden'`
- **Dev server:** `webpack-dev-server` с `devServer.static`, `hot`, `historyApiFallback` → встроенный `server` в vite (HMR из коробки)
- **Манифест:** `WebpackManifestPlugin` → встроенный плагин `vite-manifest` через `generateBundle` hook (формат идентичен: `{ "main.js": "js/main.<hash>.js", "main.css": "css/main.<hash>.css" }`)
- **CI:** упоминания `@swc/core` в allow-scripts заменены на `esbuild`
- **Размер `dist/`:** за счёт tree-shaking Rollup сборка обычно на 10-20% компактнее webpack-овской

### Преимущества vite над webpack для этого use-case

1. **Скорость dev-старта:** Vite использует нативные ES-модули в браузере — нет бандлинга на старте, пересборка мгновенная (даже для крупных проектов).
2. **HMR быстрее:** обновляется только изменённый модуль, без пересборки всего графа зависимостей.
3. **Меньше конфигурации:** три файла → один. `postcss.config.js` подхватывается без `postcss-loader`, env-файлы без `dotenv-webpack`, alias'ы без `resolve.alias` отдельным плагином.
4. **Меньше зависимостей:** 30+ dev-зависимостей webpack-проекта → 15 в vite-проекте.
5. **Меньше postinstall-ловушек:** esbuild скачивается один раз (в составе vite), нет `@swc/core` с нативными WASI-биндингами.

## Roadmap

- **Итерация 1:** ✅ Vite 6 + @vitejs/plugin-vue + esbuild (встроен) + PostCSS/Tailwind + ESLint 9 flat
- **Итерация 2:** ⏳ Опционально: Pinia для state management, Vue Router для SPA-режима
- **Итерация 3:** ⏳ Опционально: Vitest для unit-тестов (нативная интеграция с vite)
- **Итерация 4:** ⏳ Опционально: `unplugin-swc` если потребуется совместимость с `.swcrc` из webpack-проекта