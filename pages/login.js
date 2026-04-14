import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import toast from "react-hot-toast";

function EyeIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" stroke="currentColor" strokeWidth="2" />
      <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M3 3l18 18" stroke="currentColor" strokeWidth="2" />
      <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" stroke="currentColor" strokeWidth="2" />
      <path d="M9.5 5.1A10.4 10.4 0 0 1 12 5c6.5 0 10 7 10 7a18 18 0 0 1-3.2 4.2" stroke="currentColor" strokeWidth="2" />
      <path d="M6.2 6.2C3.4 8.4 2 12 2 12s3.5 7 10 7c1.1 0 2.1-.2 3-.5" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

export default function Login() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const presetEmail = String(router.query.email || "");

  useEffect(() => {
    if (presetEmail) {
      setForm((prev) => ({ ...prev, email: presetEmail }));
    }
  }, [presetEmail]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
      credentials: "include",
    });

    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error || "Login failed");
      return;
    }

    window.dispatchEvent(new Event("auth-changed"));

    if (data.needsEmailVerification) {
      return router.push(
        `/verify-email/sent?email=${encodeURIComponent(data.email || form.email)}&role=${encodeURIComponent(data.role || "JOBSEEKER")}`
      );
    }

    toast.success("Login successful.");

    if (data.mustChangePassword) {
      if (data.role === "ADMIN") return router.push("/admin/profile");
      if (data.role === "EMPLOYER") return router.push("/employer/profile");
      return router.push("/jobseeker/profile");
    }

    if (data.role === "EMPLOYER") return router.push("/employer/dashboard");
    if (data.role === "ADMIN") return router.push("/admin/dashboard");
    return router.push("/");
  };

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <h2 className="auth-title">Welcome back</h2>
        <p className="muted auth-subtitle">Log in to continue on WorkaHive.</p>

        <form onSubmit={handleSubmit} className="form">
          <div className="field">
            <label>Email</label>
            <input
              name="email"
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
              required
              autoComplete="email"
            />
          </div>

          <div className="field">
            <div className="row-between">
              <label>Password</label>
              <Link href="/forgot-password" className="link small">Forgot password?</Link>
            </div>
            <div className="input-wrap">
              <input
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="Your password"
                value={form.password}
                onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
                required
                autoComplete="current-password"
              />
              <button type="button" className="icon-btn" onClick={() => setShowPassword((prev) => !prev)}>
                {showPassword ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>
          </div>

          <button className="btn-primary" type="submit">Login</button>

          <p className="small" style={{ marginTop: 12 }}>
            Don&apos;t have an account? <Link href="/register" className="link">Register</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
