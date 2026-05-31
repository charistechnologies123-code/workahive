import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import toast from "react-hot-toast";
import { formatWorkaHiveDate, formatWorkaHiveDateTime } from "../../lib/date-format";

function DetailRow({ label, value }) {
  return (
    <div className="field">
      <label>{label}</label>
      <input readOnly value={value || ""} />
    </div>
  );
}

function SectionCard({ title, children }) {
  return (
    <div className="card" style={{ marginTop: 16 }}>
      <div className="card-head">
        <h2>{title}</h2>
      </div>
      {children}
    </div>
  );
}

export default function ReferralDetailsPage() {
  const router = useRouter();
  const referralId = Number(router.query.id);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const referral = useMemo(
    () => (Array.isArray(data?.referrals) ? data.referrals.find((item) => Number(item.id) === referralId) : null),
    [data, referralId]
  );

  useEffect(() => {
    if (!router.isReady) return;

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

    load();
  }, [router.isReady]);

  return (
    <div className="page">
      <div style={{ marginBottom: 18 }}>
        <button type="button" className="btn-soft" onClick={() => router.back()}>
          Back
        </button>
      </div>

      <div className="page-head">
        <h1>Referral Details</h1>
        <p className="muted">A closer look at the referred user you selected.</p>
      </div>

      {loading ? (
        <div className="card">
          <p className="muted">Loading referral details...</p>
        </div>
      ) : !data ? (
        <div className="card">
          <p className="muted">Unable to load referral details right now.</p>
        </div>
      ) : !referral ? (
        <div className="card">
          <p className="muted">Referral not found.</p>
          <div style={{ marginTop: 12 }}>
            <button type="button" className="btn-soft" onClick={() => router.back()}>
              Back to Profile
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="card">
            <div className="card-head">
              <h2>{referral.name || referral.email}</h2>
              <p className="muted">Role: {referral.role}</p>
            </div>

            <div className="grid-2">
              <DetailRow label="Email" value={referral.email || ""} />
              <DetailRow label="Joined WorkaHive" value={formatWorkaHiveDate(referral.createdAt)} />
            </div>

            <div className="grid-2">
              <DetailRow label="Current Tokens" value={String(referral.tokens ?? 0)} />
              <DetailRow label="Company" value={referral.company?.name || "—"} />
            </div>

            {referral.role === "EMPLOYER" && referral.company && (
              <p className="muted small" style={{ margin: "12px 0 0" }}>
                Company status: {referral.company.verified ? "Verified" : "Pending verification"}
              </p>
            )}
          </div>

          {referral.role === "EMPLOYER" && (
            <SectionCard title="Employer Referral Details">
              <div style={{ padding: "0 22px 22px" }}>
                <p style={{ marginTop: 0 }}>
                  Jobs posted: <strong>{Number(referral.jobsPosted || 0)}</strong>
                </p>
                <p style={{ marginTop: 0 }}>
                  Current tokens: <strong>{Number(referral.tokens ?? 0).toLocaleString()}</strong>
                </p>

                {Array.isArray(referral.recentJobs) && referral.recentJobs.length > 0 && (
                  <div style={{ marginTop: 16 }}>
                    <h3 style={{ margin: "0 0 10px" }}>Recent Jobs</h3>
                    <div className="job-list">
                      {referral.recentJobs.map((job) => (
                        <div key={job.id} className="job-item">
                          <div>
                            <p className="job-title">{job.title}</p>
                            <p className="muted small">
                              {job.status} • {formatWorkaHiveDate(job.createdAt)} •{" "}
                              {Number(job._count?.applications || 0)} applications
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </SectionCard>
          )}

          {referral.role === "JOBSEEKER" && (
            <SectionCard title="Jobseeker Referral Details">
              <div style={{ padding: "0 22px 22px" }}>
                <p style={{ marginTop: 0 }}>
                  Total applications: <strong>{Number(referral.totalApplications || 0)}</strong>
                </p>
                <p style={{ marginTop: 0 }}>
                  Shortlisted: <strong>{Number(referral.shortlisted || 0)}</strong>
                </p>
                <p style={{ marginTop: 0 }}>
                  Current tokens: <strong>{Number(referral.tokens ?? 0).toLocaleString()}</strong>
                </p>

                <div style={{ marginTop: 16 }}>
                  <h3 style={{ margin: "0 0 10px" }}>Recent Applications</h3>
                  {Array.isArray(referral.recentApplications) && referral.recentApplications.length > 0 ? (
                    <div className="job-list">
                      {referral.recentApplications.map((application) => (
                        <div key={application.id} className="job-item">
                          <div>
                            <p className="job-title">{application.job?.title || "Untitled job"}</p>
                            <p className="muted small">
                              {application.job?.company?.name || "Unknown company"} • {application.status} •{" "}
                              {formatWorkaHiveDateTime(application.createdAt)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="muted small">No applications yet.</p>
                  )}
                </div>
              </div>
            </SectionCard>
          )}

          <div style={{ marginTop: 16 }}>
            <button type="button" className="btn-soft" onClick={() => router.back()}>
              Back to Profile
            </button>
          </div>
        </>
      )}
    </div>
  );
}
