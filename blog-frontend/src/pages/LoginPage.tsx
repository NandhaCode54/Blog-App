import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import api, { apiErrorMessage } from "../api";
import { useAuth } from "../context/AuthContext";
import type { AuthResponse } from "../types";

const schema = z.object({
  name: z.string().optional(),
  email: z.string().min(1, "Email is required").email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

type FormValues = z.infer<typeof schema>;

export default function LoginPage() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const isRegister = mode === "register";
  const { login } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const switchMode = (next: "login" | "register") => {
    setMode(next);
    reset();
  };

  const onSubmit = async (values: FormValues) => {
    if (isRegister) {
      if (!values.name || values.name.trim().length === 0) {
        setError("name", { message: "Name is required" });
        return;
      }
      if (values.password.length < 8) {
        setError("password", { message: "Password must be at least 8 characters" });
        return;
      }
    }
    try {
      const url = isRegister ? "/auth/register" : "/auth/login";
      const payload = isRegister
        ? { name: values.name, email: values.email, password: values.password }
        : { email: values.email, password: values.password };
      const { data } = await api.post<AuthResponse>(url, payload);
      login(data);
      toast.success(isRegister ? "Welcome aboard!" : "Welcome back!");
      navigate("/");
    } catch (e) {
      toast.error(apiErrorMessage(e, isRegister ? "Registration failed" : "Login failed"));
    }
  };

  return (
    <div className="container py-5" style={{ maxWidth: 420 }}>
      <div className="card shadow-sm">
        <div className="card-body p-4">
          <h2 className="h4 mb-3 text-center">{isRegister ? "Create account" : "Welcome back"}</h2>

          <div className="btn-group w-100 mb-4" role="group">
            <button
              type="button"
              className={`btn ${!isRegister ? "btn-primary" : "btn-outline-primary"}`}
              onClick={() => switchMode("login")}
            >
              Login
            </button>
            <button
              type="button"
              className={`btn ${isRegister ? "btn-primary" : "btn-outline-primary"}`}
              onClick={() => switchMode("register")}
            >
              Register
            </button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            {isRegister && (
              <div className="mb-3">
                <label className="form-label">User Name</label>
                <input className={`form-control ${errors.name ? "is-invalid" : ""}`} {...register("name")} />
                {errors.name && <div className="invalid-feedback">{errors.name.message}</div>}
              </div>
            )}
            <div className="mb-3">
              <label className="form-label">Email</label>
              <input
                type="email"
                className={`form-control ${errors.email ? "is-invalid" : ""}`}
                {...register("email")}
              />
              {errors.email && <div className="invalid-feedback">{errors.email.message}</div>}
            </div>
            <div className="mb-4">
              <label className="form-label">Password</label>
              <input
                type="password"
                className={`form-control ${errors.password ? "is-invalid" : ""}`}
                {...register("password")}
              />
              {errors.password && <div className="invalid-feedback">{errors.password.message}</div>}
              {isRegister && !errors.password && (
                <div className="form-text">At least 8 characters.</div>
              )}
            </div>
            <button className="btn btn-primary w-100" disabled={isSubmitting}>
              {isSubmitting ? "Please wait…" : isRegister ? "Create account" : "Login"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
