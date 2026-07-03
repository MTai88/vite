/**
 * Entry-файл клиентской сборки.
 *
 * Подключается в Bitrix-шаблоне через манифест:
 *   /local/client/dist/manifest.json → main.js / main.css
 *
 * Стили импортируются одним корневым main.css, который через
 * postcss-import подтягивает variables / mixins / tailwind.
 */
import './scss/main.css';

document.addEventListener('DOMContentLoaded', (): void => {
  // Здесь код инициализации клиента.
  // Vue 3 компоненты монтируются через createApp(...).mount('#app')
  // после готовности DOM.
});
