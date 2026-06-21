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

const schema = z
  .object({
    name: z.string().min(1, "Name is required").max(150, "Name is too long"),
    email: z.string().min(1, "Email is required").email("Enter a valid email"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type FormValues = z.infer<typeof schema>;

function getStrength(pwd: string): 0 | 1 | 2 | 3 | 4 {
  if (!pwd) return 0;
  let score = 0;
  if (pwd.length >= 8) score++;
  if (pwd.length >= 12) score++;
  if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) score++;
  if (/[0-9]/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;
  if (score <= 1) return 1;
  if (score === 2) return 2;
  if (score === 3) return 3;
  return 4;
}

const STRENGTH_CFG = {
  1: { label: "Weak", color: "#ef4444" },
  2: { label: "Fair", color: "#f97316" },
  3: { label: "Good", color: "#f59e0b" },
  4: { label: "Strong", color: "#10b981" },
} as const;

function PasswordStrength({ password }: { password: string }) {
  const score = getStrength(password);
  if (!password) return null;
  const cfg = STRENGTH_CFG[score as keyof typeof STRENGTH_CFG];
  return (
    <div className="mt-2">
      <div className="d-flex gap-1 mb-1">
        {([1, 2, 3, 4] as const).map((i) => (
          <div
            key={i}
            className="strength-bar"
            style={{ backgroundColor: i <= score ? cfg.color : "var(--bs-border-color)" }}
          />
        ))}
      </div>
      <span style={{ fontSize: "0.75rem", fontWeight: 500, color: cfg.color }}>{cfg.label}</span>
    </div>
  );
}

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

export default function RegisterPage() {
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const passwordValue = watch("password", "");

  const onSubmit = async (values: FormValues) => {
    try {
      const { data } = await api.post<AuthResponse>("/auth/register", {
        name: values.name,
        email: values.email,
        password: values.password,
      });
      login(data);
      toast.success("Welcome to BlogHub!");
      navigate("/");
    } catch (e) {
      toast.error(apiErrorMessage(e, "Registration failed"));
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card card">
        {/* Header */}
        <div className="auth-card-header">
          <div className="mb-2">
            <BlogLogo size={30} />
          </div>
          <h1 className="h5 fw-bold mb-1 text-white">Create your account</h1>
          <p className="mb-0 text-white-50 small">Start writing and sharing your stories</p>
        </div>

        {/* Body */}
        <div className="auth-card-body card-body">
          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            {/* Name */}
            <div className="mb-3">
              <label className="form-label fw-medium">Full name</label>
              <input
                type="text"
                autoComplete="name"
                placeholder="Jane Smith"
                className={`form-control ${errors.name ? "is-invalid" : ""}`}
                {...register("name")}
              />
              {errors.name && <div className="invalid-feedback">{errors.name.message}</div>}
            </div>

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
              {errors.email && <div className="invalid-feedback">{errors.email.message}</div>}
            </div>

            {/* Password */}
            <div className="mb-3">
              <label className="form-label fw-medium">Password</label>
              <div className="position-relative">
                <input
                  type={showPwd ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="Min. 8 characters"
                  className={`form-control pe-5 ${errors.password ? "is-invalid" : ""}`}
                  {...register("password")}
                />
                <button
                  type="button"
                  className="btn-pwd-toggle position-absolute top-50 end-0 translate-middle-y me-2"
                  onClick={() => setShowPwd((v) => !v)}
                  aria-label={showPwd ? "Hide password" : "Show password"}
                >
                  {showPwd ? <EyeOffIcon /> : <EyeIcon />}
                </button>
                {errors.password && (
                  <div className="invalid-feedback">{errors.password.message}</div>
                )}
              </div>
              <PasswordStrength password={passwordValue} />
            </div>

            {/* Confirm Password */}
            <div className="mb-4">
              <label className="form-label fw-medium">Confirm password</label>
              <div className="position-relative">
                <input
                  type={showConfirm ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="Repeat your password"
                  className={`form-control pe-5 ${errors.confirmPassword ? "is-invalid" : ""}`}
                  {...register("confirmPassword")}
                />
                <button
                  type="button"
                  className="btn-pwd-toggle position-absolute top-50 end-0 translate-middle-y me-2"
                  onClick={() => setShowConfirm((v) => !v)}
                  aria-label={showConfirm ? "Hide password" : "Show password"}
                >
                  {showConfirm ? <EyeOffIcon /> : <EyeIcon />}
                </button>
                {errors.confirmPassword && (
                  <div className="invalid-feedback">{errors.confirmPassword.message}</div>
                )}
              </div>
            </div>

            <button type="submit" className="btn btn-auth w-100" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />
                  Creating account…
                </>
              ) : (
                "Create account"
              )}
            </button>
          </form>

          <div className="auth-divider">
            <span>Already have an account?</span>
          </div>

          <Link to="/login" className="btn btn-outline-secondary w-100">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
