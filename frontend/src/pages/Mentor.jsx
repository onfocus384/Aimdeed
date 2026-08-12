import { useState } from "react";
import { FadeIn } from "../components/motion";

const GOOGLE_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbzHb4c98lyAsQFd45R4qzISifja1OOjmY2S1H5-rrhw7t5fRbHCIujYUetVy-TIJkQx/exec";

const initialForm = {
  name: "",
  gender: "",
  email: "",
  phone: "",
  school: "",
  class: "",
  city: "",
  district: "",
  state: "",
  career_goal: "",
  study_time: "",
  reason: "",
};

function getValidationError(data) {
  if (!data.name || data.name.length < 2) return "Please enter your full name (at least 2 characters).";
  if (!data.gender) return "Please select your gender.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) return "Please enter a valid email address.";
  if (!/^\d{10}$/.test(data.phone)) return "Please enter a valid 10-digit phone number.";
  if (!data.school || data.school.length < 2) return "Please enter your school name.";
  const cls = Number(data.class);
  if (!cls || cls < 1 || cls > 12) return "Class must be between 1 and 12.";
  if (!data.city || data.city.length < 2) return "Please enter your village/city.";
  if (!data.district || data.district.length < 2) return "Please enter your district.";
  if (!data.state || data.state.length < 2) return "Please enter your state.";
  if (!data.career_goal || data.career_goal.length < 5) return "Please describe your career goal.";
  if (!data.study_time) return "Please select your daily study hours.";
  if (!data.reason || data.reason.length < 2) return "Please tell us why you chose us.";
  return null;
}

export default function Mentor() {
  const [form, setForm] = useState(initialForm);
  const [status, setStatus] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus(null);

    const error = getValidationError(form);
    if (error) {
      setStatus({ type: "error", message: error });
      return;
    }

    setSubmitting(true);

    try {
      const params = new URLSearchParams({
        ...form,
        class_num: form.class,
      });

      await fetch(GOOGLE_SCRIPT_URL, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: params,
      });

      setStatus({
        type: "success",
        message: "Your mentor application was submitted successfully! We will contact you soon.",
      });
      setForm(initialForm);
    } catch {
      setStatus({ type: "error", message: "Something went wrong. Please try again." });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <section className="page-hero">
        <div className="container">
          <FadeIn>
            <div className="badge-premium mb-3">Expert Guidance</div>
            <h1 className="page-title">Get a Personal Mentor</h1>
            <p className="page-subtitle">
              Ready to excel? Fill out the form below and we'll match you with the perfect mentor for your journey.
            </p>
          </FadeIn>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-lg-8">
              <FadeIn className="glass-card">
                {status && (
                  <div
                    className={`alert-glass mb-4 ${
                      status.type === "error" ? "alert-glass-error" : "alert-glass-success"
                    }`}
                  >
                    {status.type === "error" ? (
                      <>
                        <i className="ri-alert-line me-2"></i>
                        {status.message}
                      </>
                    ) : (
                      <>
                        <i className="ri-checkbox-circle-line me-2"></i>
                        {status.message}
                      </>
                    )}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label-premium">Full Name</label>
                    <input type="text" className="form-control form-control-glass" value={form.name} onChange={set("name")} required />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label-premium">Gender</label>
                    <select className="form-select form-control-glass" value={form.gender} onChange={set("gender")} required>
                      <option value="">Select...</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label-premium">Email Address</label>
                    <input type="email" className="form-control form-control-glass" placeholder="you@example.com" value={form.email} onChange={set("email")} required />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label-premium">Contact Number</label>
                    <input type="tel" className="form-control form-control-glass" placeholder="+91 00000 00000" value={form.phone} onChange={set("phone")} required />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label-premium">School Name</label>
                    <input type="text" className="form-control form-control-glass" value={form.school} onChange={set("school")} required />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label-premium">Class</label>
                    <input type="number" min="1" max="12" className="form-control form-control-glass" value={form.class} onChange={set("class")} required />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label-premium">Village / City</label>
                    <input type="text" className="form-control form-control-glass" value={form.city} onChange={set("city")} required />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label-premium">District</label>
                    <input type="text" className="form-control form-control-glass" value={form.district} onChange={set("district")} required />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label-premium">State</label>
                    <input type="text" className="form-control form-control-glass" value={form.state} onChange={set("state")} required />
                  </div>
                  <div className="col-12">
                    <label className="form-label-premium">Future career goal</label>
                    <textarea rows="2" className="form-control form-control-glass" value={form.career_goal} onChange={set("career_goal")} required></textarea>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label-premium">Study Hours Daily</label>
                    <select className="form-select form-control-glass" value={form.study_time} onChange={set("study_time")} required>
                      <option value="">Select...</option>
                      <option value="Less than 2 hours">Less than 2 hours</option>
                      <option value="2-4 hours">2-4 hours</option>
                      <option value="4-8 hours">4-8 hours</option>
                      <option value="More than 8 hours">More than 8 hours</option>
                    </select>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label-premium">Why did you choose us?</label>
                    <input type="text" className="form-control form-control-glass" placeholder="e.g. Referral, Social Media..." value={form.reason} onChange={set("reason")} required />
                  </div>
                  <div className="col-12 text-center mt-4">
                    <button className="btn-premium px-5 py-3" type="submit" disabled={submitting}>
                      {submitting ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2"></span> Submitting...
                        </>
                      ) : (
                        <>
                          Submit My Application <i className="ri-send-plane-fill ms-2"></i>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </FadeIn>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
