import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import api, { apiErrorMessage } from "../api";
import BlogLogo from "../components/BlogLogo";

const schema = z
  .object({
    newPassword: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
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

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const passwordValue = watch("newPassword", "");

  const onSubmit = async (values: FormValues) => {
    if (!token) return;
    try {
      await api.post("/auth/reset-password", {
        token,
        newPassword: values.newPassword,
      });
      setSuccess(true);
    } catch (e) {
      toast.error(apiErrorMessage(e, "Failed to reset password"));
    }
  };

  // No token in URL
  if (!token) {
    return (
      <div className="auth-page">
        <div className="auth-card card">
          <div className="auth-card-header">
            <div className="mb-2">
              <BlogLogo size={30} />
            </div>
            <h1 className="h5 fw-bold mb-1 text-white">Invalid link</h1>
            <p className="mb-0 text-white-50 small">This link is missing required information</p>
          </div>
          <div className="auth-card-body card-body text-center py-4">
            <p className="text-secondary mb-4">
              The password reset link is invalid. Please request a new one.
            </p>
            <Link to="/forgot-password" className="btn btn-auth w-100">
              Request new link
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Success state
  if (success) {
    return (
      <div className="auth-page">
        <div className="auth-card card">
          <div className="auth-card-header">
            <div className="mb-2">
              <BlogLogo size={30} />
            </div>
            <h1 className="h5 fw-bold mb-1 text-white">Password updated!</h1>
            <p className="mb-0 text-white-50 small">Your account is secured</p>
          </div>
          <div className="auth-card-body card-body text-center py-4">
            <div className="auth-success-icon mx-auto">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h2 className="h6 fw-bold mb-2">All done!</h2>
            <p className="text-secondary small mb-4">
              Your password has been reset successfully. Sign in with your new password.
            </p>
            <Link to="/login" className="btn btn-auth w-100">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-card card">
        {/* Header */}
        <div className="auth-card-header">
          <div className="mb-2">
            <BlogLogo size={30} />
          </div>
          <h1 className="h5 fw-bold mb-1 text-white">Set new password</h1>
          <p className="mb-0 text-white-50 small">Choose a strong password for your account</p>
        </div>

        {/* Body */}
        <div className="auth-card-body card-body">
          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            {/* New Password */}
            <div className="mb-3">
              <label className="form-label fw-medium">New password</label>
              <div className="position-relative">
                <input
                  type={showPwd ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="Min. 8 characters"
                  className={`form-control pe-5 ${errors.newPassword ? "is-invalid" : ""}`}
                  {...register("newPassword")}
                />
                <button
                  type="button"
                  className="btn-pwd-toggle position-absolute top-50 end-0 translate-middle-y me-2"
                  onClick={() => setShowPwd((v) => !v)}
                  aria-label={showPwd ? "Hide password" : "Show password"}
                >
                  {showPwd ? <EyeOffIcon /> : <EyeIcon />}
                </button>
                {errors.newPassword && (
                  <div className="invalid-feedback">{errors.newPassword.message}</div>
                )}
              </div>
              <PasswordStrength password={passwordValue} />
            </div>

            {/* Confirm Password */}
            <div className="mb-4">
              <label className="form-label fw-medium">Confirm new password</label>
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
                  Resetting…
                </>
              ) : (
                "Reset password"
              )}
            </button>
          </form>

          <div className="auth-divider">
            <span>Changed your mind?</span>
          </div>

          <Link to="/login" className="btn btn-outline-secondary w-100">
            Back to sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
