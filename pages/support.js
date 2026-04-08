import { useAuth } from "../context/AuthContext";
import { useEffect, useState } from "react";

export default function SupportPage() {
  const { user } = useAuth();
  const isEmployer = user?.role === "EMPLOYER";

  const [plans, setPlans] = useState([]);
  const [tokens, setTokens] = useState(null);
  const [note, setNote] = useState("");

  const whatsappNumber = "2349130276015";
  const adminEmail = "support@workahive.com";

  // Fetch token plans dynamically
  useEffect(() => {
    if (isEmployer) {
      fetch("/api/token-plans")
        .then((res) => res.json())
        .then((data) => {
          setPlans(data);
          if (data.length) setTokens(data[0].tokens); // select first plan by default
        });
    }
  }, [isEmployer]);

  const handleBuyTokens = () => {
    const selectedPlan = plans.find((p) => p.tokens === tokens);
    const priceText = selectedPlan ? `₦${selectedPlan.price.toLocaleString()}` : "";
    const message = encodeURIComponent(
      `Hello WorkaHive Support,\n\nI want to purchase tokens.\n\nToken Plan: ${tokens} Tokens (${priceText})\nNote: ${note}`
    );
    window.open(`https://wa.me/${whatsappNumber}?text=${message}`, "_blank");
  };

  return (
    <div className="support-page">
      <div className="support-container">
        {/* HEADER */}
        <div className="support-header">
          <h1 className="support-title">Get Support</h1>
          <p className="support-subtitle">
            Need help? We're here to assist you. Choose your preferred way to reach us.
          </p>
        </div>

        {/* CONTACT METHODS */}
        <div className="contact-grid">
          {/* WhatsApp Contact */}
          <div className="contact-card whatsapp-card">
            <div className="contact-icon whatsapp-icon">
              <svg width="32" height="32" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.967-.94 1.164-.173.198-.347.223-.644.075-.297-.149-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.52.148-.174.198-.298.297-.497.099-.198.05-.372-.025-.52-.075-.149-.67-1.611-.916-2.207-.242-.579-.487-.5-.67-.51l-.57-.01c-.198 0-.52.074-.792.372-.273.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.71.306 1.263.489 1.695.626.712.227 1.36.195 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.29.173-1.413-.074-.124-.272-.198-.57-.347z"/>
              </svg>
            </div>
            <div className="contact-content">
              <h3 className="contact-title">Chat on WhatsApp</h3>
              <p className="contact-description">
                Get instant support through WhatsApp. We're usually online and respond quickly.
              </p>
              <button
                onClick={() =>
                  window.open(`https://wa.me/${whatsappNumber}?text=Hello WorkaHive Support`, "_blank")
                }
                className="contact-button whatsapp-button"
              >
                Start Chat
                <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/>
                </svg>
              </button>
            </div>
          </div>

          {/* Email Contact */}
          <div className="contact-card email-card">
            <div className="contact-icon email-icon">
              <svg width="32" height="32" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                <polyline points="22,6 12,13 2,6"/>
              </svg>
            </div>
            <div className="contact-content">
              <h3 className="contact-title">Send Email</h3>
              <p className="contact-description">
                For detailed inquiries or when you prefer written communication.
              </p>
              <div className="email-display">
                <span className="email-text">{adminEmail}</span>
                <button
                  onClick={() => navigator.clipboard.writeText(adminEmail)}
                  className="copy-button"
                  title="Copy email address"
                >
                  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* EMPLOYER TOKEN PURCHASE SECTION */}
        {isEmployer && (
          <div id="buy-tokens" className="token-section">
            <div className="token-header">
              <h2 className="token-title">Token Plans</h2>
              <p className="token-subtitle">
                Purchase tokens to post jobs and access premium features
              </p>
            </div>

            {/* TOKEN PLANS GRID */}
            <div className="token-plans-grid">
              {plans.map((plan) => (
                <div
                  key={plan.id}
                  onClick={() => setTokens(plan.tokens)}
                  className={`token-plan-card ${tokens === plan.tokens ? 'selected' : ''}`}
                >
                  <div className="plan-tokens">
                    <span className="token-icon">🪙</span>
                    <span className="token-count">{plan.tokens}</span>
                  </div>
                  <div className="plan-price">
                    ₦{plan.price.toLocaleString()}
                  </div>
                  <div className="plan-per-token">
                    ₦{(plan.price / plan.tokens).toFixed(0)} per token
                  </div>
                </div>
              ))}
            </div>

            {/* PURCHASE FORM */}
            <div className="purchase-form">
              <div className="form-group">
                <label className="form-label">Add a note (optional)</label>
                <textarea
                  placeholder="Any special instructions or questions..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="form-textarea"
                  rows="3"
                />
              </div>

              <button
                onClick={handleBuyTokens}
                disabled={!tokens}
                className="purchase-button"
              >
                <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.967-.94 1.164-.173.198-.347.223-.644.075-.297-.149-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.52.148-.174.198-.298.297-.497.099-.198.05-.372-.025-.52-.075-.149-.67-1.611-.916-2.207-.242-.579-.487-.5-.67-.51l-.57-.01c-.198 0-.52.074-.792.372-.273.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.71.306 1.263.489 1.695.626.712.227 1.36.195 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.29.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                </svg>
                Continue on WhatsApp
              </button>
            </div>
          </div>
        )}

        {/* ADDITIONAL INFO */}
        <div className="support-info">
          <div className="info-card">
            <h3>Response Times</h3>
            <div className="info-items">
              <div className="info-item">
                <span className="info-label">WhatsApp:</span>
                <span className="info-value">Usually within 1 hour</span>
              </div>
              <div className="info-item">
                <span className="info-label">Email:</span>
                <span className="info-value">Within 24 hours</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}