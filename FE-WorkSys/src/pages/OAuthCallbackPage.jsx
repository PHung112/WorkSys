import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

// Trang callback OAuth: nhận token từ URL, lưu phiên và điều hướng theo kết quả đăng nhập.
export default function OAuthCallbackPage() {
  const navigate = useNavigate();
  const location = useLocation();

  // Parse query params từ backend OAuth và xử lý thành công/thất bại.
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get("token");
    const id = params.get("id");
    const username = params.get("username");
    const email = params.get("email");
    const avatarUrl = params.get("avatarUrl");  // Lấy thêm avatarUrl từ Google
    const systemRole = params.get("systemRole");
    const status = params.get("status");
    const error = params.get("error");

    if (token) {
      // Lưu token từ Google vào sessionStorage
      sessionStorage.setItem("token", token);

      // Lưu currentUser (kể cả avatarUrl) để AppNavbar + ProjectsPage dùng được ngay
      if (id && username) {
        sessionStorage.setItem(
          "currentUser",
          JSON.stringify({
            id: Number(id),
            username,
            email: email || "",
            avatarUrl: avatarUrl ? decodeURIComponent(avatarUrl) : null,
            systemRole: systemRole || "USER",
            status: status || "ACTIVE",
          }),
        );
      }

      // Redirect về trang tương ứng
      if (systemRole === "SYSTEM_ADMIN") {
        navigate("/admin", { replace: true });
      } else {
        navigate("/projects", { replace: true });
      }
    } else if (error) {
      // Nếu có lỗi, hiển thị và redirect về login
      alert(`Đăng nhập Google thất bại: ${error}`);
      navigate("/auth", { replace: true });
    } else {
      // Nếu không có token hoặc error, redirect về login
      navigate("/auth", { replace: true });
    }
  }, [location, navigate]);

  return (
    <main className="min-h-screen flex items-center justify-center p-container-margin">
      <div className="flex flex-col w-full">
        <div className="flex flex-col items-center justify-center w-full max-w-md mx-auto text-center gap-stack-lg">
          {/* Cipher Logo Node */}
          <div className="relative flex items-center justify-center w-24 h-24 bg-surface-container rounded-2xl shadow-xl">
            {/* Ethereal Glow */}
            <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full mix-blend-screen animate-pulse"></div>
            {/* Geometric Logo SVG */}
            <svg className="w-12 h-12 text-primary relative z-10" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <polygon points="12 2 2 7 2 17 12 22 22 17 22 7 12 2"></polygon>
              <circle cx="12" cy="12" r="3"></circle>
              <path d="M12 2v20"></path>
              <path d="M2 7l20 10"></path>
              <path d="M2 17L22 7"></path>
            </svg>
          </div>
          {/* Typography & Spinner */}
          <div className="flex flex-col items-center gap-stack-sm mt-stack-md">
            <div className="flex items-center gap-stack-sm">
              {/* Custom Animated Spinner */}
              <svg className="animate-spin w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"></circle>
                <path className="opacity-90" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" fill="currentColor"></path>
              </svg>
              <h1 className="font-headline-md text-headline-md text-on-background">Đang xử lý đăng nhập...</h1>
            </div>
            <p className="font-body-sm text-body-sm text-on-surface-variant">Vui lòng chờ trong giây lát.</p>
          </div>
          {/* Terminal-style Status */}
          <div className="mt-stack-lg flex items-center gap-2 font-label-xs text-label-xs text-outline uppercase">
            <span className="w-2 h-2 bg-tertiary rounded-full animate-pulse shadow-[0_0_8px_rgba(76,215,246,0.5)]"></span>
            <span className="tracking-widest opacity-70">Đang thiết lập kết nối an toàn_</span>
          </div>
        </div>
      </div>
    </main>
  );
}
