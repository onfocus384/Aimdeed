import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FadeIn, Stagger, StaggerItem, HoverLift } from "../components/motion";

const slides = [
  {
    image:
      "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=900&q=80",
    text: "Success is the sum of small efforts repeated day in and day out.",
  },
  {
    image:
      "https://images.unsplash.com/photo-1543269865-cbf427effbad?auto=format&fit=crop&w=900&q=80",
    text: "The secret of getting ahead is getting started.",
  },
  {
    image:
      "https://images.unsplash.com/photo-1509869175650-a1d97972541a?auto=format&fit=crop&w=900&q=80",
    text: "Don't watch the clock; do what it does. Keep going.",
  },
  {
    image:
      "https://images.unsplash.com/photo-1498243691581-b145c3f54a5a?auto=format&fit=crop&w=900&q=80",
    text: "Your only limit is your mind.",
  },
  {
    image:
      "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=900&q=80",
    text: "The future belongs to those who believe in the beauty of their dreams.",
  },
  {
    image:
      "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=900&q=80",
    text: "It always seems impossible until it's done.",
  },
];

const resources = [
  {
    title: "Premium Notes",
    desc: "Concise, exam-oriented notes crafted by toppers and mentors.",
    icon: "ri-book-open-line",
    color: "#3b82f6",
    to: "/student",
  },
  {
    title: "Mock Tests",
    desc: "Real-exam experience with timed tests and instant analysis.",
    icon: "ri-edit-box-line",
    color: "#14b8a6",
    to: "#",
  },
  {
    title: "PYQ Archive",
    desc: "Previous year questions organized topic-wise with solutions.",
    icon: "ri-history-line",
    color: "#8b5cf6",
    to: "#",
  },
  {
    title: "Mentorship",
    desc: "Get matched with a personal mentor for 1-on-1 guidance.",
    icon: "ri-user-star-line",
    color: "#22c55e",
    to: "/mentor",
  },
  {
    title: "Rank Predictor",
    desc: "Predict your JEE rank and matching colleges from JOSAA data.",
    icon: "ri-ruler-2-line",
    color: "#f97316",
    to: "/predictor",
  },
  {
    title: "AI Assistant",
    desc: "24/7 AI tutor to clear your doubts at any hour.",
    icon: "ri-robot-2-line",
    color: "#6366f1",
    to: "/chatbot",
  },
];

const TYPED_TEXT = "Your Ultimate Guide to NEET & JEE Success!";

function Typewriter() {
  const [text, setText] = useState("");

  useEffect(() => {
    let i = 0;
    const timeout = setTimeout(() => {
      const interval = setInterval(() => {
        i += 1;
        setText(TYPED_TEXT.slice(0, i));
        if (i >= TYPED_TEXT.length) clearInterval(interval);
      }, 100);
      return () => clearInterval(interval);
    }, 500);
    return () => clearTimeout(timeout);
  }, []);

  return (
    <h1 className="page-title typewriter-title">
      {text}
      <span className="typing-cursor"></span>
    </h1>
  );
}

export default function Studies() {
  return (
    <>
      {/* HERO */}
      <section
        className="page-hero"
        style={{ minHeight: "70vh", display: "flex", alignItems: "center" }}
      >
        <div className="container text-center">
          <FadeIn>
            <div className="badge-premium mb-3">Elevate Your Preparation</div>
          </FadeIn>
          <FadeIn>
            <Typewriter />
          </FadeIn>
          <FadeIn>
            <p className="page-subtitle mx-auto mb-4">
              Premium study materials, mock tests, PYQs and expert mentorship — everything you need for a
              focused NEET & JEE journey.
            </p>
          </FadeIn>
          <FadeIn className="d-flex flex-wrap gap-3 justify-content-center">
            <a href="#resources" className="btn-premium">
              Explore Materials <i className="ri-arrow-right-line"></i>
            </a>
            <Link to="/login" className="btn-outline-premium">
              Start Free Trial
            </Link>
          </FadeIn>
        </div>
      </section>

      {/* RESOURCES */}
      <section id="resources" className="section">
        <div className="container">
          <FadeIn className="text-center mb-5">
            <div className="badge-premium mb-2">Everything You Need</div>
            <h2 className="section-title">A Complete Ecosystem for Your Exam Journey</h2>
          </FadeIn>
          <Stagger className="row g-4">
            {resources.map((r) => (
              <StaggerItem className="col-lg-4 col-md-6" key={r.title}>
                {r.to === "#" ? (
                  <div className="glass-card h-100">
                    <div
                      className="btn-premium mb-3"
                      style={{ width: 55, height: 55, padding: 0, justifyContent: "center", borderRadius: 15, background: r.color }}
                    >
                      <i className={`${r.icon} fs-4`}></i>
                    </div>
                    <h4 className="mb-2">{r.title}</h4>
                    <p className="text-white mb-0" style={{ opacity: 0.8 }}>
                      {r.desc}
                    </p>
                  </div>
                ) : (
                  <Link to={r.to} className="glass-card h-100 d-block border-hover" style={{ color: "inherit" }}>
                    <div
                      className="btn-premium mb-3"
                      style={{ width: 55, height: 55, padding: 0, justifyContent: "center", borderRadius: 15, background: r.color }}
                    >
                      <i className={`${r.icon} fs-4`}></i>
                    </div>
                    <h4 className="mb-2">{r.title}</h4>
                    <p className="text-white mb-0" style={{ opacity: 0.8 }}>
                      {r.desc}
                    </p>
                  </Link>
                )}
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      {/* MARQUEE SLIDER */}
      <section className="section">
        <div className="container-fluid px-0">
          <FadeIn className="text-center mb-5">
            <div className="badge-premium mb-2">Daily Motivation</div>
            <h2 className="section-title">Keep Going</h2>
          </FadeIn>
          <div className="scroll-track" style={{ paddingLeft: "1rem", paddingRight: "1rem" }}>
            {[...slides, ...slides].map((s, i) => (
              <div key={i} className="topper-card" style={{ width: 300, height: 200, position: "relative" }}>
                <img src={s.image} alt="Motivation" style={{ width: "100%", height: "100%", objectFit: "cover" }} loading="lazy" />
                <div
                  className="d-flex align-items-end"
                  style={{
                    position: "absolute",
                    inset: 0,
                    background: "linear-gradient(to top, rgba(15,23,42,0.9), transparent)",
                    padding: "1rem",
                  }}
                >
                  <p className="mb-0 text-white" style={{ fontSize: "0.95rem", lineHeight: 1.5 }}>
                    "{s.text}"
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* VIDEO + QUOTE */}
      <section className="section">
        <div className="container">
          <div className="row g-4 align-items-center">
            <FadeIn
              className="col-lg-6"
              variants={{
                hidden: { opacity: 0, x: -40 },
                visible: { opacity: 1, x: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } },
              }}
            >
              <div className="glass-card p-2" style={{ borderRadius: 24, overflow: "hidden" }}>
                <video
                  src="/images/coverVideo.mp4"
                  controls
                  autoPlay
                  loop
                  muted
                  playsInline
                  style={{ width: "100%", borderRadius: 18 }}
                />
              </div>
            </FadeIn>
            <FadeIn
              className="col-lg-6"
              variants={{
                hidden: { opacity: 0, x: 40 },
                visible: { opacity: 1, x: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } },
              }}
            >
              <div className="glass-card">
                <div className="badge-premium mb-3">Daily Motivation</div>
                <blockquote className="fs-4 mb-3" style={{ lineHeight: 1.6 }}>
                  "If you think yourselves strong, strong you will be!"
                </blockquote>
                <p className="text-muted mb-4">— Swami Vivekananda</p>
                <Link to="/mentor" className="btn-premium">
                  Connect with a Mentor <i className="ri-user-heart-line ms-2"></i>
                </Link>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* ABOUT */}
      <section id="about" className="section">
        <div className="container">
          <div className="row g-5 align-items-center">
            <FadeIn className="col-lg-6">
              <div className="glass-card p-2" style={{ borderRadius: 24, overflow: "hidden", position: "relative" }}>
                <img
                  src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1200&q=80"
                  alt="Students"
                  className="w-100"
                  style={{ borderRadius: 18, height: 350, objectFit: "cover" }}
                  loading="lazy"
                />
                <div
                  className="glass-card"
                  style={{
                    position: "absolute",
                    bottom: 20,
                    left: 20,
                    right: 20,
                    padding: "1rem 1.5rem",
                    borderRadius: 16,
                  }}
                >
                  <h4 className="mb-0">
                    <i className="ri-group-line me-2" style={{ color: "#38bdf8" }}></i>10k+ Active Students
                  </h4>
                </div>
              </div>
            </FadeIn>
            <FadeIn className="col-lg-6">
              <div className="badge-premium mb-3">Our Story</div>
              <h2 className="section-title text-start mb-4">Who We Are</h2>
              <p className="text-white fs-6 lh-lg" style={{ opacity: 0.85 }}>
                Aimdeed was founded with a mission to make world-class NEET & JEE preparation accessible to
                every student, regardless of background. We combine expert mentorship with data-driven tools
                and premium materials to give every student a fair shot at their dream college.
              </p>
              <p className="text-white fs-6 lh-lg" style={{ opacity: 0.85 }}>
                Our mentors are IITians, doctors, and top scorers who understand exactly what it takes to crack
                the toughest exams in the country — because they've done it themselves.
              </p>
            </FadeIn>
          </div>
        </div>
      </section>
    </>
  );
}
