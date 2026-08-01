/* ============================================================
   FLOWSYNC — Auth Pages JavaScript
   ============================================================ */

(function () {
  'use strict';

  /* ── If already signed in, redirect away from auth pages ── */
  if (FlowsyncAuth.isSignedIn()) {
    const page = window.location.pathname.split('/').pop();
    if (page === 'signin.html' || page === 'signup.html') {
      window.location.replace('dashboard.html');
      return; // Stop executing the rest of this module
    }
  }

  /* ── Theme init and toggle injection ── */
  if (typeof FlowsyncTheme !== 'undefined') {
    FlowsyncTheme.init();
    const navThemeToggle = document.getElementById('navThemeToggle');
    if (navThemeToggle) FlowsyncTheme.injectToggle(navThemeToggle);
  }

  /* ── Utility: show a toast notification ── */
  function showToast(message, type = 'success') {
    let toast = document.getElementById('globalToast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'globalToast';
      toast.className = 'toast';
      toast.innerHTML = '<span class="toast-dot"></span><span class="toast-msg"></span>';
      document.body.appendChild(toast);
    }
    toast.className = `toast ${type}`;
    toast.querySelector('.toast-msg').textContent = message;
    // Force reflow for re-trigger
    void toast.offsetWidth;
    toast.classList.add('show');
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => toast.classList.remove('show'), 3800);
  }

  /* ── Utility: set field error ── */
  function setError(groupId, message) {
    const group = document.getElementById(groupId);
    if (!group) return;
    group.classList.add('has-error');
    group.classList.remove('has-success');
    const err = group.querySelector('.form-error');
    if (err) err.textContent = message;
  }

  /* ── Utility: clear field error ── */
  function clearError(groupId) {
    const group = document.getElementById(groupId);
    if (!group) return;
    group.classList.remove('has-error');
    const err = group.querySelector('.form-error');
    if (err) err.textContent = '';
  }

  /* ── Utility: set field success ── */
  function setSuccess(groupId) {
    const group = document.getElementById(groupId);
    if (!group) return;
    group.classList.remove('has-error');
    group.classList.add('has-success');
    const err = group.querySelector('.form-error');
    if (err) err.textContent = '';
  }

  /* ── Utility: validate email ── */
  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  }

  /* ── Utility: set button loading state ── */
  function setButtonLoading(btn, loading) {
    const text    = btn.querySelector('.btn-text');
    const spinner = btn.querySelector('.btn-spinner');
    btn.disabled  = loading;
    if (text)    text.style.display    = loading ? 'none' : '';
    if (spinner) spinner.style.display = loading ? 'inline-flex' : 'none';
  }

  /* ── Password show/hide toggle ── */
  function initPasswordToggle(inputId, toggleId) {
    const input  = document.getElementById(inputId);
    const btn    = document.getElementById(toggleId);
    if (!input || !btn) return;
    const eyeOpen   = btn.querySelector('#eyeOpen');
    const eyeClosed = btn.querySelector('#eyeClosed');
    btn.addEventListener('click', () => {
      const isHidden = input.type === 'password';
      input.type = isHidden ? 'text' : 'password';
      if (eyeOpen)   eyeOpen.style.display   = isHidden ? 'none'  : '';
      if (eyeClosed) eyeClosed.style.display = isHidden ? ''      : 'none';
      btn.setAttribute('aria-label', isHidden ? 'Hide password' : 'Show password');
    });
  }

  /* ── Real-time field validation on blur/input ── */
  function attachFieldValidation(inputEl, groupId, validator) {
    if (!inputEl) return;
    inputEl.addEventListener('blur', () => {
      const result = validator(inputEl.value);
      if (result) setError(groupId, result);
      else setSuccess(groupId);
    });
    inputEl.addEventListener('input', () => {
      if (document.getElementById(groupId).classList.contains('has-error')) {
        const result = validator(inputEl.value);
        if (!result) setSuccess(groupId);
        else setError(groupId, result);
      }
    });
  }

  /* ── Social button handler (demo) ── */
  function initSocialButtons() {
    const google = document.getElementById('googleBtn');
    const github = document.getElementById('githubBtn');
    if (google) google.addEventListener('click', () => showToast('Google sign-in is not available.', 'error'));
    if (github) github.addEventListener('click', () => showToast('GitHub sign-in is not available.', 'error'));
  }

  /* ============================================================
     SIGN IN PAGE
  ============================================================ */
  const signinForm = document.getElementById('signinForm');
  if (signinForm) {
    initPasswordToggle('password', 'togglePassword');
    initSocialButtons();

    // Real-time validation
    attachFieldValidation(
      document.getElementById('email'), 'emailGroup',
      (v) => !v.trim() ? 'Email is required.' : !isValidEmail(v) ? 'Please enter a valid email address.' : ''
    );
    attachFieldValidation(
      document.getElementById('password'), 'passwordGroup',
      (v) => !v ? 'Password is required.' : v.length < 6 ? 'Password must be at least 6 characters.' : ''
    );

    signinForm.addEventListener('submit', (e) => {
      e.preventDefault();
      let valid = true;

      const email    = document.getElementById('email').value.trim();
      const password = document.getElementById('password').value;

      if (!email) {
        setError('emailGroup', 'Email is required.'); valid = false;
      } else if (!isValidEmail(email)) {
        setError('emailGroup', 'Please enter a valid email address.'); valid = false;
      } else {
        clearError('emailGroup');
      }

      if (!password) {
        setError('passwordGroup', 'Password is required.'); valid = false;
      } else if (password.length < 6) {
        setError('passwordGroup', 'Password must be at least 6 characters.'); valid = false;
      } else {
        clearError('passwordGroup');
      }

      if (!valid) return;

      const submitBtn = document.getElementById('submitBtn');
      setButtonLoading(submitBtn, true);

      ApiClient.post('/auth/signin', { email, password })
        .then((data) => {
          // Response envelope: { success, data: { user, accessToken } }
          const payload = data.data || data;
          const existing = FlowsyncAuth.getUser();
          FlowsyncAuth.signIn({
            name:           payload.user?.name  || email.split('@')[0],
            email:          payload.user?.email || email,
            plan:           payload.user?.plan  || existing?.plan || 'starter',
            trialStartedAt: payload.user?.trialStartedAt || existing?.trialStartedAt,
            token:          payload.accessToken
          });
          if (payload.accessToken) {
            FlowsyncAuth.setToken(payload.accessToken);
          }
          showToast('Signed in successfully! Redirecting…', 'success');
          setTimeout(() => { window.location.href = 'dashboard.html'; }, 1200);
        })
        .catch((err) => {
          setButtonLoading(submitBtn, false);
          const msg = err.status === 401
            ? 'Incorrect email or password.'
            : err.message || 'Sign-in failed. Please try again.';
          showToast(msg, 'error');
        });
    });
  }

  /* ============================================================
     SIGN UP PAGE
  ============================================================ */
  const signupForm = document.getElementById('signupForm');
  if (signupForm) {
    initPasswordToggle('password', 'togglePassword');
    initSocialButtons();

    // Password strength meter
    const passwordInput = document.getElementById('password');
    const strengthBar   = document.getElementById('strengthBar');
    const strengthFill  = document.getElementById('strengthFill');
    const strengthLabel = document.getElementById('strengthLabel');

    function getStrength(pw) {
      if (!pw) return { score: 0, label: '', cls: '' };
      let score = 0;
      if (pw.length >= 8)  score++;
      if (/[A-Z]/.test(pw)) score++;
      if (/[0-9]/.test(pw)) score++;
      if (/[^A-Za-z0-9]/.test(pw)) score++;
      if (score <= 1) return { score: 1, label: 'Weak',   cls: 'weak' };
      if (score <= 2) return { score: 2, label: 'Fair',   cls: 'fair' };
      return               { score: 3, label: 'Strong', cls: 'strong' };
    }

    if (passwordInput && strengthBar) {
      passwordInput.addEventListener('input', () => {
        const pw = passwordInput.value;
        if (!pw) { strengthBar.style.display = 'none'; return; }
        strengthBar.style.display = 'flex';
        const s = getStrength(pw);
        strengthFill.className = `strength-fill ${s.cls}`;
        strengthLabel.className = `strength-label ${s.cls}`;
        strengthLabel.textContent = s.label;
      });
    }

    // Real-time validation
    attachFieldValidation(
      document.getElementById('fullName'), 'nameGroup',
      (v) => !v.trim() ? 'Full name is required.' : v.trim().length < 2 ? 'Please enter your full name.' : ''
    );
    attachFieldValidation(
      document.getElementById('email'), 'emailGroup',
      (v) => !v.trim() ? 'Work email is required.' : !isValidEmail(v) ? 'Please enter a valid email address.' : ''
    );
    attachFieldValidation(
      document.getElementById('password'), 'passwordGroup',
      (v) => !v ? 'Password is required.' : v.length < 8 ? 'Password must be at least 8 characters.' : ''
    );

    signupForm.addEventListener('submit', (e) => {
      e.preventDefault();
      console.count("SIGNIN SUBMIT");
      let valid = true;

      const name     = document.getElementById('fullName').value.trim();
      const email    = document.getElementById('email').value.trim();
      const password = document.getElementById('password').value;
      const terms    = document.getElementById('agreeTerms').checked;

      if (!name || name.length < 2) {
        setError('nameGroup', 'Full name is required.'); valid = false;
      } else { clearError('nameGroup'); }

      if (!email) {
        setError('emailGroup', 'Work email is required.'); valid = false;
      } else if (!isValidEmail(email)) {
        setError('emailGroup', 'Please enter a valid email address.'); valid = false;
      } else { clearError('emailGroup'); }

      if (!password) {
        setError('passwordGroup', 'Password is required.'); valid = false;
      } else if (password.length < 8) {
        setError('passwordGroup', 'Password must be at least 8 characters.'); valid = false;
      } else { clearError('passwordGroup'); }

      if (!terms) {
        setError('termsGroup', 'You must agree to the terms to continue.'); valid = false;
      } else { clearError('termsGroup'); }

      if (!valid) return;

      const submitBtn = document.getElementById('submitBtn');
      setButtonLoading(submitBtn, true);

      // Read the plan the user selected on the pricing page (if any)
      const pendingPlan = sessionStorage.getItem('flowsync_pending_plan') || 'starter';

      ApiClient.post('/auth/signup', { name, email, password, plan: pendingPlan })
        .then((data) => {
          sessionStorage.removeItem('flowsync_pending_plan');

          // Response envelope: { success, data: { user, accessToken } }
          const payload = data.data || data;
          const signInData = {
            name:  payload.user?.name  || name,
            email: payload.user?.email || email,
            plan:  payload.user?.plan  || pendingPlan,
            token: payload.accessToken
          };
          if (signInData.plan === 'pro_trial') {
            signInData.trialStartedAt = payload.user?.trialStartedAt || Date.now();
          }
          FlowsyncAuth.signIn(signInData);
          if (payload.accessToken) {
            FlowsyncAuth.setToken(payload.accessToken);
          }
          showToast('Account created! Welcome to Flowsync.', 'success');
          setTimeout(() => { window.location.href = 'dashboard.html'; }, 1200);
        })
        .catch((err) => {
          setButtonLoading(submitBtn, false);
          const msg = err.status === 409
            ? 'An account with this email already exists.'
            : err.message || 'Sign-up failed. Please try again.';
          showToast(msg, 'error');
        });
    });
  }

  /* ============================================================
     FORGOT PASSWORD PAGE
  ============================================================ */
  const forgotForm = document.getElementById('forgotForm');
  if (forgotForm) {
    attachFieldValidation(
      document.getElementById('email'), 'emailGroup',
      (v) => !v.trim() ? 'Email is required.' : !isValidEmail(v) ? 'Please enter a valid email address.' : ''
    );

    forgotForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const email = document.getElementById('email').value.trim();

      if (!email) {
        setError('emailGroup', 'Email is required.'); return;
      }
      if (!isValidEmail(email)) {
        setError('emailGroup', 'Please enter a valid email address.'); return;
      }
      clearError('emailGroup');

      const forgotBtn = document.getElementById('submitBtn');
      setButtonLoading(forgotBtn, true);
      setTimeout(() => {
        setButtonLoading(forgotBtn, false);
        document.getElementById('step1').style.display = 'none';
        document.getElementById('sentEmail').textContent = email;
        document.getElementById('step2').style.display = 'block';
      }, 1400);
    });

    const resendBtn = document.getElementById('resendBtn');
    if (resendBtn) {
      resendBtn.addEventListener('click', () => {
        showToast('Reset link resent — check your inbox.', 'success');
      });
    }
  }

})();
