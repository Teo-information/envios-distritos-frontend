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
