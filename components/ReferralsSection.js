import { useEffect, useState } from "react";
import toast from "react-hot-toast";

function ReferredUserCard({ referral }) {
  return (
    <div className="card" style={{ marginBottom: 12 }}>
      <div className="card-head">
        <h3>{referral.name || referral.email}</h3>
        <p className="muted small">
          Role: {referral.role} • Joined {new Date(referral.createdAt).toLocaleDateString()}
        </p>
      </div>

      {referral.role === "EMPLOYER" && referral.company && (
        <p className="muted small">
          Company profile: {referral.company.name} ({referral.company.verified ? "Verified" : "Pending verification"})
        </p>
      )}

      {Array.isArray(referral.jobs) && referral.jobs.length > 0 && (
        <div className="job-list" style={{ marginBottom: 12 }}>
          {referral.jobs.map((job) => (
            <div key={job.id} className="job-item">
              <div>
                <p className="job-title">{job.title}</p>
                <p className="muted small">Total applications: {job._count?.applications ?? 0}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <div>
        <p className="muted small" style={{ marginBottom: 8 }}>
          Activities
        </p>
        {Array.isArray(referral.referralActivities) && referral.referralActivities.length > 0 ? (
          <div className="job-list">
            {referral.referralActivities.map((activity) => (
              <div key={activity.id} className="job-item">
                <div>
                  <p className="job-title">{activity.title}</p>
                  <p className="muted small">{activity.description}</p>
                </div>
                <span className="muted small">
                  {new Date(activity.createdAt).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="muted small">No tracked activities yet.</p>
        )}
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
        <p className="muted">Share your referral code and monitor activity from referred users.</p>
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
