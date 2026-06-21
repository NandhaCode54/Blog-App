import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import Posts from "./pages/PostsPage";
import PostDetail from "./pages/PostDetailPage";
import PostForm from "./pages/NewPostPage";
import AuthorsPage from "./pages/AuthorsPage";
import AuthorProfilePage from "./pages/AuthorProfilePage";
import AuthorDashboardPage from "./pages/AuthorDashboardPage";
import NavBar from "./components/NavBar";
import AdminRoute from "./components/AdminRoute";
import AuthorRoute from "./components/AuthorRoute";
import AdminDashboardPage from "./pages/admin/AdminDashboardPage";
import AdminUsersPage from "./pages/admin/AdminUsersPage";
import AdminAuthorsPage from "./pages/admin/AdminAuthorsPage";
import AdminUpgradeRequestsPage from "./pages/admin/AdminUpgradeRequestsPage";
import AdminSettingsPage from "./pages/admin/AdminSettingsPage";
import { useAuth } from "./context/AuthContext";

export default function App() {
  const { isAuthenticated } = useAuth();
  return (
    <Routes>
      {/* Public blog + author dashboard — all share NavBar */}
      <Route
        path="/*"
        element={
          <>
            <NavBar />
            <Routes>
              <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/" />} />
              <Route path="/register" element={!isAuthenticated ? <RegisterPage /> : <Navigate to="/" />} />
              <Route path="/forgot-password" element={!isAuthenticated ? <ForgotPasswordPage /> : <Navigate to="/" />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />
              <Route path="/" element={<Posts />} />
              <Route path="/posts/:id" element={<PostDetail />} />
              <Route path="/authors" element={<AuthorsPage />} />
              <Route path="/authors/:id" element={<AuthorProfilePage />} />
              <Route path="/new" element={isAuthenticated ? <PostForm /> : <Navigate to="/login" />} />
              <Route path="/edit/:id" element={isAuthenticated ? <PostForm /> : <Navigate to="/login" />} />
              <Route
                path="/dashboard"
                element={<AuthorRoute><AuthorDashboardPage /></AuthorRoute>}
              />
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </>
        }
      />

      {/* Admin panel — own sidebar layout, no NavBar */}
      <Route path="/admin" element={<AdminRoute><AdminDashboardPage /></AdminRoute>} />
      <Route path="/admin/users" element={<AdminRoute><AdminUsersPage /></AdminRoute>} />
      <Route path="/admin/authors" element={<AdminRoute><AdminAuthorsPage /></AdminRoute>} />
      <Route path="/admin/upgrade-requests" element={<AdminRoute><AdminUpgradeRequestsPage /></AdminRoute>} />
      <Route path="/admin/settings" element={<AdminRoute><AdminSettingsPage /></AdminRoute>} />
    </Routes>
  );
}
