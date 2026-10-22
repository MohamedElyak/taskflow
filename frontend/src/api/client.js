import axios from 'axios';

// Cookie-based Sanctum auth: no tokens are ever stored in the browser.
const client = axios.create({
  baseURL: '/api/v1',
  withCredentials: true,
  withXSRFToken: true,
  headers: { Accept: 'application/json' },
});

export const fetchCsrfCookie = () => axios.get('/sanctum/csrf-cookie', { withCredentials: true });

const SILENT_401 = ['/user', '/login', '/register', '/forgot-password', '/reset-password'];

client.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { response, config } = error;

    // CSRF cookie expired: fetch a new one and retry once.
    if (response?.status === 419 && config && !config._retried) {
      config._retried = true;
      await fetchCsrfCookie();
      return client(config);
    }

    if (response?.status === 401 && !SILENT_401.some((p) => config?.url?.startsWith(p))) {
      window.dispatchEvent(new Event('auth:unauthorized'));
    }

    return Promise.reject(error);
  }
);

/** Best human-readable message from an API error. */
export function errorMessage(error, fallback = 'Something went wrong. Please try again.') {
  if (!error?.response) return 'Cannot reach the server. Is the Laravel API running?';
  const data = error.response.data;
  if (data?.errors) return Object.values(data.errors).flat()[0] ?? fallback;
  return data?.message || fallback;
}

/** Field errors as { field: 'message' } for forms. */
export function fieldErrors(error) {
  const errors = error?.response?.data?.errors;
  if (!errors) return {};
  return Object.fromEntries(Object.entries(errors).map(([k, v]) => [k, v[0]]));
}

export default client;
