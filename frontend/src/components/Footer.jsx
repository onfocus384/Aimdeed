import { useState } from "react";
import { Link } from "react-router-dom";
import { FadeIn } from "./motion";

export default function Footer() {
  const year = new Date().getFullYear();
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (email.trim()) {
      setSubscribed(true);
      setEmail("");
      setTimeout(() => setSubscribed(false), 4000);
    }
  };

  return (
    <FadeIn variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] } } }}>
    <footer className="site-footer">
      {/* Newsletter strip */}
      <div className="container mb-4">
        <div className="glass-card d-flex flex-column flex-lg-row align-items-lg-center justify-content-between gap-4 p-4">
          <div>
            <h5 className="footer-heading mb-1">Stay Ahead of the Curve</h5>
            <p className="text-muted mb-0" style={{ color: "#94a3b8" }}>
              Get exam tips, topper insights and new study material announcements straight to your inbox.
            </p>
          </div>
          <div className="flex-shrink-0">
            <form onSubmit={handleSubscribe} className="d-flex flex-column flex-sm-row gap-2 newsletter-form">
              <input
                type="email"
                required
                className="form-control form-control-glass"
                placeholder="Enter your email"
                style={{ minWidth: 240 }}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                aria-label="Email for newsletter"
              />
              <button type="submit" className="btn-premium">
                Subscribe
              </button>
            </form>
            {subscribed && (
              <div className="alert-glass alert-glass-success mb-0 mt-3">Thanks for subscribing! Check your inbox soon.</div>
            )}
          </div>
        </div>
      </div>

      <div className="container">
        <div className="row g-5">
          <div className="col-lg-4">
            <Link to="/" className="navbar-brand-custom mb-3">
              <div className="brand-logo-wrap">
                <img src="/images/logo_circular.png" alt="Aimdeed" className="brand-logo" />
              </div>
              <span>
                <span className="brand-a">A</span>
                <span className="brand-name">imdeed</span>
              </span>
            </Link>
            <p className="text-muted mt-3" style={{ color: "#94a3b8", lineHeight: 1.7 }}>
              Empowering students for a brighter future through mentorship, premium study resources,
              and career guidance. Let's aim high together.
            </p>
            <div className="d-flex gap-2 mt-4">
              <a
                href="https://www.facebook.com/people/Aim-Deed/pfbid027eQwMFMRqbEDE8ptHYTcEKRJdNAZ1aXywE2dZrncJgXam36mmLXoXvDG39yfwQ6xl/"
                target="_blank"
                rel="noreferrer"
                className="social-icon"
                aria-label="Facebook"
              >
                <i className="ri-facebook-fill"></i>
              </a>
              <a href="https://x.com/Aimdeed_" target="_blank" rel="noreferrer" className="social-icon" aria-label="X">
                <i className="ri-twitter-x-fill"></i>
              </a>
              <a
                href="https://www.linkedin.com/company/aimdeed/"
                target="_blank"
                rel="noreferrer"
                className="social-icon"
                aria-label="LinkedIn"
              >
                <i className="ri-linkedin-fill"></i>
              </a>
              <a
                href="https://www.instagram.com/aimdeed"
                target="_blank"
                rel="noreferrer"
                className="social-icon"
                aria-label="Instagram"
              >
                <i className="ri-instagram-fill"></i>
              </a>
            </div>
          </div>

          <div className="col-lg-2">
            <h5 className="footer-heading">Explore</h5>
            <ul className="list-unstyled">
              <li>
                <Link to="/" className="footer-link">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/studies" className="footer-link">
                  Studies
                </Link>
              </li>
              <li>
                <Link to="/chatbot" className="footer-link">
                  AI Chatbot
                </Link>
              </li>
              <li>
                <Link to="/predictor" className="footer-link">
                  Rank Predictor
                </Link>
              </li>
              <li>
                <Link to="/mentor" className="footer-link">
                  Mentorship
                </Link>
              </li>
            </ul>
          </div>

          <div className="col-lg-2">
            <h5 className="footer-heading">Support</h5>
            <ul className="list-unstyled">
              <li>
                <Link to="/#contact" className="footer-link">
                  Help Center
                </Link>
              </li>
              <li>
                <Link to="/#contact" className="footer-link">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="footer-link">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms" className="footer-link">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>

          <div className="col-lg-4">
            <h5 className="footer-heading">Get in Touch</h5>
            <ul className="list-unstyled text-muted" style={{ color: "#94a3b8" }}>
              <li className="d-flex gap-2 mb-2 align-items-start">
                <i className="ri-map-pin-line mt-1"></i>
                <span>Indian Institute of Technology Kharagpur, West Bengal, India - 721302</span>
              </li>
              <li className="d-flex gap-2 mb-2">
                <i className="ri-phone-line"></i>
                <span>+91 6239547309</span>
              </li>
              <li className="d-flex gap-2 mb-2">
                <i className="ri-mail-line"></i>
                <span>support@aimdeed.in</span>
              </li>
            </ul>
          </div>
        </div>

        <hr style={{ borderColor: "rgba(255,255,255,0.08)", margin: "2.5rem 0 1rem" }} />
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-center gap-2 pb-3">
          <p className="text-muted mb-0" style={{ color: "#64748b", fontSize: "0.9rem" }}>
            © {year} Aimdeed. Crafted with <i className="ri-heart-fill text-danger"></i> for future leaders.
          </p>
          <div className="d-flex gap-3 footer-bottom-links">
            <Link to="/privacy" className="footer-link" style={{ fontSize: "0.9rem" }}>
              Privacy
            </Link>
            <Link to="/terms" className="footer-link" style={{ fontSize: "0.9rem" }}>
              Terms
            </Link>
            <Link to="/cookies" className="footer-link" style={{ fontSize: "0.9rem" }}>
              Cookies
            </Link>
          </div>
        </div>
      </div>
    </footer>
    </FadeIn>
  );
}
