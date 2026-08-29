import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import LoginForm from "../components/auth/LoginForm";
import RegisterForm from "../components/auth/RegisterForm";

export default function AuthPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const tab = searchParams.get("tab") || "login";
  const { login, register, loading } = useAuth();

  useEffect(() => {
    const token = sessionStorage.getItem("token");
    if (token) {
      try {
        const currentUser = JSON.parse(sessionStorage.getItem("currentUser") || "{}");
        if (currentUser.systemRole === "SYSTEM_ADMIN") {
          navigate("/admin");
        } else {
          navigate("/projects");
        }
      } catch (e) {
        navigate("/projects");
      }
    }
  }, [navigate]);

  return (
    <div className="relative overflow-hidden bg-background font-sans text-on-background min-h-screen flex items-center justify-center pt-24 pb-12 px-6">
      {/* Background glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-primary/5 via-background to-background pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 w-[30rem] h-[30rem] bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-tertiary/5 via-transparent to-transparent opacity-50 pointer-events-none" />

      {/* Auth Card */}
      <div className="relative z-10 w-full max-w-[460px] bg-surface-container-lowest border border-outline-variant/20 rounded-2xl shadow-2xl p-8 flex flex-col gap-7">

        {/* Dynamic Title — căn giữa */}
        <div className="flex flex-col gap-1 text-center">
          <h1 className="font-sans text-3xl font-bold text-on-surface tracking-tight">
            {tab === "login" ? "Chào mừng trở lại" : "Tạo tài khoản mới"}
          </h1>
          <p className="font-sans text-sm text-on-surface-variant">
            {tab === "login"
              ? "Nhập thông tin để truy cập vào tài khoản của bạn."
              : "Thiết lập tài khoản của bạn để bắt đầu."}
          </p>
        </div>

        {/* Segmented Tab Switcher */}
        <div className="flex p-1 bg-surface-container-highest rounded-lg relative">
          {/* Active tab indicator */}
          <div
            className="absolute top-1 bottom-1 w-[calc(50%-0.25rem)] bg-primary/20 border border-primary/40 rounded-md shadow-sm transition-all duration-300 ease-out z-0"
            style={{
              left: tab === "login" ? "0.25rem" : "calc(50% + 0.125rem)",
            }}
          />

          {/* Login tab */}
          <button
            type="button"
            onClick={() => navigate("/auth?tab=login")}
            className={`flex-1 relative z-10 py-2.5 text-center font-sans text-sm font-semibold transition-colors duration-200 cursor-pointer ${tab === "login"
                ? "text-primary"
                : "text-on-surface-variant hover:text-on-surface"
              }`}
          >
            Đăng nhập
          </button>
          {/* Register tab */}
          <button
            type="button"
            onClick={() => navigate("/auth?tab=register")}
            className={`flex-1 relative z-10 py-2.5 text-center font-sans text-sm font-semibold transition-colors duration-200 cursor-pointer ${tab === "register"
                ? "text-primary"
                : "text-on-surface-variant hover:text-on-surface"
              }`}
          >
            Đăng ký
          </button>
        </div>

        {/* Form */}
        {tab === "login" ? (
          <LoginForm onLogin={login} loading={loading} />
        ) : (
          <RegisterForm onRegister={register} loading={loading} />
        )}
      </div>
    </div>
  );
}
