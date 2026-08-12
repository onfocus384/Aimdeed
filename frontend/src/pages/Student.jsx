import { motion, EASE, FadeIn, Stagger, StaggerItem } from "../components/motion";

const cards = [
  {
    title: "Class IX",
    desc: "Foundation building for future champions.",
    image: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=800&q=80",
    to: "/Books/class9.html",
    badge: null,
  },
  {
    title: "Class X",
    desc: "Board exam excellence starts here.",
    image: "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=800&q=80",
    to: "/Books/class10.html",
    badge: null,
  },
  {
    title: "Class XI",
    desc: "NEET & JEE foundation for serious aspirants.",
    image: "https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?auto=format&fit=crop&w=800&q=80",
    to: "/Books/class11.html",
    badge: null,
  },
  {
    title: "Class XII",
    desc: "Board + competitive integration made simple.",
    image: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=800&q=80",
    to: "/Books/class12.html",
    badge: null,
  },
  {
    title: "IIT-JEE",
    desc: "Premium preparation for JEE Main & Advanced.",
    image: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=800&q=80",
    to: "/Books/iit.html",
    badge: { label: "Pro", color: "#6366f1" },
  },
  {
    title: "NEET",
    desc: "Medical entrance preparation with care.",
    image: "https://images.unsplash.com/photo-1532938911079-1b06ac7ceec7?auto=format&fit=crop&w=800&q=80",
    to: "/Books/neet.html",
    badge: { label: "Pro", color: "#0ea5e9" },
  },
];

export default function Student() {
  return (
    <>
      <section className="page-hero">
        <div className="container">
          <FadeIn>
            <div className="badge-premium mb-3">Resource Center</div>
            <h1 className="page-title">Study Materials</h1>
            <p className="page-subtitle">
              Select your class or target exam to access premium notes, practice papers, and video solutions.
            </p>
          </FadeIn>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <Stagger className="row g-4">
            {cards.map((c) => (
              <StaggerItem className="col-lg-4 col-md-6" key={c.title}>
                <motion.a
                  href={c.to}
                  className="glass-card d-block h-100 border-hover"
                  style={{ color: "inherit", position: "relative", overflow: "hidden", padding: 0 }}
                  whileHover={{ y: -8 }}
                  transition={{ duration: 0.3, ease: EASE }}
                >
                  <div style={{ height: 180, overflow: "hidden", borderRadius: "20px 20px 0 0" }}>
                    <motion.img
                      src={c.image}
                      alt={c.title}
                      loading="lazy"
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      whileHover={{ scale: 1.1 }}
                      transition={{ duration: 0.35, ease: EASE }}
                    />
                  </div>
                  {c.badge && (
                    <span
                      className="badge-premium"
                      style={{
                        position: "absolute",
                        top: 12,
                        right: 12,
                        background: c.badge.color,
                        color: "#fff",
                        border: "none",
                      }}
                    >
                      {c.badge.label}
                    </span>
                  )}
                  <div className="p-4">
                    <h4 className="mb-2">{c.title}</h4>
                    <p className="text-white mb-0" style={{ opacity: 0.8 }}>
                      {c.desc}
                    </p>
                  </div>
                </motion.a>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>
    </>
  );
}
