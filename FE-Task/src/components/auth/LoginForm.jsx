import { useState } from "react";
import GoogleLoginButton from "./GoogleLoginButton";

const inputCls =
  "w-full bg-white/8 border border-white/15 rounded-xl px-4 py-3 text-white placeholder:text-white/25 focus:outline-none focus:border-purple-500 transition";

export default function LoginForm({ onLogin, loading, onSwitchToRegister }) {
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [errorUsername, setErrorUsername] = useState("");
  const [errorPassword, setErrorPassword] = useState("");
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setErrorUsername("");
    setErrorPassword("");
    if (!form.username && !form.password) {
      setErrorUsername("Vui lòng nhập tên đăng nhập");
      setErrorPassword("Vui lòng nhập mật khẩu");
      return;
    } else if (!form.username) {
      setErrorUsername("Vui lòng nhập tên đăng nhập");
      return;
    } else if (!form.password) {
      setErrorPassword("Vui lòng nhập mật khẩu");
      return;
    }
    const res = await onLogin(form);
    if (!res.success) setError(res.error);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="text-white/60 text-sm mb-1.5 block">
          Tên đăng nhập
        </label>
        <input
          value={form.username}
          onChange={(e) => setForm((p) => ({ ...p, username: e.target.value }))}
          placeholder="Nhập username của bạn..."
          className={inputCls}
        />
        {errorUsername && (
          <p className="text-red-400 text-sm mt-1">{errorUsername}</p>
        )}
      </div>
      <div>
        <label className="text-white/60 text-sm mb-1.5 block">Mật khẩu</label>
        <input
          type="password"
          value={form.password}
          onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
          placeholder="••••••••"
          className={inputCls}
        />
        {errorPassword && (
          <p className="text-red-400 text-sm mt-1">{errorPassword}</p>
        )}
      </div>
      {error && (
        <div className="bg-red-500/10 border border-red-500/25 rounded-xl px-4 py-3 text-red-400 text-sm">
          {error}
        </div>
      )}
      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 rounded-xl font-semibold text-white transition shadow-lg shadow-purple-500/20"
      >
        {loading ? "Đang đăng nhập..." : "Đăng nhập"}
      </button>

      <div className="relative flex items-center gap-4">
        <div className="flex-1 h-px bg-white/10"></div>
        <span className="text-white/40 text-sm mb-0.5">Hoặc</span>  
        <div className="flex-1 h-px bg-white/10"></div>
      </div>

      <GoogleLoginButton />
      <p className="text-center text-white/35 text-sm">
        Chưa có tài khoản?{" "}
        <button
          type="button"
          onClick={onSwitchToRegister}
          className="text-purple-400 hover:text-purple-300"
        >
          Đăng ký ngay
        </button>
      </p>
    </form>
  );
}
