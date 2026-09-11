(() => {
  'use strict';

  const CONFIG = window.ENVIO_APP_CONFIG || {};
  if (!CONFIG.authEnabled) return;

  const API = String(CONFIG.apiBase || '/api').replace(/\/$/, '');
  const LOGO = 'assets/img/toga-globe.svg';
  let currentUser = null;

  const qs = selector => document.querySelector(selector);

  function api(path, options = {}) {
    return fetch(`${API}${path}`, {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {})
      },
      ...options
    }).then(async response => {
      const text = await response.text();
      let data = {};
      try { data = text ? JSON.parse(text) : {}; } catch (_) {}
      if (!response.ok) {
        const message = data.detail || data.message || data.error || `${response.status} ${response.statusText}`;
        const error = new Error(message);
        error.status = response.status;
        throw error;
      }
      return data;
    });
  }

  function injectNav() {
    const nav = qs('.nav-list');
    if (!nav || qs('[data-view="credentials"]')) return;

    const button = document.createElement('button');
    button.className = 'nav-item';
    button.type = 'button';
    button.dataset.view = 'credentials';
    button.innerHTML = '<span class="nav-icon">⚿</span><span>Credenciales</span>';
    nav.appendChild(button);
    button.addEventListener('click', openCredentials);
  }

  function injectLogin() {
    if (qs('#authOverlay')) return;
    const overlay = document.createElement('div');
    overlay.className = 'auth-overlay';
    overlay.id = 'authOverlay';
    overlay.innerHTML = `
      <form class="auth-card" id="loginForm" novalidate>
        <div class="auth-brand">
          <img src="${LOGO}" alt="TOGA" />
          <div><strong>Generación de envíos</strong><span>Acceso seguro TOGA</span></div>
        </div>
        <h1>Iniciar sesión</h1>
        <p>Ingresa con las credenciales asignadas por un administrador.</p>
        <label class="auth-field"><span>Correo</span><input id="loginEmail" type="email" autocomplete="username" required /></label>
        <label class="auth-field"><span>Contraseña</span><input id="loginPassword" type="password" autocomplete="current-password" required /></label>
        <button class="auth-submit" id="loginSubmit" type="submit">Iniciar sesión</button>
        <div class="auth-message" id="loginMessage"></div>
      </form>`;
    document.body.appendChild(overlay);

    qs('#loginForm').addEventListener('submit', async event => {
      event.preventDefault();
      const email = qs('#loginEmail').value.trim();
      const password = qs('#loginPassword').value;
      const message = qs('#loginMessage');
      const submit = qs('#loginSubmit');
      message.textContent = '';
      submit.disabled = true;
      submit.textContent = 'Ingresando...';
      try {
        const result = await api('/auth/login', {
          method: 'POST',
          body: JSON.stringify({ email, password })
        });
        currentUser = result.user || result;
        overlay.hidden = true;
        await afterLogin();
      } catch (error) {
        message.textContent = error.message || 'No se pudo iniciar sesión.';
      } finally {
        submit.disabled = false;
        submit.textContent = 'Iniciar sesión';
      }
    });
  }

  function injectCredentialsView() {
    const main = qs('.main-content');
    if (!main || qs('#credentialsView')) return;
    const section = document.createElement('section');
    section.className = 'credentials-view';
    section.id = 'credentialsView';
    main.appendChild(section);
  }

  function renderSidebarUser() {
    const footer = qs('.sidebar-footer');
    if (!footer || !currentUser) return;

    let box = qs('#authUserBox');
    if (!box) {
      box = document.createElement('div');
      box.className = 'auth-user-pill';
      box.id = 'authUserBox';
      footer.prepend(box);
    }

    box.innerHTML = `
      <strong>${escapeHtml(currentUser.username || currentUser.email)}</strong>
      <span>${escapeHtml(currentUser.email)} · ${escapeHtml(currentUser.role)}</span>
      <button class="auth-logout" id="authLogout" type="button">Cerrar sesión</button>`;

    qs('#authLogout').addEventListener('click', async () => {
      try { await api('/auth/logout', { method: 'POST', body: '{}' }); } catch (_) {}
      window.location.reload();
    });
  }

  function escapeHtml(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function closeOtherViews() {
    document.body.classList.remove('is-history-view');
    qs('[data-view="history"]')?.classList.remove('is-active');
    qs('[data-view="generator"]')?.classList.remove('is-active');
    qs('[data-view="credentials"]')?.classList.add('is-active');
  }

  async function loadUsers() {
    if (currentUser?.role !== 'ADMIN') return [];
    const result = await api('/auth/users');
    return result.items || result.users || [];
  }

  async function renderCredentials() {
    const view = qs('#credentialsView');
    if (!view || !currentUser) return;

    const isAdmin = currentUser.role === 'ADMIN';
    let users = [];
    if (isAdmin) {
      try { users = await loadUsers(); } catch (_) { users = []; }
    }

    view.innerHTML = `
      <div class="credentials-head">
        <div><span class="section-number">CREDENCIALES</span><h2>Cuenta y accesos</h2><p>Administra tu perfil y los accesos al sistema.</p></div>
        <span class="credentials-role">${escapeHtml(currentUser.role)}</span>
      </div>
      ${currentUser.must_change_password ? '<div class="credentials-notice">Debes cambiar tu contraseña temporal antes de continuar usando el sistema.</div>' : ''}
      <div class="credentials-grid">
        <article class="credentials-card">
          <h3>Mi cuenta</h3>
          <form id="profileForm">
            <label class="auth-field"><span>Nombre</span><input id="profileName" value="${escapeHtml(currentUser.username || '')}" required /></label>
            <label class="auth-field"><span>Correo</span><input value="${escapeHtml(currentUser.email)}" disabled /></label>
            <div class="credentials-actions"><button class="button button--primary" type="submit">Guardar nombre</button></div>
          </form>
          <hr style="border:0;border-top:1px solid var(--border);margin:22px 0;" />
          <form id="passwordForm">
            <label class="auth-field"><span>Contraseña actual</span><input id="currentPassword" type="password" required /></label>
            <label class="auth-field"><span>Nueva contraseña</span><input id="newPassword" type="password" minlength="10" required /></label>
            <label class="auth-field"><span>Confirmar nueva contraseña</span><input id="confirmPassword" type="password" minlength="10" required /></label>
            <div class="credentials-actions"><button class="button button--primary" type="submit">Cambiar contraseña</button></div>
          </form>
        </article>
        ${isAdmin ? `
        <article class="credentials-card">
          <h3>Usuarios</h3>
          <form id="createUserForm">
            <label class="auth-field"><span>Nombre</span><input id="newUserName" required /></label>
            <label class="auth-field"><span>Correo</span><input id="newUserEmail" type="email" required /></label>
            <label class="auth-field"><span>Contraseña temporal</span><input id="newUserPassword" type="password" minlength="10" required /></label>
            <label class="auth-field"><span>Rol</span><select id="newUserRole"><option value="USER">Usuario</option><option value="ADMIN">Administrador</option></select></label>
            <div class="credentials-actions"><button class="button button--primary" type="submit">Crear usuario</button></div>
          </form>
          <div class="credentials-table-wrap" style="margin-top:22px;">
            <table class="credentials-table"><thead><tr><th>Usuario</th><th>Correo</th><th>Rol</th><th>Estado</th><th></th></tr></thead>
              <tbody>${users.map(user => `<tr><td>${escapeHtml(user.username)}</td><td>${escapeHtml(user.email)}</td><td>${escapeHtml(user.role)}</td><td>${user.is_active ? 'Activo' : 'Inactivo'}</td><td>${user.id === currentUser.id ? '' : `<button type="button" data-deactivate-user="${user.id}">${user.is_active ? 'Desactivar' : 'Activar'}</button>`}</td></tr>`).join('')}</tbody>
            </table>
          </div>
        </article>` : ''}
      </div>`;

    qs('#profileForm')?.addEventListener('submit', async event => {
      event.preventDefault();
      const result = await api('/auth/profile', { method: 'PATCH', body: JSON.stringify({ username: qs('#profileName').value.trim() }) });
      currentUser = result.user || result;
      renderSidebarUser();
      await renderCredentials();
    });

    qs('#passwordForm')?.addEventListener('submit', async event => {
      event.preventDefault();
      const next = qs('#newPassword').value;
      if (next !== qs('#confirmPassword').value) {
        alert('Las nuevas contraseñas no coinciden.');
        return;
      }
      const result = await api('/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({ current_password: qs('#currentPassword').value, new_password: next })
      });
      currentUser = result.user || currentUser;
      document.body.classList.remove('auth-force-password');
      renderSidebarUser();
      await renderCredentials();
      alert('Contraseña actualizada.');
    });

    qs('#createUserForm')?.addEventListener('submit', async event => {
      event.preventDefault();
      await api('/auth/users', {
        method: 'POST',
        body: JSON.stringify({
          username: qs('#newUserName').value.trim(),
          email: qs('#newUserEmail').value.trim(),
          temporary_password: qs('#newUserPassword').value,
          role: qs('#newUserRole').value
        })
      });
      await renderCredentials();
    });

    view.querySelectorAll('[data-deactivate-user]').forEach(button => {
      button.addEventListener('click', async () => {
        const id = button.dataset.deactivateUser;
        await api(`/auth/users/${id}/toggle-active`, { method: 'POST', body: '{}' });
        await renderCredentials();
      });
    });
  }

  async function openCredentials() {
    if (!currentUser) return;
    document.body.classList.add('is-credentials-view');
    closeOtherViews();
    const title = qs('.topbar h1');
    if (title) title.textContent = 'Credenciales';
    await renderCredentials();
  }

  function leaveCredentials() {
    document.body.classList.remove('is-credentials-view');
    qs('[data-view="credentials"]')?.classList.remove('is-active');
  }

  async function afterLogin() {
    injectNav();
    injectCredentialsView();
    renderSidebarUser();

    qs('[data-view="generator"]')?.addEventListener('click', leaveCredentials);
    qs('[data-view="history"]')?.addEventListener('click', leaveCredentials);

    if (currentUser.must_change_password) {
      document.body.classList.add('auth-force-password');
      await openCredentials();
    }
  }

  async function bootstrap() {
    injectLogin();
    const overlay = qs('#authOverlay');
    try {
      const result = await api('/auth/me');
      currentUser = result.user || result;
      overlay.hidden = true;
      await afterLogin();
    } catch (error) {
      overlay.hidden = false;
    }
  }

  bootstrap();
})();
