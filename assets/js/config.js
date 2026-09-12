/**
 * Configuración V2.
 *
 * Desarrollo local:
 * - conserva el flujo actual directo a n8n para no romper BrowserSync.
 * - autenticación desactivada porque localhost no publica /api.
 *
 * Producción/dominio:
 * - activa autenticación con cookie HttpOnly.
 * - todas las acciones pasan por FastAPI en /api/gateway/envios-distritos.
 * - el navegador deja de conocer/utilizar directamente el webhook de n8n.
 */
(() => {
  'use strict';

  const hostname = String(window.location.hostname || '').toLowerCase();
  const isLocal = (
    window.location.protocol === 'file:' ||
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '::1'
  );

  window.ENVIO_APP_CONFIG = {
    mode: 'live', // 'mock' | 'live'

    // En localhost se mantiene temporalmente el webhook directo para QA local.
    // En el dominio, el único gateway visible al navegador será FastAPI.
    gatewayWebhook: isLocal
      ? 'https://paneln8n.toga.pe/webhook/envios-distritos/solicitud'
      : '/api/gateway/envios-distritos',

    // El login se activa automáticamente fuera de localhost.
    authEnabled: !isLocal,
    apiBase: '/api',

    // Solo se usa como valor inicial visual. n8n mantiene la autoridad
    // sobre el periodo real mediante CONTROL DE CIERRES.
    defaultPeriod: '202607',

    themeStorageKey: 'envios-data-theme'
  };

  const LOGO_PATH = 'assets/img/toga-globe.svg';
  const BRAND_CSS_PATH = 'assets/css/brand-layout-fixes.css';
  const AUTH_CSS_PATH = 'assets/css/auth-ui.css';
  const AUTH_JS_PATH = 'assets/js/auth.js';

  function addStylesheet(path, datasetKey) {
    if (document.querySelector(`link[data-${datasetKey}]`)) return;
    const styles = document.createElement('link');
    styles.rel = 'stylesheet';
    styles.href = path;
    styles.setAttribute(`data-${datasetKey}`, 'true');
    document.head.appendChild(styles);
  }

  function applyBranding() {
    addStylesheet(BRAND_CSS_PATH, 'toga-brand-styles');

    if (!document.querySelector('link[data-toga-favicon]')) {
      const favicon = document.createElement('link');
      favicon.rel = 'icon';
      favicon.type = 'image/svg+xml';
      favicon.href = LOGO_PATH;
      favicon.dataset.togaFavicon = 'true';
      document.head.appendChild(favicon);
    }

    const brandMark = document.querySelector('.brand-mark');
    if (brandMark && !brandMark.querySelector('.brand-logo')) {
      brandMark.innerHTML = `
        <img
          class="brand-logo"
          src="${LOGO_PATH}"
          alt=""
          width="42"
          height="42"
          aria-hidden="true"
        />
      `;
    }
  }

  function loadAuthUi() {
    if (!window.ENVIO_APP_CONFIG.authEnabled) return;

    addStylesheet(AUTH_CSS_PATH, 'toga-auth-styles');

    if (!document.querySelector('script[data-toga-auth-script]')) {
      const script = document.createElement('script');
      script.src = AUTH_JS_PATH;
      script.defer = true;
      script.dataset.togaAuthScript = 'true';
      document.body.appendChild(script);
    }
  }

  function init() {
    applyBranding();
    loadAuthUi();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
