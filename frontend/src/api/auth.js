import client, { fetchCsrfCookie } from './client';

export const getUser = () => client.get('/user').then((r) => r.data.data);

export async function login(payload) {
  await fetchCsrfCookie();
  return client.post('/login', payload).then((r) => r.data.data);
}

export async function register(payload) {
  await fetchCsrfCookie();
  return client.post('/register', payload).then((r) => r.data.data);
}

export const logout = () => client.post('/logout');
export const forgotPassword = (email) => client.post('/forgot-password', { email }).then((r) => r.data);
export const resetPassword = (payload) => client.post('/reset-password', payload).then((r) => r.data);
export const updateProfile = (payload) => client.put('/profile', payload).then((r) => r.data.data);
export const updatePassword = (payload) => client.put('/profile/password', payload).then((r) => r.data);
