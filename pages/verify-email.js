import { useEffect, useState } from "react";
import { useRouter } from "next/router";

export default function VerifyEmail() {
  const router = useRouter();
  const { token } = router.query;

  const [status, setStatus] = useState("Verifying...");

  useEffect(() => {
    if (!token) return;

    async function verify() {
      try {
        const res = await fetch(`/api/verify-email?token=${token}`);
        const data = await res.json();

        if (res.ok) {
          setStatus("✅ Email verified successfully! You can now log in.");
        } else {
          setStatus(`❌ ${data.error}`);
        }
      } catch (err) {
        setStatus("❌ Something went wrong. Please try again.");
      }
    }

    verify();
  }, [token]);

  return (
    <div style={{ textAlign: "center", marginTop: "5rem" }}>
      <h1>Email Verification</h1>
      <p>{status}</p>
    </div>
  );
}