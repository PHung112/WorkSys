import http from "./axiosConfig";

const authApi = {
  login: (data) => http.post("/api/auth/login", data),
  register: (data) => http.post("/api/auth/register", data),
  sendRegisterOtp: (data) => http.post("/api/auth/send-register-otp", data),
  verifyAndRegister: (data) => http.post("/api/auth/verify-and-register", data),
};

export default authApi;
