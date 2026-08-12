import { useEffect, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { motion } from "./motion";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 16);
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(max > 0 ? Math.min(y / max, 1) : 0);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const close = () => setOpen(false);

  return (
    <>
      <motion.div
        className="scroll-progress"
        initial={{ scaleX: 0 }}
        animate={{ scaleX: progress }}
        transition={{ ease: "linear", duration: 0.1 }}
        aria-hidden="true"
      />
      <motion.header
        className={`site-header ${scrolled ? "is-scrolled" : ""}`}
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        <nav className="navbar navbar-expand-lg navbar-dark py-2" aria-label="Main navigation">
          <div className="container">
            <Link to="/" className="navbar-brand-custom" onClick={close}>
              <div className="brand-logo-wrap">
                <img src="/images/logo_circular.png" alt="Aimdeed" className="brand-logo" />
              </div>
              <span>
                <span className="brand-a">A</span>
                <span className="brand-name">imdeed</span>
              </span>
            </Link>

            <button
              className="navbar-toggler"
              type="button"
              aria-label="Toggle navigation"
              aria-expanded={open}
              onClick={() => setOpen(!open)}
            >
              <span className="navbar-toggler-icon">
                <span></span>
                <span></span>
                <span></span>
              </span>
            </button>

            <div className={`collapse navbar-collapse ${open ? "show" : ""}`}>
              <ul className="navbar-nav ms-auto align-items-lg-center gap-1 gap-lg-1">
                <li className="nav-item">
                  <NavLink to="/" className="nav-link nav-link-custom" onClick={close}>
                    Home
                  </NavLink>
                </li>
                <li className="nav-item">
                  <NavLink to="/studies" className="nav-link nav-link-custom" onClick={close}>
                    Studies
                  </NavLink>
                </li>
                <li className="nav-item">
                  <NavLink to="/mentor" className="nav-link nav-link-custom" onClick={close}>
                    Mentor
                  </NavLink>
                </li>

                <li className="nav-item dropdown">
                  <a
                    className="nav-link nav-link-custom dropdown-toggle"
                    href="#"
                    id="toolsDropdown"
                    data-bs-toggle="dropdown"
                    aria-expanded="false"
                  >
                    Tools
                  </a>
                  <ul className="dropdown-menu dropdown-menu-glass mt-2" aria-labelledby="toolsDropdown">
                    <li>
                      <NavLink to="/chatbot" className="dropdown-item d-flex align-items-center gap-2" onClick={close}>
                        <i className="ri-robot-2-line" style={{ color: "#a5b4fc" }}></i> AI Chatbot
                      </NavLink>
                    </li>
                    <li>
                      <NavLink to="/predictor" className="dropdown-item d-flex align-items-center gap-2" onClick={close}>
                        <i className="ri-ruler-2-line" style={{ color: "#38bdf8" }}></i> JEE Rank Predictor
                      </NavLink>
                    </li>
                    <li>
                      <NavLink to="/student" className="dropdown-item d-flex align-items-center gap-2" onClick={close}>
                        <i className="ri-book-open-line" style={{ color: "#60a5fa" }}></i> Student Resources
                      </NavLink>
                    </li>
                  </ul>
                </li>

                {!user && (
                  <li className="nav-item d-lg-none">
                    <NavLink to="/signup" className="btn-premium w-100 btn-cta-mobile" onClick={close}>
                      Get Started <i className="ri-arrow-right-up-line"></i>
                    </NavLink>
                  </li>
                )}

                <li className="nav-item">
                  <Link to="/#contact" className="nav-link nav-link-custom" onClick={close}>
                    Contact
                  </Link>
                </li>

                <li className="nav-item dropdown">
                  <a
                    className="nav-link nav-link-custom dropdown-toggle d-flex align-items-center gap-2"
                    href="#"
                    id="accountDropdown"
                    data-bs-toggle="dropdown"
                    aria-expanded="false"
                  >
                    <i className="ri-user-smile-line fs-5"></i>
                    <span>Account</span>
                  </a>
                  <ul className="dropdown-menu dropdown-menu-end dropdown-menu-glass mt-2">
                    {user ? (
                      <>
                        <li className="dropdown-header d-flex align-items-center gap-2">
                          <div
                            style={{
                              width: 30,
                              height: 30,
                              background: "linear-gradient(135deg, #4F46E5, #0ea5e9)",
                              borderRadius: "50%",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              flexShrink: 0,
                            }}
                          >
                            <i className="ri-user-fill text-white"></i>
                          </div>
                          <strong className="text-truncate">{user.username}</strong>
                        </li>
                        <li>
                          <hr className="dropdown-divider" />
                        </li>
                        <li>
                          <button
                            className="dropdown-item text-danger d-flex align-items-center gap-2"
                            onClick={() => {
                              close();
                              handleLogout();
                            }}
                          >
                            <i className="ri-logout-circle-r-line"></i> Logout
                          </button>
                        </li>
                      </>
                    ) : (
                      <>
                        <li>
                          <NavLink to="/login" className="dropdown-item d-flex align-items-center gap-2" onClick={close}>
                            <i className="ri-login-circle-line" style={{ color: "#60a5fa" }}></i> Login
                          </NavLink>
                        </li>
                        <li>
                          <NavLink to="/signup" className="dropdown-item d-flex align-items-center gap-2" onClick={close}>
                            <i className="ri-user-add-line" style={{ color: "#38bdf8" }}></i> Signup
                          </NavLink>
                        </li>
                      </>
                    )}
                  </ul>
                </li>
              </ul>
            </div>
          </div>
        </nav>
      </motion.header>
    </>
  );
}
