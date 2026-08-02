/* ============================================================
   TASKLUNE — Contact Sales Modal
   Handles open/close, validation, and submission for the
   Contact Sales modal on the landing page.
   No external email service — submission is handled locally.
   ============================================================ */

(function () {
  'use strict';

  const overlay      = document.getElementById('contactSalesOverlay');
  const modal        = document.getElementById('contactSalesModal');
  const openBtn      = document.getElementById('contactSalesBtn');
  const closeBtn     = document.getElementById('csClose');
  const form         = document.getElementById('csForm');
  const formWrap     = document.getElementById('csFormWrap');
  const confirmPanel = document.getElementById('csConfirm');
  const closeConfirm = document.getElementById('csCloseConfirm');
  const submitBtn    = document.getElementById('csSubmit');

  /* ── Open / close ── */
  function openModal() {
    overlay.classList.add('open');
    overlay.setAttribute('aria-hidden', 'false');
    // Focus first input after transition completes
    setTimeout(() => {
      const first = form.querySelector('input, select, textarea');
      if (first) first.focus();
    }, 120);
    // Prevent background scroll
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    overlay.classList.remove('open');
    overlay.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    // After close animation, restore form view for next open
    setTimeout(() => {
      confirmPanel.style.display = 'none';
      formWrap.style.display     = '';
      resetForm();
    }, 260);
  }

  function resetForm() {
    form.reset();
    // Clear all error states
    form.querySelectorAll('.cs-field').forEach(f => {
      f.classList.remove('has-error');
      const errEl = f.querySelector('.cs-error');
      if (errEl) errEl.textContent = '';
    });
    submitBtn.disabled = false;
    submitBtn.querySelector('.cs-submit-text').style.display    = '';
    submitBtn.querySelector('.cs-submit-spinner').style.display = 'none';
  }

  /* ── Triggers ── */
  openBtn.addEventListener('click', openModal);

  // "Talk to sales" in the CTA band — same modal, no duplicate
  const talkToSalesBtn = document.getElementById('talkToSalesBtn');
  if (talkToSalesBtn) talkToSalesBtn.addEventListener('click', openModal);

  closeBtn.addEventListener('click', closeModal);
  closeConfirm.addEventListener('click', closeModal);

  // Click outside the modal card
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeModal();
  });

  // Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && overlay.classList.contains('open')) {
      closeModal();
    }
  });

  /* ── Validation helpers ── */
  function setError(fieldId, errId, msg) {
    const field = document.getElementById(fieldId);
    const wrap  = document.getElementById(errId)?.closest('.cs-field');
    const errEl = document.getElementById(errId);
    if (wrap)  wrap.classList.add('has-error');
    if (errEl) errEl.textContent = msg;
    if (field) field.setAttribute('aria-invalid', 'true');
  }

  function clearError(fieldId, errId) {
    const field = document.getElementById(fieldId);
    const wrap  = document.getElementById(errId)?.closest('.cs-field');
    const errEl = document.getElementById(errId);
    if (wrap)  wrap.classList.remove('has-error');
    if (errEl) errEl.textContent = '';
    if (field) field.removeAttribute('aria-invalid');
  }

  function isValidEmail(val) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim());
  }

  // Clear error on input so feedback is immediate
  [
    ['csName',    'csErrName'],
    ['csEmail',   'csErrEmail'],
    ['csCompany', 'csErrCompany'],
  ].forEach(([inputId, errId]) => {
    document.getElementById(inputId)?.addEventListener('input', () => {
      const wrap = document.getElementById(errId)?.closest('.cs-field');
      if (wrap?.classList.contains('has-error')) clearError(inputId, errId);
    });
  });

  /* ── Form submission ── */
  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const name    = document.getElementById('csName').value.trim();
    const email   = document.getElementById('csEmail').value.trim();
    const company = document.getElementById('csCompany').value.trim();

    let valid = true;

    // Name
    if (!name) {
      setError('csName', 'csErrName', 'Full name is required.');
      valid = false;
    } else {
      clearError('csName', 'csErrName');
    }

    // Email
    if (!email) {
      setError('csEmail', 'csErrEmail', 'Work email is required.');
      valid = false;
    } else if (!isValidEmail(email)) {
      setError('csEmail', 'csErrEmail', 'Please enter a valid email address.');
      valid = false;
    } else {
      clearError('csEmail', 'csErrEmail');
    }

    // Company
    if (!company) {
      setError('csCompany', 'csErrCompany', 'Company name is required.');
      valid = false;
    } else {
      clearError('csCompany', 'csErrCompany');
    }

    if (!valid) {
      // Focus the first errored field
      const firstErr = form.querySelector('.cs-field.has-error input, .cs-field.has-error select');
      if (firstErr) firstErr.focus();
      return;
    }

    // Show loading state
    submitBtn.disabled = true;
    submitBtn.querySelector('.cs-submit-text').style.display    = 'none';
    submitBtn.querySelector('.cs-submit-spinner').style.display = 'flex';

    // Simulate a brief processing delay, then show confirmation
    setTimeout(() => {
      formWrap.style.display     = 'none';
      confirmPanel.style.display = '';
      // Scroll modal to top so confirmation is fully visible
      modal.scrollTop = 0;
    }, 800);
  });

})();
