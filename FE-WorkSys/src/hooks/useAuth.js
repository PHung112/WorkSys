import { useState } from "react";
import { useNavigate } from "react-router-dom";
import authApi from "../api/authApi";

export function useAuth() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  // Lưu token và thông tin user (kể cả avatarUrl) vào sessionStorage sau khi đăng nhập/đăng ký.
  const saveSession = (data) => {
    sessionStorage.setItem("token", data.token);
    sessionStorage.setItem(
      "currentUser",
      JSON.stringify({
        id: data.id,
        username: data.username,
        email: data.email,
        avatarUrl: data.avatarUrl || null,
        systemRole: data.systemRole,
        status: data.status,
      }),
    );
  };

  const login = async (form) => {
    setLoading(true);
    try {
      const res = await authApi.login(form);
      saveSession(res.data);
      if (res.data.systemRole === "SYSTEM_ADMIN") {
        navigate("/admin");
      } else {
        navigate("/projects");
      }
      return { success: true };
    } catch (err) {
      return { success: false, error: err.response?.data?.error || "Đăng nhập thất bại." };
    } finally {
      setLoading(false);
    }
  };

  const register = async (form) => {
    setLoading(true);
    try {
      const res = await authApi.register(form);
      saveSession(res.data);
      if (res.data.systemRole === "SYSTEM_ADMIN") {
        navigate("/admin");
      } else {
        navigate("/projects");
      }
      return { success: true };
    } catch (err) {
      const data = err.response?.data;
      if (data?.message && typeof data.message === "object") {
        return { success: false, fieldErrors: data.message };
      }
      return {
        success: false,
        error: data?.error || "Đăng ký thất bại. Username hoặc email có thể đã tồn tại.",
      };
    } finally {
      setLoading(false);
    }
  };

  const sendRegisterOtp = async ({ username, email }) => {
    setLoading(true);
    try {
      const res = await authApi.sendRegisterOtp({ username, email });
      return { success: true, message: res.data.message };
    } catch (err) {
      return {
        success: false,
        error: err.response?.data?.error || "Không thể gửi mã xác thực. Vui lòng thử lại sau.",
      };
    } finally {
      setLoading(false);
    }
  };

  const verifyAndRegister = async ({ username, email, password, otp }) => {
    setLoading(true);
    try {
      const res = await authApi.verifyAndRegister({ username, email, password, otp });
      saveSession(res.data);
      if (res.data.systemRole === "SYSTEM_ADMIN") {
        navigate("/admin");
      } else {
        navigate("/projects");
      }
      return { success: true };
    } catch (err) {
      return {
        success: false,
        error: err.response?.data?.error || "Xác thực thất bại. Vui lòng kiểm tra lại mã OTP.",
      };
    } finally {
      setLoading(false);
    }
  };

  return { login, register, sendRegisterOtp, verifyAndRegister, loading };
}
