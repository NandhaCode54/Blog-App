import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link } from "react-router-dom";
import { apiErrorMessage } from "../api";
import api from "../api";
import BlogLogo from "../components/BlogLogo";

const schema = z.object({
  email: z.string().min(1, "Email is required").email("Enter a valid email"),
});

type FormValues = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const [submitted, setSubmitted] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: FormValues) => {
    try {
      await api.post("/auth/forgot-password", { email: values.email });
      setSubmittedEmail(values.email);
      setSubmitted(true);
    } catch (e) {
      // Still show success to prevent email enumeration
      setSubmittedEmail(values.email);
      setSubmitted(true);
      console.error(apiErrorMessage(e));
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
          <h1 className="h5 fw-bold mb-1 text-white">Forgot your password?</h1>
          <p className="mb-0 text-white-50 small">
            {submitted ? "Check your inbox" : "We'll send you a reset link"}
          </p>
        </div>

        {/* Body */}
        <div className="auth-card-body card-body">
          {submitted ? (
            <div className="text-center py-2">
              <div className="auth-success-icon mx-auto">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <h2 className="h6 fw-bold mb-2">Email sent!</h2>
              <p className="text-secondary small mb-4">
                If <strong>{submittedEmail}</strong> is registered with BlogHub, you will receive a
                password reset link within a few minutes. The link expires in{" "}
                <strong>15 minutes</strong>.
              </p>
              <p className="text-secondary small mb-4">
                Don't see it? Check your spam folder.
              </p>
              <Link to="/login" className="btn btn-auth w-100">
                Back to sign in
              </Link>
            </div>
          ) : (
            <>
              <p className="text-secondary small mb-4">
                Enter your account email and we'll send you a secure link to reset your password.
              </p>
              <form onSubmit={handleSubmit(onSubmit)} noValidate>
                <div className="mb-4">
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

                <button type="submit" className="btn btn-auth w-100" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />
                      Sending…
                    </>
                  ) : (
                    "Send reset link"
                  )}
                </button>
              </form>

              <div className="auth-divider">
                <span>Remembered it?</span>
              </div>

              <Link to="/login" className="btn btn-outline-secondary w-100">
                Back to sign in
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
