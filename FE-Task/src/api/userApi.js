import http from "./axiosConfig";

const userApi = {
  // Lấy danh sách tất cả user
  getAllUsers: () => {
    return http.get("/api/users");
  },

  // Tìm 1 user theo ID
  getUserById: (id) => {
    return http.get(`/api/users/${id}`);
  },

  // Gửi dữ liệu user mới lên để BE lưu vào Database
  createUser: (userData) => {
    return http.post("/api/users/", userData);
  },

  // Cập nhật thông tin user
  updateUser: (id, userData) => {
    return http.put(`/api/users/${id}`, userData);
  },

  // Update avatar URL (after uploading to Cloudinary)
  updateAvatarUrl: (id, avatarUrl) => {
    return http.put(`/api/users/${id}/avatar`, { avatarUrl });
  },

  // Xóa user khỏi hệ thống
  deleteUser: (id) => {
    return http.delete(`/api/users/${id}`);
  },

  // Tìm kiếm user theo username
  searchUsers: (q) => {
    return http.get(`/api/users/search?q=${encodeURIComponent(q)}`);
  },
};

export default userApi;
