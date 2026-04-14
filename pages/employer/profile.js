import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import ReferralsSection from "../../components/ReferralsSection";

function CoinIcon() {
  return (
    <span aria-hidden="true" style={{ marginRight: 6 }}>
      🪙
    </span>
  );
}

function Field({ label, value, multiline = false }) {
  return (
    <div className="field">
      <label>{label}</label>
      {multiline ? (
        <textarea value={value || ""} readOnly rows={4} />
      ) : (
        <input value={value || ""} readOnly />
      )}
    </div>
  );
}

function SocialLinkRow({ label, href }) {
  if (!href) return null;

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        gap: 12,
        padding: "10px 12px",
        borderRadius: 10,
        border: "1px solid rgba(255,255,255,0.08)",
        background: "rgba(255,255,255,0.03)",
        flexWrap: "wrap",
      }}
    >
      <span>{label}</span>
      <a
        href={href}
        target="_blank"
        rel="noreferrer"
        style={{ wordBreak: "break-all" }}
      >
        {href}
      </a>
    </div>
  );
}

export default function EmployerProfilePage() {
  const [me, setMe] = useState(null);
  const [company, setCompany] = useState(null);

  const [loadingMe, setLoadingMe] = useState(true);
  const [loadingCompany, setLoadingCompany] = useState(true);

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [savingPassword, setSavingPassword] = useState(false);

  const tokenBalance = useMemo(() => Number(me?.tokens ?? 0), [me]);

  const fetchMe = async () => {
    setLoadingMe(true);
    try {
      const res = await fetch("/api/auth/me", { credentials: "include" });
      const data = await res.json();

      if (!res.ok || !data?.user) {
        setMe(null);
        toast.error(data.error || "Failed to load employer details");
        return;
      }

      setMe(data.user);
    } catch {
      setMe(null);
      toast.error("Failed to load employer details");
    } finally {
      setLoadingMe(false);
    }
  };

  const fetchCompany = async () => {
    setLoadingCompany(true);
    try {
      const res = await fetch("/api/company/me", { credentials: "include" });
      const data = await res.json();

      if (!res.ok) {
        setCompany(null);
        toast.error(data.error || "Failed to load company profile");
        return;
      }

      setCompany(data.company || null);
    } catch {
      setCompany(null);
      toast.error("Failed to load company profile");
    } finally {
      setLoadingCompany(false);
    }
  };

  const refreshAll = async () => {
    await Promise.all([fetchMe(), fetchCompany()]);
    toast.success("Profile refreshed.");
  };

  const onPasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordForm((prev) => ({ ...prev, [name]: value }));
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();

    const currentPassword = passwordForm.currentPassword.trim();
    const newPassword = passwordForm.newPassword.trim();
    const confirmPassword = passwordForm.confirmPassword.trim();

    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error("Please fill in all password fields.");
      return;
    }

    if (newPassword.length < 8) {
      toast.error("New password must be at least 8 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("New password and confirm password do not match.");
      return;
    }

    if (currentPassword === newPassword) {
      toast.error("New password must be different from current password.");
      return;
    }

    setSavingPassword(true);

    try {
      const res = await fetch("/api/auth/update-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Failed to update password.");
        return;
      }

      toast.success(data.message || "Password updated successfully.");
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch {
      toast.error("Failed to update password.");
    } finally {
      setSavingPassword(false);
    }
  };

  useEffect(() => {
    fetchMe();
    fetchCompany();
  }, []);

  return (
    <div className="container">
      <div className="page-head">
        <h1>Employer Profile</h1>
        <p className="muted">
          View your employer account, token balance, company profile details, and update your password.
        </p>
      </div>

      <div className="card">
        <div
          className="card-head"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <div>
            <h2 style={{ marginBottom: 6 }}>Employer Details</h2>
            <p className="muted" style={{ margin: 0 }}>
              Your JobsHive employer account information.
            </p>
          </div>

          <button type="button" className="btn-soft" onClick={refreshAll}>
            Refresh
          </button>
        </div>

        {loadingMe ? (
          <p className="muted">Loading employer details…</p>
        ) : !me ? (
          <p className="muted">Unable to load employer details.</p>
        ) : (
          <div className="form">
            <div className="grid-2">
              <Field label="Full Name" value={me.name || ""} />
              <Field label="Email Address" value={me.email || ""} />
            </div>

            <div className="grid-2">
              <Field label="Role" value={me.role || ""} />
              <Field
                label="Account ID"
                value={me.id != null ? String(me.id) : ""}
              />
            </div>
          </div>
        )}
      </div>

      <div className="card">
        <div className="card-head">
          <h2>Update Password</h2>
          <p className="muted">
            Change your account password securely.
          </p>
        </div>

        <form className="form" onSubmit={handlePasswordSubmit}>
          <div className="grid-2">
            <div className="field">
              <label htmlFor="currentPassword">Current Password</label>
              <input
                id="currentPassword"
                name="currentPassword"
                type="password"
                value={passwordForm.currentPassword}
                onChange={onPasswordChange}
                placeholder="Enter current password"
                autoComplete="current-password"
              />
            </div>

            <div className="field">
              <label htmlFor="newPassword">New Password</label>
              <input
                id="newPassword"
                name="newPassword"
                type="password"
                value={passwordForm.newPassword}
                onChange={onPasswordChange}
                placeholder="Enter new password"
                autoComplete="new-password"
              />
            </div>
          </div>

          <div className="grid-2">
            <div className="field">
              <label htmlFor="confirmPassword">Confirm New Password</label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                value={passwordForm.confirmPassword}
                onChange={onPasswordChange}
                placeholder="Re-enter new password"
                autoComplete="new-password"
              />
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "end",
              }}
            >
              <div
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  borderRadius: 12,
                  border: "1px solid rgba(255,255,255,0.08)",
                  background: "rgba(255,255,255,0.03)",
                }}
              >
                <p className="muted small" style={{ margin: 0 }}>
                  Use a strong password with uppercase, lowercase, number, and special character where possible.
                </p>
              </div>
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button
              type="submit"
              className="btn-primary"
              disabled={savingPassword}
            >
              {savingPassword ? "Updating..." : "Update Password"}
            </button>

            <button
              type="button"
              className="btn-soft"
              disabled={savingPassword}
              onClick={() =>
                setPasswordForm({
                  currentPassword: "",
                  newPassword: "",
                  confirmPassword: "",
                })
              }
            >
              Clear
            </button>
          </div>
        </form>
      </div>

      <div className="card">
        <div className="card-head">
          <h2>
            <CoinIcon />
            Token Balance
          </h2>
          <p className="muted">
            Tokens are required for job posting.
          </p>
        </div>

        {loadingMe ? (
          <p className="muted">Loading token balance…</p>
        ) : (
          <div
            style={{
              display: "grid",
              gap: 14,
            }}
          >
            <div
              style={{
                padding: "16px 18px",
                borderRadius: 14,
                border: "1px solid rgba(255,255,255,0.1)",
                background: "rgba(255,255,255,0.03)",
              }}
            >
              <p className="muted small" style={{ marginTop: 0 }}>
                Current Balance
              </p>
              <h2 style={{ margin: 0 }}>
                {tokenBalance} token{tokenBalance === 1 ? "" : "s"}
              </h2>
            </div>

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button type="button" className="btn-soft" onClick={fetchMe}>
                Refresh Balance
              </button>

              <Link href="/support#buy-tokens" className="btn-primary">
                Buy Tokens
              </Link>
            </div>

            
          </div>
        )}
      </div>

      <div className="card">
        <div className="card-head">
          <h2>Company Profile</h2>
          <p className="muted">
            Your company information is displayed here for review.
          </p>
        </div>

        {loadingCompany ? (
          <p className="muted">Loading company profile…</p>
        ) : !company ? (
          <div>
            <p className="muted">No company profile found yet.</p>
            <div style={{ marginTop: 12 }}>
              <Link href="/employer/dashboard" className="btn-primary">
                Go to Dashboard
              </Link>
            </div>
          </div>
        ) : (
          <div className="form">
            <div
              style={{
                marginBottom: 14,
                padding: "12px 14px",
                borderRadius: 12,
                border: "1px solid rgba(255,255,255,0.1)",
                background: "rgba(255,255,255,0.03)",
              }}
            >
              {company.verified ? (
                <p style={{ margin: 0 }}>
                  <strong>Status:</strong>{" "}
                  <span className="status-pill status-open">Verified</span>
                </p>
              ) : (
                <p style={{ margin: 0 }}>
                  <strong>Status:</strong>{" "}
                  <span className="status-pill status-closed">Not Verified</span>
                </p>
              )}
            </div>

            <div className="grid-2">
              <Field label="Company Name" value={company.name || ""} />
              <Field label="Industry" value={company.industry || ""} />
            </div>

            <div className="grid-2">
              <Field label="Location" value={company.location || ""} />
              <Field label="Website" value={company.website || ""} />
            </div>

            <Field
              label="Company Description"
              value={company.description || ""}
              multiline
            />

            <div className="grid-2">
              <Field
                label="Registration Number"
                value={company.regNo || ""}
              />
              <Field
                label="Alternative Proof Note"
                value={company.proofNote || ""}
              />
            </div>

            <div className="card" style={{ marginTop: 8 }}>
              <div className="card-head">
                <h3 style={{ margin: 0 }}>Social Links</h3>
                <p className="muted small" style={{ marginTop: 6 }}>
                  Company online presence used for credibility and verification review.
                </p>
              </div>

              <div style={{ display: "grid", gap: 10 }}>
                <SocialLinkRow label="Facebook" href={company.facebook} />
                <SocialLinkRow label="Instagram" href={company.instagram} />
                <SocialLinkRow label="LinkedIn" href={company.linkedin} />
                <SocialLinkRow label="X (Twitter)" href={company.x} />
                <SocialLinkRow label="YouTube" href={company.youtube} />

                {!company.facebook &&
                  !company.instagram &&
                  !company.linkedin &&
                  !company.x &&
                  !company.youtube && (
                    <p className="muted small" style={{ margin: 0 }}>
                      No social links added.
                    </p>
                  )}
              </div>
            </div>

            <div style={{ marginTop: 14 }}>
              <Link href="/employer/dashboard" className="btn-soft">
                Back to Dashboard
              </Link>
            </div>
          </div>
        )}
      </div>

      <ReferralsSection />
    </div>
  );
}
