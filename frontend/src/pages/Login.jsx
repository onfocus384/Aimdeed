import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { motion } from "../components/motion";
import { EASE } from "../components/motion";

export default function Login() {
  const { login, signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(form);
      navigate("/");
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogle = async () => {
    setError(null);
    setSubmitting(true);
    try {
      await signInWithGoogle();
    } catch (err) {
      setError(err.message);
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
          <div className="badge-premium mb-3">Welcome Back</div>
          <h2 className="section-title mb-2">Sign In</h2>
          <p className="text-muted">Access your Aimdeed account to continue your journey.</p>
        </div>

        {error && <div className="alert-glass alert-glass-error mb-4">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label-premium">Email Address</label>
            <input
              type="email"
              className="form-control form-control-glass"
              placeholder="Enter your email address"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>
          <div className="mb-2">
            <label className="form-label-premium">Password</label>
            <div className="input-group">
              <input
                type={showPassword ? "text" : "password"}
                className="form-control form-control-glass"
                placeholder="Enter your password"
                required
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
              <button
                type="button"
                className="btn btn-outline-secondary border-start-0"
                style={{ borderColor: "var(--glass-border)", background: "transparent", color: "var(--text-muted)" }}
                onClick={() => setShowPassword(!showPassword)}
                aria-label="Toggle password"
              >
                <i className={showPassword ? "ri-eye-off-line" : "ri-eye-line"}></i>
              </button>
            </div>
          </div>
          <div className="text-end mb-4">
            <Link to="/forgot-password" className="footer-link" style={{ fontSize: "0.9rem" }}>
              Forgot Password?
            </Link>
          </div>
          <button className="btn-premium w-100" type="submit" disabled={submitting}>
            {submitting ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <div className="d-flex align-items-center gap-3 my-4">
          <hr style={{ flex: 1, borderColor: "rgba(255,255,255,0.1)" }} />
          <span className="text-muted" style={{ fontSize: "0.85rem" }}>OR</span>
          <hr style={{ flex: 1, borderColor: "rgba(255,255,255,0.1)" }} />
        </div>

        <button
          className="btn-outline-premium w-100"
          onClick={handleGoogle}
          disabled={submitting}
        >
          <i className="ri-google-fill me-2" style={{ color: "#4285F4" }}></i> Sign in with Google
        </button>

        <p className="text-center text-muted mt-4 mb-0">
          Don't have an account?{" "}
          <Link to="/signup" className="footer-link" style={{ color: "#818cf8" }}>
            Create Account
          </Link>
        </p>
      </motion.div>
    </section>
  );
}
