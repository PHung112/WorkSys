import { useState } from "react";
import GoogleLoginButton from "./GoogleLoginButton";

const inputBase = "w-full bg-surface-container-low text-on-surface font-sans text-sm rounded-lg py-3 outline-none focus:bg-surface-container focus:ring-1 focus:ring-primary/50 transition-all placeholder:text-on-surface-variant/40 border border-transparent focus:border-outline-variant/30";
const inputWithLeftIcon = inputBase + " pl-10 pr-4";
const inputWithBothIcons = inputBase + " pl-10 pr-10";

export default function RegisterForm({ onRegister, loading }) {
  const [form, setForm] = useState({ username: "", email: "", password: "", confirmPassword: "" });
  const [errors, setErrors] = useState({});
  const [errorUsername, setErrorUsername] = useState("");
  const [errorEmail, setErrorEmail] = useState("");
  const [errorPassword, setErrorPassword] = useState("");
  const [errorConfirmPassword, setErrorConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setErrorUsername("");
    setErrorEmail("");
    setErrorPassword("");
    setErrorConfirmPassword("");

    if (!form.username && !form.email && !form.password && !form.confirmPassword) {
      setErrorUsername("Vui lòng nhập tên đăng nhập");
      setErrorEmail("Vui lòng nhập email");
      setErrorPassword("Vui lòng nhập mật khẩu");
      setErrorConfirmPassword("Vui lòng xác nhận mật khẩu");
      return;
    } else if (!form.username) {
      setErrorUsername("Vui lòng nhập tên đăng nhập");
      return;
    } else if (!form.email) {
      setErrorEmail("Vui lòng nhập email");
      return;
    } else if (!form.password) {
      setErrorPassword("Vui lòng nhập mật khẩu");
      return;
    } else if (!form.confirmPassword) {
      setErrorConfirmPassword("Vui lòng xác nhận mật khẩu");
      return;
    } else if (form.password !== form.confirmPassword) {
      setErrorConfirmPassword("Mật khẩu không trùng khớp");
      return;
    }

    const res = await onRegister(form);
    if (!res.success) {
      if (res.fieldErrors) setErrors(res.fieldErrors);
      else setErrors({ general: res.error });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {/* Username */}
      <div className="flex flex-col gap-2">
        <label className="font-mono text-[11px] font-medium text-on-surface uppercase tracking-wider">
          Tên đăng nhập
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
        {errors.username && <p className="text-error text-xs mt-0.5">{errors.username}</p>}
      </div>

      {/* Email */}
      <div className="flex flex-col gap-2">
        <label className="font-mono text-[11px] font-medium text-on-surface uppercase tracking-wider">
          Email
        </label>
        <div className="relative group">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/50 group-focus-within:text-primary transition-colors text-[20px]">
            mail
          </span>
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
            placeholder="email@example.com"
            className={inputWithLeftIcon}
          />
        </div>
        {errorEmail && <p className="text-error text-xs mt-0.5">{errorEmail}</p>}
        {errors.email && <p className="text-error text-xs mt-0.5">{errors.email}</p>}
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
        {errors.password && <p className="text-error text-xs mt-0.5">{errors.password}</p>}
      </div>

      {/* Confirm Password */}
      <div className="flex flex-col gap-2">
        <label className="font-mono text-[11px] font-medium text-on-surface uppercase tracking-wider">
          Xác nhận mật khẩu
        </label>
        <div className="relative group">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/50 group-focus-within:text-primary transition-colors text-[20px]">
            lock_reset
          </span>
          <input
            type={showConfirmPassword ? "text" : "password"}
            value={form.confirmPassword}
            onChange={(e) => setForm((p) => ({ ...p, confirmPassword: e.target.value }))}
            placeholder="••••••••"
            className={inputWithBothIcons}
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant/50 hover:text-on-surface transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">
              {showConfirmPassword ? "visibility" : "visibility_off"}
            </span>
          </button>
        </div>
        {errorConfirmPassword && <p className="text-error text-xs mt-0.5">{errorConfirmPassword}</p>}
      </div>

      {/* General error */}
      {errors.general && (
        <div className="bg-error/10 border border-error/25 rounded-xl px-4 py-3 text-error text-sm">
          {errors.general}
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={loading}
        className="w-full mt-1 bg-primary text-on-primary font-mono text-sm font-medium py-3.5 rounded-lg hover:bg-primary-fixed active:scale-[0.98] transition-all flex items-center justify-center gap-2 group relative overflow-hidden disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
      >
        <span className="relative z-10">{loading ? "Đang tạo tài khoản..." : "Tạo tài khoản"}</span>
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
