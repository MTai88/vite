import { defineConfig, loadEnv } from 'vite';
import vue from '@vitejs/plugin-vue';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Vite config.
 *
 * Заменяет тройку webpack.{common,dev,prod}.js. По аналогии с webpack-проектом:
 *   - entry: src/index.ts (через index.html)
 *   - output: dist/ с manifest.json для Bitrix
 *   - aliases: @, @components, @styles, @js
 *   - Vue SFC через @vitejs/plugin-vue (аналог vue-loader)
 *   - PostCSS pipeline: postcss-import → tailwind → postcss-nested → autoprefixer → cssnano (prod)
 *     читается из postcss.config.js автоматически
 *   - TS транспилируется встроенным esbuild (аналог swc-loader, но без postinstall-нативов)
 *   - vendor chunk в rollupOptions.manualChunks (аналог splitChunks: { vendor })
 *   - dotenv через loadEnv() + define (аналог dotenv-webpack)
 *   - __BUILD_DATE__ через define (аналог DefinePlugin)
 *
 * Манифест генерируется встроенным плагином `viteManifestPlugin` ниже —
 * формат совместим с тем, что раньше писал WebpackManifestPlugin.
 */
export default defineConfig(({ mode }) => {
  // mode = 'development' | 'production' (или кастомный)
  const isProd = mode === 'production';

  // Грузим ВСЕ переменные из .env (по умолчанию loadEnv берёт только VITE_*).
  // Так доступны BITRIX_API_VERSION и прочие, без префикса.
  const env = loadEnv(mode, process.cwd(), '');

  // define для process.env.<NAME> — обратная совместимость с webpack-проектом,
  // где через DefinePlugin / EnvironmentPlugin подменялся process.env.
  const envDefine = Object.fromEntries(
    Object.entries(env).map(([key, value]) => [
      `process.env.${key}`,
      JSON.stringify(value),
    ]),
  );

  return {
    plugins: [
      vue(),

      // ── Кастомный плагин: dist/manifest.json ────────────────────────────
      // Формат совместим с WebpackManifestPlugin:
      //   { "main.js": "js/main.abc12345.js", "main.css": "css/main.abc12345.css" }
      // Source maps в манифест не попадают (как и в webpack).
      {
        name: 'vite-manifest',
        apply: 'build',
        generateBundle(_options, bundle) {
          const manifest = {};
          for (const [fileName, chunk] of Object.entries(bundle)) {
            if (fileName.endsWith('.map')) continue;
            // entry chunk → "main.<ext>": "<rel-path>"
            if (chunk.type === 'chunk' && chunk.isEntry) {
              const ext = fileName.endsWith('.css') ? 'css' : 'js';
              manifest[`main.${ext}`] = fileName;
            }
            if (chunk.type === 'asset' && fileName.endsWith('.css')) {
              // CSS-ассеты, сгенерированные из импортов в JS-чанке
              manifest[`main.css`] = manifest[`main.css`] || fileName;
            }
          }
          this.emitFile({
            type: 'asset',
            fileName: 'manifest.json',
            source: JSON.stringify(manifest, null, 2),
          });
        },
      },
    ],

    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
        '@components': path.resolve(__dirname, 'src/vue'),
        '@styles': path.resolve(__dirname, 'src/scss'),
        '@js': path.resolve(__dirname, 'src/js'),
      },
    },

    css: {
      // postcss.config.js подхватывается автоматически, но фиксируем явно
      // (полезно, если в проекте появятся несколько PostCSS-конфигов).
      postcss: './postcss.config.js',
    },

    define: {
      __BUILD_DATE__: JSON.stringify(new Date().toISOString()),
      'process.env.NODE_ENV': JSON.stringify(mode),
      ...envDefine,
    },

    build: {
      outDir: 'dist',
      emptyOutDir: true,
      // sourcemap: в dev — inline, в prod — hidden (как в webpack).
      sourcemap: isProd ? 'hidden' : true,
      // Не пишем index.html в dist/ для Bitrix — но он там полезен для vite preview.
      // Чтобы исключить, оставляем как есть: Bitrix читает только manifest.json.
      // Если index.html в dist/ мешает — можно добавить closeBundle hook и удалять.

      cssCodeSplit: true, // аналог MiniCssExtractPlugin: CSS в отдельный файл
      target: 'es2020',   // как в webpack

      rollupOptions: {
        input: path.resolve(__dirname, 'index.html'),
        output: {
          // Структура путей как в webpack: js/[name].[hash].js
          entryFileNames: 'js/[name].[hash].js',
          chunkFileNames: 'js/[name].[hash].chunk.js',
          assetFileNames: ({ names = [] } = {}) => {
            const name = names[0] ?? '';
            if (/\.(eot|svg|ttf|woff|woff2|png|jpg|gif|webp)$/i.test(name)) {
              return 'assets/[name].[hash][extname]';
            }
            return 'assets/[name].[hash][extname]';
          },
          // vendor chunk — аналог splitChunks: { vendor: { test: /node_modules/ } }
          manualChunks(id) {
            if (id.includes('node_modules')) return 'vendor';
          },
        },
      },

      // performance hints: ругаться, если что-то больше 512 КБ (как в webpack)
      chunkSizeWarningLimit: 512,
    },

    server: {
      port: 3000,
      host: '0.0.0.0',
      strictPort: false,
      open: false,
      // proxy НЕ настраивается — по требованию Bitrix хостится отдельно,
      // аналогично webpack-dev-server.
    },

    preview: {
      port: 3000,
      host: '0.0.0.0',
    },
  };
});