import { useState } from "react";
import Link from "next/link";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [info, setInfo] = useState("");
  const [error, setError] = useState("");

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setInfo("");

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong");
        return;
      }

      setInfo(data.message || "If an account exists for that email, we'll send a reset link.");
    } catch (error) {
      setError("Network error. Please try again.");
    }
  };

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <h2 className="auth-title">Forgot password</h2>
        <p className="muted auth-subtitle">
          Enter your email address and we'll send you a password reset link.
        </p>

        <form onSubmit={submit} className="form">
          <div className="field">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              required
              autoComplete="email"
            />
          </div>

          <button className="btn-primary" type="submit">
            Continue
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
