import { useState } from "react";

const inputCls =
  "w-full bg-white/8 border border-white/15 rounded-xl px-4 py-3 text-white placeholder:text-white/25 focus:outline-none focus:border-purple-500 transition";

export default function RegisterForm({ onRegister, loading, onSwitchToLogin }) {
  const [form, setForm] = useState({ username: "", email: "", password: "", confirmPassword: "" });
  const [errors, setErrors] = useState({});
  const [errorUsername, setErrorUsername] = useState("");
  const [errorEmail, setErrorEmail] = useState("");
  const [errorPassword, setErrorPassword] = useState("");
  const [errorConfirmPassword, setErrorConfirmPassword] = useState("");

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
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="text-white/60 text-sm mb-1.5 block">Tên đăng nhập</label>
        <input
          type="text"
          value={form.username}
          onChange={(e) => setForm((p) => ({ ...p, username: e.target.value }))}
          placeholder="username..."
          className={inputCls}
        />
        {errorUsername && (
          <p className="text-red-400 text-sm mt-1">{errorUsername}</p>
        )}
        {errors.username && (
          <p className="text-red-400 text-sm mt-1">{errors.username}</p>
        )}
      </div>

      <div>
        <label className="text-white/60 text-sm mb-1.5 block">Email</label>
        <input
          type="email"
          value={form.email}
          onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
          placeholder="email@example.com"
          className={inputCls}
        />
        {errorEmail && (
          <p className="text-red-400 text-sm mt-1">{errorEmail}</p>
        )}
        {errors.email && (
          <p className="text-red-400 text-sm mt-1">{errors.email}</p>
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
        {errors.password && (
          <p className="text-red-400 text-sm mt-1">{errors.password}</p>
        )}
      </div>

      <div>
        <label className="text-white/60 text-sm mb-1.5 block">Xác nhận mật khẩu</label>
        <input
          type="password"
          value={form.confirmPassword}
          onChange={(e) => setForm((p) => ({ ...p, confirmPassword: e.target.value }))}
          placeholder="••••••••"
          className={inputCls}
        />
        {errorConfirmPassword && (
          <p className="text-red-400 text-sm mt-1">{errorConfirmPassword}</p>
        )}
      </div>

      {errors.general && (
        <div className="bg-red-500/10 border border-red-500/25 rounded-xl px-4 py-3 text-red-400 text-sm">
          {errors.general}
        </div>
      )}
      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 rounded-xl font-semibold text-white transition shadow-lg shadow-purple-500/20"
      >
        {loading ? "Đang tạo tài khoản..." : "Tạo tài khoản"}
      </button>
      <p className="text-center text-white/35 text-sm">
        Đã có tài khoản?{" "}
        <button
          type="button"
          onClick={onSwitchToLogin}
          className="text-purple-400 hover:text-purple-300"
        >
          Đăng nhập
        </button>
      </p>
    </form>
  );
}
