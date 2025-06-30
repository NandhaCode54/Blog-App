import { Link } from 'react-router-dom';
import { useContext } from 'react';
import { AuthCtx } from '../context/AuthContext.jsx';

export default function NavBar() {
  const { token, logout } = useContext(AuthCtx);

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-primary">
      <div className="container">
        <Link className="navbar-brand" to="/">Mini Blog</Link>

        <button className="navbar-toggler" type="button"
                data-bs-toggle="collapse" data-bs-target="#mainNav">
          <span className="navbar-toggler-icon"></span>
        </button>

        <div className="collapse navbar-collapse" id="mainNav">
          <ul className="navbar-nav ms-auto">
            {token ? (
              <>
                <li className="nav-item">
                  <Link className="nav-link" to="/new">New Post</Link>
                </li>
                <li className="nav-item">
                  <button className="btn btn-outline-light ms-lg-2" onClick={logout}>
                    Logout
                  </button>
                </li>
              </>
            ) : (
              <li className="nav-item">
                <Link className="btn btn-outline-light" to="/login">Login</Link>
              </li>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
}
