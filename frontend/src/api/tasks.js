import client from './client';

// params: q, status, priority, assignee, due, sort, direction, page, per_page
const clean = (params = {}) => Object.fromEntries(Object.entries(params).filter(([, v]) => v !== '' && v != null));

export const listProjectTasks = (projectId, params) =>
  client.get(`/projects/${projectId}/tasks`, { params: clean(params) }).then((r) => r.data);
export const listMyTasks = (params) => client.get('/tasks', { params: clean(params) }).then((r) => r.data);
export const getTask = (id) => client.get(`/tasks/${id}`).then((r) => r.data.data);
export const createTask = (projectId, payload) =>
  client.post(`/projects/${projectId}/tasks`, payload).then((r) => r.data.data);
export const updateTask = (id, payload) => client.put(`/tasks/${id}`, payload).then((r) => r.data.data);
export const updateTaskStatus = (id, status) => client.patch(`/tasks/${id}/status`, { status }).then((r) => r.data.data);
export const deleteTask = (id) => client.delete(`/tasks/${id}`);

export const listComments = (taskId) => client.get(`/tasks/${taskId}/comments`).then((r) => r.data.data);
export const addComment = (taskId, body) => client.post(`/tasks/${taskId}/comments`, { body }).then((r) => r.data.data);
export const deleteComment = (id) => client.delete(`/comments/${id}`);
