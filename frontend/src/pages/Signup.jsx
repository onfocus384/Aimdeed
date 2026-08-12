import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { motion } from "../components/motion";
import { EASE } from "../components/motion";

export default function Signup() {
  const { signup, signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    username: "",
    email: "",
    password: "",
    terms: false,
  });
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const result = await signup(form);
      if (result?.session) {
        navigate("/");
      } else {
        setSuccess("Account created successfully! Please check your email to confirm, then login.");
        setTimeout(() => navigate("/login"), 1800);
      }
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
        className="glass-card"
        style={{ maxWidth: 600, width: "100%" }}
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: EASE }}
      >
        <div className="text-center mb-4">
          <div className="badge-premium mb-3">Join the Community</div>
          <h2 className="section-title mb-2">Create Account</h2>
          <p className="text-muted">Start your journey towards NEET & JEE success with Aimdeed.</p>
        </div>

        {error && <div className="alert-glass alert-glass-error mb-4">{error}</div>}
        {success && <div className="alert-glass alert-glass-success mb-4">{success}</div>}

        <form onSubmit={handleSubmit}>
          <div className="row g-3 mb-3">
            <div className="col-md-6">
              <label className="form-label-premium">First Name</label>
              <input
                type="text"
                className="form-control form-control-glass"
                required
                value={form.firstName}
                onChange={(e) => setForm({ ...form, firstName: e.target.value })}
              />
            </div>
            <div className="col-md-6">
              <label className="form-label-premium">Last Name</label>
              <input
                type="text"
                className="form-control form-control-glass"
                required
                value={form.lastName}
                onChange={(e) => setForm({ ...form, lastName: e.target.value })}
              />
            </div>
            <div className="col-md-6">
              <label className="form-label-premium">Username</label>
              <input
                type="text"
                className="form-control form-control-glass"
                placeholder="Unique username"
                required
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
              />
            </div>
            <div className="col-md-6">
              <label className="form-label-premium">Email Address</label>
              <input
                type="email"
                className="form-control form-control-glass"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div className="col-12">
              <label className="form-label-premium">Password</label>
              <input
                type="password"
                className="form-control form-control-glass"
                placeholder="At least 8 characters"
                required
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
            </div>
            <div className="col-12 d-flex align-items-center gap-2">
              <input
                type="checkbox"
                id="terms"
                required
                checked={form.terms}
                onChange={(e) => setForm({ ...form, terms: e.target.checked })}
              />
              <label htmlFor="terms" className="text-muted mb-0" style={{ fontSize: "0.9rem" }}>
                I agree to the{" "}
                <Link to="/terms" className="footer-link" style={{ color: "#818cf8" }}>
                  Terms & Conditions
                </Link>{" "}
                and{" "}
                <Link to="/privacy" className="footer-link" style={{ color: "#818cf8" }}>
                  Privacy Policy
                </Link>
              </label>
            </div>
          </div>
          <button className="btn-premium w-100" type="submit" disabled={submitting}>
            {submitting ? "Creating Account..." : "Create Account"}
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
          <i className="ri-google-fill me-2" style={{ color: "#4285F4" }}></i> Sign up with Google
        </button>

        <p className="text-center text-muted mt-4 mb-0">
          Already have an account?{" "}
          <Link to="/login" className="footer-link" style={{ color: "#818cf8" }}>
            Log in here
          </Link>
        </p>
      </motion.div>
    </section>
  );
}
