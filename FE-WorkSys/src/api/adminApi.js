import http from "./axiosConfig";

const adminApi = {
  getDashboard: () => {
    return http.get("/api/admin/dashboard");
  },

  getUsers: (params) => {
    return http.get("/api/admin/users", { params });
  },

  updateUserStatus: (id, status) => {
    return http.patch(`/api/admin/users/${id}/status`, { status });
  },

  updateUserRole: (id, role) => {
    return http.patch(`/api/admin/users/${id}/role`, { role });
  },

  getProjects: (params) => {
    return http.get("/api/admin/projects", { params });
  },

  updateProjectArchived: (id, archived) => {
    return http.patch(`/api/admin/projects/${id}/archived`, { archived });
  },

  deleteProject: (id) => {
    return http.delete(`/api/admin/projects/${id}`);
  },

  getAuditLogs: (params) => {
    return http.get("/api/admin/audit-logs", { params });
  },
};

export default adminApi;
