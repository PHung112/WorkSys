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
import SecurityPage from "./pages/SecurityPage";
import CreateTaskPage from "./pages/CreateTaskPage";
import OAuthCallbackPage from "./pages/OAuthCallbackPage";
import ProjectMembersPage from "./pages/ProjectMembersPage";
import AdminLayout from "./layouts/AdminLayout";
import AdminRoute from "./components/common/AdminRoute";
import AdminDashboardPage from "./pages/admin/AdminDashboardPage";
import AdminUsersPage from "./pages/admin/AdminUsersPage";
import AdminProjectsPage from "./pages/admin/AdminProjectsPage";
import AdminAuditLogsPage from "./pages/admin/AdminAuditLogsPage";
import AdminSystemStatusPage from "./pages/admin/AdminSystemStatusPage";
import AppNavbar from "./layouts/AppNavbar";
import PublicNavbar from "./layouts/PublicNavbar";
import Footer from "./layouts/Footer";
import ScrollToTop from "./components/ScrollToTop";

// Layout app dùng để chọn navbar, render route và ẩn/hiện footer theo trang hiện tại.
function Layout() {
  useLocation(); // re-render mỗi khi route thay đổi
  const isAuthenticated = !!sessionStorage.getItem("token");
  const isProjectsPage = location.pathname.startsWith("/projects");
  const isAdminRoute = location.pathname.startsWith("/admin");
  
  if (isAdminRoute && isAuthenticated) {
    return (
      <AdminRoute>
        <Routes>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboardPage />} />
            <Route path="users" element={<AdminUsersPage />} />
            <Route path="projects" element={<AdminProjectsPage />} />
            <Route path="audit-logs" element={<AdminAuditLogsPage />} />
            <Route path="system-status" element={<AdminSystemStatusPage />} />
          </Route>
        </Routes>
      </AdminRoute>
    );
  }
  return (
    <div className="min-h-screen flex flex-col bg-background text-on-background">
      <ScrollToTop />
      {isAuthenticated ? <AppNavbar /> : <PublicNavbar />}
      <Routes>
        <Route path="/" element={isAuthenticated ? <Navigate to="/projects" replace /> : <HomePage />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/oauth/callback" element={<OAuthCallbackPage />} />
        <Route path="/profile" element={<UserProfilePage />} />
        <Route path="/security" element={<SecurityPage />} />
        <Route path="/projects" element={<ProjectsPage />} />
        <Route path="/projects/:projectId/members" element={<ProjectMembersPage />} />
        <Route path="/projects/:projectId/new-task" element={<CreateTaskPage />} />
        <Route path="/tasks/new" element={<CreateTaskPage />} />
        <Route path="/taskpage" element={<CreateTaskPage />} />
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
