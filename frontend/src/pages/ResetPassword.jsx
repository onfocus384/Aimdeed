import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { requireSupabase } from "../lib/supabase";
import { motion } from "../components/motion";
import { EASE } from "../components/motion";

export default function ResetPassword() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ password: "", confirmPassword: "" });
  const [status, setStatus] = useState(null);
  const [ready, setReady] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let active = true;
    let subscription = null;

    try {
      const supabase = requireSupabase();

      supabase.auth.getSession().then(({ data }) => {
        if (!active) return;
        if (data.session) setReady(true);
      });

      const { data: authListener } = supabase.auth.onAuthStateChange((event) => {
        if (!active) return;
        if (event === "PASSWORD_RECOVERY") setReady(true);
      });
      subscription = authListener.subscription;
    } catch (err) {
      if (active) {
        setStatus({ type: "error", message: err.message });
      }
    }

    return () => {
      active = false;
      if (subscription) subscription.unsubscribe();
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus(null);

    if (form.password !== form.confirmPassword) {
      setStatus({ type: "error", message: "Passwords do not match!" });
      return;
    }

    setSubmitting(true);
    try {
      const supabase = requireSupabase();
      const { error } = await supabase.auth.updateUser({ password: form.password });
      if (error) throw error;
      setStatus({ type: "success", message: "Password updated successfully! You can now login." });
      setTimeout(() => navigate("/login"), 1500);
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
              background: "linear-gradient(135deg, #22c55e, #16a34a)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1.75rem",
            }}
          >
            <i className="ri-lock-password-line"></i>
          </div>
          <h2 className="section-title mb-2">Set New Password</h2>
          <p className="text-muted">Enter your new password below.</p>
        </div>

        {!ready && !status && (
          <div className="alert-glass mb-4">
            <span className="spinner-border spinner-border-sm me-2"></span>Verifying your reset link...
          </div>
        )}

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
          <div className="mb-3">
            <label className="form-label-premium">New Password</label>
            <input
              type="password"
              className="form-control form-control-glass"
              minLength="6"
              placeholder="At least 6 characters"
              required
              disabled={!ready || submitting}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </div>
          <div className="mb-4">
            <label className="form-label-premium">Confirm Password</label>
            <input
              type="password"
              className="form-control form-control-glass"
              minLength="6"
              required
              disabled={!ready || submitting}
              value={form.confirmPassword}
              onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
            />
          </div>
          <button className="btn-premium w-100" type="submit" disabled={!ready || submitting}>
            {submitting ? "Resetting..." : "Reset Password"}
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
