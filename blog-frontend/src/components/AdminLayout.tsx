import { NavLink, useNavigate } from "react-router-dom";
import type { ReactNode } from "react";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

const navItems = [
  { to: "/admin", label: "Dashboard", icon: "bi-speedometer2", end: true },
  { to: "/admin/users", label: "Users", icon: "bi-people" },
  { to: "/admin/authors", label: "Authors", icon: "bi-pen" },
  { to: "/admin/upgrade-requests", label: "Upgrade Requests", icon: "bi-person-check" },
  { to: "/admin/categories", label: "Categories", icon: "bi-tag" },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    toast.success("Logged out");
    navigate("/login");
  };

  return (
    <div className="d-flex" style={{ minHeight: "100vh" }}>
      {/* Sidebar */}
      <nav
        className="d-flex flex-column flex-shrink-0 p-3 bg-dark text-white"
        style={{ width: 230 }}
      >
        <NavLink to="/" className="d-flex align-items-center mb-3 text-white text-decoration-none">
          <span className="fs-5 fw-bold">BlogHub Admin</span>
        </NavLink>
        <hr />

        <ul className="nav nav-pills flex-column mb-auto gap-1">
          {navItems.map((item) => (
            <li key={item.to} className="nav-item">
              <NavLink
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  "nav-link text-white d-flex align-items-center gap-2" +
                  (isActive ? " active bg-primary" : " hover-light")
                }
              >
                <i className={`bi ${item.icon}`}></i>
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>

        <hr />
        <div className="d-flex align-items-center gap-2">
          <div className="flex-grow-1 small text-truncate">{user?.name}</div>
          <button
            className="btn btn-sm btn-outline-light"
            onClick={handleLogout}
            title="Logout"
          >
            <i className="bi bi-box-arrow-right"></i>
          </button>
        </div>
        <NavLink to="/" className="btn btn-sm btn-outline-secondary mt-2">
          View Blog
        </NavLink>
      </nav>

      {/* Main content */}
      <main className="flex-grow-1 p-4 overflow-auto bg-body">
        {children}
      </main>
    </div>
  );
}
