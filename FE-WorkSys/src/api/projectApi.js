import http from "./axiosConfig";

const projectApi = {
  getMyProjects: () => http.get("/api/projects/my"),
  getAllProjects: () => http.get("/api/projects"),
  getProjectById: (id) => http.get(`/api/projects/${id}`),
  createProject: (data) => http.post("/api/projects", data),
  updateProject: (id, data) => http.put(`/api/projects/${id}`, data),
  deleteProject: (id) => http.delete(`/api/projects/${id}`),
  getProjectMembers: (projectId) => http.get(`/api/projects/${projectId}/members`),
  inviteMember: (projectId, inviteRequest) => http.post(`/api/projects/${projectId}/invite`, inviteRequest),
  removeMember: (projectId, userId) => http.delete(`/api/projects/${projectId}/members/${userId}`),
  updateMemberRole: (projectId, userId, data) => http.put(`/api/projects/${projectId}/members/${userId}`, data),
};

export default projectApi
