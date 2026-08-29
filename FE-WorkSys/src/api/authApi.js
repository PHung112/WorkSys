import http from "./axiosConfig";

const authApi = {
  login: (data) => http.post("/api/auth/login", data),
  register: (data) => http.post("/api/auth/register", data),
};

export default authApi;
