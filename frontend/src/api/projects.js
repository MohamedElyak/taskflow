import client from './client';

export const listProjects = (params) => client.get('/projects', { params }).then((r) => r.data);
export const getProject = (id) => client.get(`/projects/${id}`).then((r) => r.data.data);
export const createProject = (payload) => client.post('/projects', payload).then((r) => r.data.data);
export const updateProject = (id, payload) => client.put(`/projects/${id}`, payload).then((r) => r.data.data);
export const deleteProject = (id) => client.delete(`/projects/${id}`);
export const archiveProject = (id) => client.post(`/projects/${id}/archive`).then((r) => r.data.data);
export const unarchiveProject = (id) => client.post(`/projects/${id}/unarchive`).then((r) => r.data.data);

export const changeMemberRole = (projectId, userId, role) =>
  client.put(`/projects/${projectId}/members/${userId}`, { role }).then((r) => r.data.data);
export const removeMember = (projectId, userId) => client.delete(`/projects/${projectId}/members/${userId}`);

export const listInvitations = (projectId) => client.get(`/projects/${projectId}/invitations`).then((r) => r.data.data);
export const createInvitation = (projectId, payload) =>
  client.post(`/projects/${projectId}/invitations`, payload).then((r) => r.data.data);
export const revokeInvitation = (id) => client.delete(`/invitations/${id}`);
export const getInvitation = (token) => client.get(`/invitations/${token}`).then((r) => r.data.data);
export const acceptInvitation = (token) => client.post(`/invitations/${token}/accept`).then((r) => r.data.data);
