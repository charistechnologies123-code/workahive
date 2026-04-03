import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";

function formatStatus(status) {
  const s = String(status || "").toUpperCase();
  if (!s) return "Unknown";
  return s.charAt(0) + s.slice(1).toLowerCase();
}

function formatWorkMode(workMode) {
  const x = String(workMode || "").toUpperCase();
  if (x === "REMOTE") return "Remote";
  if (x === "HYBRID") return "Hybrid";
  if (x === "ONSITE") return "On-site";
  return "—";
}

function formatDate(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString();
}

export default function EmployerJobsPage() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyJobId, setBusyJobId] = useState(null);

  const openCount = useMemo(
    () => jobs.filter((job) => String(job.status || "").toUpperCase() === "OPEN").length,
    [jobs]
  );

  const closedCount = useMemo(
    () => jobs.filter((job) => String(job.status || "").toUpperCase() === "CLOSED").length,
    [jobs]
  );

  const loadJobs = async () => {
    setLoading(true);

    try {
      const res = await fetch("/api/jobs?status=ALL", {
        credentials: "include",
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Failed to load your jobs");
        setJobs([]);
        return;
      }

      const rows = Array.isArray(data) ? data : data.jobs || [];
      setJobs(rows);
    } catch {
      toast.error("Failed to load your jobs");
      setJobs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadJobs();
  }, []);

  const updateStatus = async (jobId, nextStatus) => {
    setBusyJobId(jobId);

    try {
      const res = await fetch(`/api/jobs/${jobId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status: nextStatus }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(
          data.error ||
            (nextStatus === "CLOSED" ? "Failed to close job" : "Failed to re-open job")
        );
        return;
      }

      setJobs((prev) =>
        prev.map((job) =>
          job.id === jobId
            ? {
                ...job,
                ...data,
                applicantsCount:
                  typeof data.applicantsCount === "number"
                    ? data.applicantsCount
                    : typeof job.applicantsCount === "number"
                    ? job.applicantsCount
                    : 0,
              }
            : job
        )
      );

      toast.success(
        nextStatus === "CLOSED" ? "Job closed successfully." : "Job re-opened successfully."
      );
    } catch {
      toast.error(nextStatus === "CLOSED" ? "Failed to close job" : "Failed to re-open job");
    } finally {
      setBusyJobId(null);
    }
  };

  return (
    <div className="container">
      <div className="page-head">
        <h1>My Jobs</h1>
        <p className="muted">
          View and manage all jobs you have posted.
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
              Total: <b>{jobs.length}</b> • Open: <b>{openCount}</b> • Closed: <b>{closedCount}</b>
            </p>
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button type="button" className="btn-soft" onClick={loadJobs}>
              Refresh
            </button>
            <Link href="/employer/dashboard" className="btn-primary">
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-head">
          <h2>Your Posted Jobs</h2>
        </div>

        {loading ? (
          <p className="muted">Loading jobs…</p>
        ) : jobs.length === 0 ? (
          <div>
            <p className="muted">You have not posted any jobs yet.</p>
            <div style={{ marginTop: 12 }}>
              <Link href="/employer/dashboard" className="btn-primary">
                Go to Dashboard
              </Link>
            </div>
          </div>
        ) : (
          <div className="job-list">
            {jobs.map((job) => {
              const status = String(job.status || "").toUpperCase();
              const applicantsCount =
                typeof job.applicantsCount === "number"
                  ? job.applicantsCount
                  : typeof job.applicationsCount === "number"
                  ? job.applicationsCount
                  : Array.isArray(job.applications)
                  ? job.applications.length
                  : 0;

              return (
                <div
                  key={job.id}
                  className="job-item"
                  style={{
                    display: "grid",
                    gap: 12,
                    paddingBlock: 16,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      gap: 16,
                      flexWrap: "wrap",
                    }}
                  >
                    <div>
                      <p className="job-title" style={{ marginBottom: 6 }}>
                        {job.title || "Untitled Job"}
                      </p>

                      <p className="muted small" style={{ margin: 0 }}>
                        {job.category || "—"} • {job.type || "—"} •{" "}
                        {formatWorkMode(job.workMode)} • {job.location || "—"}
                      </p>

                      <p className="muted small" style={{ marginTop: 6, marginBottom: 0 }}>
                        Applicants: <b>{applicantsCount}</b> • Posted:{" "}
                        <b>{formatDate(job.createdAt)}</b>
                      </p>

                      {Array.isArray(job.applicationFields) &&
                        job.applicationFields.length > 0 && (
                          <p className="muted small" style={{ marginTop: 6, marginBottom: 0 }}>
                            Custom questions: <b>{job.applicationFields.length}</b>
                          </p>
                        )}
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: 10, alignItems: "flex-end" }}>
                      <span
                        className={`status-pill status-${String(job.status || "").toLowerCase()}`}
                      >
                        Status: {formatStatus(job.status)}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                    <Link href={`/employer/jobs/${job.id}`} className="btn-primary">
                      View / Edit
                    </Link>

                    {status === "OPEN" ? (
                      <button
                        type="button"
                        className="btn-primary"
                        onClick={() => updateStatus(job.id, "CLOSED")}
                        disabled={busyJobId === job.id}
                      >
                        {busyJobId === job.id ? "Please wait…" : "Close Job"}
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="btn-soft"
                        onClick={() => updateStatus(job.id, "OPEN")}
                        disabled={busyJobId === job.id}
                      >
                        {busyJobId === job.id ? "Please wait…" : "Re-open Job"}
                      </button>
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