import { Link, useLocation } from "react-router-dom";
import { motion } from "../components/motion";
import { EASE } from "../components/motion";

export default function PaymentSuccess() {
  const { state } = useLocation();
  const amount = state?.amount || "—";
  const transactionId = state?.transactionId || "—";
  const date = new Date().toLocaleString();

  return (
    <section
      className="auth-section"
      style={{ background: "linear-gradient(135deg, #064e3b, #065f46, #0f766e)" }}
    >
      <motion.div
        className="glass-card text-center"
        style={{ maxWidth: 480, width: "100%" }}
        initial={{ opacity: 0, y: 24, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: EASE }}
      >
        <motion.i
          className="ri-checkbox-circle-fill text-success"
          style={{ fontSize: "4rem", display: "inline-block" }}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 15, delay: 0.15 }}
        ></motion.i>
        <h2 className="section-title mt-3">Payment Successful!</h2>
        <p className="text-muted">Thank you for your payment. Your subscription has been activated.</p>

        <motion.div
          className="my-4 p-3"
          style={{
            background: "var(--gradient-primary)",
            borderRadius: 12,
            fontSize: "2.25rem",
            fontWeight: 800,
          }}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.25, duration: 0.4, ease: EASE }}
        >
          ₹{amount}
        </motion.div>

        <div className="text-start glass-card" style={{ background: "rgba(255,255,255,0.03)" }}>
          <div className="d-flex justify-content-between py-1">
            <span className="text-muted">Transaction ID</span>
            <strong>{transactionId}</strong>
          </div>
          <div className="d-flex justify-content-between py-1">
            <span className="text-muted">Date & Time</span>
            <strong>{date}</strong>
          </div>
          <div className="d-flex justify-content-between py-1">
            <span className="text-muted">Status</span>
            <strong className="text-success">Completed</strong>
          </div>
        </div>

        <div className="d-flex flex-column flex-sm-row gap-3 mt-4">
          <Link to="/" className="btn-premium flex-fill">
            <i className="ri-home-4-line me-2"></i> Home
          </Link>
        </div>

        <p className="text-muted small mt-4 mb-0" style={{ fontSize: "0.85rem" }}>
          Confirmation email sent. Please check your email for payment receipt and subscription details.
          <br />
          For any questions, contact: support@aimdeed.com
        </p>
      </motion.div>
    </section>
  );
}
