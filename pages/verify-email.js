import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function VerifyEmailPage() {
  const router = useRouter();
  const { token } = router.query;
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("Preparing verification...");

  useEffect(() => {
    if (!router.isReady) return;

    const verify = async () => {
      if (!token || Array.isArray(token)) {
        setStatus("error");
        setMessage("This verification link is invalid.");
        return;
      }

      setStatus("loading");
      const res = await fetch(`/api/auth/verify-email?token=${encodeURIComponent(token)}`);
      const data = await res.json();

      if (!res.ok) {
        setStatus("error");
        setMessage(data.error || "Unable to verify email.");
        return;
      }

      setStatus("success");
      setMessage(data.message || "Email verified successfully.");
    };

    verify();
  }, [router.isReady, token]);

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <h2 className="auth-title">Email Verification</h2>
        <p className="muted auth-subtitle">{message}</p>

        {status === "loading" && <p className="muted small">Please wait...</p>}

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Link href="/login" className="btn-primary">Go to Login</Link>
          <Link href="/register" className="btn-soft">Register another account</Link>
        </div>
      </div>
    </div>
  );
}
