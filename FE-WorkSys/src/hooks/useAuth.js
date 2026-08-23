import { useState } from "react";
import { useNavigate } from "react-router-dom";
import authApi from "../api/authApi";

export function useAuth() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const saveSession = (data) => {
    sessionStorage.setItem("token", data.token);
    sessionStorage.setItem(
      "currentUser",
      JSON.stringify({ id: data.id, username: data.username, email: data.email }),
    );
  };

  const login = async (form) => {
    setLoading(true);
    try {
      const res = await authApi.login(form);
      saveSession(res.data);
      navigate("/projects");
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
      navigate("/projects");
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

  return { login, register, loading };
}
