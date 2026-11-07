import http from "./axiosConfig";

/**
 * API client giao tiếp với các tính năng Trí tuệ Nhân tạo (Google Gemini) trên Backend
 */
const aiApi = {
  /**
   * Hỏi đáp & phân tích tiến độ, tình hình các task trong dự án (Chatbot)
   * @param {number|string} projectId - ID dự án
   * @param {string} prompt - Câu hỏi hoặc yêu cầu của Admin
   */
  chatAboutProject: (projectId, prompt) =>
    http.post(`/api/ai/project/${projectId}/chat`, { prompt }),

  /**
   * Tự động phân rã một mục tiêu tính năng lớn thành danh sách 3-6 task con (WBS)
   * @param {number|string} projectId - ID dự án
   * @param {Object} data - { featureGoal, additionalRequirements, targetDeadline }
   */
  decomposeFeature: (projectId, data) =>
    http.post(`/api/ai/project/${projectId}/decompose-task`, data),

  /**
   * Lưu hàng loạt các sub-tasks đã duyệt và chỉnh sửa vào cơ sở dữ liệu
   * @param {number|string} projectId - ID dự án
   * @param {Array} tasks - Danh sách các task [{ title, description, deadline, assigneeIds, priority }]
   */
  batchCreateTasks: (projectId, tasks) =>
    http.post(`/api/ai/project/${projectId}/batch-create`, { tasks }),
};

export default aiApi;
