import { useState } from "react";
import { Link } from "react-router-dom";
import { requireSupabase } from "../lib/supabase";
import { motion } from "../components/motion";
import { EASE } from "../components/motion";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus(null);
    setSubmitting(true);
    try {
      const supabase = requireSupabase();
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      setStatus({
        type: "success",
        message: "If an account exists with this email, a reset link will be sent.",
      });
    } catch (err) {
      setStatus({ type: "error", message: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="auth-section">
      <motion.div
        className="glass-card auth-card"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: EASE }}
      >
        <div className="text-center mb-4">
          <div
            style={{
              width: 72,
              height: 72,
              margin: "0 auto 1rem",
              borderRadius: "50%",
              background: "linear-gradient(135deg, #4f46e5, #0ea5e9)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1.75rem",
            }}
          >
            <i className="ri-lock-2-line"></i>
          </div>
          <h2 className="section-title mb-2">Reset Your Password</h2>
          <p className="text-muted">
            Enter your email address and we'll send you a link to reset your password.
          </p>
        </div>

        {status && (
          <div
            className={`alert-glass mb-4 ${
              status.type === "error" ? "alert-glass-error" : "alert-glass-success"
            }`}
          >
            {status.message}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="form-label-premium">Email Address</label>
            <input
              type="email"
              className="form-control form-control-glass"
              placeholder="you@example.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <button className="btn-premium w-100" type="submit" disabled={submitting}>
            {submitting ? "Sending..." : "Send Reset Link"}
          </button>
        </form>

        <div className="text-center mt-4">
          <Link to="/login" className="footer-link">
            <i className="ri-arrow-left-line me-1"></i> Back to Login
          </Link>
        </div>
      </motion.div>
    </section>
  );
}
