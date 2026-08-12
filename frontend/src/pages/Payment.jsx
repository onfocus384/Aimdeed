import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { motion, AnimatePresence, FadeIn } from "../components/motion";
import { EASE } from "../components/motion";

const AMOUNTS = [499, 799, 999];

export default function Payment() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState(null);
  const [qrImage, setQrImage] = useState(null);
  const [showQr, setShowQr] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [confirmForm, setConfirmForm] = useState({ payerName: "", utr: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.paymentPlans().catch(() => {});
  }, []);

  const proceed = async () => {
    setError(null);
    setGenerating(true);
    try {
      const data = await api.generateQR(selected);
      setQrImage(data.qrImage);
      setShowQr(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setError(err.message || "Failed to generate QR. Please try again.");
    } finally {
      setGenerating(false);
    }
  };

  const confirm = async (e) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const data = await api.confirmPayment({
        amount: selected,
        utr: confirmForm.utr,
        payerName: confirmForm.payerName,
      });
      navigate("/payment/success", {
        state: { amount: data.amount, transactionId: data.transactionId },
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <section className="page-hero">
        <div className="container">
          <FadeIn>
            <div className="badge-premium mb-3">Premium Access</div>
            <h1 className="page-title">Unlock Your Potential</h1>
            <p className="page-subtitle">
              Choose a plan that fits your preparation needs and get started today.
            </p>
          </FadeIn>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-lg-7">
              <FadeIn className="glass-card">
                <div className="d-flex justify-content-between align-items-center mb-4">
                  <h4 className="mb-0">Aimdeed Payments</h4>
                  <span className="badge-premium">
                    <i className="ri-shield-check-line me-1"></i>Secure & Instant Verification
                  </span>
                </div>

                {error && <div className="alert-glass alert-glass-error mb-4">{error}</div>}

                <AnimatePresence mode="wait">
                {!showQr ? (
                  <motion.div
                    key="plans"
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -16 }}
                    transition={{ duration: 0.4, ease: EASE }}
                  >
                    <label className="form-label-premium mb-3">Select Subscription Plan</label>
                    <div className="row g-3 mb-4">
                      {AMOUNTS.map((amount) => (
                        <div className="col-4" key={amount}>
                          <motion.div
                            className={`amount-option ${selected === amount ? "selected" : ""}`}
                            onClick={() => setSelected(amount)}
                            whileHover={{ y: -4, scale: 1.02 }}
                            whileTap={{ scale: 0.97 }}
                            transition={{ duration: 0.2, ease: EASE }}
                          >
                            <div className="small text-muted">INR</div>
                            <div className="price">₹{amount}</div>
                          </motion.div>
                        </div>
                      ))}
                    </div>
                    <button
                      className="btn-premium w-100"
                      onClick={proceed}
                      disabled={!selected || generating}
                    >
                      {generating ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2"></span> Generating QR...
                        </>
                      ) : (
                        <>Proceed to Checkout (₹{selected || 0})</>
                      )}
                    </button>
                  </motion.div>
                ) : (
                  <motion.div
                    key="qr"
                    initial={{ opacity: 0, x: 16 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 16 }}
                    transition={{ duration: 0.4, ease: EASE }}
                  >
                    <div
                      className="text-center mb-4 p-3"
                      style={{ background: "rgba(255,255,255,0.05)", borderRadius: 16 }}
                    >
                      <p className="text-muted mb-1">Total Payable</p>
                      <h2 style={{ background: "var(--gradient-primary)", WebkitBackgroundClip: "text", backgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                        ₹{selected}
                      </h2>
                    </div>

                    <motion.div
                      className="text-center mb-4"
                      style={{
                        background: "#fff",
                        padding: "1rem",
                        borderRadius: 16,
                        width: "min(260px, 100%)",
                        margin: "0 auto",
                      }}
                      initial={{ scale: 0.7, opacity: 0, rotate: -3 }}
                      animate={{ scale: 1, opacity: 1, rotate: 0 }}
                      transition={{ type: "spring", stiffness: 200, damping: 18 }}
                    >
                      <img src={qrImage} alt="UPI QR Code" style={{ width: "100%" }} />
                    </motion.div>

                    <form onSubmit={confirm} className="row g-3">
                      <input type="hidden" value={selected} />
                      <div className="col-md-6">
                        <label className="form-label-premium">Payer Name</label>
                        <input
                          type="text"
                          className="form-control form-control-glass"
                          required
                          value={confirmForm.payerName}
                          onChange={(e) => setConfirmForm({ ...confirmForm, payerName: e.target.value })}
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label-premium">Transaction ID / UTR</label>
                        <input
                          type="text"
                          className="form-control form-control-glass"
                          placeholder="Enter 12-digit Transaction ID"
                          required
                          value={confirmForm.utr}
                          onChange={(e) => setConfirmForm({ ...confirmForm, utr: e.target.value })}
                        />
                      </div>
                      <div className="col-12 text-center mt-4">
                        <button className="btn-premium px-5 py-3" type="submit" disabled={submitting}>
                          {submitting ? "Submitting..." : "I've Completed the Payment"}
                        </button>
                      </div>
                    </form>

                    <div className="text-center mt-4">
                      <span className="badge text-bg-info" style={{ padding: "0.6rem 1.2rem" }}>
                        Payment is manually verified. It usually takes 5-15 minutes to activate your account.
                      </span>
                    </div>
                  </motion.div>
                )}
                </AnimatePresence>
              </FadeIn>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
