/* ============================================================
   FLOWSYNC — Auth State Module
   Single source of truth for authentication state.
   Used by auth.js (write) and app.js / navbar (read).
   Storage: localStorage — persists across page refreshes.
   ============================================================ */

const FlowsyncAuth = (function () {
  'use strict';

  const STORAGE_KEY = 'flowsync_user';

  /** Save a user session to localStorage */
  function signIn(userData) {
    const plan = userData.plan || 'starter'; // 'starter' | 'pro_trial'
    const entry = {
      name:       userData.name  || 'User',
      email:      userData.email || '',
      initials:   getInitials(userData.name || userData.email || 'U'),
      signedInAt: Date.now(),
      plan:       plan
    };
    // Record when the Pro trial was started so days-remaining stays accurate
    if (plan === 'pro_trial') {
      entry.trialStartedAt = userData.trialStartedAt || Date.now();
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entry));
  }

  /** Remove the session */
  function signOut() {
    localStorage.removeItem(STORAGE_KEY);
  }

  /** Return the current user object, or null if not signed in */
  function getUser() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  /** Convenience check */
  function isSignedIn() {
    return getUser() !== null;
  }

  /** Derive up-to-2-character initials from a name or email */
  function getInitials(str) {
    if (!str) return '?';
    const clean = str.trim();
    // If it looks like an email, use first letter of local part
    if (clean.includes('@')) return clean[0].toUpperCase();
    const parts = clean.split(/\s+/).filter(Boolean);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  /** Update the stored user data (e.g. after editing name) */
  function updateUser(changes) {
    const current = getUser();
    if (!current) return false;
    const updated = Object.assign({}, current, changes);
    // Always recompute initials whenever name changes
    if (changes.name !== undefined) {
      updated.initials = getInitials(changes.name || current.email);
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return true;
  }

  /**
   * Return a display-ready plan object for the current user.
   * { label: string, sublabel: string|null, isPro: boolean }
   */
  function getPlanInfo() {
    const u = getUser();
    if (!u) return { label: 'Free', sublabel: null, isPro: false };
    if (u.plan === 'pro_trial') {
      const MS_PER_DAY  = 86400000;
      const TRIAL_DAYS  = 14;
      const started     = u.trialStartedAt || u.signedInAt || Date.now();
      const elapsed     = Math.floor((Date.now() - started) / MS_PER_DAY);
      const remaining   = Math.max(0, TRIAL_DAYS - elapsed);
      const sublabel    = remaining > 0
        ? `${remaining} day${remaining === 1 ? '' : 's'} remaining`
        : 'Trial ended';
      return { label: 'Pro Trial', sublabel, isPro: true };
    }
    // Default: starter
    return { label: 'Starter', sublabel: null, isPro: false };
  }

  return { signIn, signOut, getUser, updateUser, isSignedIn, getInitials, getPlanInfo };
})();
