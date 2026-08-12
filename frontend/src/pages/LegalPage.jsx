import { FadeIn } from "../components/motion";

function LegalPage({ badge, title, children }) {
  return (
    <>
      <section className="page-hero">
        <div className="container">
          <FadeIn>
            <div className="badge-premium mb-3">{badge}</div>
            <h1 className="page-title">{title}</h1>
            <p className="page-subtitle">Last Updated: March 14, 2026</p>
          </FadeIn>
        </div>
      </section>
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-lg-8">
              <FadeIn className="glass-card content-area">{children}</FadeIn>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

export default LegalPage;
