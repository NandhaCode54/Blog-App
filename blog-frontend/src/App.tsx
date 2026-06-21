import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/LoginPage";
import Posts from "./pages/PostsPage";
import PostDetail from "./pages/PostDetailPage";
import PostForm from "./pages/NewPostPage";
import NavBar from "./components/NavBar";
import AdminRoute from "./components/AdminRoute";
import AdminDashboardPage from "./pages/admin/AdminDashboardPage";
import AdminUsersPage from "./pages/admin/AdminUsersPage";
import AdminAuthorsPage from "./pages/admin/AdminAuthorsPage";
import { useAuth } from "./context/AuthContext";

export default function App() {
  const { isAuthenticated } = useAuth();
  return (
    <Routes>
      {/* Public blog — has NavBar */}
      <Route
        path="/*"
        element={
          <>
            <NavBar />
            <Routes>
              <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/" />} />
              <Route path="/" element={<Posts />} />
              <Route path="/posts/:id" element={<PostDetail />} />
              <Route path="/new" element={isAuthenticated ? <PostForm /> : <Navigate to="/login" />} />
              <Route path="/edit/:id" element={isAuthenticated ? <PostForm /> : <Navigate to="/login" />} />
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </>
        }
      />

      {/* Admin panel — has its own sidebar layout, no NavBar */}
      <Route path="/admin" element={<AdminRoute><AdminDashboardPage /></AdminRoute>} />
      <Route path="/admin/users" element={<AdminRoute><AdminUsersPage /></AdminRoute>} />
      <Route path="/admin/authors" element={<AdminRoute><AdminAuthorsPage /></AdminRoute>} />
    </Routes>
  );
}
