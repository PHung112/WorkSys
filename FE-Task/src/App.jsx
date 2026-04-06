import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import HomePage from "./pages/HomePage";
import AuthPage from "./pages/AuthPage";
import ProjectsPage from "./pages/ProjectsPage";
import UserProfilePage from "./pages/UserProfilePage";
import OAuthCallbackPage from "./pages/OAuthCallbackPage";
import AppNavbar from "./layouts/AppNavbar";
import PublicNavbar from "./layouts/PublicNavbar";
import Footer from "./layouts/Footer";
import ScrollToTop from "./components/ScrollToTop";

// Layout app dùng để chọn navbar, render route và ẩn/hiện footer theo trang hiện tại.
function Layout() {
  useLocation(); // re-render mỗi khi route thay đổi
  const isAuthenticated = !!sessionStorage.getItem("token");
  const isProjectsPage = location.pathname === "/projects";
  return (
    <div className="min-h-screen flex flex-col bg-linear-to-br from-slate-900 via-purple-950 to-slate-900 text-white">
      <ScrollToTop />
      {isAuthenticated ? <AppNavbar /> : <PublicNavbar />}
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/oauth/callback" element={<OAuthCallbackPage />} />
        <Route path="/profile" element={<UserProfilePage />} />
        <Route path="/projects" element={<ProjectsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {!isProjectsPage && <Footer />}
    </div>
  );
}

// Entry component bọc toàn bộ ứng dụng trong BrowserRouter.
function App() {
  return (
    <BrowserRouter>
      <Layout />
    </BrowserRouter>
  );
}

export default App;
