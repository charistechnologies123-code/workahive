import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";

function formatApplicationStatus(status) {
  const s = String(status || "").toUpperCase();
  if (!s) return "Unknown";
  return s.charAt(0) + s.slice(1).toLowerCase();
}

function formatDate(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString();
}

function formatWorkMode(value) {
  const v = String(value || "").toUpperCase();
  if (v === "REMOTE") return "Remote";
  if (v === "HYBRID") return "Hybrid";
  if (v === "ONSITE") return "On-site";
  return "—";
}

function renderCustomAnswers(customAnswers) {
  if (!customAnswers) return null;

  if (Array.isArray(customAnswers)) {
    if (customAnswers.length === 0) return null;

    return (
      <div style={{ display: "grid", gap: 10 }}>
        {customAnswers.map((item, index) => (
          <div
            key={index}
            style={{
              padding: "10px 12px",
              borderRadius: 10,
              border: "1px solid rgba(255,255,255,0.08)",
              background: "rgba(255,255,255,0.02)",
            }}
          >
            <p className="muted small" style={{ marginTop: 0 }}>
              {item?.label || `Response ${index + 1}`}
            </p>
            <p style={{ marginBottom: 0, whiteSpace: "pre-wrap" }}>
              {item?.answer || "—"}
            </p>
          </div>
        ))}
      </div>
    );
  }

  if (typeof customAnswers === "object") {
    const entries = Object.entries(customAnswers);
    if (entries.length === 0) return null;

    return (
      <div style={{ display: "grid", gap: 10 }}>
        {entries.map(([key, value]) => (
          <div
            key={key}
            style={{
              padding: "10px 12px",
              borderRadius: 10,
              border: "1px solid rgba(255,255,255,0.08)",
              background: "rgba(255,255,255,0.02)",
            }}
          >
            <p className="muted small" style={{ marginTop: 0 }}>
              {key}
            </p>
            <p style={{ marginBottom: 0, whiteSpace: "pre-wrap" }}>
              {typeof value === "string" ? value : JSON.stringify(value)}
            </p>
          </div>
        ))}
      </div>
    );
  }

  return (
    <p style={{ marginBottom: 0, whiteSpace: "pre-wrap" }}>
      {String(customAnswers)}
    </p>
  );
}

export default function EmployerApplicationsPage() {
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

  const totalApplications = useMemo(() => apps.length, [apps]);

  const loadApplications = async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);

    try {
      const res = await fetch("/api/applications/employer", {
        credentials: "include",
      });

      let json = {};
      try {
        json = await res.json();
      } catch {
        json = {};
      }

      if (!res.ok) {
        toast.error(json?.error || "Failed to fetch applications");
        setApps([]);
        return;
      }

      setApps(Array.isArray(json.applications) ? json.applications : []);
    } catch {
      toast.error("Failed to fetch applications");
      setApps([]);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const updateStatus = async (applicationId, status) => {
    setUpdatingId(applicationId);

    try {
      const res = await fetch("/api/applications/update-status", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ applicationId, status }),
      });

      let json = {};
      try {
        json = await res.json();
      } catch {
        json = {};
      }

      if (!res.ok) {
        toast.error(json?.error || "Failed to update status");
        return;
      }

      setApps((prev) =>
        prev.map((app) =>
          app.id === applicationId
            ? {
                ...app,
                status:
                  json?.application?.status ||
                  json?.status ||
                  status,
              }
            : app
        )
      );

      let successMessage = "Application updated";
      if (status === "SHORTLISTED") successMessage = "Application shortlisted";
      if (status === "REJECTED") successMessage = "Application rejected";
      if (status === "APPLIED") successMessage = "Application reset";

      toast.success(successMessage);
    } catch {
      toast.error("Failed to update status");
    } finally {
      setUpdatingId(null);
    }
  };

  useEffect(() => {
    loadApplications();
  }, []);

  return (
    <div className="container">
      <div className="page-head">
        <h1>Applications</h1>
        <p className="muted">
          Review applications submitted to jobs you posted on WorkaHive.
        </p>
      </div>

      <div className="card">
        <div
          className="card-head"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 16,
            flexWrap: "wrap",
          }}
        >
          <div>
            <h2 style={{ marginBottom: 6 }}>Overview</h2>
            <p className="muted" style={{ margin: 0 }}>
              Total Applications: <b>{totalApplications}</b>
            </p>
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button
              type="button"
              className="btn-soft"
              onClick={() => loadApplications()}
              disabled={loading}
            >
              {loading ? "Refreshing..." : "Refresh"}
            </button>
            <Link href="/employer/jobs" className="btn-primary">
              My Jobs
            </Link>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-head">
          <h2>All Applications</h2>
          <p className="muted">
            Applications from job seekers across all your posted jobs.
          </p>
        </div>

        {loading ? (
          <p className="muted">Loading applications…</p>
        ) : apps.length === 0 ? (
          <div>
            <p className="muted">No applications yet.</p>
            <div style={{ marginTop: 12 }}>
              <Link href="/employer/jobs" className="btn-soft">
                Back to My Jobs
              </Link>
            </div>
          </div>
        ) : (
          <div style={{ display: "grid", gap: 14 }}>
            {apps.map((a) => {
              const isUpdating = updatingId === a.id;

              return (
                <div
                  key={a.id}
                  className="card"
                  style={{
                    margin: 0,
                    border: "1px solid rgba(255,255,255,0.08)",
                  }}
                >
                  <div
                    className="card-head"
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      gap: 14,
                      flexWrap: "wrap",
                    }}
                  >
                    <div>
                      <h3 style={{ marginBottom: 6 }}>
                        {a.job?.title || "Untitled Job"}
                      </h3>

                      <p className="muted small" style={{ margin: 0 }}>
                        Applicant: <b>{a.applicant?.name || "N/A"}</b>{" "}
                        {a.applicant?.email ? `(${a.applicant.email})` : ""}
                      </p>

                      <p
                        className="muted small"
                        style={{ marginTop: 6, marginBottom: 0 }}
                      >
                        Applied: <b>{formatDate(a.createdAt)}</b>
                      </p>
                    </div>

                    <span
                      className={`status-pill status-${String(a.status || "").toLowerCase()}`}
                    >
                      Status: {formatApplicationStatus(a.status)}
                    </span>
                  </div>

                  <div style={{ display: "grid", gap: 12 }}>
                    <div
                      style={{
                        padding: "12px 14px",
                        borderRadius: 12,
                        border: "1px solid rgba(255,255,255,0.08)",
                        background: "rgba(255,255,255,0.03)",
                      }}
                    >
                      <p className="muted small" style={{ marginTop: 0 }}>
                        Job Details
                      </p>
                      <p style={{ margin: 0 }}>
                        <b>Title:</b> {a.job?.title || "—"}
                      </p>
                      <p style={{ marginTop: 6, marginBottom: 0 }}>
                        <b>Status:</b> {a.job?.status || "—"}
                      </p>

                      <div
                        className="muted small"
                        style={{
                          marginTop: 8,
                          display: "flex",
                          gap: 8,
                          flexWrap: "wrap",
                        }}
                      >
                        <span>{a.job?.category || "—"}</span>
                        <span>•</span>
                        <span>{a.job?.type || "—"}</span>
                        <span>•</span>
                        <span>{formatWorkMode(a.job?.workMode)}</span>
                        <span>•</span>
                        <span>{a.job?.location || "—"}</span>
                      </div>
                    </div>

                    <div
                      style={{
                        padding: "12px 14px",
                        borderRadius: 12,
                        border: "1px solid rgba(255,255,255,0.08)",
                        background: "rgba(255,255,255,0.03)",
                      }}
                    >
                      <p className="muted small" style={{ marginTop: 0 }}>
                        Applicant Details
                      </p>
                      <p style={{ margin: 0 }}>
                        <b>Name:</b> {a.applicant?.name || "N/A"}
                      </p>
                      <p style={{ marginTop: 6, marginBottom: 0 }}>
                        <b>Email:</b> {a.applicant?.email || "N/A"}
                      </p>
                    </div>

                    {a.cvPath && (
                      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                        <a
                          href={a.cvPath}
                          target="_blank"
                          rel="noreferrer"
                          className="btn-primary"
                        >
                          View CV
                        </a>
                      </div>
                    )}

                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                      <button
                        type="button"
                        className="btn-soft"
                        onClick={() => updateStatus(a.id, "SHORTLISTED")}
                        disabled={isUpdating || a.status === "SHORTLISTED"}
                      >
                        {isUpdating && a.status !== "SHORTLISTED"
                          ? "Updating..."
                          : "Shortlist"}
                      </button>

                      <button
                        type="button"
                        className="btn-soft"
                        onClick={() => updateStatus(a.id, "REJECTED")}
                        disabled={isUpdating || a.status === "REJECTED"}
                      >
                        {isUpdating && a.status !== "REJECTED"
                          ? "Updating..."
                          : "Reject"}
                      </button>

                      <button
                        type="button"
                        className="btn-soft"
                        onClick={() => updateStatus(a.id, "APPLIED")}
                        disabled={isUpdating || a.status === "APPLIED"}
                      >
                        {isUpdating && a.status !== "APPLIED"
                          ? "Updating..."
                          : "Reset"}
                      </button>
                    </div>

                    {a.coverLetter && (
                      <div
                        style={{
                          padding: "12px 14px",
                          borderRadius: 12,
                          border: "1px solid rgba(255,255,255,0.08)",
                          background: "rgba(255,255,255,0.03)",
                        }}
                      >
                        <p className="muted small" style={{ marginTop: 0 }}>
                          Cover Letter
                        </p>
                        <p style={{ whiteSpace: "pre-wrap", marginBottom: 0 }}>
                          {a.coverLetter}
                        </p>
                      </div>
                    )}

                    {a.customAnswers && (
                      <div
                        style={{
                          padding: "12px 14px",
                          borderRadius: 12,
                          border: "1px solid rgba(255,255,255,0.08)",
                          background: "rgba(255,255,255,0.03)",
                        }}
                      >
                        <p className="muted small" style={{ marginTop: 0 }}>
                          Custom Responses
                        </p>
                        {renderCustomAnswers(a.customAnswers)}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}