import { useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import toast from "react-hot-toast";

const strongPasswordRegex =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

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

export default function Register() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "JOBSEEKER",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const router = useRouter();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();

    // ✅ strong password check
    if (!strongPasswordRegex.test(form.password)) {
      toast.error(
        "Password must be at least 8 characters and include uppercase, lowercase, number, and special character."
      );
      return;
    }

    // ✅ confirm password check
    if (form.password !== form.confirmPassword) {
      toast.error("Passwords do not match. Please confirm your password.");
      return;
    }

    const payload = {
      name: form.name,
      email: form.email,
      password: form.password,
      role: form.role,
    };

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok) {
      toast.error(data.error || "Registration failed");
      return;
    }

    toast.success("Registration successful. Redirecting to login…");

    // redirect to login after a short delay
    setTimeout(() => {
      router.push("/login");
    }, 1200);
  };

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <h2 className="auth-title">Create your account</h2>
        <p className="muted auth-subtitle">Start applying or posting jobs on WorkaHive.</p>

        <form onSubmit={handleSubmit} className="form">
          <div className="field">
            <label>Name</label>
            <input
              name="name"
              type="text"
              placeholder="Your full name"
              value={form.name}
              onChange={handleChange}
              required
              autoComplete="name"
            />
          </div>

          <div className="field">
            <label>Email</label>
            <input
              name="email"
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={handleChange}
              required
              autoComplete="email"
            />
          </div>

          <div className="field">
            <label>Password</label>

            <div className="input-wrap">
              <input
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="Create a strong password"
                value={form.password}
                onChange={handleChange}
                required
                autoComplete="new-password"
              />

              <button
                type="button"
                className="icon-btn"
                onClick={() => setShowPassword((s) => !s)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                title={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>

            <p className="muted small" style={{ marginTop: 6 }}>
              Must be at least 8 characters and include: uppercase, lowercase, number, special character.
            </p>
          </div>

          <div className="field">
            <label>Confirm Password</label>

            <div className="input-wrap">
              <input
                name="confirmPassword"
                type={showConfirm ? "text" : "password"}
                placeholder="Re-enter your password"
                value={form.confirmPassword}
                onChange={handleChange}
                required
                autoComplete="new-password"
              />

              <button
                type="button"
                className="icon-btn"
                onClick={() => setShowConfirm((s) => !s)}
                aria-label={showConfirm ? "Hide password" : "Show password"}
                title={showConfirm ? "Hide password" : "Show password"}
              >
                {showConfirm ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>
          </div>

          <div className="field">
            <label>Register as</label>
            <select name="role" value={form.role} onChange={handleChange}>
              <option value="JOBSEEKER">Job Seeker</option>
              <option value="EMPLOYER">Employer</option>
            </select>
          </div>

          <button className="btn-primary" type="submit">
            Create account
          </button>

          <p className="small" style={{ marginTop: 12 }}>
            Already have an account?{" "}
            <Link href="/login" className="link">
              Login
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}