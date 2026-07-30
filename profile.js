/* ============================================================
   FLOWSYNC — Profile Page JavaScript
   ============================================================ */

(function () {
  'use strict';

  /* ── Auth guard: redirect unauthenticated users ── */
  if (!FlowsyncAuth.isSignedIn()) {
    window.location.replace('signin.html');
    return;
  }

  /* ──────────────────────────────────────────────
     SHARED NAVBAR INIT (same pattern as app.js)
  ────────────────────────────────────────────── */
  function populateNavbar() {
    const user = FlowsyncAuth.getUser();
    if (!user) return;

    const navAuthOut  = document.getElementById('navAuthOut');
    const navAuthIn   = document.getElementById('navAuthIn');
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

  /* ── Profile dropdown toggle ── */
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

  /* ── Hamburger mobile menu ── */
  function initHamburger() {
    const hamburger  = document.getElementById('hamburger');
    const mobileMenu = document.getElementById('mobileMenu');
    const navbar     = document.getElementById('navbar');
    if (!hamburger || !mobileMenu) return;

    hamburger.addEventListener('click', () => {
      const isOpen = mobileMenu.classList.toggle('open');
      hamburger.classList.toggle('open', isOpen);
    });
    document.querySelectorAll('.mobile-link, .mobile-cta').forEach(link => {
      link.addEventListener('click', () => {
        mobileMenu.classList.remove('open');
        hamburger.classList.remove('open');
      });
    });
    document.addEventListener('click', (e) => {
      if (navbar && !navbar.contains(e.target) && !mobileMenu.contains(e.target)) {
        mobileMenu.classList.remove('open');
        hamburger.classList.remove('open');
      }
    });
  }

  /* ── Logout (desktop dropdown + sidebar + mobile) ── */
  function initLogout() {
    function doLogout() {
      FlowsyncAuth.signOut();
      window.location.href = 'index.html';
    }
    ['logoutBtn', 'sidebarLogoutBtn', 'mobileLogoutBtn'].forEach(id => {
      const btn = document.getElementById(id);
      if (btn) btn.addEventListener('click', doLogout);
    });
  }

  /* ──────────────────────────────────────────────
     TOAST
  ────────────────────────────────────────────── */
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

  /* ──────────────────────────────────────────────
     PROFILE VIEW / EDIT
  ────────────────────────────────────────────── */
  const viewMode  = document.getElementById('viewMode');
  const editMode  = document.getElementById('editMode');
  const editBtn   = document.getElementById('editBtn');
  const cancelBtn = document.getElementById('cancelBtn');
  const editForm  = document.getElementById('editForm');
  const saveBtn   = document.getElementById('saveBtn');
  const nameInput = document.getElementById('editNameInput');

  /* Populate the view-mode card from stored user */
  function renderViewMode() {
    const user = FlowsyncAuth.getUser();
    if (!user) return;

    const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };

    set('viewAvatar',  user.initials);
    set('viewName',    user.name);
    set('viewEmail',   user.email);
    set('fieldName',   user.name);
    set('fieldEmail',  user.email);

    // Member since
    const since = user.signedInAt
      ? new Date(user.signedInAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
      : 'Unknown';
    set('fieldSince', since);
  }

  /* Populate the edit-mode form from stored user */
  function renderEditMode() {
    const user = FlowsyncAuth.getUser();
    if (!user) return;
    if (nameInput) nameInput.value = user.name;
    const emailDisplay = document.getElementById('editEmailDisplay');
    if (emailDisplay) emailDisplay.value = user.email;
    const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
    set('editCurrentName',  user.name);
    set('editCurrentEmail', user.email);
    set('editAvatar',       user.initials);
  }

  /* Show view mode */
  function showView() {
    renderViewMode();
    viewMode.style.display = '';
    editMode.style.display = 'none';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /* Show edit mode */
  function showEdit() {
    renderEditMode();
    viewMode.style.display = 'none';
    editMode.style.display = '';
    if (nameInput) {
      nameInput.focus();
      nameInput.select();
    }
  }

  /* Validation helpers */
  function setError(groupId, msg) {
    const g = document.getElementById(groupId);
    if (!g) return;
    g.classList.add('has-error');
    const e = g.querySelector('.form-error');
    if (e) e.textContent = msg;
  }
  function clearError(groupId) {
    const g = document.getElementById(groupId);
    if (!g) return;
    g.classList.remove('has-error');
    const e = g.querySelector('.form-error');
    if (e) e.textContent = '';
  }

  /* Save handler */
  if (editForm) {
    editForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const newName = nameInput ? nameInput.value.trim() : '';

      if (!newName || newName.length < 2) {
        setError('editNameGroup', 'Name must be at least 2 characters.');
        return;
      }
      clearError('editNameGroup');

      // Disable button, show spinner
      saveBtn.disabled = true;
      saveBtn.querySelector('.btn-text').style.display    = 'none';
      saveBtn.querySelector('.btn-spinner').style.display = 'inline-flex';

      // Simulate async save (250ms feels snappy but intentional)
      setTimeout(() => {
        // Persist to localStorage
        FlowsyncAuth.updateUser({ name: newName });

        // Re-enable button
        saveBtn.disabled = false;
        saveBtn.querySelector('.btn-text').style.display    = '';
        saveBtn.querySelector('.btn-spinner').style.display = 'none';

        // Update navbar avatar/name/initials instantly — no reload needed
        populateNavbar();

        // Return to view mode with fresh data
        showView();
        showToast('Profile updated successfully.', 'success');
      }, 280);
    });
  }

  /* Live update of the avatar preview in edit mode while typing */
  if (nameInput) {
    nameInput.addEventListener('input', () => {
      const val = nameInput.value.trim();
      const initials = val ? FlowsyncAuth.getInitials(val) : '?';
      const el = document.getElementById('editAvatar');
      if (el) el.textContent = initials;
      const nameEl = document.getElementById('editCurrentName');
      if (nameEl) nameEl.textContent = val || '—';
    });
  }

  /* Button wiring */
  if (editBtn)   editBtn.addEventListener('click',   showEdit);
  if (cancelBtn) cancelBtn.addEventListener('click', showView);

  /* ──────────────────────────────────────────────
     BOOT
  ────────────────────────────────────────────── */
  populateNavbar();
  initProfileDropdown();
  initHamburger();
  initLogout();
  renderViewMode();   // Start in view mode

  // Init theme engine and inject toggle
  if (typeof FlowsyncTheme !== 'undefined') {
    FlowsyncTheme.init();
    const navThemeToggle = document.getElementById('navThemeToggle');
    if (navThemeToggle) FlowsyncTheme.injectToggle(navThemeToggle);
    const mobileThemeRow = document.getElementById('mobileThemeRow');
    if (mobileThemeRow) FlowsyncTheme.injectToggle(mobileThemeRow);
  }

})();
