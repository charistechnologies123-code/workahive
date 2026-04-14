import Link from "next/link";
import { useRouter } from "next/router";
import { useState } from "react";
import toast from "react-hot-toast";

export default function VerifyEmailSentPage() {
  const router = useRouter();
  const email = String(router.query.email || "");
  const role = String(router.query.role || "JOBSEEKER");
  const [resending, setResending] = useState(false);

  const resend = async () => {
    if (!email) {
      toast.error("Missing email address.");
      return;
    }

    setResending(true);
    const res = await fetch("/api/auth/resend-verification", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();

    if (!res.ok) {
      toast.error(data.error || "Failed to resend verification email");
    } else {
      toast.success(data.message || "Verification email sent.");
    }
    setResending(false);
  };

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <h2 className="auth-title">Check your email</h2>
        <p className="muted auth-subtitle">
          {role === "EMPLOYER"
            ? "Click the verification link sent to your email address to verify your employer account."
            : "Click the verification link sent to your email address to verify your account."}
        </p>

        <div className="card" style={{ marginBottom: 16 }}>
          <div className="field" style={{ marginBottom: 0 }}>
            <label>Email address</label>
            <input readOnly value={email} />
          </div>
        </div>

        <div className="alert alert-success">
          Click the verification link sent to your email address to continue.
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button type="button" className="btn-primary" onClick={resend} disabled={resending}>
            {resending ? "Sending..." : "Resend verification link"}
          </button>
          <Link href={`/login${email ? `?email=${encodeURIComponent(email)}` : ""}`} className="btn-soft">
            Go to Login
          </Link>
        </div>

        <p className="muted small" style={{ marginTop: 14 }}>
          If the email does not arrive, check spam and promotions. If resend still fails, email delivery is not configured correctly yet.
        </p>
      </div>
    </div>
  );
}
