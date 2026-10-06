import axios from "axios";

// Instance dÃ¹ng chung cho toÃ n bá»™ app
const http = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "https://worksys.onrender.com",
  headers: { "Content-Type": "application/json" },
});

// Tá»± Ä‘á»™ng gáº¯n JWT token vÃ o má»—i request
http.interceptors.request.use((config) => {
  const token = sessionStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Náº¿u BE tráº£ 401 (token háº¿t háº¡n / khÃ´ng há»£p lá»‡) â†’ Ä‘áº©y vá» trang login
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

