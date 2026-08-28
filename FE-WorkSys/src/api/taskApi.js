import http from "./axiosConfig";

const taskApi = {
  // Tạo task mới: hỗ trợ gửi JSON hoặc FormData (nếu có đính kèm file)
  createTask: (data) => {
    if (data instanceof FormData) {
      return http.post("/api/tasks", data, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    }
    return http.post("/api/tasks", data);
  },
  getTaskById: (id) => http.get(`/api/tasks/${id}`),
  getAllTasks: () => http.get("/api/tasks"),
  getTasksByProject: (projectId) => http.get(`/api/tasks/project/${projectId}`),
  getTasksByUser: (userId) => http.get(`/api/tasks/user/${userId}`),
  updateTask: (id, data) => http.put(`/api/tasks/${id}`, data),
  // Cập nhật trạng thái task khi kéo thả Kanban:
  updateTaskStatus: (id, status) => http.patch(`/api/tasks/${id}/status`, { status }),
  deleteTask: (id) => http.delete(`/api/tasks/${id}`),
  acceptTask: (taskId, memberId) => http.post(`/api/tasks/${taskId}/accept`, null, { params: { memberId } }),
  // submissionLink: string URL, hoặc file: File object
  submitTask: (taskId, memberId, { submissionLink, file } = {}) => {
    const formData = new FormData();
    formData.append("memberId", memberId);
    if (file) formData.append("file", file);
    if (submissionLink) formData.append("submissionLink", submissionLink);
    return http.post(`/api/tasks/${taskId}/submit`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
  // Hủy bài đã nộp của một task:
  // Gọi DELETE /api/tasks/{taskId}/submit với memberId để xóa submissionLink
  // và chuyển task trở về trạng thái IN_PROGRESS để có thể nộp lại.
  unsubmitTask: (taskId, memberId) =>
    http.delete(`/api/tasks/${taskId}/submit`, { params: { memberId } }),
};

export default taskApi;
