import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import LoginForm from "../components/auth/LoginForm";
import RegisterForm from "../components/auth/RegisterForm";

// Trang đăng nhập/đăng ký, điều khiển tab bằng query param và gọi API auth tương ứng.
export default function AuthPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const tab = searchParams.get("tab") || "login";
  const { login, register, loading } = useAuth();

  // Nếu đã có token thì chuyển thẳng sang trang quản lý dự án.
  useEffect(() => {
    const token = sessionStorage.getItem("token");
    if (token) navigate("/projects");
  }, [navigate]);

  return (
    <div className="min-h-160 bg-linear-to-br from-slate-900 via-purple-950 to-slate-900 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-4 mt-2">
          <button
            onClick={() => navigate("/")}
            className="inline-flex items-center gap-2 hover:opacity-80 transition"
          >
            <div className="w-10 h-10 bg-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-lg">
              T
            </div>
            <span className="text-2xl font-bold text-white tracking-tight">
              TaskFlow
            </span>
          </button>
          <p className="text-white/40 text-sm mt-2">
            {tab === "login" ? "Chào mừng trở lại 👋" : "Tạo tài khoản mới ✨"}
          </p>
        </div>

        <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-8 mb-10">
          {/* Tab switcher */}
          <div className="flex bg-white/5 rounded-xl p-1 mb-7">
            {[
              { key: "login", label: "Đăng nhập" },
              { key: "register", label: "Đăng ký" },
            ].map((t) => (
              <button
                key={t.key}
                onClick={() => navigate(`/auth?tab=${t.key}`)}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${
                  tab === t.key
                    ? "bg-purple-600 text-white shadow"
                    : "text-white/50 hover:text-white"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {tab === "login" ? (
            <LoginForm
              onLogin={login}
              loading={loading}
              onSwitchToRegister={() => navigate("/auth?tab=register")}
            />
          ) : (
            <RegisterForm
              onRegister={register}
              loading={loading}
              onSwitchToLogin={() => navigate("/auth?tab=login")}
            />
          )}
        </div>
      </div>
    </div>
  );
}
