import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/LoginPage";
import Posts from "./pages/PostsPage";
import PostDetail from "./pages/PostDetailPage";
import PostForm from "./pages/NewPostPage";
import NavBar from "./components/NavBar";
import { useAuth } from "./context/AuthContext";

export default function App() {
  const { isAuthenticated } = useAuth();
  return (
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
  );
}
