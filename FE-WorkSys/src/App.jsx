import { lazy, Suspense } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";

// Code splitting các trang theo route bằng dynamic import
const HomePage = lazy(() => import("./pages/HomePage"));
const AuthPage = lazy(() => import("./pages/AuthPage"));
const ProjectsPage = lazy(() => import("./pages/ProjectsPage"));
const UserProfilePage = lazy(() => import("./pages/UserProfilePage"));
const SecurityPage = lazy(() => import("./pages/SecurityPage"));
const CreateTaskPage = lazy(() => import("./pages/CreateTaskPage"));
const OAuthCallbackPage = lazy(() => import("./pages/OAuthCallbackPage"));
const ProjectMembersPage = lazy(() => import("./pages/ProjectMembersPage"));
const ProjectArchivePage = lazy(() => import("./pages/ProjectArchivePage"));

// Admin pages
const AdminLayout = lazy(() => import("./layouts/AdminLayout"));
const AdminDashboardPage = lazy(() => import("./pages/admin/AdminDashboardPage"));
const AdminUsersPage = lazy(() => import("./pages/admin/AdminUsersPage"));
const AdminProjectsPage = lazy(() => import("./pages/admin/AdminProjectsPage"));
const AdminAuditLogsPage = lazy(() => import("./pages/admin/AdminAuditLogsPage"));
const AdminSystemStatusPage = lazy(() => import("./pages/admin/AdminSystemStatusPage"));

import AdminRoute from "./components/common/AdminRoute";
import AppNavbar from "./layouts/AppNavbar";
import PublicNavbar from "./layouts/PublicNavbar";
import Footer from "./layouts/Footer";
import ScrollToTop from "./components/ScrollToTop";

function PageFallback() {
  return (
    <div className="min-h-[60vh] w-full flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
    </div>
  );
}

// Layout app dùng để chọn navbar, render route và ẩn/hiện footer theo trang hiện tại.
function Layout() {
  const location = useLocation(); // re-render mỗi khi route thay đổi
  const isAuthenticated = !!sessionStorage.getItem("token");
  const isProjectsPage = location.pathname.startsWith("/projects");
  const isAdminRoute = location.pathname.startsWith("/admin");

  if (isAdminRoute && isAuthenticated) {
    return (
      <AdminRoute>
        <Suspense fallback={<PageFallback />}>
          <Routes>
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminDashboardPage />} />
              <Route path="users" element={<AdminUsersPage />} />
              <Route path="projects" element={<AdminProjectsPage />} />
              <Route path="audit-logs" element={<AdminAuditLogsPage />} />
              <Route path="system-status" element={<AdminSystemStatusPage />} />
            </Route>
          </Routes>
        </Suspense>
      </AdminRoute>
    );
  }
  return (
    <div className="min-h-screen flex flex-col bg-background text-on-background">
      <ScrollToTop />
      {isAuthenticated ? <AppNavbar /> : <PublicNavbar />}
      <Suspense fallback={<PageFallback />}>
        <Routes>
          <Route path="/" element={isAuthenticated ? <Navigate to="/projects" replace /> : <HomePage />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/oauth/callback" element={<OAuthCallbackPage />} />
          <Route path="/profile" element={<UserProfilePage />} />
          <Route path="/security" element={<SecurityPage />} />
          <Route path="/projects" element={<ProjectsPage />} />
          <Route path="/projects/:projectId/members" element={<ProjectMembersPage />} />
          <Route path="/projects/:projectId/new-task" element={<CreateTaskPage />} />
          <Route path="/projects/:projectId/archive" element={<ProjectArchivePage />} />
          <Route path="/tasks/new" element={<CreateTaskPage />} />
          <Route path="/taskpage" element={<CreateTaskPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>

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
