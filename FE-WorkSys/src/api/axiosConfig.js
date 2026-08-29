import axios from "axios";

// Instance dùng chung cho toàn bộ app
const http = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "https://api.tdphihung.id.vn",
  headers: { "Content-Type": "application/json" },
});

// Tự động gắn JWT token vào mỗi request
http.interceptors.request.use((config) => {
  const token = sessionStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Nếu BE trả 401 (token hết hạn / không hợp lệ) → đẩy về trang login
http.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !window.location.pathname.includes("/auth")) {
      sessionStorage.removeItem("token");
      sessionStorage.removeItem("currentUser");
      window.location.href = "/auth";
    }
    return Promise.reject(error);
  }
);

export default http;
