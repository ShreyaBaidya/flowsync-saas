/* ============================================================
   TASKLUNE — Theme Engine
   Manages light/dark theme across all pages.
   Exports: window.FlowsyncTheme
   ============================================================ */

const FlowsyncTheme = (function () {
  'use strict';

  const STORAGE_KEY = 'flowsync-theme';
  const THEMES      = { DARK: 'dark', LIGHT: 'light' };

  /* ── Read / apply / save ── */
  function getStored() {
    return localStorage.getItem(STORAGE_KEY); // 'light' | 'dark' | null
  }

  function getSystem() {
    return (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches)
      ? THEMES.LIGHT : THEMES.DARK;
  }

  function getCurrent() {
    return document.documentElement.getAttribute('data-theme') || THEMES.DARK;
  }

  function apply(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(STORAGE_KEY, theme);
    // Update every toggle button on the page (there may be one in navbar + sidebar)
    document.querySelectorAll('.theme-toggle-btn').forEach(btn => {
      const isLight = theme === THEMES.LIGHT;
      btn.setAttribute('aria-label', isLight ? 'Switch to dark mode' : 'Switch to light mode');
      btn.setAttribute('data-theme-current', theme);
      // show sun in dark mode (click → go light), moon in light mode (click → go dark)
      const sunIcon  = btn.querySelector('.theme-icon-sun');
      const moonIcon = btn.querySelector('.theme-icon-moon');
      if (sunIcon)  sunIcon.style.display  = isLight ? 'none' : 'block';
      if (moonIcon) moonIcon.style.display = isLight ? 'block' : 'none';
    });
    // Sync settings-page theme chips if present
    document.querySelectorAll('.theme-chip').forEach(chip => {
      chip.classList.toggle('active', chip.dataset.theme === theme);
    });
  }

  function toggle() {
    apply(getCurrent() === THEMES.DARK ? THEMES.LIGHT : THEMES.DARK);
  }

  function init() {
    const theme = getStored() || getSystem();
    apply(theme);
    // Listen for system preference changes (only applies when no saved preference)
    window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', (e) => {
      if (!getStored()) apply(e.matches ? THEMES.LIGHT : THEMES.DARK);
    });
  }

  /* ── Build the toggle button HTML ── */
  function buildToggleBtn() {
    const btn = document.createElement('button');
    btn.className  = 'theme-toggle-btn';
    btn.type       = 'button';
    btn.innerHTML  = `
      <!-- Sun icon: visible in dark mode (click to go light) -->
      <svg class="theme-icon-sun" width="18" height="18" viewBox="0 0 24 24" fill="none"
           aria-hidden="true" focusable="false">
        <circle cx="12" cy="12" r="4" stroke="currentColor" stroke-width="2"/>
        <path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M17.66 4.93l-1.41 1.41M4.93 19.07l1.41-1.41"
              stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      </svg>
      <!-- Moon icon: visible in light mode (click to go dark) -->
      <svg class="theme-icon-moon" width="18" height="18" viewBox="0 0 24 24" fill="none"
           aria-hidden="true" focusable="false" style="display:none">
        <path d="M21 12.79A9 9 0 1 1 11.21 3a7 7 0 0 0 9.79 9.79z"
              stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>`;
    btn.addEventListener('click', toggle);
    // Set initial state
    const isLight = getCurrent() === THEMES.LIGHT;
    btn.setAttribute('aria-label', isLight ? 'Switch to dark mode' : 'Switch to light mode');
    btn.setAttribute('data-theme-current', getCurrent());
    if (btn.querySelector('.theme-icon-sun'))  btn.querySelector('.theme-icon-sun').style.display  = isLight ? 'none'  : 'block';
    if (btn.querySelector('.theme-icon-moon')) btn.querySelector('.theme-icon-moon').style.display = isLight ? 'block' : 'none';
    return btn;
  }

  /* ── Inject toggle into a container element ── */
  function injectToggle(containerEl, position) {
    if (!containerEl) return;
    const btn = buildToggleBtn();
    if (position === 'prepend') containerEl.prepend(btn);
    else containerEl.appendChild(btn);
  }

  return { init, apply, toggle, getCurrent, getStored, injectToggle, buildToggleBtn, THEMES };
})();
