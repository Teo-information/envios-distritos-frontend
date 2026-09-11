/**
 * Configuración V2 conectada a n8n.
 * Un único webhook actúa como gateway para consultar disponibilidad,
 * consultar lotes y generar el corte mediante el campo "accion".
 */
window.ENVIO_APP_CONFIG = {
  mode: 'live', // 'mock' | 'live'

  // Mientras la autenticación está desactivada, el frontend conserva
  // el flujo actual directo a n8n. Al desplegar el dominio se cambiará
  // a /api/gateway/envios-distritos detrás de FastAPI autenticado.
  gatewayWebhook: 'https://paneln8n.toga.pe/webhook/envios-distritos/solicitud',

  // Preparado para el despliegue con FastAPI + cookie HttpOnly.
  // Se activa cuando el backend y el proxy HTTPS estén verificados.
  authEnabled: false,
  apiBase: '/api',

  // Solo se usa como valor inicial visual. n8n mantiene la autoridad
  // sobre el periodo real mediante CONTROL DE CIERRES.
  defaultPeriod: '202607',

  themeStorageKey: 'envios-data-theme'
};

(() => {
  'use strict';

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
