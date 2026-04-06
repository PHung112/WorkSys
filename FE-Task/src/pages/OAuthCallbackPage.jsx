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
    const error = params.get("error");

    if (token) {
      // Lưu token từ Google vào sessionStorage
      sessionStorage.setItem("token", token);

      // Lưu currentUser để AppNavbar + ProjectsPage dùng được ngay
      if (id && username) {
        sessionStorage.setItem(
          "currentUser",
          JSON.stringify({
            id: Number(id),
            username,
            email: email || "",
          }),
        );
      }

      // Redirect về trang projects sau khi đăng nhập thành công
      navigate("/projects", { replace: true });
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
    <div className="min-h-screen bg-linear-to-br from-slate-900 via-purple-950 to-slate-900 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin w-12 h-12 border-4 border-purple-600 border-t-white rounded-full mx-auto mb-4"></div>
        <p className="text-white">Đang xử lý đăng nhập...</p>
      </div>
    </div>
  );
}
