/**
 * Configuración V2 conectada a n8n.
 * Un único webhook actúa como gateway para consultar disponibilidad,
 * consultar lotes y generar el corte mediante el campo "accion".
 */
window.ENVIO_APP_CONFIG = {
  mode: 'live', // 'mock' | 'live'

  // Workflow GENERACION DATA ENVIOS activado en n8n.
  gatewayWebhook: 'https://paneln8n.toga.pe/webhook/envios-distritos/solicitud',

  // Solo se usa como valor inicial visual. n8n mantiene la autoridad
  // sobre el periodo real mediante CONTROL DE CIERRES.
  defaultPeriod: '202607',

  themeStorageKey: 'envios-data-theme'
};

(() => {
  'use strict';

  const LOGO_PATH = 'assets/img/toga-globe.svg';

  function applyBranding() {
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

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyBranding, { once: true });
  } else {
    applyBranding();
  }
})();
