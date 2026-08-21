import { useState } from "react";
import GeoSelector from "../components/GeoSelector";
import AnalysisPanel from "../components/AnalysisPanel";
import SignalCityScene from "../components/SignalCityScene";
import { createConsultationRequest } from "../services/consultationApi";
import "./ProjectHome.css";
import "./HomeConsultation.css";

const problemPoints = [
  "Property decisions are still made from scattered broker inputs, outdated reports, and emotional price expectations.",
  "Students, analysts, and small investors struggle to compare micro-markets with a consistent risk framework.",
  "Fast-growing corridors change quickly, but most tools do not combine demand, infrastructure, supply pressure, and builder reliability.",
];

const solutionSteps = [
  {
    title: "Collect Signals",
    text: "The platform organizes local market inputs such as connectivity, infrastructure progress, search heat, supply pressure, and builder execution.",
  },
  {
    title: "Score Markets",
    text: "A rule-based scoring engine converts raw indicators into capital allocation scores, confidence bands, risk deductions, and trend views.",
  },
  {
    title: "Support Decisions",
    text: "Dashboards help users compare areas, review investor activity, update analyst inputs, and prepare cleaner market research.",
  },
];

const modules = [
  "Area intelligence and allocation scoring",
  "City and micro-market comparison",
  "Investor dashboard for capital-flow analysis",
  "Enterprise workbench for risk and memo generation",
  "Admin console for staff access and analyst inputs",
  "Consultation capture for real users or project demos",
];

export default function Home() {
  const [selection, setSelection] = useState({
    country: null,
    state: null,
    city: null,
    area: null,
  });
  const [isConsultOpen, setIsConsultOpen] = useState(false);
  const [consultLoading, setConsultLoading] = useState(false);
  const [consultError, setConsultError] = useState("");
  const [consultSuccess, setConsultSuccess] = useState("");
  const [consultForm, setConsultForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    company: "",
    role: "",
    interest: "",
    preferred_date: "",
    preferred_time: "",
    message: "",
  });

  function scrollToId(targetId) {
    const el = document.getElementById(targetId);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function goToAdmin() {
    window.location.assign("/admin");
  }

  function openConsultation() {
    setConsultError("");
    setConsultSuccess("");
    setIsConsultOpen(true);
  }

  function closeConsultation() {
    setIsConsultOpen(false);
  }

  function updateConsultField(field, value) {
    setConsultForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleConsultSubmit(e) {
    e.preventDefault();
    if (!consultForm.full_name.trim() || !consultForm.email.trim() || !consultForm.interest.trim()) {
      setConsultError("Please fill Name, Email, and Consultation Type.");
      return;
    }

    try {
      setConsultLoading(true);
      setConsultError("");
      setConsultSuccess("");
      await createConsultationRequest({
        ...consultForm,
        full_name: consultForm.full_name.trim(),
        email: consultForm.email.trim(),
        phone: consultForm.phone.trim(),
        company: consultForm.company.trim(),
        role: consultForm.role.trim(),
        interest: consultForm.interest.trim(),
        preferred_date: consultForm.preferred_date.trim(),
        preferred_time: consultForm.preferred_time.trim(),
        message: consultForm.message.trim(),
      });
      setConsultSuccess("Consultation request submitted. Our team will contact you shortly.");
      setConsultForm({
        full_name: "",
        email: "",
        phone: "",
        company: "",
        role: "",
        interest: "",
        preferred_date: "",
        preferred_time: "",
        message: "",
      });
    } catch (err) {
      setConsultError(err.message || "Could not submit request");
    } finally {
      setConsultLoading(false);
    }
  }

  return (
    <div className="page project-home">
      <header className="site-header project-header">
        <div className="header-shell">
          <div className="brand">
            <span className="brand-mark">R</span>
            <div>
              <p className="brand-title">Real Estate Signal Stack</p>
              <p className="brand-subtitle">Final Year Major Project</p>
            </div>
          </div>

          <nav className="nav">
            <a href="#problem">Problem</a>
            <a href="#solution">Solution</a>
            <a href="#modules">Modules</a>
            <a href="#platform">Live Demo</a>
            <a href="/pricing">Access</a>
          </nav>

          <div className="header-actions">
            <button className="btn ghost" onClick={goToAdmin}>
              Admin Access
            </button>
            <button className="btn primary" onClick={() => scrollToId("platform")}>
              Explore Demo
            </button>
          </div>
        </div>
      </header>

      <main>
        <section className="project-hero" id="top">
          <SignalCityScene mode="hero" />
          <div className="hero-scrim" />
          <div className="project-hero-shell">
            <div className="project-hero-copy">
              <p className="eyebrow">Data Analytics + Real Estate Decision Support</p>
              <h1>Real Estate Signal Stack</h1>
              <p className="lead">
                A web-based intelligence system that helps compare property markets using risk,
                growth, demand, infrastructure, and investment-readiness signals.
              </p>
              <div className="project-hero-actions">
                <button className="btn primary" onClick={() => scrollToId("problem")}>
                  Understand the Problem
                </button>
                <button className="btn ghost ghost-on-dark" onClick={() => scrollToId("platform")}>
                  Open Live Analysis
                </button>
              </div>
              <div className="project-meta-strip">
                <span>Final Year Major Project</span>
                <span>React + FastAPI + SQLite</span>
                <span>Real Estate Analytics</span>
              </div>
            </div>
          </div>
          <div className="scroll-cue">
            <span>Scroll</span>
            <i />
          </div>
        </section>

        <section className="project-section project-problem" id="problem">
          <div className="project-section-shell split">
            <div>
              <p className="eyebrow">Real Life Problem</p>
              <h2>Real estate choices need data, but the data is fragmented.</h2>
              <p>
                Buyers, investors, and analysts often compare locations through hearsay, manual
                spreadsheets, and disconnected market reports. This makes it difficult to identify
                which area is genuinely improving, which one carries supply risk, and where capital
                should be deployed with confidence.
              </p>
            </div>
            <div className="problem-list">
              {problemPoints.map((point) => (
                <article className="problem-item" key={point}>
                  <span />
                  <p>{point}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="project-section project-solution" id="solution">
          <div className="project-section-shell">
            <div className="section-header">
              <p className="eyebrow">How We Solve It</p>
              <h2>We convert market noise into comparable real-estate signals.</h2>
              <p>
                The website acts like an intelligence desk: it gathers indicators, applies scoring
                logic, separates risk from opportunity, and presents the result through dashboards
                that are easy to explain during review.
              </p>
            </div>
            <div className="solution-flow">
              {solutionSteps.map((step, index) => (
                <article className="solution-step" key={step.title}>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <h3>{step.title}</h3>
                  <p>{step.text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="project-visual-band">
          <div className="visual-copy">
            <p className="eyebrow">System View</p>
            <h2>From locality data to investment-ready dashboards.</h2>
            <p>
              The 3D city model represents how the project connects demand, risk, infrastructure,
              and capital-flow layers into one visual decision system.
            </p>
          </div>
          <SignalCityScene mode="band" />
        </section>

        <section className="project-section" id="modules">
          <div className="project-section-shell split">
            <div>
              <p className="eyebrow">What the Website Does</p>
              <h2>A complete project, not just a static presentation.</h2>
              <p>
                The application includes a public introduction, protected staff access, scoring APIs,
                analyst tools, enterprise views, and a working frontend that consumes backend data.
              </p>
            </div>
            <div className="module-grid">
              {modules.map((module) => (
                <div className="module-pill" key={module}>
                  {module}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="project-section demo-section" id="platform">
          <div className="section-header">
            <p className="eyebrow">Live Demo</p>
            <h2>Try the core market-analysis engine.</h2>
            <p>
              Select a geography and review the same signal output used across the platform. The
              rest of the dashboards remain available through staff access.
            </p>
          </div>
          <div className="signal-grid">
            <div className="signal-controls">
              <div className="card">
                <h3>Market Scope</h3>
                <p>Select a geography to activate the live signal suite.</p>
                <GeoSelector selection={selection} onChange={setSelection} />
              </div>
              <div className="card contact-card" id="contact">
                <h3>Project Contact</h3>
                <p>Use this for demo inquiries, testing the public form, or project evaluation.</p>
                <div className="contact-list">
                  <div>
                    <span className="contact-label">Email</span>
                    <span>niharlakhani2@gmail.com</span>
                  </div>
                  <div>
                    <span className="contact-label">Phone</span>
                    <span>+91 9834241892</span>
                  </div>
                  <div>
                    <span className="contact-label">Location</span>
                    <span>Pune, India</span>
                  </div>
                </div>
                <button className="btn primary full" onClick={openConsultation}>
                  Test Consultation Form
                </button>
              </div>
            </div>
            <div className="signal-panel">
              <div className="panel-shell">
                <AnalysisPanel selection={selection} />
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="site-footer project-footer">
        <div className="footer-shell">
          <div>
            <p className="footer-title">Real Estate Signal Stack</p>
            <p>Final year major project for real-estate analytics and decision support.</p>
          </div>
          <div className="footer-columns">
            <div>
              <p className="footer-heading">Stack</p>
              <p>React, Vite, FastAPI, SQLite</p>
            </div>
            <div>
              <p className="footer-heading">Focus</p>
              <p>Market scoring</p>
              <p>Risk intelligence</p>
            </div>
            <div>
              <p className="footer-heading">Demo</p>
              <p>Dashboards and admin tools are preserved.</p>
            </div>
          </div>
        </div>
        <div className="footer-base">
          <p>2026 Real Estate Signal Stack.</p>
          <p>Academic project introduction and live system demo.</p>
        </div>
      </footer>

      {isConsultOpen && (
        <div className="consult-modal-backdrop" onClick={closeConsultation}>
          <div className="consult-modal" onClick={(e) => e.stopPropagation()}>
            <div className="consult-modal-head">
              <div>
                <h3>Test Consultation Form</h3>
                <p>Submit a sample request to demonstrate public lead capture.</p>
              </div>
              <button className="consult-modal-close" type="button" onClick={closeConsultation}>
                x
              </button>
            </div>

            <form className="consult-form" onSubmit={handleConsultSubmit}>
              <div className="consult-grid">
                <input
                  placeholder="Full Name *"
                  value={consultForm.full_name}
                  onChange={(e) => updateConsultField("full_name", e.target.value)}
                  required
                />
                <input
                  type="email"
                  placeholder="Email *"
                  value={consultForm.email}
                  onChange={(e) => updateConsultField("email", e.target.value)}
                  required
                />
                <input
                  placeholder="Phone"
                  value={consultForm.phone}
                  onChange={(e) => updateConsultField("phone", e.target.value)}
                />
                <input
                  placeholder="College / Company"
                  value={consultForm.company}
                  onChange={(e) => updateConsultField("company", e.target.value)}
                />
                <input
                  placeholder="Role"
                  value={consultForm.role}
                  onChange={(e) => updateConsultField("role", e.target.value)}
                />
                <select
                  value={consultForm.interest}
                  onChange={(e) => updateConsultField("interest", e.target.value)}
                  required
                >
                  <option value="">Request Type *</option>
                  <option value="Project Demo">Project Demo</option>
                  <option value="Market Intelligence Brief">Market Intelligence Brief</option>
                  <option value="Technical Review">Technical Review</option>
                  <option value="General Inquiry">General Inquiry</option>
                </select>
                <input
                  type="date"
                  value={consultForm.preferred_date}
                  onChange={(e) => updateConsultField("preferred_date", e.target.value)}
                />
                <input
                  placeholder="Preferred Time"
                  value={consultForm.preferred_time}
                  onChange={(e) => updateConsultField("preferred_time", e.target.value)}
                />
              </div>

              <textarea
                placeholder="Message"
                value={consultForm.message}
                onChange={(e) => updateConsultField("message", e.target.value)}
              />

              <p className="consult-inline-note">Fields marked with * are required.</p>

              {consultError && <div className="consult-error">{consultError}</div>}
              {consultSuccess && <div className="consult-success">{consultSuccess}</div>}

              <div className="consult-submit-row">
                <button className="btn ghost" type="button" onClick={closeConsultation}>
                  Cancel
                </button>
                <button className="btn primary" type="submit" disabled={consultLoading}>
                  {consultLoading ? "Submitting..." : "Submit Request"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
