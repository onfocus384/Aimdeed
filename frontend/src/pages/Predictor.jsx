import { useState } from "react";
import { api } from "../api/client";
import { motion, AnimatePresence, FadeIn } from "../components/motion";
import { EASE } from "../components/motion";

function getInstituteType(institute) {
  const name = String(institute || "");
  if (name.includes("IIT")) return "IIT";
  if (name.includes("NIT")) return "NIT";
  if (name.includes("IIIT")) return "IIIT";
  if (name.includes("IIEST")) return "IIEST";
  if (name.includes("GFTI")) return "GFTI";
  return "Other";
}

const TYPE_PRIORITY = { IIT: 1, NIT: 2, IIIT: 3, IIEST: 4, GFTI: 5, Other: 6 };

function getAdmissionChance(userRank, open, close) {
  if (userRank < open) {
    return { label: "High Admission Chance", cls: "text-success" };
  }
  const position = ((userRank - open) / Math.max(close - open, 1)) * 100;
  if (position < 25) return { label: "High Admission Chance", cls: "text-success" };
  if (position < 75) return { label: "Moderate Chance", cls: "text-warning" };
  return { label: "Possible in Waitlist", cls: "text-danger" };
}

const TYPE_BADGE = {
  IIT: "bg-primary",
  NIT: "bg-success",
  IIIT: "bg-info",
  IIEST: "bg-secondary",
  GFTI: "bg-warning text-dark",
  Other: "bg-secondary",
};

export default function Predictor() {
  const [rank, setRank] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);

  const predict = async () => {
    const userRank = Number(rank);
    setResults(null);
    setError(null);

    if (!userRank || userRank <= 0) {
      setError("Please enter a valid positive rank to continue.");
      return;
    }

    setLoading(true);
    try {
      const data = await api.josaa();
      const matches = data.filter(
        (c) =>
          userRank >= Number(c["Opening Rank"]) && userRank <= Number(c["Closing Rank"]),
      );
      matches.sort(
        (a, b) =>
          TYPE_PRIORITY[getInstituteType(a.Institute)] -
            TYPE_PRIORITY[getInstituteType(b.Institute)] ||
          Number(a["Closing Rank"]) - Number(b["Closing Rank"]),
      );
      setResults(matches);
    } catch {
      setError("Failed to load college data. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <section className="page-hero">
        <div className="container">
          <FadeIn>
            <div className="badge-premium mb-3">Admission Intelligence</div>
            <h1 className="page-title">JEE College Predictor</h1>
            <p className="page-subtitle">
              Input your All India Rank to see your potential college matches based on historical admission data.
            </p>
          </FadeIn>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-lg-8">
              <FadeIn className="glass-card mb-4">
                <label className="form-label-premium">Enter Your JEE Rank (AIR)</label>
                <div className="d-flex flex-column flex-sm-row gap-3">
                  <input
                    type="number"
                    min="1"
                    className="form-control form-control-glass"
                    placeholder="e.g. 15000"
                    value={rank}
                    onChange={(e) => setRank(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && predict()}
                  />
                  <button className="btn-premium flex-shrink-0" onClick={predict} disabled={loading}>
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2"></span> Analyzing...
                      </>
                    ) : (
                      "Predict"
                    )}
                  </button>
                </div>
                {error && <div className="alert-glass alert-glass-error mt-3">{error}</div>}
              </FadeIn>

              {loading && (
                <motion.div
                  className="text-center glass-card"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, ease: EASE }}
                >
                  <div className="spinner-border text-primary mb-3"></div>
                  <p className="mb-0 text-muted">Analyzing historical cut-off data...</p>
                </motion.div>
              )}

              {results && !loading && (
                <AnimatePresence mode="wait">
                  <motion.div
                    key="results"
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.4, ease: EASE }}
                  >
                  <div className="d-flex align-items-center justify-content-between mb-3">
                    <h3 className="section-title mb-0">Matched Colleges ({results.length})</h3>
                    <span className="badge-premium">Scroll to view</span>
                  </div>

                  {results.length === 0 ? (
                    <div className="glass-card text-center">
                      <i className="ri-emotion-sad-line fs-1 mb-3 d-block" style={{ color: "#818cf8" }}></i>
                      <h4 className="mb-2">No Direct Matches Found</h4>
                      <p className="text-muted mb-0">
                        Try considering state-level counseling or spot rounds for better options.
                      </p>
                    </div>
                  ) : (
                    results.map((c, i) => {
                      const type = getInstituteType(c.Institute);
                      const chance = getAdmissionChance(
                        Number(rank),
                        Number(c["Opening Rank"]),
                        Number(c["Closing Rank"]),
                      );
                      return (
                        <motion.div
                          className="glass-card mb-3"
                          key={i}
                          style={{ transform: "none" }}
                          initial={{ opacity: 0, y: 14 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.4, ease: EASE, delay: Math.min(i * 0.03, 0.6) }}
                        >
                          <div className="d-flex justify-content-between align-items-start mb-2">
                            <span className={`badge ${TYPE_BADGE[type]} me-2`}>{type}</span>
                            <span className="small text-muted">{c["Seat Type"]} · {c.Quota}</span>
                          </div>
                          <h5 className="mb-1">{c.Institute}</h5>
                          <p className="text-muted mb-3">{c["Academic Program Name"]}</p>
                          <div className="d-flex flex-wrap align-items-center gap-3">
                            <span className="badge-premium">
                              Rank {c["Opening Rank"]} - {c["Closing Rank"]}
                            </span>
                            <span className={`fw-semibold ${chance.cls}`}>{chance.label}</span>
                          </div>
                        </motion.div>
                      );
                    })
                  )}
                  </motion.div>
                </AnimatePresence>
              )}

              <div className="text-center mt-4">
                <span className="badge text-bg-warning text-dark" style={{ padding: "0.6rem 1.2rem" }}>
                  Predictions are based on previous year's JoSAA cut-off data. Actual results may vary.
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
