(() => {
  'use strict';

  const form = document.querySelector('#requestForm');
  const inputs = [
    document.querySelector('#projectId1'),
    document.querySelector('#projectId2'),
    document.querySelector('#projectId3')
  ].filter(Boolean);
  const rule = document.querySelector('#projectIdRule');
  const toast = document.querySelector('#toast');

  if (!form || inputs.length !== 3) return;

  function isWhatsapp() {
    return document.querySelector('input[name="canal"]:checked')?.value === 'WHATSAPP';
  }

  function sanitize(input) {
    const cleaned = String(input.value || '').replace(/\D/g, '').slice(0, 4);
    if (input.value !== cleaned) input.value = cleaned;
  }

  function showToast(message) {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('is-visible');
    window.clearTimeout(showToast.timer);
    showToast.timer = window.setTimeout(() => toast.classList.remove('is-visible'), 3200);
  }

  function clearState() {
    inputs.forEach(input => input.classList.remove('is-project-id-invalid'));
    if (rule) {
      rule.classList.remove('is-error', 'is-valid');
      rule.textContent = 'Cada Project ID debe tener 3 o 4 dígitos y los tres deben ser diferentes.';
    }
  }

  function validate({ report = false } = {}) {
    if (!isWhatsapp()) {
      clearState();
      return { valid: true, message: '', firstInvalid: null };
    }

    const values = inputs.map(input => input.value.trim());
    const invalidLengthIndexes = values
      .map((value, index) => (/^\d{3,4}$/.test(value) ? -1 : index))
      .filter(index => index >= 0);

    const counts = values.reduce((map, value) => {
      if (value) map.set(value, (map.get(value) || 0) + 1);
      return map;
    }, new Map());

    const duplicateIndexes = values
      .map((value, index) => (value && counts.get(value) > 1 ? index : -1))
      .filter(index => index >= 0);

    const invalidIndexes = new Set([...invalidLengthIndexes, ...duplicateIndexes]);

    inputs.forEach((input, index) => {
      const shouldMark = invalidIndexes.has(index) && (report || input.value.length >= 3);
      input.classList.toggle('is-project-id-invalid', shouldMark);
    });

    let message = '';
    if (invalidLengthIndexes.length) {
      message = 'Los 3 Project IDs deben tener exactamente 3 o 4 dígitos.';
    } else if (duplicateIndexes.length) {
      message = 'Los 3 Project IDs deben ser diferentes entre sí.';
    }

    if (rule) {
      rule.classList.toggle('is-error', Boolean(message) && report);
      rule.classList.toggle('is-valid', !message && values.every(Boolean));
      rule.textContent = message && report
        ? message
        : 'Cada Project ID debe tener 3 o 4 dígitos y los tres deben ser diferentes.';
    }

    return {
      valid: !message,
      message,
      firstInvalid: invalidIndexes.size ? inputs[[...invalidIndexes][0]] : null
    };
  }

  inputs.forEach(input => {
    input.setAttribute('maxlength', '4');
    input.setAttribute('inputmode', 'numeric');
    input.setAttribute('pattern', '[0-9]{3,4}');
    input.setAttribute('autocomplete', 'off');

    input.addEventListener('input', () => {
      sanitize(input);
      validate({ report: false });
    });

    input.addEventListener('blur', () => {
      if (input.value) validate({ report: true });
    });
  });

  document.querySelectorAll('input[name="canal"]').forEach(input => {
    input.addEventListener('change', () => validate({ report: false }));
  });

  // Captura el submit antes que app.js para impedir cualquier consulta inválida.
  form.addEventListener('submit', event => {
    const result = validate({ report: true });
    if (result.valid) return;

    event.preventDefault();
    event.stopImmediatePropagation();
    showToast(result.message);
    result.firstInvalid?.focus();
  }, true);
})();
