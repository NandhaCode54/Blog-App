import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import api, { apiErrorMessage } from "../api";
import BlogLogo from "../components/BlogLogo";

/* ── schemas ─────────────────────────────────────────────────────────────── */

const emailSchema = z.object({
  email: z.string().min(1, "Email is required").email("Enter a valid email"),
});

const resetSchema = z
  .object({
    newPassword: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type EmailForm = z.infer<typeof emailSchema>;
type ResetForm = z.infer<typeof resetSchema>;

/* ── password strength ───────────────────────────────────────────────────── */

function getStrength(pwd: string): 0 | 1 | 2 | 3 | 4 {
  if (!pwd) return 0;
  let s = 0;
  if (pwd.length >= 8) s++;
  if (pwd.length >= 12) s++;
  if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) s++;
  if (/[0-9]/.test(pwd)) s++;
  if (/[^A-Za-z0-9]/.test(pwd)) s++;
  return (Math.min(4, Math.max(1, s)) as 0 | 1 | 2 | 3 | 4);
}

const STRENGTH_CFG = {
  1: { label: "Weak",   color: "#ef4444" },
  2: { label: "Fair",   color: "#f97316" },
  3: { label: "Good",   color: "#f59e0b" },
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
          <div key={i} className="strength-bar"
            style={{ backgroundColor: i <= score ? cfg.color : "var(--bs-border-color)" }} />
        ))}
      </div>
      <span style={{ fontSize: "0.75rem", fontWeight: 500, color: cfg.color }}>{cfg.label}</span>
    </div>
  );
}

/* ── eye icons ───────────────────────────────────────────────────────────── */

function EyeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
      <path d="M10.73 10.73a3 3 0 0 0 4.24 4.24" /><path d="M1 1l22 22" />
    </svg>
  );
}

/* ── main component ──────────────────────────────────────────────────────── */

type Phase = "email" | "otp" | "success";

export default function ForgotPasswordPage() {
  const [phase, setPhase]               = useState<Phase>("email");
  const [sentEmail, setSentEmail]       = useState("");
  const [otpDigits, setOtpDigits]       = useState(["", "", "", "", "", ""]);
  const [otpError, setOtpError]         = useState("");
  const [showPwd, setShowPwd]           = useState(false);
  const [showConfirm, setShowConfirm]   = useState(false);
  const [resending, setResending]       = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  /* email form */
  const emailForm = useForm<EmailForm>({ resolver: zodResolver(emailSchema) });

  /* reset form */
  const resetForm = useForm<ResetForm>({ resolver: zodResolver(resetSchema) });
  const pwdValue = resetForm.watch("newPassword", "");

  /* ── phase 1: send OTP ─────────────────────────────────────────────── */
  const handleSendOtp = async (values: EmailForm) => {
    try {
      await api.post("/auth/forgot-password", { email: values.email });
    } catch {
      /* always show OTP phase — never reveal whether email exists */
    }
    setSentEmail(values.email);
    setPhase("otp");
    setTimeout(() => inputRefs.current[0]?.focus(), 80);
  };

  /* ── resend ────────────────────────────────────────────────────────── */
  const handleResend = async () => {
    setResending(true);
    try {
      await api.post("/auth/forgot-password", { email: sentEmail });
    } catch { /* silent */ }
    setOtpDigits(["", "", "", "", "", ""]);
    setOtpError("");
    setResending(false);
    toast.success("New code sent!");
    setTimeout(() => inputRefs.current[0]?.focus(), 80);
  };

  /* ── phase 2: verify OTP + reset ──────────────────────────────────── */
  const handleReset = async (values: ResetForm) => {
    const otp = otpDigits.join("");
    if (otp.length < 6) { setOtpError("Please enter all 6 digits"); return; }

    try {
      await api.post("/auth/reset-password", {
        email: sentEmail,
        otp,
        newPassword: values.newPassword,
      });
      setPhase("success");
    } catch (e) {
      setOtpError(apiErrorMessage(e, "Invalid or expired code"));
    }
  };

  /* ── OTP box handlers ──────────────────────────────────────────────── */
  const handleDigitChange = (i: number, val: string) => {
    if (!/^\d*$/.test(val)) return;
    const next = [...otpDigits];
    next[i] = val.slice(-1);
    setOtpDigits(next);
    setOtpError("");
    if (val && i < 5) inputRefs.current[i + 1]?.focus();
  };

  const handleDigitKeyDown = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otpDigits[i] && i > 0) {
      inputRefs.current[i - 1]?.focus();
    }
  };

  const handleDigitPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted) {
      const next = ["", "", "", "", "", ""];
      pasted.split("").forEach((d, idx) => { next[idx] = d; });
      setOtpDigits(next);
      setOtpError("");
      inputRefs.current[Math.min(pasted.length, 5)]?.focus();
    }
    e.preventDefault();
  };

  /* ── render ────────────────────────────────────────────────────────── */

  const headerSubtitle =
    phase === "email"   ? "We'll send a 6-digit code to your email"
  : phase === "otp"     ? "Enter the code we sent you"
  :                       "Your account is secured";

  return (
    <div className="auth-page">
      <div className="auth-card card">

        {/* ── gradient header ── */}
        <div className="auth-card-header">
          <div className="mb-2"><BlogLogo size={30} /></div>
          <h1 className="h5 fw-bold mb-1 text-white">
            {phase === "success" ? "Password updated!" : "Forgot your password?"}
          </h1>
          <p className="mb-0 text-white-50 small">{headerSubtitle}</p>
        </div>

        {/* ── card body ── */}
        <div className="auth-card-body card-body">

          {/* ══ Phase 1 — email entry ══════════════════════════════════ */}
          {phase === "email" && (
            <>
              <p className="text-secondary small mb-4">
                Enter your account email and we'll send a <strong>6-digit code</strong> to reset your password.
              </p>
              <form onSubmit={emailForm.handleSubmit(handleSendOtp)} noValidate>
                <div className="mb-4">
                  <label className="form-label fw-medium">Email address</label>
                  <input
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    className={`form-control ${emailForm.formState.errors.email ? "is-invalid" : ""}`}
                    {...emailForm.register("email")}
                  />
                  {emailForm.formState.errors.email && (
                    <div className="invalid-feedback">{emailForm.formState.errors.email.message}</div>
                  )}
                </div>
                <button type="submit" className="btn btn-auth w-100"
                  disabled={emailForm.formState.isSubmitting}>
                  {emailForm.formState.isSubmitting ? (
                    <><span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />Sending…</>
                  ) : "Send code"}
                </button>
              </form>
              <div className="auth-divider"><span>Remembered it?</span></div>
              <Link to="/login" className="btn btn-outline-secondary w-100">Back to sign in</Link>
            </>
          )}

          {/* ══ Phase 2 — OTP + new password ══════════════════════════ */}
          {phase === "otp" && (
            <>
              <p className="text-secondary small mb-1">
                We sent a code to <strong>{sentEmail}</strong>. It expires in <strong>10 minutes</strong>.
              </p>

              <form onSubmit={resetForm.handleSubmit(handleReset)} noValidate>
                {/* OTP boxes */}
                <div className="mb-4 mt-3">
                  <label className="form-label fw-medium">6-digit code</label>
                  <div className="d-flex gap-2 justify-content-between">
                    {otpDigits.map((digit, i) => (
                      <input
                        key={i}
                        ref={(el) => { inputRefs.current[i] = el; }}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleDigitChange(i, e.target.value)}
                        onKeyDown={(e) => handleDigitKeyDown(i, e)}
                        onPaste={handleDigitPaste}
                        className={`otp-box${digit ? " otp-filled" : ""}${otpError ? " otp-error" : ""}`}
                        aria-label={`Digit ${i + 1}`}
                      />
                    ))}
                  </div>
                  {otpError && (
                    <div className="text-danger small mt-2">{otpError}</div>
                  )}
                </div>

                {/* New password */}
                <div className="mb-3">
                  <label className="form-label fw-medium">New password</label>
                  <div className="position-relative">
                    <input
                      type={showPwd ? "text" : "password"}
                      autoComplete="new-password"
                      placeholder="Min. 8 characters"
                      className={`form-control pe-5 ${resetForm.formState.errors.newPassword ? "is-invalid" : ""}`}
                      {...resetForm.register("newPassword")}
                    />
                    <button type="button"
                      className="btn-pwd-toggle position-absolute top-50 end-0 translate-middle-y me-2"
                      onClick={() => setShowPwd((v) => !v)}
                      aria-label={showPwd ? "Hide password" : "Show password"}>
                      {showPwd ? <EyeOffIcon /> : <EyeIcon />}
                    </button>
                    {resetForm.formState.errors.newPassword && (
                      <div className="invalid-feedback">{resetForm.formState.errors.newPassword.message}</div>
                    )}
                  </div>
                  <PasswordStrength password={pwdValue} />
                </div>

                {/* Confirm password */}
                <div className="mb-4">
                  <label className="form-label fw-medium">Confirm new password</label>
                  <div className="position-relative">
                    <input
                      type={showConfirm ? "text" : "password"}
                      autoComplete="new-password"
                      placeholder="Repeat your password"
                      className={`form-control pe-5 ${resetForm.formState.errors.confirmPassword ? "is-invalid" : ""}`}
                      {...resetForm.register("confirmPassword")}
                    />
                    <button type="button"
                      className="btn-pwd-toggle position-absolute top-50 end-0 translate-middle-y me-2"
                      onClick={() => setShowConfirm((v) => !v)}
                      aria-label={showConfirm ? "Hide password" : "Show password"}>
                      {showConfirm ? <EyeOffIcon /> : <EyeIcon />}
                    </button>
                    {resetForm.formState.errors.confirmPassword && (
                      <div className="invalid-feedback">{resetForm.formState.errors.confirmPassword.message}</div>
                    )}
                  </div>
                </div>

                <button type="submit" className="btn btn-auth w-100"
                  disabled={resetForm.formState.isSubmitting}>
                  {resetForm.formState.isSubmitting ? (
                    <><span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />Verifying…</>
                  ) : "Reset password"}
                </button>
              </form>

              {/* Resend + back */}
              <div className="d-flex justify-content-between align-items-center mt-3">
                <button className="btn btn-link btn-sm p-0 text-decoration-none"
                  style={{ color: "#6366f1" }}
                  onClick={handleResend}
                  disabled={resending}>
                  {resending ? "Sending…" : "Resend code"}
                </button>
                <button className="btn btn-link btn-sm p-0 text-secondary text-decoration-none"
                  onClick={() => { setPhase("email"); setOtpDigits(["","","","","",""]); setOtpError(""); }}>
                  Change email
                </button>
              </div>
            </>
          )}

          {/* ══ Phase 3 — success ══════════════════════════════════════ */}
          {phase === "success" && (
            <div className="text-center py-2">
              <div className="auth-success-icon mx-auto">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <h2 className="h6 fw-bold mb-2">All done!</h2>
              <p className="text-secondary small mb-4">
                Your password has been reset successfully. Sign in with your new password.
              </p>
              <Link to="/login" className="btn btn-auth w-100">Sign in</Link>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
