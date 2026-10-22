import client from './client';

export const getDashboard = () => client.get('/dashboard').then((r) => r.data.data);

export const listNotifications = (page = 1) => client.get('/notifications', { params: { page } }).then((r) => r.data);
export const getUnreadCount = () => client.get('/notifications/unread-count').then((r) => r.data.count);
export const markNotificationRead = (id) => client.post(`/notifications/${id}/read`);
export const markAllNotificationsRead = () => client.post('/notifications/read-all');
