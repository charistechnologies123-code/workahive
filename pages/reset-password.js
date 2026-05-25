import Link from "next/link";
import { useRouter } from "next/router";
import { useMemo, useState } from "react";

const passwordRule =
  "Use at least 8 characters with uppercase, lowercase, number, and special character.";

export default function ResetPasswordPage() {
  const router = useRouter();
  const token = useMemo(() => {
    if (!router.isReady) return "";
    return Array.isArray(router.query.token) ? router.query.token[0] || "" : String(router.query.token || "");
  }, [router.isReady, router.query.token]);
  const [form, setForm] = useState({
    newPassword: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setInfo("");

    if (!token) {
      setError("This password reset link is invalid.");
      return;
    }

    if (form.newPassword !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          newPassword: form.newPassword,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Unable to reset password.");
        setLoading(false);
        return;
      }

      setInfo(data.message || "Password updated successfully.");
      router.push("/login?reset=success");
    } catch (requestError) {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <h2 className="auth-title">Reset password</h2>
        <p className="muted auth-subtitle">
          Choose a new password for your WorkaHive account.
        </p>

        <form onSubmit={submit} className="form">
          <div className="field">
            <label>New password</label>
            <input
              type="password"
              value={form.newPassword}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, newPassword: event.target.value }))
              }
              placeholder="Enter a strong password"
              required
              autoComplete="new-password"
            />
          </div>

          <div className="field">
            <label>Confirm password</label>
            <input
              type="password"
              value={form.confirmPassword}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, confirmPassword: event.target.value }))
              }
              placeholder="Re-enter your password"
              required
              autoComplete="new-password"
            />
            <p className="muted small" style={{ marginTop: 8 }}>
              {passwordRule}
            </p>
          </div>

          <button className="btn-primary" type="submit" disabled={loading}>
            {loading ? "Updating..." : "Update password"}
          </button>

          {error && <div className="alert alert-error">{error}</div>}
          {info && <div className="alert alert-success">{info}</div>}

          <p className="small" style={{ marginTop: 12 }}>
            <Link className="link" href="/login">
              Back to login
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
