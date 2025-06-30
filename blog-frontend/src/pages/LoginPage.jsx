import { useState, useContext } from "react";
import api from "../api";
import { AuthCtx } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [pwd, setPwd]   = useState("");       // <- MATCHES "pwd"
  const [name, setName] = useState("");
  const [err,  setErr]  = useState(null);
  const { login } = useContext(AuthCtx);
  const nav = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    try {
      const { data } = await api.post("/auth/login", {
        email,
        password: pwd,     // <- uses same state variable
        name               // optional
      });
      login(data.token);   // store JWT
      nav("/");
    } catch (e) {
      setErr("Login failed: " + (e.response?.data?.message || e.message));
    }
  };

  return (
    <div className="container mt-5" style={{ maxWidth: 400 }}>
      <h2>Login / Register</h2>
      {err && <div className="alert alert-danger">{err}</div>}
      <form onSubmit={submit}>
        <div className="mb-3">
          <label className="form-label">Email</label>
          <input className="form-control"
                 value={email}
                 onChange={e => setEmail(e.target.value)}
                 required />
        </div>
        <div className="mb-3">
          <label className="form-label">Password</label>
          <input type="password" className="form-control"
                 value={pwd}
                 onChange={e => setPwd(e.target.value)}
                 required />
        </div>
        <div className="mb-4">
          <label className="form-label">Name (new users)</label>
          <input className="form-control"
                 value={name}
                 onChange={e => setName(e.target.value)} />
        </div>
        <button className="btn btn-primary w-100">Submit</button>
      </form>
    </div>
  );
}
