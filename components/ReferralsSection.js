import { useEffect, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { formatWorkaHiveDate } from "../lib/date-format";

function ReferredUserCard({ referral }) {
  return (
    <div className="card" style={{ marginBottom: 12 }}>
      <div className="card-head">
        <h3>{referral.name || referral.email}</h3>
        <p className="muted small">
          Role: {referral.role} • Joined {formatWorkaHiveDate(referral.createdAt)}
        </p>
      </div>

      {referral.role === "EMPLOYER" && referral.company && (
        <p className="muted small">
          Company profile: {referral.company.name} ({referral.company.verified ? "Verified" : "Pending verification"})
        </p>
      )}

      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
        <p className="muted small" style={{ margin: 0 }}>
          Open the referral details page to view jobs, applications, and activity.
        </p>
        <Link href={`/referrals/${referral.id}`} className="btn-soft">
          View Details
        </Link>
      </div>
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
        <p className="muted">Loading referralsâ€¦</p>
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
