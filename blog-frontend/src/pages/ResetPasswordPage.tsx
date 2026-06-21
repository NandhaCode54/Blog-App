import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

/**
 * Password reset is now handled entirely via OTP on /forgot-password.
 * Old link-based /reset-password?token= URLs are redirected here.
 */
export default function ResetPasswordPage() {
  const navigate = useNavigate();
  useEffect(() => { navigate("/forgot-password", { replace: true }); }, [navigate]);
  return null;
}
