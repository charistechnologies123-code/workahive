import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { formatWorkaHiveDate } from "../lib/date-format";

function ReferredUserCard({ referral }) {
  const isEmployer = String(referral.role || "").toUpperCase() === "EMPLOYER";
  const isJobseeker = String(referral.role || "").toUpperCase() === "JOBSEEKER";

  return (
    <div className="card" style={{ marginBottom: 12 }}>
      <div className="card-head">
        <h3>{referral.name || referral.email}</h3>
        <p className="muted small">
          Role: {referral.role} • Joined {formatWorkaHiveDate(referral.createdAt)}
        </p>
      </div>

      {isEmployer && referral.company && (
        <div className="muted small" style={{ display: "grid", gap: 4 }}>
          <p style={{ margin: 0 }}>
            Company profile: {referral.company.name} ({referral.company.verified ? "Verified" : "Pending verification"})
          </p>
          <p style={{ margin: 0 }}>
            Current tokens: <strong>{Number(referral.tokens ?? 0).toLocaleString()}</strong>
          </p>
          <p style={{ margin: 0 }}>
            Jobs posted: <strong>{Number(referral.jobsPosted || 0).toLocaleString()}</strong>
          </p>
        </div>
      )}

      {isJobseeker && (
        <div className="muted small" style={{ display: "grid", gap: 4 }}>
          <p style={{ margin: 0 }}>
            Current tokens: <strong>{Number(referral.tokens ?? 0).toLocaleString()}</strong>
          </p>
          <p style={{ margin: 0 }}>
            Applications: <strong>{Number(referral.totalApplications || 0).toLocaleString()}</strong>
          </p>
          <p style={{ margin: 0 }}>
            Shortlisted: <strong>{Number(referral.shortlistedApplications || 0).toLocaleString()}</strong>
          </p>
        </div>
      )}
    </div>
  );
}

export default function ReferralsSection() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/referrals/me", { credentials: "include" });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error || "Failed to load referrals");
        setData(null);
      } else {
        setData(json);
      }
    } catch {
      toast.error("Failed to load referrals");
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="card">
      <div className="card-head">
        <h2>My Referrals</h2>
        <p className="muted">Share your referral code and browse your referred users.</p>
      </div>

      {loading ? (
        <p className="muted">Loading referrals…</p>
      ) : !data ? (
        <p className="muted">Unable to load referrals right now.</p>
      ) : (
        <>
          <div className="grid-2">
            <div className="field">
              <label>Your Referral Code</label>
              <input readOnly value={data.referralCode || ""} />
            </div>
            <div className="field">
              <label>Total Referrals</label>
              <input readOnly value={String(data.referrals?.length || 0)} />
            </div>
          </div>

          {!Array.isArray(data.referrals) || data.referrals.length === 0 ? (
            <p className="muted small">No referrals yet.</p>
          ) : (
            <div style={{ marginTop: 12 }}>
              {data.referrals.map((referral) => (
                <ReferredUserCard key={referral.id} referral={referral} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
