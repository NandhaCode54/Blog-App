import { Link, NavLink, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import BlogLogo from "./BlogLogo";

export default function NavBar() {
  const { isAuthenticated, isAdmin, user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const isAuthor = user?.role === "AUTHOR" || user?.role === "ADMIN";

  const handleLogout = async () => {
    await logout();
    toast.success("Logged out");
    navigate("/login");
  };

  return (
    <nav className="navbar navbar-expand-lg bg-body-tertiary border-bottom sticky-top">
      <div className="container">
        <Link className="navbar-brand fw-bold d-flex align-items-center gap-2" to="/">
          <span className="nav-logo-mark">
            <BlogLogo size={16} />
          </span>
          BlogHub
        </Link>

        <button className="navbar-toggler" type="button"
                data-bs-toggle="collapse" data-bs-target="#mainNav">
          <span className="navbar-toggler-icon"></span>
        </button>

        <div className="collapse navbar-collapse" id="mainNav">
          <ul className="navbar-nav me-auto align-items-lg-center gap-lg-1">
            <li className="nav-item">
              <NavLink className="nav-link" to="/">Posts</NavLink>
            </li>
            <li className="nav-item">
              <NavLink className="nav-link" to="/authors">Authors</NavLink>
            </li>
          </ul>

          <ul className="navbar-nav ms-auto align-items-lg-center gap-lg-2">
            <li className="nav-item">
              <button
                className="btn btn-sm btn-outline-secondary"
                onClick={toggleTheme}
                title="Toggle theme"
                aria-label="Toggle color theme"
              >
                {theme === "dark" ? "Light" : "Dark"}
              </button>
            </li>

            {isAuthenticated ? (
              <>
                {user?.name && (
                  <li className="nav-item">
                    <span className="navbar-text">
                      {user.name}
                      {user.role === "ADMIN" && (
                        <span className="badge text-bg-warning ms-1">Admin</span>
                      )}
                      {user.role === "AUTHOR" && (
                        <span className="badge text-bg-primary ms-1">Author</span>
                      )}
                    </span>
                  </li>
                )}
                {isAuthor && (
                  <li className="nav-item">
                    <NavLink className="btn btn-sm btn-outline-primary" to="/dashboard">
                      Dashboard
                    </NavLink>
                  </li>
                )}
                {isAdmin && (
                  <li className="nav-item">
                    <NavLink className="btn btn-sm btn-warning" to="/admin">
                      Admin
                    </NavLink>
                  </li>
                )}
                <li className="nav-item">
                  <Link className="btn btn-sm btn-primary" to="/new">New Post</Link>
                </li>
                <li className="nav-item">
                  <button className="btn btn-sm btn-outline-danger" onClick={handleLogout}>
                    Logout
                  </button>
                </li>
              </>
            ) : (
              <li className="nav-item">
                <Link className="btn btn-sm btn-primary" to="/login">Login</Link>
              </li>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
}
