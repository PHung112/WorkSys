const fs = require('fs');
const path = 'D:/Learn/devops/WorkSys/FE-WorkSys/src/';

const authPageContent = `import { useEffect } from "react";
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
    if (token) navigate("/projects");
  }, [navigate]);

  return (
    <div className="bg-background font-sans text-on-background min-h-screen flex items-center justify-center p-6">
      <div className="flex flex-col w-full h-[calc(100vh-3rem)] min-h-[600px] overflow-hidden rounded-[24px] bg-surface-container-lowest shadow-2xl relative">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-primary/5 via-surface-container-lowest to-surface-container-lowest pointer-events-none"></div>
        <div className="flex flex-row w-full h-full relative z-10">
          
          {/* Left Panel */}
          <div className="hidden lg:flex flex-col w-[45%] h-full bg-surface-container-low p-12 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-transparent to-primary/5 opacity-50"></div>
            <div className="relative z-10 flex flex-col h-full justify-between">
              <button onClick={() => navigate("/")} className="flex items-center gap-3 w-fit hover:opacity-80 transition cursor-pointer">
                <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                  <span className="material-symbols-outlined text-on-primary text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>lock</span>
                </div>
                <span className="font-sans text-xl font-bold text-on-surface tracking-wide">WorkSys</span>
              </button>
              
              <div className="w-full aspect-square relative rounded-[32px] overflow-hidden bg-surface-container transition-transform duration-700 ease-out group-hover:scale-[1.02]">
                <div className="absolute inset-0 bg-cover bg-center w-full h-full mix-blend-luminosity opacity-80" style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuBxHQeJvOk-tXuPhpzAcmioa5jt7VZPHWU2-uDli12ALU5-cyNeVFpR86h60-j51Cr_BgBS7JCN-RVstGNdJaN4egNz3wZcpq81VjGXRmy2SNQq_yvbtKX75-2ERoxMF-LJ9EerveanpD4ulFyCqy8GAZcDZwBFfVTf8WOkpJzWs3mjgGP2Lr8Gwfk_L9lXXahXa3KJWzLFwZWKsWyuGF6OmGdIqBby1nEvbv5BYTA0mAeb3grAwvABNw')" }}></div>
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none mix-blend-overlay opacity-30">
                  <svg className="w-[80%] h-[80%] animate-[spin_60s_linear_infinite]" viewBox="0 0 100 100">
                    <circle className="text-primary-fixed" cx="50" cy="50" fill="none" r="45" stroke="currentColor" strokeDasharray="2 4" strokeWidth="0.5"></circle>
                    <circle className="text-tertiary" cx="50" cy="50" fill="none" r="35" stroke="currentColor" strokeDasharray="4 8" strokeWidth="0.2"></circle>
                  </svg>
                </div>
                <div className="absolute bottom-6 left-6 right-6 p-6 rounded-2xl bg-surface/40 backdrop-blur-md border border-white/5">
                  <p className="font-sans text-lg text-on-surface font-light leading-relaxed">
                    "WorkSys giúp d?i ngu c?a chúng tôi t? ch?c công vi?c hi?u qu?, phân quy?n rõ ràng và ti?t ki?m hàng tram gi? m?i tháng."
                  </p>
                  <div className="mt-4 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-secondary-container flex items-center justify-center">
                      <span className="material-symbols-outlined text-on-secondary-container text-[16px]">psychology</span>
                    </div>
                    <div>
                      <p className="font-mono text-sm font-medium text-on-surface">Không gian làm vi?c thông minh</p>
                      <p className="font-mono text-[11px] font-medium text-on-surface-variant uppercase tracking-wider">T?i uu hi?u su?t</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div>
                <p className="font-mono text-[11px] font-medium text-on-surface-variant uppercase tracking-widest opacity-60">H? th?ng qu?n lý d? án</p>
              </div>
            </div>
          </div>

          {/* Right Panel (Auth Form Wrapper) */}
          <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-12 lg:p-24 bg-surface-container-lowest relative overflow-y-auto">
            <div className="absolute top-0 right-0 w-[40rem] h-[40rem] bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-tertiary/5 via-transparent to-transparent opacity-50 pointer-events-none"></div>
            
            <div className="w-full max-w-[420px] relative z-10 flex flex-col gap-10">
              {/* Mobile Logo */}
              <div className="lg:hidden flex items-center gap-3 justify-center mb-4">
                <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                  <span className="material-symbols-outlined text-on-primary text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>lock</span>
                </div>
                <span className="font-sans text-xl font-bold text-on-surface tracking-wide">WorkSys</span>
              </div>
              
              {/* Dynamic Title */}
              <div className="flex flex-col gap-2">
                <div className="transition-opacity duration-300">
                  <h1 className="font-sans text-4xl md:text-5xl font-bold text-on-surface tracking-tight">
                    {tab === "login" ? "Chào m?ng tr? l?i" : "T?o không gian làm vi?c"}
                  </h1>
                  <p className="font-sans text-sm md:text-base text-on-surface-variant mt-2">
                    {tab === "login" ? "Nh?p thông tin d? truy c?p vào tài kho?n c?a b?n." : "Thi?t l?p tài kho?n c?a b?n d? b?t d?u."}
                  </p>
                </div>
              </div>
              
              {/* Segmented Tab Switcher */}
              <div className="flex p-1 bg-surface-container-highest rounded-lg relative">
                <div 
                  className="absolute top-1 bottom-1 w-[calc(50%-0.25rem)] bg-surface rounded-md shadow-sm transition-all duration-300 ease-out z-0" 
                  style={{ left: tab === "login" ? "0.25rem" : "calc(50% + 0.125rem)" }}
                ></div>
                <button 
                  onClick={() => navigate('/auth?tab=login')}
                  className={`flex-1 relative z-10 py-2.5 text-center font-mono text-sm font-medium transition-colors duration-200 cursor-pointer ${tab === "login" ? "text-on-surface" : "text-on-surface-variant hover:text-on-surface"}`}
                >
                  Ðang nh?p
                </button>
                <button 
                  onClick={() => navigate('/auth?tab=register')}
                  className={`flex-1 relative z-10 py-2.5 text-center font-mono text-sm font-medium transition-colors duration-200 cursor-pointer ${tab === "register" ? "text-on-surface" : "text-on-surface-variant hover:text-on-surface"}`}
                >
                  Ðang ký
                </button>
              </div>

              {/* Form Render */}
              {tab === "login" ? (
                <LoginForm onLogin={login} loading={loading} />
              ) : (
                <RegisterForm onRegister={register} loading={loading} />
              )}
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}`;

const loginFormContent = `import { useState } from "react";
import GoogleLoginButton from "./GoogleLoginButton";

const inputCls = "w-full bg-surface-container-low text-on-surface font-sans text-sm rounded-lg pl-10 pr-4 py-3 outline-none focus:bg-surface-container focus:ring-1 focus:ring-primary/50 transition-all placeholder:text-on-surface-variant/40 border border-transparent focus:border-outline-variant/30";

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
      setErrorUsername("Vui lòng nh?p tên dang nh?p");
      setErrorPassword("Vui lòng nh?p m?t kh?u");
      return;
    } else if (!form.username) {
      setErrorUsername("Vui lòng nh?p tên dang nh?p");
      return;
    } else if (!form.password) {
      setErrorPassword("Vui lòng nh?p m?t kh?u");
      return;
    }
    const res = await onLogin(form);
    if (!res.success) setError(res.error);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <label className="font-mono text-[11px] font-medium text-on-surface uppercase tracking-wider">Tên dang nh?p</label>
        <div className="relative group">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/50 group-focus-within:text-primary transition-colors text-[20px]">person</span>
          <input
            type="text"
            value={form.username}
            onChange={(e) => setForm((p) => ({ ...p, username: e.target.value }))}
            placeholder="Nh?p username..."
            className={inputCls}
          />
        </div>
        {errorUsername && <p className="text-error text-sm mt-1">{errorUsername}</p>}
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex justify-between items-end">
          <label className="font-mono text-[11px] font-medium text-on-surface uppercase tracking-wider">M?t kh?u</label>
        </div>
        <div className="relative group">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/50 group-focus-within:text-primary transition-colors text-[20px]">key</span>
          <input
            type={showPassword ? "text" : "password"}
            value={form.password}
            onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
            placeholder="••••••••"
            className={\`\${inputCls} pr-10\`}
          />
          <button 
            type="button" 
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant/50 hover:text-on-surface transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">{showPassword ? "visibility" : "visibility_off"}</span>
          </button>
        </div>
        {errorPassword && <p className="text-error text-sm mt-1">{errorPassword}</p>}
      </div>

      {error && (
        <div className="bg-error/10 border border-error/25 rounded-xl px-4 py-3 text-error text-sm">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full mt-2 bg-primary text-on-primary font-mono text-sm font-medium py-3.5 rounded-lg hover:bg-primary-fixed active:scale-[0.98] transition-all flex items-center justify-center gap-2 group relative overflow-hidden disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
      >
        <span className="relative z-10">{loading ? "Ðang dang nh?p..." : "Ðang nh?p"}</span>
        {!loading && <span className="material-symbols-outlined relative z-10 text-[18px] group-hover:translate-x-1 transition-transform">arrow_forward</span>}
        <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out z-0"></div>
      </button>

      <div className="relative flex items-center py-2">
        <div className="flex-grow border-t border-surface-container-highest"></div>
        <span className="flex-shrink-0 mx-4 font-mono text-[11px] font-medium text-on-surface-variant uppercase tracking-widest bg-surface-container-lowest px-2">Ho?c ti?p t?c v?i</span>
        <div className="flex-grow border-t border-surface-container-highest"></div>
      </div>

      <GoogleLoginButton />
    </form>
  );
}`;

const registerFormContent = `import { useState } from "react";
import GoogleLoginButton from "./GoogleLoginButton";

const inputCls = "w-full bg-surface-container-low text-on-surface font-sans text-sm rounded-lg pl-10 pr-4 py-3 outline-none focus:bg-surface-container focus:ring-1 focus:ring-primary/50 transition-all placeholder:text-on-surface-variant/40 border border-transparent focus:border-outline-variant/30";

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
      setErrorUsername("Vui lòng nh?p tên dang nh?p");
      setErrorEmail("Vui lòng nh?p email");
      setErrorPassword("Vui lòng nh?p m?t kh?u");
      setErrorConfirmPassword("Vui lòng xác nh?n m?t kh?u");
      return;
    } else if (!form.username) {
      setErrorUsername("Vui lòng nh?p tên dang nh?p");
      return;
    } else if (!form.email) {
      setErrorEmail("Vui lòng nh?p email");
      return;
    } else if (!form.password) {
      setErrorPassword("Vui lòng nh?p m?t kh?u");
      return;
    } else if (!form.confirmPassword) {
      setErrorConfirmPassword("Vui lòng xác nh?n m?t kh?u");
      return;
    } else if (form.password !== form.confirmPassword) {
      setErrorConfirmPassword("M?t kh?u không trùng kh?p");
      return;
    }

    const res = await onRegister(form);
    if (!res.success) {
      if (res.fieldErrors) setErrors(res.fieldErrors);
      else setErrors({ general: res.error });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <label className="font-mono text-[11px] font-medium text-on-surface uppercase tracking-wider">Tên dang nh?p</label>
        <div className="relative group">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/50 group-focus-within:text-primary transition-colors text-[20px]">person</span>
          <input
            type="text"
            value={form.username}
            onChange={(e) => setForm((p) => ({ ...p, username: e.target.value }))}
            placeholder="Nh?p username..."
            className={inputCls}
          />
        </div>
        {errorUsername && <p className="text-error text-sm mt-1">{errorUsername}</p>}
        {errors.username && <p className="text-error text-sm mt-1">{errors.username}</p>}
      </div>

      <div className="flex flex-col gap-2">
        <label className="font-mono text-[11px] font-medium text-on-surface uppercase tracking-wider">Email</label>
        <div className="relative group">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/50 group-focus-within:text-primary transition-colors text-[20px]">mail</span>
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
            placeholder="email@example.com"
            className={inputCls}
          />
        </div>
        {errorEmail && <p className="text-error text-sm mt-1">{errorEmail}</p>}
        {errors.email && <p className="text-error text-sm mt-1">{errors.email}</p>}
      </div>

      <div className="flex flex-col gap-2">
        <label className="font-mono text-[11px] font-medium text-on-surface uppercase tracking-wider">M?t kh?u</label>
        <div className="relative group">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/50 group-focus-within:text-primary transition-colors text-[20px]">key</span>
          <input
            type={showPassword ? "text" : "password"}
            value={form.password}
            onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
            placeholder="••••••••"
            className={\`\${inputCls} pr-10\`}
          />
          <button 
            type="button" 
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant/50 hover:text-on-surface transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">{showPassword ? "visibility" : "visibility_off"}</span>
          </button>
        </div>
        {errorPassword && <p className="text-error text-sm mt-1">{errorPassword}</p>}
        {errors.password && <p className="text-error text-sm mt-1">{errors.password}</p>}
      </div>

      <div className="flex flex-col gap-2">
        <label className="font-mono text-[11px] font-medium text-on-surface uppercase tracking-wider">Xác nh?n m?t kh?u</label>
        <div className="relative group">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/50 group-focus-within:text-primary transition-colors text-[20px]">lock_reset</span>
          <input
            type={showConfirmPassword ? "text" : "password"}
            value={form.confirmPassword}
            onChange={(e) => setForm((p) => ({ ...p, confirmPassword: e.target.value }))}
            placeholder="••••••••"
            className={\`\${inputCls} pr-10\`}
          />
          <button 
            type="button" 
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant/50 hover:text-on-surface transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">{showConfirmPassword ? "visibility" : "visibility_off"}</span>
          </button>
        </div>
        {errorConfirmPassword && <p className="text-error text-sm mt-1">{errorConfirmPassword}</p>}
      </div>

      {errors.general && (
        <div className="bg-error/10 border border-error/25 rounded-xl px-4 py-3 text-error text-sm">
          {errors.general}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full mt-2 bg-primary text-on-primary font-mono text-sm font-medium py-3.5 rounded-lg hover:bg-primary-fixed active:scale-[0.98] transition-all flex items-center justify-center gap-2 group relative overflow-hidden disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
      >
        <span className="relative z-10">{loading ? "Ðang t?o tài kho?n..." : "T?o tài kho?n"}</span>
        {!loading && <span className="material-symbols-outlined relative z-10 text-[18px] group-hover:translate-x-1 transition-transform">arrow_forward</span>}
        <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out z-0"></div>
      </button>

      <div className="relative flex items-center py-2">
        <div className="flex-grow border-t border-surface-container-highest"></div>
        <span className="flex-shrink-0 mx-4 font-mono text-[11px] font-medium text-on-surface-variant uppercase tracking-widest bg-surface-container-lowest px-2">Ho?c ti?p t?c v?i</span>
        <div className="flex-grow border-t border-surface-container-highest"></div>
      </div>

      <GoogleLoginButton />
    </form>
  );
}`;

const googleBtnContent = `import React from "react";

const GoogleLoginButton = () => {
  const handleGoogleLogin = () => {
    window.location.href = "http://localhost:8080/oauth2/authorization/google";
  };

  return (
    <button
      type="button"
      onClick={handleGoogleLogin}
      className="w-full flex items-center justify-center gap-3 bg-surface-container-low text-on-surface hover:bg-surface-container font-mono text-sm font-medium py-3.5 rounded-lg transition-colors border border-surface-container-highest cursor-pointer"
    >
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"></path>
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"></path>
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"></path>
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"></path>
      </svg>
      Ðang nh?p b?ng Google
    </button>
  );
};

export default GoogleLoginButton;`;

fs.writeFileSync(path + 'pages/AuthPage.jsx', authPageContent);
fs.writeFileSync(path + 'components/auth/LoginForm.jsx', loginFormContent);
fs.writeFileSync(path + 'components/auth/RegisterForm.jsx', registerFormContent);
fs.writeFileSync(path + 'components/auth/GoogleLoginButton.jsx', googleBtnContent);
console.log('Script completed');
