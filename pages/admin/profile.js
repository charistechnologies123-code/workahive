import { useEffect, useState } from "react";
import toast from "react-hot-toast";

function EyeIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"
        stroke="currentColor"
        strokeWidth="2"
      />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M3 3l18 18" stroke="currentColor" strokeWidth="2" />
      <path
        d="M10.6 10.6a2 2 0 0 0 2.8 2.8"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M9.5 5.1A10.4 10.4 0 0 1 12 5c6.5 0 10 7 10 7a18 18 0 0 1-3.2 4.2"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M6.2 6.2C3.4 8.4 2 12 2 12s3.5 7 10 7c1.1 0 2.1-.2 3-.5"
        stroke="currentColor"
        strokeWidth="2"
      />
    </svg>
  );
}

export default function AdminProfile() {
  const [me, setMe] = useState(null);
  const [loading, setLoading] = useState(true);

  const [profile, setProfile] = useState({ name: "", email: "" });

  const [showPw, setShowPw] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const [pw, setPw] = useState({
    currentPassword: "",
    newPassword: "",
    confirmNewPassword: "",
  });
  const [testEmail, setTestEmail] = useState("");
  const [sendingTestEmail, setSendingTestEmail] = useState(false);

  const load = async () => {
    setLoading(true);

    try {
      const res = await fetch("/api/auth/me", { credentials: "include" });
      const data = await res.json();

      if (!data.user) {
        toast.error("Unauthorized");
        setLoading(false);
        return;
      }

      setMe(data.user);
      setProfile({ name: data.user.name || "", email: data.user.email || "" });
      setTestEmail(data.user.email || "");
    } catch {
      toast.error("Failed to load profile");
    }

    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const saveProfile = async (e) => {
    e.preventDefault();

    const res = await fetch("/api/auth/update-profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        name: profile.name,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      toast.error(data.error || "Failed to update profile");
      return;
    }

    toast.success("Profile updated.");
    window.dispatchEvent(new Event("auth-changed"));
    setMe(data.user);
    setProfile((prev) => ({
      ...prev,
      name: data.user?.name || prev.name,
      email: data.user?.email || prev.email,
    }));
  };

  const changePassword = async () => {
    const payload = {
      currentPassword: pw.currentPassword,
      newPassword: pw.newPassword,
    };

    const res = await fetch("/api/auth/change-password", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok) {
      toast.error(data.error || "Failed to change password");
      return;
    }

    toast.success("Password updated.");
    setPw({ currentPassword: "", newPassword: "", confirmNewPassword: "" });
  };

  const sendTestEmail = async (e) => {
    e.preventDefault();

    if (!testEmail.trim()) {
      toast.error("Enter a recipient email address.");
      return;
    }

    setSendingTestEmail(true);

    try {
      const res = await fetch("/api/admin/test-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ to: testEmail }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Failed to send test email");
        return;
      }

      toast.success(data.message || "Test email sent.");
    } catch {
      toast.error("Failed to send test email");
    } finally {
      setSendingTestEmail(false);
    }
  };

  if (loading)
    return (
      <div className="container">
        <p className="muted">Loading…</p>
      </div>
    );

  return (
    <div className="container">
      <div className="page-head">
        <h1>Admin Profile</h1>
        <p className="muted">Update your details and password.</p>
      </div>

      <div className="card">
        <div className="card-head">
          <h2>Profile Details</h2>
        </div>

        <form onSubmit={saveProfile} className="form">
          <div className="grid-2">
            <div className="field">
              <label>Name</label>
              <input
                value={profile.name}
                onChange={(e) =>
                  setProfile({ ...profile, name: e.target.value })
                }
              />
            </div>

            <div className="field">
              <label>Email</label>
              <input type="email" value={profile.email} readOnly />
              <p className="muted small" style={{ marginTop: 6 }}>
                Email cannot be changed here. Contact admin support for formal update requests.
              </p>
            </div>
          </div>

          <button className="btn-primary" type="submit">
            Save Profile
          </button>
        </form>
      </div>

      <div className="card">
        <div className="card-head">
          <h2>Change Password</h2>
          <p className="muted small">
            Password must be at least 8 characters and include:
            <br />
            • Uppercase letter
            <br />
            • Lowercase letter
            <br />
            • Number
            <br />
            • Special character
          </p>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();

            const strongPasswordRegex =
              /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

            if (!strongPasswordRegex.test(pw.newPassword)) {
              toast.error(
                "Password must contain uppercase, lowercase, number, special character, and be at least 8 characters long."
              );
              return;
            }

            if (pw.newPassword !== pw.confirmNewPassword) {
              toast.error("New password and confirm password do not match.");
              return;
            }

            changePassword();
          }}
          className="form"
        >
          <div className="grid-2">
            <div className="field">
              <label>Current Password</label>
              <div className="input-wrap">
                <input
                  type={showPw.current ? "text" : "password"}
                  value={pw.currentPassword}
                  onChange={(e) =>
                    setPw({ ...pw, currentPassword: e.target.value })
                  }
                  required
                />
                <button
                  type="button"
                  className="icon-btn"
                  onClick={() =>
                    setShowPw((s) => ({ ...s, current: !s.current }))
                  }
                  aria-label={showPw.current ? "Hide password" : "Show password"}
                >
                  {showPw.current ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
            </div>

            <div className="field">
              <label>New Password</label>
              <div className="input-wrap">
                <input
                  type={showPw.new ? "text" : "password"}
                  value={pw.newPassword}
                  onChange={(e) =>
                    setPw({ ...pw, newPassword: e.target.value })
                  }
                  required
                />
                <button
                  type="button"
                  className="icon-btn"
                  onClick={() =>
                    setShowPw((s) => ({ ...s, new: !s.new }))
                  }
                  aria-label={showPw.new ? "Hide password" : "Show password"}
                >
                  {showPw.new ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
            </div>

            <div className="field">
              <label>Confirm New Password</label>
              <div className="input-wrap">
                <input
                  type={showPw.confirm ? "text" : "password"}
                  value={pw.confirmNewPassword}
                  onChange={(e) =>
                    setPw({ ...pw, confirmNewPassword: e.target.value })
                  }
                  required
                />
                <button
                  type="button"
                  className="icon-btn"
                  onClick={() =>
                    setShowPw((s) => ({ ...s, confirm: !s.confirm }))
                  }
                  aria-label={showPw.confirm ? "Hide password" : "Show password"}
                >
                  {showPw.confirm ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
            </div>
          </div>

          <button className="btn-primary" type="submit">
            Update Password
          </button>
        </form>
      </div>

      <div className="card">
        <div className="card-head">
          <h2>Send Test Email</h2>
          <p className="muted small">
            Use this to confirm that Resend, your sender address, and your app environment are configured correctly.
          </p>
        </div>

        <form onSubmit={sendTestEmail} className="form">
          <div className="field">
            <label>Recipient Email</label>
            <input
              type="email"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
          </div>

          <button className="btn-primary" type="submit" disabled={sendingTestEmail}>
            {sendingTestEmail ? "Sending..." : "Send Test Email"}
          </button>
        </form>
      </div>
    </div>
  );
}
