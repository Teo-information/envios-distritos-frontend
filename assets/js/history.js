(() => {
  'use strict';

  const CONFIG = window.ENVIO_APP_CONFIG || {};
  const main = document.querySelector('.main-content');
  const topbarTitle = document.querySelector('.topbar h1');
  const generatorNav = document.querySelector('[data-view="generator"]');
  const historyNav = document.querySelector('[data-view="history"]');

  if (!main || !generatorNav || !historyNav) return;

  const originalTitle = topbarTitle?.textContent || 'Generación de cortes';
  let loaded = false;
  let loading = false;
  let rows = [];

  function escapeHtml(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function number(value) {
    return new Intl.NumberFormat('es-PE').format(Number(value || 0));
  }

  function normalizeText(value) {
    return String(value || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  }

  function channelClass(value) {
    const channel = String(value || '').toUpperCase();
    if (channel === 'EMAIL') return 'history-channel--email';
    if (channel === 'WHATSAPP') return 'history-channel--whatsapp';
    return 'history-channel--other';
  }

  function parseDate(value) {
    if (!value) return null;
    const raw = String(value).trim();
    const parsed = new Date(raw);
    if (!Number.isNaN(parsed.getTime())) return parsed;

    const ddmmyyyy = raw.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
    if (ddmmyyyy) {
      const [, d, m, y] = ddmmyyyy;
      const date = new Date(Number(y), Number(m) - 1, Number(d));
      if (!Number.isNaN(date.getTime())) return date;
    }

    return null;
  }

  function formatDate(value) {
    const date = parseDate(value);
    if (!date) return value ? String(value) : '—';

    return new Intl.DateTimeFormat('es-PE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  }

  function createView() {
    const section = document.createElement('section');
    section.className = 'history-view';
    section.id = 'historyView';
    section.setAttribute('aria-live', 'polite');
    section.innerHTML = `
      <div class="history-grid-bg" aria-hidden="true"></div>
      <div class="history-content">
        <div class="history-head">
          <div class="history-title-wrap">
            <span class="section-number">HISTORIAL</span>
            <h2>Cortes realizados</h2>
            <p>Consulta los cortes confirmados registrados por el sistema.</p>
          </div>
          <div class="history-count" aria-label="Cantidad de cortes">
            <span class="history-count__glow" aria-hidden="true"></span>
            <strong id="historyCount">0</strong>
            <span class="history-count__label">cortes</span>
          </div>
        </div>

        <div class="history-search-row">
          <div class="history-search" id="historySearchBox">
            <span class="history-search__glow" aria-hidden="true"></span>
            <span class="history-search__border" aria-hidden="true"></span>
            <span class="history-search__inner-border" aria-hidden="true"></span>
            <svg class="history-search__icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle cx="11" cy="11" r="7" stroke="currentColor" stroke-width="2"></circle>
              <path d="m16.5 16.5 4 4" stroke="currentColor" stroke-width="2" stroke-linecap="round"></path>
            </svg>
            <input
              class="history-search__input"
              id="historySearch"
              type="text"
              autocomplete="off"
              placeholder="Buscar por fecha..."
              aria-label="Buscar cortes por fecha"
            />
            <button class="history-filter-button" id="historyDateButton" type="button" aria-label="Seleccionar fecha">
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M4 5h16l-6.4 7.2v5.3l-3.2 1.7v-7L4 5Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"></path>
              </svg>
            </button>
            <input class="history-date-native" id="historyDateNative" type="date" tabindex="-1" aria-hidden="true" />
          </div>

          <button class="history-refresh" id="historyRefresh" type="button">Actualizar historial</button>
        </div>

        <div class="history-table-shell" id="historyTableShell">
          <div class="history-loading">Consultando cortes...</div>
        </div>
      </div>
    `;

    main.appendChild(section);
    return section;
  }

  const view = createView();
  const searchInput = view.querySelector('#historySearch');
  const dateInput = view.querySelector('#historyDateNative');
  const dateButton = view.querySelector('#historyDateButton');
  const refreshButton = view.querySelector('#historyRefresh');
  const tableShell = view.querySelector('#historyTableShell');
  const countEl = view.querySelector('#historyCount');

  function normalizeRows(payload) {
    const source = Array.isArray(payload)
      ? payload
      : (payload?.items || payload?.historial || payload?.lotes || payload?.batches || payload?.data || payload?.result || []);

    if (!Array.isArray(source)) return [];

    return source
      .map((row, index) => ({
        id: row.batch_id || row.id || `${index}`,
        fecha: row.fecha_corte || row.confirmed_at || row.completed_at || row.created_at || row.fecha || '',
        cantidad: Number(row.generados ?? row.cantidad ?? row.solicitados ?? row.total ?? 0),
        tipo: String(row.canal || row.tipo || '').toUpperCase(),
        distrito: row.distrito_nombre || row.distrito || '—',
        status: String(row.status || row.estado || 'COMPLETED').toUpperCase()
      }))
      .filter(row => !row.status || row.status === 'COMPLETED')
      .sort((a, b) => {
        const aTime = parseDate(a.fecha)?.getTime() || 0;
        const bTime = parseDate(b.fecha)?.getTime() || 0;
        return bTime - aTime;
      });
  }

  function filteredRows() {
    const query = normalizeText(searchInput.value);
    if (!query) return rows;

    return rows.filter(row => {
      const rawDate = normalizeText(row.fecha);
      const formatted = normalizeText(formatDate(row.fecha));
      const compact = formatted.replace(/[^0-9]/g, '');
      const queryCompact = query.replace(/[^0-9]/g, '');

      return rawDate.includes(query)
        || formatted.includes(query)
        || (queryCompact && compact.includes(queryCompact));
    });
  }

  function render() {
    const result = filteredRows();
    countEl.textContent = number(result.length);

    if (!result.length) {
      tableShell.innerHTML = `
        <div class="history-empty">
          <div>
            <strong>No se encontraron cortes</strong>
            <span>${rows.length ? 'Prueba con otra fecha.' : 'Todavía no hay cortes confirmados para mostrar.'}</span>
          </div>
        </div>
      `;
      return;
    }

    tableShell.innerHTML = `
      <div class="history-table-wrap">
        <table class="history-table">
          <thead>
            <tr>
              <th scope="col">Fecha del corte</th>
              <th scope="col">Cantidad</th>
              <th scope="col">Tipo</th>
              <th scope="col">Distrito</th>
            </tr>
          </thead>
          <tbody>
            ${result.map((row, index) => `
              <tr style="animation-delay:${Math.min(index * 32, 320)}ms">
                <td>${escapeHtml(formatDate(row.fecha))}</td>
                <td><strong>${number(row.cantidad)}</strong></td>
                <td>
                  <span class="history-channel ${channelClass(row.tipo)}">
                    <span class="history-channel__dot" aria-hidden="true"></span>
                    ${escapeHtml(row.tipo || '—')}
                  </span>
                </td>
                <td>${escapeHtml(row.distrito)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  async function requestHistory() {
    if (!CONFIG.gatewayWebhook) {
      throw new Error('No está configurado el gateway de n8n.');
    }

    const response = await fetch(CONFIG.gatewayWebhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accion: 'historial' })
    });

    const text = await response.text();
    let data;

    try {
      data = text ? JSON.parse(text) : {};
    } catch (_) {
      throw new Error('n8n devolvió una respuesta no JSON para el historial.');
    }

    if (!response.ok || data?.ok === false) {
      const detail = data?.message || data?.detail || data?.error || `${response.status} ${response.statusText}`;
      throw new Error(detail);
    }

    return data;
  }

  async function loadHistory({ force = false } = {}) {
    if (loading || (loaded && !force)) return;

    loading = true;
    refreshButton.disabled = true;
    refreshButton.textContent = 'Actualizando...';
    tableShell.innerHTML = '<div class="history-loading">Consultando cortes...</div>';

    try {
      const data = await requestHistory();
      rows = normalizeRows(data);
      loaded = true;
      render();
    } catch (error) {
      tableShell.innerHTML = `
        <div class="history-error">
          <div>
            <strong>Historial aún no disponible</strong>
            <span>${escapeHtml(error.message || 'No se pudo consultar el historial.')}</span>
            <br />
            <button class="history-refresh" id="historyRetry" type="button">Reintentar</button>
          </div>
        </div>
      `;
      tableShell.querySelector('#historyRetry')?.addEventListener('click', () => loadHistory({ force: true }));
    } finally {
      loading = false;
      refreshButton.disabled = false;
      refreshButton.textContent = 'Actualizar historial';
    }
  }

  function openHistory() {
    document.body.classList.add('is-history-view');
    generatorNav.classList.remove('is-active');
    historyNav.classList.add('is-active');
    if (topbarTitle) topbarTitle.textContent = 'Historial de cortes';
    loadHistory();
  }

  function openGenerator() {
    document.body.classList.remove('is-history-view');
    historyNav.classList.remove('is-active');
    generatorNav.classList.add('is-active');
    if (topbarTitle) topbarTitle.textContent = originalTitle;
  }

  historyNav.disabled = false;
  historyNav.removeAttribute('disabled');
  historyNav.querySelector('.nav-badge')?.remove();

  historyNav.addEventListener('click', openHistory);
  generatorNav.addEventListener('click', openGenerator);
  refreshButton.addEventListener('click', () => loadHistory({ force: true }));
  searchInput.addEventListener('input', render);

  dateButton.addEventListener('click', () => {
    if (typeof dateInput.showPicker === 'function') {
      dateInput.showPicker();
    } else {
      dateInput.focus();
      dateInput.click();
    }
  });

  dateInput.addEventListener('change', () => {
    if (!dateInput.value) {
      searchInput.value = '';
    } else {
      const [year, month, day] = dateInput.value.split('-');
      searchInput.value = `${day}/${month}/${year}`;
    }
    render();
  });
})();
