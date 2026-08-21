import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ENTERPRISE_FEATURES = [
  "City heatmaps",
  "Risk scoring",
  "Stress modeling",
  "Portfolio allocation simulator",
  "Developer risk database",
  "IC memo automation",
  "API access",
  "Custom advisory layer",
];

export default function Pricing() {
  const navigate = useNavigate();
  const {
    isAuthenticated,
    role,
    subscriptionUnlocked,
    subscriptionMethod,
    unlockWithDemoPaypal,
    unlockWithReferralCode,
  } = useAuth();
  const [showPaymentPanel, setShowPaymentPanel] = useState(false);
  const [referralCode, setReferralCode] = useState("");
  const [paymentMessage, setPaymentMessage] = useState("");

  const canAccessEnterprise = role === "admin" || subscriptionUnlocked;

  function handlePaypalDemo() {
    if (!isAuthenticated) {
      navigate("/admin");
      return;
    }
    if (role !== "admin") {
      setPaymentMessage("Login as Admin to unlock this plan.");
      return;
    }
    unlockWithDemoPaypal();
    setPaymentMessage("PayPal demo payment complete. Enterprise subscription unlocked.");
  }

  function handleReferralUnlock() {
    if (!isAuthenticated) {
      navigate("/admin");
      return;
    }
    if (role !== "admin") {
      setPaymentMessage("Login as Admin to apply referral unlock.");
      return;
    }
    try {
      unlockWithReferralCode(referralCode);
      setPaymentMessage("Referral code accepted. Enterprise subscription unlocked.");
      setReferralCode("");
    } catch (err) {
      setPaymentMessage(err.message || "Referral code rejected.");
    }
  }

  return (
    <div className="page pricing-page">
      <header className="site-header">
        <div className="header-shell">
          <div className="brand">
            <span className="brand-mark">A</span>
            <div>
              <p className="brand-title">Apex Signal Capital</p>
              <p className="brand-subtitle">Pricing</p>
            </div>
          </div>

          <nav className="nav">
            <a href="/">Home</a>
            <a href="/pricing">Pricing</a>
            <a href="/admin">Admin Access</a>
          </nav>

          <div className="header-actions">
            <button className="btn ghost" onClick={() => window.location.assign("/")}>
              Back to Home
            </button>
            <button className="btn primary" onClick={() => window.location.assign("/admin")}>
              Admin Access
            </button>
          </div>
        </div>
      </header>

      <main>
        <section className="hero pricing-hero" id="top">
          <div className="hero-shell">
            <div className="hero-content">
              <p className="eyebrow">Pricing</p>
              <h1>Choose the right signal stack for your team.</h1>
              <p className="lead">
                Five tiers built for investors, analysts, and institutions that need
                dependable market intelligence.
              </p>
              <div className="cta-row">
                <button className="btn primary" onClick={() => window.location.assign("/admin")}>
                  Request Access
                </button>
                <button className="btn ghost" onClick={() => window.location.assign("/")}>
                  Explore Platform
                </button>
              </div>
              <div className="trust-row">
                <span>No long-term lock-ins</span>
                <span>Quarterly updates included</span>
              </div>
            </div>

            <div className="hero-card">
              <div className="hero-note">
                All tiers include a dedicated analyst brief and quarterly macro
                updates. Upgrade anytime as coverage expands.
              </div>
            </div>
          </div>
        </section>

        <section className="section" id="plans">
          <div className="section-header">
            <p className="eyebrow">Subscriptions</p>
            <h2>Five levels of access from free to enterprise.</h2>
            <p>
              Start with core market summaries, then unlock live signal workflow and
              portfolio diagnostics as you scale.
            </p>
          </div>

          <div className="pricing-grid">
            <div className="card pricing-card">
              <p className="pricing-tier">Free</p>
              <h3>Signal Starter</h3>
              <p className="pricing-price">Free</p>
              <p className="pricing-desc">
                Limited market snapshots for early exploration.
              </p>
              <ul className="pricing-list">
                <li>2 cities included</li>
                <li>Quarterly summaries</li>
                <li>Public brief downloads</li>
              </ul>
              <button className="btn ghost">Get Started</button>
            </div>

            <div className="card pricing-card">
              <p className="pricing-tier">Base</p>
              <h3>Signal Core</h3>
              <p className="pricing-price">499 / month</p>
              <p className="pricing-desc">
                Daily dashboards for small teams and scouts.
              </p>
              <ul className="pricing-list">
                <li>10 cities included</li>
                <li>Weekly momentum briefs</li>
                <li>Email support</li>
              </ul>
              <button className="btn primary">Start Core</button>
            </div>

            <div className="card pricing-card featured">
              <p className="pricing-tier">Growth</p>
              <h3>Signal Plus</h3>
              <p className="pricing-price">1,200 / month</p>
              <p className="pricing-desc">
                Best for funds building sustained allocation strategies.
              </p>
              <ul className="pricing-list">
                <li>30 cities included</li>
                <li>Live alerts + heatmaps</li>
                <li>Analyst review calls</li>
              </ul>
              <button className="btn primary">Start Plus</button>
            </div>

            <div className="card pricing-card">
              <p className="pricing-tier">Institutional</p>
              <h3>Signal Pro</h3>
              <p className="pricing-price">3,500 / month</p>
              <p className="pricing-desc">
                Expanded coverage and portfolio diagnostics.
              </p>
              <ul className="pricing-list">
                <li>75 cities included</li>
                <li>Custom risk overlays</li>
                <li>Dedicated analyst desk</li>
              </ul>
              <button className="btn primary">Talk to Sales</button>
            </div>

            <div className="card pricing-card">
              <p className="pricing-tier">Enterprise</p>
              <h3>Signal Elite</h3>
              <p className="pricing-price">INR 2 Cr / year</p>
              <p className="pricing-desc">
                Enterprise-grade investment intelligence stack with advanced automation.
              </p>
              <ul className="pricing-list">
                {ENTERPRISE_FEATURES.map((feature) => (
                  <li key={feature}>{feature}</li>
                ))}
              </ul>
              <button
                className="btn primary"
                onClick={() => {
                  setShowPaymentPanel((prev) => !prev);
                  setPaymentMessage("");
                }}
              >
                Payment Options
              </button>
              {showPaymentPanel && (
                <div className="pricing-payment-panel">
                  <h4>Choose Unlock Method</h4>
                  <p className="pricing-desc">
                    Demo only: no real transaction is processed.
                  </p>
                  <button className="btn primary" onClick={handlePaypalDemo}>
                    Pay with PayPal (Demo)
                  </button>
                  <div className="pricing-referral">
                    <input
                      value={referralCode}
                      onChange={(e) => setReferralCode(e.target.value)}
                      placeholder='Use referral code "OPEN"'
                    />
                    <button className="btn ghost" onClick={handleReferralUnlock}>
                      Apply Referral Code
                    </button>
                  </div>
                  {paymentMessage && <p className="pricing-payment-msg">{paymentMessage}</p>}
                  {subscriptionUnlocked && (
                    <p className="pricing-payment-ok">
                      Subscription unlocked via: {subscriptionMethod || "manual"}.
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="card pricing-access-card">
            <h3>Enterprise Access</h3>
            <p className="pricing-desc">
              Premium features are available to the <strong>Admin</strong> account.
            </p>
            <div className="pricing-access-actions">
              <button className="btn ghost" onClick={() => navigate("/admin")}>
                Admin Login
              </button>
              <button
                className="btn primary"
                onClick={() => navigate("/investor-dashboard")}
                disabled={!canAccessEnterprise}
              >
                Open Investor Dashboard
              </button>
              <button
                className="btn primary"
                onClick={() => navigate("/enterprise-workbench")}
                disabled={!canAccessEnterprise}
              >
                Open Enterprise Workbench
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
