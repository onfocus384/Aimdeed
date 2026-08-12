import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useInView } from "motion/react";
import { api } from "../api/client";
import { motion, AnimatePresence, FadeIn, Stagger, StaggerItem, HoverLift } from "../components/motion";
import { EASE } from "../components/motion";

const studyData = [
  { name: "Priti Bansal", detail: "Studying for JEE", image: "/people/st1.png" },
  { name: "Priya Singh", detail: "Studying for JEE", image: "/people/st2.png" },
  { name: "Arjun Thakur", detail: "Studying for JEE", image: "/people/st3.png" },
  { name: "Sneha Das", detail: "Studying for JEE", image: "/people/st4.png" },
  { name: "Karan Gupta", detail: "Studying for JEE", image: "/people/st5.png" },
  { name: "Sougata Sain", detail: "Studying for NEET & AIMS", image: "/people/st6.png" },
  { name: "Pooja Chowdhuri", detail: "Studying for JEE", image: "/people/st7.png" },
];

function CountUp({ to, suffix = "" }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const duration = 1500;
    const start = performance.now();
    let raf;
    const tick = (now) => {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setValue(Math.round(eased * to));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, to]);

  return (
    <span ref={ref}>
      {value.toLocaleString("en-IN")}
      {suffix}
    </span>
  );
}

const stats = [
  { to: 500, suffix: "+", label: "Toppers Mentored" },
  { to: 25000, suffix: "+", label: "Students Onboarded" },
  { to: 40, suffix: "+", label: "Expert Mentors" },
  { to: 98, suffix: "%", label: "Success Rate" },
];

const heroSlides = [
  {
    badge: "Level up your game",
    title: "Aimdeed:",
    titleAccent: "Inspire. Learn. Achieve.",
    subtitle:
      "Modern courses, proven results — join thousands who transformed their future with our expert guidance.",
    image:
      "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?q=80&w=2070&auto=format&fit=crop",
    primary: { label: "Explore Courses", to: "/studies", icon: "ri-arrow-right-line" },
    secondary: { label: "Contact Us", to: "/#contact", icon: null },
  },
  {
    badge: "Expert 1-on-1 Help",
    title: "Aimdeed NEET & JEE",
    titleAccent: "Mentorship",
    subtitle:
      "Dedicated mentors, small batches, and measurable progress tailored to your unique learning style.",
    image: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=1950&q=80",
    primary: { label: "Find a Mentor", to: "/mentor", icon: "ri-user-heart-line" },
    secondary: { label: "Meet Toppers", to: "/studies", icon: null },
  },
  {
    badge: "Real Success Stories",
    title: "Excellence in",
    titleAccent: "Real Outcomes",
    subtitle:
      "Top placements and record-breaking exam scores — see our success stories and build your own.",
    image: "https://images.unsplash.com/photo-1529070538774-1843cb3265df?auto=format&fit=crop&w=1950&q=80",
    primary: { label: "View Results", to: "/studies", icon: "ri-medal-line" },
    secondary: null,
  },
];

function ContactForm() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [status, setStatus] = useState(null);
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSending(true);
    setStatus(null);
    try {
      const data = await api.contact(form);
      setStatus({ type: "success", message: data.message });
      setForm({ name: "", email: "", message: "" });
    } catch (err) {
      setStatus({ type: "error", message: err.message });
    } finally {
      setSending(false);
      setTimeout(() => setStatus(null), 5000);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="row g-4">
      <div className="col-md-6">
        <label className="form-label-premium">Full Name</label>
        <div className="input-group">
          <span className="input-group-text bg-transparent border-end-0" style={{ borderColor: "var(--glass-border)" }}>
            <i className="ri-user-line"></i>
          </span>
          <input
            type="text"
            className="form-control form-control-glass border-start-0"
            placeholder="John Doe"
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </div>
      </div>
      <div className="col-md-6">
        <label className="form-label-premium">Email Address</label>
        <div className="input-group">
          <span className="input-group-text bg-transparent border-end-0" style={{ borderColor: "var(--glass-border)" }}>
            <i className="ri-mail-line"></i>
          </span>
          <input
            type="email"
            className="form-control form-control-glass border-start-0"
            placeholder="john@example.com"
            required
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
        </div>
      </div>
      <div className="col-12">
        <label className="form-label-premium">Your Message</label>
        <div className="input-group">
          <span
            className="input-group-text bg-transparent border-end-0 align-items-start pt-2"
            style={{ borderColor: "var(--glass-border)" }}
          >
            <i className="ri-message-2-line"></i>
          </span>
          <textarea
            className="form-control form-control-glass border-start-0"
            rows="5"
            placeholder="Tell us how we can help..."
            required
            value={form.message}
            onChange={(e) => setForm({ ...form, message: e.target.value })}
          />
        </div>
      </div>
      <div className="col-12 text-center mt-5">
        <button className="btn-premium px-5 py-3" type="submit" disabled={sending}>
          {sending ? "Sending..." : (
            <>
              Send Message <i className="ri-send-plane-fill ms-2"></i>
            </>
          )}
        </button>
      </div>
      {status && (
        <div className="col-12">
          <div
            className={`text-center mt-3 alert-glass ${
              status.type === "error" ? "alert-glass-error" : "alert-glass-success"
            }`}
          >
            {status.message}
          </div>
        </div>
      )}
    </form>
  );
}

export default function Home() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setActive((prev) => (prev + 1) % heroSlides.length), 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      {/* HERO */}
      <section className="hero-section">
        {heroSlides.map((slide, i) => (
          <div
            key={i}
            className="d-block w-100 h-100"
            style={{
              position: "absolute",
              inset: 0,
              opacity: i === active ? 1 : 0,
              transition: "opacity 1s ease",
            }}
          >
            <div className="hero-overlay"></div>
            <img
              src={slide.image}
              className="d-block w-100 h-100"
              style={{ objectFit: "cover" }}
              alt={slide.title}
            />
            <div
              className="carousel-caption hero-caption d-flex flex-column justify-content-center text-start h-100"
              style={{ zIndex: 2 }}
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={i === active ? "active" : `inactive-${i}`}
                  className="hero-content"
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.6, ease: EASE }}
                >
                  <div className="badge-premium mb-2" style={{ width: "fit-content" }}>
                    {slide.badge}
                  </div>
                  <h1
                    className="page-title text-start mb-0"
                    style={{ fontSize: "clamp(2.2rem, 6vw, 5rem)", lineHeight: 1.1 }}
                  >
                    {slide.title}
                    <br />
                    {slide.titleAccent}
                  </h1>
                  <p
                    className="hero-subtitle text-start ms-0 mb-3 text-white"
                    style={{ maxWidth: 550, fontSize: "clamp(0.9rem, 1.5vw, 1.1rem)" }}
                  >
                    {slide.subtitle}
                  </p>
                  <div className="d-flex flex-wrap gap-3">
                    <Link to={slide.primary.to} className="btn-premium">
                      {slide.primary.label}
                      {slide.primary.icon && <i className={slide.primary.icon}></i>}
                    </Link>
                    {slide.secondary && (
                      <Link to={slide.secondary.to} className="btn-outline-premium">
                        {slide.secondary.label}
                      </Link>
                    )}
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        ))}
        <div className="carousel-indicators" style={{ zIndex: 3 }}>
          {heroSlides.map((_, i) => (
            <button
              key={i}
              type="button"
              className={i === active ? "active" : ""}
              aria-label={`Slide ${i + 1}`}
              onClick={() => setActive(i)}
            ></button>
          ))}
        </div>
        <motion.div
          className="hero-scroll"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 1 }}
          aria-hidden="true"
        >
          <i className="ri-arrow-down-s-line"></i>
        </motion.div>
      </section>

      {/* STATS */}
      <section className="section" style={{ padding: "3.5rem 0" }}>
        <div className="container">
          <FadeIn>
            <div className="stats-grid">
              {stats.map((s) => (
                <div className="stat-item" key={s.label}>
                  <div className="stat-value">
                    <CountUp to={s.to} suffix={s.suffix} />
                  </div>
                  <div className="stat-label">{s.label}</div>
                </div>
              ))}
            </div>
          </FadeIn>
        </div>
      </section>

      {/* TOPPERS */}
      <section id="studies" className="section" style={{ background: "rgba(255,255,255,0.02)" }}>
        <div className="container">
          <FadeIn className="text-center mb-5">
            <div className="badge-premium mb-2">Hall of Fame</div>
            <h2 className="section-title mb-3">
              Meet Our{" "}
              <span style={{ background: "var(--gradient-primary)", WebkitBackgroundClip: "text", backgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                Toppers
              </span>
            </h2>
            <p className="section-subtitle mx-auto">
              Our exceptional students who are leading the way in NEET & JEE preparation.
            </p>
          </FadeIn>
          <FadeIn>
            <div className="topper-marquee">
              <div className="topper-marquee-track">
                {[0, 1].map((half) => (
                  <div className="topper-marquee-group" key={half} aria-hidden={half === 1}>
                    {studyData.map((s) => (
                      <motion.div
                        key={s.name}
                        whileHover={{ y: -8, scale: 1.03 }}
                        transition={{ duration: 0.3, ease: EASE }}
                      >
                        <div className="topper-card">
                          <img loading="lazy" className="student-img" src={s.image} alt={s.name} />
                          <div className="body">
                            <div className="title">{s.name}</div>
                            <div className="meta">{s.detail}</div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </FadeIn>
          <FadeIn className="text-center mt-5">
            <Link to="/studies" className="btn-premium">
              Explore AimDeed Studies <i className="ri-trophy-line ms-2"></i>
            </Link>
          </FadeIn>
        </div>
      </section>

      {/* FOUNDERS */}
      <section id="about" className="section">
        <div className="container">
          <div className="row g-5 align-items-center">
            <FadeIn
              className="col-lg-6"
              variants={{
                hidden: { opacity: 0, x: -40 },
                visible: { opacity: 1, x: 0, transition: { duration: 0.7, ease: EASE } },
              }}
            >
              <motion.div
                className="glass-card p-2"
                style={{ borderRadius: 30, overflow: "hidden" }}
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.4, ease: EASE }}
              >
                <img
                  src="/images/founders.jpg"
                  alt="Founders"
                  className="w-100 shadow-lg"
                  style={{ borderRadius: 22, maxHeight: 500, objectFit: "cover" }}
                  loading="lazy"
                />
              </motion.div>
            </FadeIn>
            <FadeIn
              className="col-lg-6"
              variants={{
                hidden: { opacity: 0, x: 40 },
                visible: { opacity: 1, x: 0, transition: { duration: 0.7, ease: EASE } },
              }}
            >
              <div className="about-content">
                <div className="badge-premium mb-3">Letter from Founders</div>
                <h2 className="section-title text-start mb-4">
                  Bridging the Gap Between <br />
                  <span style={{ color: "#818cf8" }}>Aimdeed & Your Success</span>
                </h2>
                <p className="text-white fs-5 lh-lg mb-4" style={{ opacity: 1 }}>
                  At AimDeed, we began with a simple observation: the gap between academic potential and
                  professional opportunity is far too wide. Currently, we are dedicated to helping students
                  navigate the rigors of JEE and NEET, empowering the next generation of doctors and engineers
                  with the grit and knowledge they need to succeed.
                </p>
                <p className="text-white fs-5 lh-lg mb-0" style={{ opacity: 1 }}>
                  Our vision is to fundamentally bridge the gap between education and employment. We aren't just
                  teaching students to pass tests; we are building an ecosystem that redefines the job market
                  through innovative placement models and a "campus-to-career" philosophy.
                </p>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* CONTACT */}
      <section
        id="contact"
        className="section"
        style={{ background: "radial-gradient(circle at center, rgba(79, 70, 229, 0.05), transparent)" }}
      >
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-lg-8">
              <FadeIn className="glass-card p-5">
                <div className="text-center mb-5">
                  <h2 className="section-title">
                    Get In <span style={{ color: "#38bdf8" }}>Touch</span>
                  </h2>
                  <p className="text-muted">Have specific questions? Our team is always here to help you.</p>
                </div>
                <ContactForm />
              </FadeIn>
            </div>
          </div>
        </div>
      </section>

      {/* SMART TOOLS */}
      <section className="section">
        <div className="container text-center">
          <FadeIn>
            <div className="badge-premium mb-3">Interactive Learning</div>
            <h2 className="section-title">
              Smart Preparation <span style={{ color: "#818cf8" }}>Tools</span>
            </h2>
            <p className="section-subtitle mx-auto mb-5">
              Harness the power of AI and data to streamline your exam journey.
            </p>
          </FadeIn>
          <Stagger className="row g-4 justify-content-center">
            <StaggerItem className="col-lg-5 col-md-6">
              <HoverLift>
                <Link to="/chatbot" className="glass-card text-decoration-none h-100 d-block p-5 border-hover" style={{ color: "inherit" }}>
                  <div
                    className="btn-premium mb-4"
                    style={{
                      width: 70,
                      height: 70,
                      padding: 0,
                      justifyContent: "center",
                      borderRadius: 20,
                      background: "linear-gradient(135deg, #4f46e5, #818cf8)",
                    }}
                  >
                    <i className="ri-robot-2-line fs-1"></i>
                  </div>
                  <h3 className="text-white mb-3">AI Academic Assistant</h3>
                  <p className="text-white fs-6" style={{ opacity: 0.8 }}>
                    Resolve your NEET & JEE doubts instantly with our advanced AI tutor, trained specifically for
                    board and entrance exams.
                  </p>
                  <span className="btn-outline-premium mt-3">
                    Try Chatbot <i className="ri-arrow-right-up-line"></i>
                  </span>
                </Link>
              </HoverLift>
            </StaggerItem>
            <StaggerItem className="col-lg-5 col-md-6">
              <HoverLift>
                <Link to="/predictor" className="glass-card text-decoration-none h-100 d-block p-5 border-hover" style={{ color: "inherit" }}>
                  <div
                    className="btn-premium mb-4"
                    style={{
                      width: 70,
                      height: 70,
                      padding: 0,
                      justifyContent: "center",
                      borderRadius: 20,
                      background: "linear-gradient(135deg, #0ea5e9, #38bdf8)",
                    }}
                  >
                    <i className="ri-ruler-2-line fs-1"></i>
                  </div>
                  <h3 className="text-white mb-3">JEE Rank Predictor</h3>
                  <p className="text-white fs-6" style={{ opacity: 0.8 }}>
                    Get an accurate estimation of your JEE Mains & Advanced rank based on current session trends
                    and historical data.
                  </p>
                  <span className="btn-outline-premium mt-3">
                    Predict Now <i className="ri-medal-line"></i>
                  </span>
                </Link>
              </HoverLift>
            </StaggerItem>
          </Stagger>
        </div>
      </section>

      {/* ADVANTAGES */}
      <section className="section">
        <div className="container">
          <Stagger className="row g-4">
            <StaggerItem className="col-lg-3 col-md-6">
              <HoverLift className="h-100">
                <div className="glass-card h-100">
                  <div
                    className="btn-premium mb-3"
                    style={{ width: 50, height: 50, padding: 0, justifyContent: "center", borderRadius: 15 }}
                  >
                    <i className="ri-customer-service-2-line fs-4"></i>
                  </div>
                  <h4 className="mb-3">24/7 Support</h4>
                  <p className="text-white small mb-0" style={{ opacity: 0.8 }}>
                    Our mentors are available around the clock because doubts don't wait for office hours.
                  </p>
                </div>
              </HoverLift>
            </StaggerItem>
            <StaggerItem className="col-lg-3 col-md-6">
              <HoverLift className="h-100">
                <div className="glass-card h-100">
                  <div
                    className="btn-premium mb-3"
                    style={{
                      width: 50,
                      height: 50,
                      padding: 0,
                      justifyContent: "center",
                      borderRadius: 15,
                      background: "linear-gradient(135deg, #14b8a6, #0f766e)",
                    }}
                  >
                    <i className="ri-timer-flash-line fs-4"></i>
                  </div>
                  <h4 className="mb-3">7-Second Rule</h4>
                  <p className="text-white small mb-0" style={{ opacity: 0.8 }}>
                    We strive for instantaneous support systems to ensure your study momentum never breaks.
                  </p>
                </div>
              </HoverLift>
            </StaggerItem>
            <StaggerItem className="col-lg-3 col-md-6">
              <HoverLift className="h-100">
                <div className="glass-card h-100">
                  <div
                    className="btn-premium mb-3"
                    style={{
                      width: 50,
                      height: 50,
                      padding: 0,
                      justifyContent: "center",
                      borderRadius: 15,
                      background: "linear-gradient(135deg, #6366f1, #4338ca)",
                    }}
                  >
                    <i className="ri-bar-chart-box-line fs-4"></i>
                  </div>
                  <h4 className="mb-3">Periodic Reviews</h4>
                  <p className="text-white small mb-0" style={{ opacity: 0.8 }}>
                    Daily tracking, weekly assessments, and monthly deep-dives into your performance layers.
                  </p>
                </div>
              </HoverLift>
            </StaggerItem>
            <StaggerItem className="col-lg-3 col-md-6">
              <HoverLift className="h-100">
                <div className="glass-card h-100">
                  <div
                    className="btn-premium mb-3"
                    style={{
                      width: 50,
                      height: 50,
                      padding: 0,
                      justifyContent: "center",
                      borderRadius: 15,
                      background: "linear-gradient(135deg, #0ea5e9, #0284c7)",
                    }}
                  >
                    <i className="ri-road-map-line fs-4"></i>
                  </div>
                  <h4 className="mb-3">Career Roadmap</h4>
                  <p className="text-white small mb-0" style={{ opacity: 0.8 }}>
                    From the first day of coaching to your first high-impact career placement, we guide the way.
                  </p>
                </div>
              </HoverLift>
            </StaggerItem>
          </Stagger>
        </div>
      </section>

      {/* CTA */}
      <section className="section">
        <div className="container">
          <FadeIn>
            <div className="cta-banner">
              <div className="badge-premium mb-3" style={{ position: "relative", zIndex: 1 }}>
                Your Journey Starts Here
              </div>
              <h2 className="section-title mb-3" style={{ position: "relative", zIndex: 1 }}>
                Ready to <span className="text-gradient">Crack NEET & JEE?</span>
              </h2>
              <p
                className="section-subtitle mx-auto mb-4"
                style={{ position: "relative", zIndex: 1 }}
              >
                Join thousands of aspirants who trust Aimdeed for mentorship, premium material and
                data-driven guidance.
              </p>
              <div
                className="d-flex flex-wrap justify-content-center gap-3"
                style={{ position: "relative", zIndex: 1 }}
              >
                <Link to="/signup" className="btn-premium">
                  Get Started Free <i className="ri-arrow-right-line"></i>
                </Link>
                <Link to="/mentor" className="btn-outline-premium">
                  Find a Mentor
                </Link>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>
    </>
  );
}
