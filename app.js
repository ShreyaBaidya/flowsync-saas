/* ============================================================
   TASKLUNE — App JavaScript
   ============================================================ */

(function () {
  'use strict';

  /* ── Theme init (must run early) ── */
  if (typeof FlowsyncTheme !== 'undefined') {
    FlowsyncTheme.init();
    // Inject toggle into the landing-page navbar
    const navThemeToggle = document.getElementById('navThemeToggle');
    if (navThemeToggle) FlowsyncTheme.injectToggle(navThemeToggle);
    // Also inject into the mobile menu so it's accessible on small screens
    const mobileThemeRow = document.getElementById('mobileThemeRow');
    if (mobileThemeRow) FlowsyncTheme.injectToggle(mobileThemeRow);
  }

  /* ============================================================
     NAVBAR AUTH STATE
     Reads from FlowsyncAuth (auth-state.js) and updates the
     navbar immediately on load. No page refresh needed after
     login because auth.js writes to localStorage then redirects
     here, so this runs fresh on every page load.
  ============================================================ */
  function initNavbarAuth() {
    const user        = FlowsyncAuth.getUser();
    const navAuthOut  = document.getElementById('navAuthOut');
    const navAuthIn   = document.getElementById('navAuthIn');
    const profileAvatar  = document.getElementById('profileAvatar');
    const dropdownAvatar = document.getElementById('dropdownAvatar');
    const dropdownName   = document.getElementById('dropdownName');
    const dropdownEmail  = document.getElementById('dropdownEmail');
    // Mobile
    const mobileAuthOut  = document.getElementById('mobileAuthOut');
    const mobileAuthIn   = document.getElementById('mobileAuthIn');
    const mobileAvatar   = document.getElementById('mobileAvatar');
    const mobileUserName = document.getElementById('mobileUserName');
    const mobileUserEmail= document.getElementById('mobileUserEmail');

    if (user) {
      // ── Show logged-in state ──
      if (navAuthOut)  navAuthOut.style.display  = 'none';
      if (navAuthIn)   navAuthIn.style.display   = 'flex';
      if (mobileAuthOut) mobileAuthOut.style.display = 'none';
      if (mobileAuthIn)  mobileAuthIn.style.display  = 'block';

      // Populate avatar / name / email
      if (profileAvatar)   profileAvatar.textContent  = user.initials;
      if (dropdownAvatar)  dropdownAvatar.textContent  = user.initials;
      if (dropdownName)    dropdownName.textContent    = user.name;
      if (dropdownEmail)   dropdownEmail.textContent   = user.email;
      if (mobileAvatar)    mobileAvatar.textContent    = user.initials;
      if (mobileUserName)  mobileUserName.textContent  = user.name;
      if (mobileUserEmail) mobileUserEmail.textContent = user.email;
    } else {
      // ── Show logged-out state (default) ──
      if (navAuthOut)  navAuthOut.style.display  = 'flex';
      if (navAuthIn)   navAuthIn.style.display   = 'none';
      if (mobileAuthOut) mobileAuthOut.style.display = 'block';
      if (mobileAuthIn)  mobileAuthIn.style.display  = 'none';
    }
  }

  /* ── Profile dropdown toggle ── */
  function initProfileDropdown() {
    const profileBtn     = document.getElementById('profileBtn');
    const profileDropdown= document.getElementById('profileDropdown');
    if (!profileBtn || !profileDropdown) return;

    profileBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = profileDropdown.classList.toggle('open');
      profileBtn.setAttribute('aria-expanded', String(isOpen));
      profileDropdown.setAttribute('aria-hidden',  String(!isOpen));
    });

    // Close on outside click
    document.addEventListener('click', (e) => {
      if (!profileBtn.contains(e.target) && !profileDropdown.contains(e.target)) {
        profileDropdown.classList.remove('open');
        profileBtn.setAttribute('aria-expanded', 'false');
        profileDropdown.setAttribute('aria-hidden', 'true');
      }
    });

    // Close on Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && profileDropdown.classList.contains('open')) {
        profileDropdown.classList.remove('open');
        profileBtn.setAttribute('aria-expanded', 'false');
        profileDropdown.setAttribute('aria-hidden', 'true');
        profileBtn.focus();
      }
    });
  }

  /* ── Logout ── */
  function initLogout() {
    // Desktop logout
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        FlowsyncAuth.signOut();
        initNavbarAuth(); // re-render navbar immediately, no reload needed
        // Close dropdown
        const profileDropdown = document.getElementById('profileDropdown');
        const profileBtn      = document.getElementById('profileBtn');
        if (profileDropdown) profileDropdown.classList.remove('open');
        if (profileBtn) profileBtn.setAttribute('aria-expanded', 'false');
      });
    }
    // Mobile logout
    const mobileLogoutBtn = document.getElementById('mobileLogoutBtn');
    if (mobileLogoutBtn) {
      mobileLogoutBtn.addEventListener('click', () => {
        FlowsyncAuth.signOut();
        initNavbarAuth();
        // Close mobile menu
        document.getElementById('mobileMenu')?.classList.remove('open');
        document.getElementById('hamburger')?.classList.remove('open');
      });
    }
  }

  // Run auth UI immediately on page load
  initNavbarAuth();
  initProfileDropdown();
  initLogout();

  /* ── Navbar scroll effect ── */
  const navbar = document.getElementById('navbar');
  function handleScroll() {
    if (window.scrollY > 20) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  }
  window.addEventListener('scroll', handleScroll, { passive: true });
  handleScroll();

  /* ── Mobile hamburger menu ── */
  const hamburger = document.getElementById('hamburger');
  const mobileMenu = document.getElementById('mobileMenu');

  hamburger.addEventListener('click', () => {
    const isOpen = mobileMenu.classList.toggle('open');
    hamburger.classList.toggle('open', isOpen);
    hamburger.setAttribute('aria-label', isOpen ? 'Close menu' : 'Open menu');
  });

  // Close mobile menu when a link is clicked
  document.querySelectorAll('.mobile-link, .mobile-cta').forEach(link => {
    link.addEventListener('click', () => {
      mobileMenu.classList.remove('open');
      hamburger.classList.remove('open');
    });
  });

  // Close mobile menu on outside click
  document.addEventListener('click', (e) => {
    if (!navbar.contains(e.target) && !mobileMenu.contains(e.target)) {
      mobileMenu.classList.remove('open');
      hamburger.classList.remove('open');
    }
  });

  /* ── Smooth scroll for in-page anchor links only ── */
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const href = this.getAttribute('href');
      // Skip bare '#' (no-op links) — don't hijack them
      if (!href || href === '#') {
        e.preventDefault();
        return;
      }
      const target = document.querySelector(href);
      if (target) {
        e.preventDefault();
        const offset = 80; // navbar height
        const top = target.getBoundingClientRect().top + window.scrollY - offset;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    });
  });

  /* ── Feature card auth gate ── */
  // Clickable feature cards go to dashboard.html#<view>.
  // Unauthenticated users are redirected to sign in instead.
  document.querySelectorAll('[data-feature-link]').forEach(card => {
    card.addEventListener('click', function (e) {
      if (!FlowsyncAuth.isSignedIn()) {
        e.preventDefault();
        window.location.href = 'signin.html';
      }
      // Signed-in users: let the <a href> navigate normally — no preventDefault needed.
    });
  });

  /* ── Pricing plan buttons ── */
  function handlePlanClick(plan) {
    if (FlowsyncAuth.isSignedIn()) {
      // Already signed in — activate plan then go straight to the app
      if (plan === 'pro_trial') {
        const user = FlowsyncAuth.getUser();
        // Only start a new trial if not already on one
        if (user.plan !== 'pro_trial') {
          FlowsyncAuth.updateUser({ plan: 'pro_trial', trialStartedAt: Date.now() });
        }
      } else {
        FlowsyncAuth.updateUser({ plan: 'starter' });
      }
      window.location.href = 'dashboard.html';
    } else {
      // Not signed in — stash the chosen plan so signup.html can pick it up
      sessionStorage.setItem('flowsync_pending_plan', plan);
      window.location.href = 'signup.html';
    }
  }

  const btnStarter = document.getElementById('btnStarterPlan');
  const btnPro     = document.getElementById('btnProTrial');
  if (btnStarter) btnStarter.addEventListener('click', () => handlePlanClick('starter'));
  if (btnPro)     btnPro.addEventListener('click',     () => handlePlanClick('pro_trial'));

  /* ── Reveal on scroll (Intersection Observer) ── */
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry, idx) => {
        if (entry.isIntersecting) {
          // Stagger siblings in the same parent
          const siblings = [...entry.target.parentElement.querySelectorAll('.reveal:not(.visible)')];
          const delay = siblings.indexOf(entry.target) * 80;
          setTimeout(() => {
            entry.target.classList.add('visible');
          }, delay);
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
  );
  document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

  /* ── FAQ accordion ── */
  document.querySelectorAll('.faq-q').forEach(btn => {
    btn.addEventListener('click', () => {
      const answer = btn.nextElementSibling;
      const isOpen = btn.getAttribute('aria-expanded') === 'true';

      // Close all others
      document.querySelectorAll('.faq-q').forEach(other => {
        if (other !== btn) {
          other.setAttribute('aria-expanded', 'false');
          other.nextElementSibling.classList.remove('open');
        }
      });

      // Toggle current
      btn.setAttribute('aria-expanded', String(!isOpen));
      answer.classList.toggle('open', !isOpen);
    });
  });

  /* ── Pricing billing toggle ── */
  const billingToggle = document.getElementById('billingToggle');
  const toggleMonthly = document.getElementById('toggleMonthly');
  const toggleAnnual  = document.getElementById('toggleAnnual');
  let isAnnual = false;

  function updatePricing() {
    document.querySelectorAll('.price-amt').forEach(el => {
      const monthly = el.dataset.monthly;
      const annual  = el.dataset.annual;
      if (monthly === undefined) return; // Custom plan, skip

      const val = isAnnual ? annual : monthly;
      el.textContent = val === '0' ? 'Free' : `$${val}`;
    });
    billingToggle.classList.toggle('on', isAnnual);
    toggleMonthly.classList.toggle('active', !isAnnual);
    toggleAnnual.classList.toggle('active', isAnnual);
  }

  billingToggle.addEventListener('click', () => {
    isAnnual = !isAnnual;
    updatePricing();
  });
  toggleMonthly.addEventListener('click', () => { isAnnual = false; updatePricing(); });
  toggleAnnual.addEventListener('click',  () => { isAnnual = true;  updatePricing(); });

  /* ── Active nav link highlight on scroll ── */
  const sections = document.querySelectorAll('section[id]');
  const navLinks  = document.querySelectorAll('.nav-links a');

  const sectionObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          navLinks.forEach(link => {
            link.classList.toggle(
              'active',
              link.getAttribute('href') === `#${entry.target.id}`
            );
          });
        }
      });
    },
    { threshold: 0.4 }
  );
  sections.forEach(s => sectionObserver.observe(s));

  /* ── Dynamic copyright year ── */
  const copyrightEl = document.getElementById('footerCopyright');
  if (copyrightEl) {
    copyrightEl.textContent = `© ${new Date().getFullYear()} TaskLune, Inc. All rights reserved.`;
  }

})();
