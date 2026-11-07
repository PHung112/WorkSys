import { useState, useEffect, useRef } from "react";
import GoogleLoginButton from "./GoogleLoginButton";

const inputBase = "w-full bg-surface-container-low text-on-surface font-sans text-sm rounded-lg py-3 outline-none focus:bg-surface-container focus:ring-1 focus:ring-primary/50 transition-all placeholder:text-on-surface-variant/40 border border-transparent focus:border-outline-variant/30";
const inputWithLeftIcon = inputBase + " pl-10 pr-4";
const inputWithBothIcons = inputBase + " pl-10 pr-10";

export default function RegisterForm({ onSendOtp, onVerifyAndRegister, loading }) {
  const [step, setStep] = useState(1); // 1: Nhập thông tin, 2: Nhập OTP xác thực email
  const [form, setForm] = useState({ username: "", email: "", password: "", confirmPassword: "" });
  const [otp, setOtp] = useState("");
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Bộ đếm ngược 60 giây gửi lại mã
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const timerRef = useRef(null);
  const otpInputRef = useRef(null);

  // Xử lý đếm ngược khi sang bước 2
  useEffect(() => {
    if (step === 2) {
      setCountdown(60);
      setCanResend(false);
      clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      // Tự động focus vào ô OTP
      setTimeout(() => otpInputRef.current?.focus(), 150);
    }

    return () => clearInterval(timerRef.current);
  }, [step]);

  // Bước 1: Kiểm tra form và gửi mã OTP
  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setErrors({});

    const newErrors = {};
    if (!form.username.trim()) newErrors.username = "Vui lòng nhập tên đăng nhập";
    if (!form.email.trim()) newErrors.email = "Vui lòng nhập email";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) newErrors.email = "Email không đúng định dạng";
    if (!form.password) newErrors.password = "Vui lòng nhập mật khẩu";
    else if (form.password.length < 6) newErrors.password = "Mật khẩu tối thiểu 6 ký tự";
    if (!form.confirmPassword) newErrors.confirmPassword = "Vui lòng xác nhận mật khẩu";
    else if (form.password !== form.confirmPassword) newErrors.confirmPassword = "Mật khẩu xác nhận không trùng khớp";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const res = await onSendOtp({
      username: form.username.trim(),
      email: form.email.trim().toLowerCase(),
    });

    if (res.success) {
      setOtp("");
      setStep(2);
    } else {
      setErrors({ general: res.error });
    }
  };

  // Bước 2: Xác thực OTP và hoàn tất đăng ký
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setErrors({});

    if (!otp.trim()) {
      setErrors({ otp: "Vui lòng nhập mã OTP gồm 6 chữ số" });
      return;
    }
    if (otp.trim().length !== 6) {
      setErrors({ otp: "Mã OTP phải có đúng 6 chữ số" });
      return;
    }

    const res = await onVerifyAndRegister({
      username: form.username.trim(),
      email: form.email.trim().toLowerCase(),
      password: form.password,
      otp: otp.trim(),
    });

    if (!res.success) {
      setErrors({ general: res.error });
    }
  };

  // Gửi lại mã OTP
  const handleResendOtp = async () => {
    if (!canResend || loading) return;
    setErrors({});
    const res = await onSendOtp({
      username: form.username.trim(),
      email: form.email.trim().toLowerCase(),
    });

    if (res.success) {
      setCountdown(60);
      setCanResend(false);
      clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      setErrors({ general: res.error });
    }
  };

  return (
    <div>
      {/* ======================= BƯỚC 1: ĐIỀN THÔNG TIN ======================= */}
      {step === 1 && (
        <form onSubmit={handleRequestOtp} className="flex flex-col gap-4">
          {/* Username */}
          <div className="flex flex-col gap-1.5">
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
            {errors.username && <p className="text-error text-xs">{errors.username}</p>}
          </div>

          {/* Email */}
          <div className="flex flex-col gap-1.5">
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
            {errors.email && <p className="text-error text-xs">{errors.email}</p>}
          </div>

          {/* Password */}
          <div className="flex flex-col gap-1.5">
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
            {errors.password && <p className="text-error text-xs">{errors.password}</p>}
          </div>

          {/* Confirm Password */}
          <div className="flex flex-col gap-1.5">
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
            {errors.confirmPassword && <p className="text-error text-xs">{errors.confirmPassword}</p>}
          </div>

          {/* Error tổng quát */}
          {errors.general && (
            <div className="bg-error/10 border border-error/25 rounded-xl px-4 py-3 text-error text-xs leading-relaxed flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px] shrink-0">error</span>
              <span>{errors.general}</span>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 bg-primary text-on-primary font-mono text-sm font-medium py-3.5 rounded-lg hover:bg-primary-fixed active:scale-[0.98] transition-all flex items-center justify-center gap-2 group relative overflow-hidden disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
          >
            <span className="relative z-10 flex items-center gap-2">
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-on-primary border-t-transparent rounded-full animate-spin"></div>
                  <span>Đang gửi mã xác thực...</span>
                </>
              ) : (
                <>
                  <span>Tiếp tục: Xác thực Email</span>
                  <span className="material-symbols-outlined text-[18px] group-hover:translate-x-1 transition-transform">
                    arrow_forward
                  </span>
                </>
              )}
            </span>
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
      )}

      {/* ======================= BƯỚC 2: NHẬP MÃ OTP ======================= */}
      {step === 2 && (
        <form onSubmit={handleVerifyOtp} className="flex flex-col gap-5 animate-in fade-in duration-300">
          {/* Header thông báo */}
          <div className="p-4 rounded-xl bg-primary/10 border border-primary/20 flex flex-col items-center text-center gap-2">
            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary mb-1">
              <span className="material-symbols-outlined text-[28px]">mark_email_read</span>
            </div>
            <h3 className="font-semibold text-on-surface text-sm">Xác thực địa chỉ Email</h3>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              Mã xác thực gồm 6 chữ số đã được gửi đến:
              <br />
              <strong className="text-primary font-mono text-sm">{form.email}</strong>
            </p>
          </div>

          {/* Ô nhập mã OTP */}
          <div className="flex flex-col gap-2">
            <label className="font-mono text-[11px] font-medium text-on-surface uppercase tracking-wider text-center">
              Nhập mã 6 chữ số (Hiệu lực trong 5 phút)
            </label>
            <div className="relative">
              <input
                ref={otpInputRef}
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                placeholder="000000"
                className="w-full text-center font-mono text-3xl font-extrabold tracking-[0.4em] py-3.5 bg-surface-container-low border border-primary/40 rounded-xl focus:ring-2 focus:ring-primary/50 focus:bg-surface-container text-on-surface outline-none transition-all placeholder:tracking-normal placeholder:font-sans placeholder:text-sm placeholder:text-on-surface-variant/40"
              />
            </div>
            {errors.otp && <p className="text-error text-xs text-center">{errors.otp}</p>}
          </div>

          {/* Lỗi tổng quát */}
          {errors.general && (
            <div className="bg-error/10 border border-error/25 rounded-xl px-4 py-3 text-error text-xs leading-relaxed flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px] shrink-0">error</span>
              <span>{errors.general}</span>
            </div>
          )}

          {/* Nút xác nhận */}
          <button
            type="submit"
            disabled={loading || otp.length !== 6}
            className="w-full bg-primary text-on-primary font-mono text-sm font-medium py-3.5 rounded-lg hover:bg-primary-fixed active:scale-[0.98] transition-all flex items-center justify-center gap-2 group relative overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            <span className="relative z-10 flex items-center gap-2">
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-on-primary border-t-transparent rounded-full animate-spin"></div>
                  <span>Đang tạo tài khoản...</span>
                </>
              ) : (
                <>
                  <span>Xác nhận & Hoàn tất</span>
                  <span className="material-symbols-outlined text-[18px]">verified</span>
                </>
              )}
            </span>
          </button>

          {/* Gửi lại mã & Quay lại */}
          <div className="flex items-center justify-between pt-2 border-t border-outline-variant/15 text-xs">
            <button
              type="button"
              onClick={() => {
                setErrors({});
                setStep(1);
              }}
              className="text-on-surface-variant hover:text-on-surface flex items-center gap-1 transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">arrow_back</span>
              <span>Sửa email</span>
            </button>

            <div>
              {canResend ? (
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={loading}
                  className="text-primary font-medium hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">refresh</span>
                  <span>Gửi lại mã</span>
                </button>
              ) : (
                <span className="text-on-surface-variant">
                  Gửi lại sau <strong className="text-primary font-mono font-medium">{countdown}s</strong>
                </span>
              )}
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
