(function () {
  const forms = document.querySelectorAll('[data-contact-form]');
  if (!forms.length) {
    return;
  }

  function updateStatus(el, type, message) {
    if (!el) {
      return;
    }

    el.classList.remove('text-brand-600', 'text-red-600', 'text-slate-500');
    if (type === 'success') {
      el.classList.add('text-brand-600');
    } else if (type === 'error') {
      el.classList.add('text-red-600');
    } else {
      el.classList.add('text-slate-500');
    }
    el.textContent = message;
  }

  forms.forEach((form) => {
    const statusElement = form.querySelector('[data-contact-status]');
    const submitButton = form.querySelector('[data-contact-submit]');
    const originalButtonText = submitButton ? submitButton.textContent : '';

    form.addEventListener('submit', async (event) => {
      event.preventDefault();

      updateStatus(statusElement, 'info', '');

      const formData = new FormData(form);
      const payload = new URLSearchParams();
      formData.forEach((value, key) => {
        if (typeof value === 'string') {
          payload.append(key, value);
        }
      });

      if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = 'Senden...';
      }

      try {
        const response = await fetch(form.action, {
          method: form.method || 'post',
          body: payload,
          headers: { Accept: 'application/json' }
        });

        const result = await response.json().catch(() => ({}));

        if (response.ok && result.success) {
          updateStatus(statusElement, 'success', result.message || 'Vielen Dank für Ihre Anfrage!');
          form.reset();
        } else {
          const errorMessage = result.error || 'Das Formular konnte nicht gesendet werden. Bitte versuchen Sie es erneut.';
          updateStatus(statusElement, 'error', errorMessage);
        }
      } catch (error) {
        console.error('Kontaktformular Fehler:', error);
        updateStatus(statusElement, 'error', 'Netzwerkfehler. Bitte prüfen Sie Ihre Verbindung und versuchen Sie es erneut.');
      } finally {
        if (submitButton) {
          submitButton.disabled = false;
          submitButton.textContent = originalButtonText;
        }
      }
    });
  });
})();
