import { Link } from "react-router-dom";
import { motion } from "../components/motion";
import { EASE } from "../components/motion";

export default function NotFound() {
  return (
    <section className="auth-section">
      <motion.div
        className="glass-card text-center"
        style={{ maxWidth: 440, width: "100%" }}
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, ease: EASE }}
      >
        <motion.h1
          style={{ fontSize: "5rem", fontWeight: 800, background: "var(--gradient-primary)", WebkitBackgroundClip: "text", backgroundClip: "text", WebkitTextFillColor: "transparent" }}
          initial={{ scale: 0, rotate: -10 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 15, delay: 0.1 }}
        >
          404
        </motion.h1>
        <h3 className="mb-3">Page Not Found</h3>
        <p className="text-muted mb-4">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link to="/" className="btn-premium">
          <i className="ri-home-4-line me-2"></i> Go Home
        </Link>
      </motion.div>
    </section>
  );
}
