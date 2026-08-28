import { useState } from "react";
import GoogleLoginButton from "./GoogleLoginButton";

const inputBase = "w-full bg-surface-container-low text-on-surface font-sans text-sm rounded-lg py-3 outline-none focus:bg-surface-container focus:ring-1 focus:ring-primary/50 transition-all placeholder:text-on-surface-variant/40 border border-transparent focus:border-outline-variant/30";
const inputWithLeftIcon = inputBase + " pl-10 pr-4";
const inputWithBothIcons = inputBase + " pl-10 pr-10";

export default function LoginForm({ onLogin, loading }) {
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [errorUsername, setErrorUsername] = useState("");
  const [errorPassword, setErrorPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

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
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {/* Username */}
      <div className="flex flex-col gap-2">
        <label className="font-mono text-[11px] font-medium text-on-surface uppercase tracking-wider">
          Tên đăng nhập hoặc Email
        </label>
        <div className="relative group">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/50 group-focus-within:text-primary transition-colors text-[20px]">
            person
          </span>
          <input
            type="text"
            value={form.username}
            onChange={(e) => setForm((p) => ({ ...p, username: e.target.value }))}
            placeholder="Nhập username..."
            className={inputWithLeftIcon}
          />
        </div>
        {errorUsername && <p className="text-error text-xs mt-0.5">{errorUsername}</p>}
      </div>

      {/* Password */}
      <div className="flex flex-col gap-2">
        <label className="font-mono text-[11px] font-medium text-on-surface uppercase tracking-wider">
          Mật khẩu
        </label>
        <div className="relative group">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/50 group-focus-within:text-primary transition-colors text-[20px]">
            key
          </span>
          <input
            type={showPassword ? "text" : "password"}
            value={form.password}
            onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
            placeholder="••••••••"
            className={inputWithBothIcons}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant/50 hover:text-on-surface transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">
              {showPassword ? "visibility" : "visibility_off"}
            </span>
          </button>
        </div>
        {errorPassword && <p className="text-error text-xs mt-0.5">{errorPassword}</p>}
      </div>

      {/* General error */}
      {error && (
        <div className="bg-error/10 border border-error/25 rounded-xl px-4 py-3 text-error text-sm">
          {error}
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={loading}
        className="w-full mt-1 bg-primary text-on-primary font-mono text-sm font-medium py-3.5 rounded-lg hover:bg-primary-fixed active:scale-[0.98] transition-all flex items-center justify-center gap-2 group relative overflow-hidden disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
      >
        <span className="relative z-10">{loading ? "Đang đăng nhập..." : "Đăng nhập"}</span>
        {!loading && (
          <span className="material-symbols-outlined relative z-10 text-[18px] group-hover:translate-x-1 transition-transform">
            arrow_forward
          </span>
        )}
        <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out z-0"></div>
      </button>

      {/* Divider */}
      <div className="relative flex items-center py-1">
        <div className="flex-grow border-t border-surface-container-highest"></div>
        <span className="flex-shrink-0 mx-4 font-mono text-[11px] font-medium text-on-surface-variant uppercase tracking-widest bg-surface-container-lowest px-2">
          Hoặc tiếp tục với
        </span>
        <div className="flex-grow border-t border-surface-container-highest"></div>
      </div>

      <GoogleLoginButton />
    </form>
  );
}
