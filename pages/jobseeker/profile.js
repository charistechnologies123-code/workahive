import { useEffect, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import ReferralsSection from "../../components/ReferralsSection";

function Field({ label, value }) {
  return (
    <div className="field">
      <label>{label}</label>
      <input value={value || ""} readOnly />
    </div>
  );
}

export default function JobSeekerProfilePage() {
  const [me, setMe] = useState(null);
  const [loadingMe, setLoadingMe] = useState(true);

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [savingPassword, setSavingPassword] = useState(false);

  const fetchMe = async () => {
    setLoadingMe(true);

    try {
      const res = await fetch("/api/auth/me", { credentials: "include" });
      const data = await res.json();

      if (!res.ok || !data?.user) {
        setMe(null);
        toast.error(data?.error || "Failed to load account details");
        return;
      }

      setMe(data.user);
    } catch {
      setMe(null);
      toast.error("Failed to load account details");
    } finally {
      setLoadingMe(false);
    }
  };

  const refreshAll = async () => {
    await fetchMe();
    toast.success("Profile refreshed.");
  };

  const onPasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const clearPasswordForm = () => {
    setPasswordForm({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
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

      let data = {};
      try {
        data = await res.json();
      } catch {
        data = {};
      }

      if (!res.ok) {
        toast.error(data.error || "Failed to update password.");
        return;
      }

      toast.success(data.message || "Password updated successfully.");
      clearPasswordForm();
    } catch {
      toast.error("Failed to update password.");
    } finally {
      setSavingPassword(false);
    }
  };

  useEffect(() => {
    fetchMe();
  }, []);

  return (
    <div className="container">
      <div className="page-head">
        <h1>Job Seeker Profile</h1>
        <p className="muted">
          View your account details and update your password.
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
            <h2 style={{ marginBottom: 6 }}>Account Details</h2>
            <p className="muted" style={{ margin: 0 }}>
              Your WorkaHive job seeker account information.
            </p>
          </div>

          <button type="button" className="btn-soft" onClick={refreshAll}>
            Refresh
          </button>
        </div>

        {loadingMe ? (
          <p className="muted">Loading account details…</p>
        ) : !me ? (
          <p className="muted">Unable to load account details.</p>
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
          <p className="muted">Change your account password securely.</p>
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
              onClick={clearPasswordForm}
            >
              Clear
            </button>

            <Link href="/jobseeker/dashboard" className="btn-soft">
              Back to Dashboard
            </Link>
          </div>
        </form>
      </div>

      <ReferralsSection />
    </div>
  );
}
