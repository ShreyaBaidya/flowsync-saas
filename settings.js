/* ============================================================
   FLOWSYNC — Settings Page JavaScript
   ============================================================ */

(function () {
  'use strict';

  /* ── Auth guard ── */
  if (!FlowsyncAuth.isSignedIn()) {
    window.location.replace('signin.html');
    return;
  }

  /* ── Toast ── */
  function showToast(message, type = 'success') {
    const toast = document.getElementById('globalToast');
    if (!toast) return;
    toast.className = `toast ${type}`;
    toast.querySelector('.toast-msg').textContent = message;
    void toast.offsetWidth;
    toast.classList.add('show');
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => toast.classList.remove('show'), 3600);
  }

  /* ── Populate navbar ── */
  function populateNavbar() {
    const user = FlowsyncAuth.getUser();
    if (!user) return;
    const navAuthOut = document.getElementById('navAuthOut');
    const navAuthIn  = document.getElementById('navAuthIn');
    if (navAuthOut) navAuthOut.style.display = 'none';
    if (navAuthIn)  navAuthIn.style.display  = 'flex';
    const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
    set('profileAvatar',  user.initials);
    set('dropdownAvatar', user.initials);
    set('dropdownName',   user.name);
    set('dropdownEmail',  user.email);
    set('mobileAvatar',    user.initials);
    set('mobileUserName',  user.name);
    set('mobileUserEmail', user.email);
  }

  /* ── Profile dropdown ── */
  function initProfileDropdown() {
    const profileBtn      = document.getElementById('profileBtn');
    const profileDropdown = document.getElementById('profileDropdown');
    if (!profileBtn || !profileDropdown) return;
    profileBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = profileDropdown.classList.toggle('open');
      profileBtn.setAttribute('aria-expanded', String(isOpen));
      profileDropdown.setAttribute('aria-hidden', String(!isOpen));
    });
    document.addEventListener('click', (e) => {
      if (!profileBtn.contains(e.target) && !profileDropdown.contains(e.target)) {
        profileDropdown.classList.remove('open');
        profileBtn.setAttribute('aria-expanded', 'false');
        profileDropdown.setAttribute('aria-hidden', 'true');
      }
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && profileDropdown.classList.contains('open')) {
        profileDropdown.classList.remove('open');
        profileBtn.setAttribute('aria-expanded', 'false');
        profileBtn.focus();
      }
    });
  }

  /* ── Hamburger ── */
  function initHamburger() {
    const hamburger  = document.getElementById('hamburger');
    const mobileMenu = document.getElementById('mobileMenu');
    const navbar     = document.getElementById('navbar');
    if (!hamburger || !mobileMenu) return;
    hamburger.addEventListener('click', () => {
      const isOpen = mobileMenu.classList.toggle('open');
      hamburger.classList.toggle('open', isOpen);
    });
    document.querySelectorAll('.mobile-link, .mobile-cta').forEach(l => {
      l.addEventListener('click', () => { mobileMenu.classList.remove('open'); hamburger.classList.remove('open'); });
    });
    document.addEventListener('click', (e) => {
      if (navbar && !navbar.contains(e.target) && !mobileMenu.contains(e.target)) {
        mobileMenu.classList.remove('open'); hamburger.classList.remove('open');
      }
    });
  }

  /* ── Logout ── */
  function initLogout() {
    function doLogout() { FlowsyncAuth.signOut(); window.location.href = 'index.html'; }
    ['logoutBtn', 'sidebarLogoutBtn', 'mobileLogoutBtn'].forEach(id => {
      const btn = document.getElementById(id);
      if (btn) btn.addEventListener('click', doLogout);
    });
  }

  /* ── Theme chips ── */
  // Sync chip active state with current theme
  function syncThemeChips(theme) {
    document.querySelectorAll('.theme-chip').forEach(c => {
      c.classList.toggle('active', c.dataset.theme === theme);
    });
  }

  document.querySelectorAll('.theme-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const chosen = chip.dataset.theme;
      if (chosen === 'system') {
        // Remove saved preference so system preference takes over dynamically
        localStorage.removeItem('flowsync-theme');
        const sys = (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) ? 'light' : 'dark';
        // Apply visually without re-saving to localStorage
        document.documentElement.setAttribute('data-theme', sys);
        document.querySelectorAll('.theme-toggle-btn').forEach(btn => {
          const isLight = sys === 'light';
          btn.setAttribute('aria-label', isLight ? 'Switch to dark mode' : 'Switch to light mode');
          const sunIcon  = btn.querySelector('.theme-icon-sun');
          const moonIcon = btn.querySelector('.theme-icon-moon');
          if (sunIcon)  sunIcon.style.display  = isLight ? 'none'  : 'block';
          if (moonIcon) moonIcon.style.display = isLight ? 'block' : 'none';
        });
        syncThemeChips('system');
      } else {
        if (typeof FlowsyncTheme !== 'undefined') FlowsyncTheme.apply(chosen);
        syncThemeChips(chosen);
      }
      showToast(`Theme set to "${chosen}".`, 'success');
    });
  });

  /* ── Toggle pills ── */
  document.querySelectorAll('.toggle-pill input[type="checkbox"]').forEach(cb => {
    cb.addEventListener('change', () => {
      const label = cb.closest('.settings-row')?.querySelector('.settings-row-label')?.textContent || 'Setting';
      showToast(`${label} ${cb.checked ? 'enabled' : 'disabled'}.`, 'success');
    });
  });

  /* ── Danger zone buttons ── */
  const signOutAllBtn = document.getElementById('signOutAllBtn');
  if (signOutAllBtn) {
    signOutAllBtn.addEventListener('click', () => {
      FlowsyncAuth.signOut();
      window.location.href = 'signin.html';
    });
  }

  const deleteAccountBtn = document.getElementById('deleteAccountBtn');
  if (deleteAccountBtn) {
    deleteAccountBtn.addEventListener('click', () => {
      const confirmed = confirm('This will permanently delete your account and all data. This action cannot be undone.\n\nContinue?');
      if (confirmed) {
        FlowsyncAuth.signOut();
        showToast('Account deleted successfully.', 'success');
        setTimeout(() => { window.location.href = 'index.html'; }, 1800);
      }
    });
  }

  /* ── Boot ── */
  populateNavbar();
  initProfileDropdown();
  initHamburger();
  initLogout();

  // Init theme engine and inject toggle
  if (typeof FlowsyncTheme !== 'undefined') {
    FlowsyncTheme.init();
    const navThemeToggle = document.getElementById('navThemeToggle');
    if (navThemeToggle) FlowsyncTheme.injectToggle(navThemeToggle);
    const mobileThemeRow = document.getElementById('mobileThemeRow');
    if (mobileThemeRow) FlowsyncTheme.injectToggle(mobileThemeRow);
    // Sync chips with current theme (or 'system' if no saved pref)
    const saved = FlowsyncTheme.getStored();
    document.querySelectorAll('.theme-chip').forEach(c => {
      c.classList.toggle('active', saved ? c.dataset.theme === saved : c.dataset.theme === 'system');
    });
  }

})();
