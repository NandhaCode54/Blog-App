import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import api, { apiErrorMessage } from "../api";
import { useAuth } from "../context/AuthContext";
import type { AuthResponse } from "../types";
import BlogLogo from "../components/BlogLogo";

const schema = z.object({
  email: z.string().min(1, "Email is required").email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

type FormValues = z.infer<typeof schema>;

function EyeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
      <path d="M10.73 10.73a3 3 0 0 0 4.24 4.24" />
      <path d="M1 1l22 22" />
    </svg>
  );
}

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: FormValues) => {
    try {
      const { data } = await api.post<AuthResponse>("/auth/login", {
        email: values.email,
        password: values.password,
      });
      login(data);
      toast.success("Welcome back!");
      navigate("/");
    } catch (e) {
      toast.error(apiErrorMessage(e, "Login failed"));
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card card">
        {/* Gradient Header */}
        <div className="auth-card-header">
          <div className="mb-2">
            <BlogLogo size={30} />
          </div>
          <h1 className="h5 fw-bold mb-1 text-white">Welcome back</h1>
          <p className="mb-0 text-white-50 small">Sign in to continue your journey</p>
        </div>

        {/* Form Body */}
        <div className="auth-card-body card-body">
          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            {/* Email */}
            <div className="mb-3">
              <label className="form-label fw-medium">Email address</label>
              <input
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                className={`form-control ${errors.email ? "is-invalid" : ""}`}
                {...register("email")}
              />
              {errors.email && (
                <div className="invalid-feedback">{errors.email.message}</div>
              )}
            </div>

            {/* Password */}
            <div className="mb-3">
              <div className="d-flex justify-content-between align-items-center mb-1">
                <label className="form-label fw-medium mb-0">Password</label>
                <Link
                  to="/forgot-password"
                  className="small text-decoration-none"
                  style={{ color: "#6366f1" }}
                >
                  Forgot password?
                </Link>
              </div>
              <div className="position-relative">
                <input
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="Your password"
                  className={`form-control pe-5 ${errors.password ? "is-invalid" : ""}`}
                  {...register("password")}
                />
                <button
                  type="button"
                  className="btn-pwd-toggle position-absolute top-50 end-0 translate-middle-y me-2"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
                {errors.password && (
                  <div className="invalid-feedback">{errors.password.message}</div>
                )}
              </div>
            </div>

            <div className="mb-4">
              <div className="form-check">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="rememberMe"
                />
                <label className="form-check-label small text-secondary" htmlFor="rememberMe">
                  Remember me
                </label>
              </div>
            </div>

            <button type="submit" className="btn btn-auth w-100" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />
                  Signing in…
                </>
              ) : (
                "Sign in"
              )}
            </button>
          </form>

          <div className="auth-divider">
            <span>New to BlogHub?</span>
          </div>

          <Link to="/register" className="btn btn-outline-secondary w-100">
            Create an account
          </Link>
        </div>
      </div>
    </div>
  );
}
