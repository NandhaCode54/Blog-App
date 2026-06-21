import { Link, NavLink, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";

export default function NavBar() {
  const { isAuthenticated, isAdmin, user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    toast.success("Logged out");
    navigate("/login");
  };

  return (
    <nav className="navbar navbar-expand-lg bg-body-tertiary border-bottom sticky-top">
      <div className="container">
        <Link className="navbar-brand fw-bold" to="/">📝 BlogHub</Link>

        <button className="navbar-toggler" type="button"
                data-bs-toggle="collapse" data-bs-target="#mainNav">
          <span className="navbar-toggler-icon"></span>
        </button>

        <div className="collapse navbar-collapse" id="mainNav">
          <ul className="navbar-nav ms-auto align-items-lg-center gap-lg-2">
            <li className="nav-item">
              <button
                className="btn btn-sm btn-outline-secondary"
                onClick={toggleTheme}
                title="Toggle theme"
                aria-label="Toggle color theme"
              >
                {theme === "dark" ? "☀️ Light" : "🌙 Dark"}
              </button>
            </li>

            {isAuthenticated ? (
              <>
                {user?.name && (
                  <li className="nav-item">
                    <span className="navbar-text">
                      Hi, {user.name}
                      {user.role === "ADMIN" && (
                        <span className="badge text-bg-warning ms-1">Admin</span>
                      )}
                    </span>
                  </li>
                )}
                {isAdmin && (
                  <li className="nav-item">
                    <NavLink className="btn btn-sm btn-warning" to="/admin">
                      Admin Panel
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
