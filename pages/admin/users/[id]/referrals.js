import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import toast from "react-hot-toast";
import { formatWorkaHiveDate, formatWorkaHiveDateTime } from "../../../../lib/date-format";

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

export default function AdminUserReferralsPage() {
  const router = useRouter();
  const userId = Number(router.query.id);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const user = data?.user || null;
  const referrals = useMemo(() => (Array.isArray(data?.referrals) ? data.referrals : []), [data]);

  useEffect(() => {
    if (!router.isReady) return;

    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/admin/users/${userId}/referrals`, { credentials: "include" });
        const json = await res.json();
        if (!res.ok) {
          toast.error(json.error || "Failed to load referral details");
          setData(null);
        } else {
          setData(json);
        }
      } catch {
        toast.error("Failed to load referral details");
        setData(null);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [router.isReady, userId]);

  return (
    <div className="page">
      <div style={{ marginBottom: 18 }}>
        <button type="button" className="btn-soft" onClick={() => router.back()}>
          Back
        </button>
      </div>

      <div className="page-head">
        <h1>Referral Details</h1>
        <p className="muted">Admin view for a user's referral network and referral activity.</p>
      </div>

      {loading ? (
        <div className="card">
          <p className="muted">Loading referral details...</p>
        </div>
      ) : !data ? (
        <div className="card">
          <p className="muted">Unable to load referral details right now.</p>
        </div>
      ) : !user ? (
        <div className="card">
          <p className="muted">User not found.</p>
          <div style={{ marginTop: 12 }}>
            <Link href="/admin/users" className="btn-soft">
              Back to Users
            </Link>
          </div>
        </div>
      ) : (
        <>
          <div className="card">
            <div className="card-head">
              <h2>{user.name || user.email}</h2>
              <p className="muted">
                {user.role} • Joined {formatWorkaHiveDate(user.createdAt)}
              </p>
            </div>

            <div className="grid-2">
              <DetailRow label="Email" value={user.email || ""} />
              <DetailRow label="Referral Code" value={user.referralCode || "—"} />
            </div>
            <div className="grid-2">
              <DetailRow label="Current Tokens" value={String(user.tokens ?? 0)} />
              <DetailRow label="Total Referrals" value={String(data.referralCount ?? referrals.length)} />
            </div>
            {user.company?.name && (
              <p className="muted small" style={{ margin: "12px 0 0" }}>
                Company: {user.company.name} {user.company.verified ? "(Verified)" : "(Pending verification)"}
              </p>
            )}
          </div>

          <SectionCard title="Referred Users">
            <div style={{ padding: "0 22px 22px" }}>
              {referrals.length === 0 ? (
                <p className="muted small" style={{ margin: 0 }}>
                  No referrals for this user yet.
                </p>
              ) : (
                <div style={{ display: "grid", gap: 12 }}>
                  {referrals.map((referral) => (
                    <div
                      key={referral.id}
                      style={{
                        padding: 14,
                        borderRadius: 16,
                        border: "1px solid #e5e7eb",
                        background: "#fafafa",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                        <div>
                          <p style={{ margin: 0, fontWeight: 800, fontSize: 15 }}>
                            {referral.name || "—"}{" "}
                            <span className="muted small" style={{ fontWeight: 600 }}>
                              ({referral.role || "—"})
                            </span>
                          </p>
                          <p className="muted small" style={{ margin: "4px 0 0" }}>
                            {referral.email} • Joined: {referral.joinedAt}
                          </p>
                        </div>
                      </div>

                      {referral.role === "EMPLOYER" && (
                        <div style={{ marginTop: 12, display: "grid", gap: 8 }}>
                          <p style={{ margin: 0 }}>
                            Jobs posted: <strong>{Number(referral.jobsPosted || 0)}</strong>
                          </p>
                          <p style={{ margin: 0 }}>
                            Current tokens: <strong>{Number(referral.tokens ?? 0).toLocaleString()}</strong>
                          </p>

                          {Array.isArray(referral.recentJobs) && referral.recentJobs.length > 0 && (
                            <div style={{ marginTop: 8 }}>
                              <p style={{ margin: "0 0 8px", fontWeight: 700 }}>Recent jobs</p>
                              <div style={{ display: "grid", gap: 8 }}>
                                {referral.recentJobs.map((job) => (
                                  <div
                                    key={job.id}
                                    style={{
                                      padding: "10px 12px",
                                      borderRadius: 12,
                                      background: "#fff",
                                      border: "1px solid #e5e7eb",
                                    }}
                                  >
                                    <p style={{ margin: 0, fontWeight: 700 }}>{job.title}</p>
                                    <p className="muted small" style={{ margin: "4px 0 0" }}>
                                      {job.status} • {formatWorkaHiveDate(job.createdAt)} •{" "}
                                      {Number(job._count?.applications || 0)} applications
                                    </p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {referral.role === "JOBSEEKER" && (
                        <div style={{ marginTop: 12, display: "grid", gap: 8 }}>
                          <p style={{ margin: 0 }}>
                            Total applications: <strong>{Number(referral.totalApplications || 0)}</strong>
                          </p>
                          <p style={{ margin: 0 }}>
                            Shortlisted: <strong>{Number(referral.shortlisted || 0)}</strong>
                          </p>
                          <p style={{ margin: 0 }}>
                            Current tokens: <strong>{Number(referral.tokens ?? 0).toLocaleString()}</strong>
                          </p>

                          {Array.isArray(referral.recentApplications) && referral.recentApplications.length > 0 && (
                            <div style={{ marginTop: 8 }}>
                              <p style={{ margin: "0 0 8px", fontWeight: 700 }}>Recent applications</p>
                              <div style={{ display: "grid", gap: 8 }}>
                                {referral.recentApplications.map((application) => (
                                  <div
                                    key={application.id}
                                    style={{
                                      padding: "10px 12px",
                                      borderRadius: 12,
                                      background: "#fff",
                                      border: "1px solid #e5e7eb",
                                    }}
                                  >
                                    <p style={{ margin: 0, fontWeight: 700 }}>
                                      {application.job?.title || "Untitled job"}
                                    </p>
                                    <p className="muted small" style={{ margin: "4px 0 0" }}>
                                      {application.job?.company?.name || "Unknown company"} • {application.status} •{" "}
                                      {formatWorkaHiveDateTime(application.createdAt)}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </SectionCard>

          <div style={{ marginTop: 16 }}>
            <Link href="/admin/users" className="btn-soft">
              Back to Users
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
