/* ============================================================
   FLOWSYNC — API Client Module
   Reusable fetch wrapper with automatic JWT token handling.
   ============================================================ */

const ApiClient = (function () {
  'use strict';

  // Base API URL - adjust if your backend runs on a different port
  let BASE_URL = 'http://localhost:5000/api/v1';

  /**
   * Core fetch wrapper that automatically attaches JWT token
   * @param {string} endpoint - API endpoint (e.g., '/projects', '/auth/login')
   * @param {Object} options - Fetch options (method, body, headers, etc.)
   * @returns {Promise<any>} - Parsed JSON response
   */
  async function request(endpoint, options = {}) {
    // Ensure endpoint starts with /
    const url = endpoint.startsWith('http') 
      ? endpoint 
      : `${BASE_URL}${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`;

    // Default headers
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    // Automatically attach Authorization header if token exists
    const user = FlowsyncAuth.getUser();
    if (user && user.token) {
      headers['Authorization'] = `Bearer ${user.token}`;
    }

    // Merge options
    const config = {
      ...options,
      headers
    };

    // Convert body to JSON if it's an object
    if (config.body && typeof config.body === 'object' && !(config.body instanceof FormData)) {
      config.body = JSON.stringify(config.body);
    }

    try {
      const response = await fetch(url, config);

      // Handle non-2xx responses
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const error = new Error(
          errorData.error || errorData.message || `HTTP ${response.status}: ${response.statusText}`
        );
        error.status = response.status;
        error.data = errorData;

        // Expired or invalid token — clear the session and redirect to sign-in
        if (response.status === 401) {
          const onAuthPage = /signin\.html|signup\.html/.test(window.location.pathname);
          if (!onAuthPage) {
            if (typeof FlowsyncAuth !== 'undefined') {
              FlowsyncAuth.clearToken();
            }
            window.location.replace('signin.html');
          }
        }

        throw error;
      }

      // Handle 204 No Content
      if (response.status === 204) {
        return null;
      }

      // Parse JSON response
      const data = await response.json();
      return data;

    } catch (error) {
      // Network errors or fetch failures
      if (!error.status) {
        error.message = `Network error: ${error.message}`;
      }
      throw error;
    }
  }

  /**
   * Convenience methods for common HTTP verbs
   */

  function get(endpoint, options = {}) {
    return request(endpoint, { ...options, method: 'GET' });
  }

  function post(endpoint, body, options = {}) {
    return request(endpoint, { ...options, method: 'POST', body });
  }

  function put(endpoint, body, options = {}) {
    return request(endpoint, { ...options, method: 'PUT', body });
  }

  function patch(endpoint, body, options = {}) {
    return request(endpoint, { ...options, method: 'PATCH', body });
  }

  function del(endpoint, options = {}) {
    return request(endpoint, { ...options, method: 'DELETE' });
  }

  /**
   * Set a custom base URL (useful for different environments)
   */
  function setBaseUrl(url) {
    BASE_URL = url.replace(/\/$/, ''); // Remove trailing slash
  }

  // Public API
  return {
    request,
    get,
    post,
    put,
    patch,
    delete: del,
    setBaseUrl
  };
})();
