import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";

const FILTERS = ["ALL", "SAVED", "APPLIED", "SHORTLISTED", "REJECTED"];

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

function getStatusMeta(status) {
  const s = String(status || "").toUpperCase();

  if (s === "SHORTLISTED") {
    return {
      label: "Shortlisted",
      className: "status-pill status-open",
      style: {
        background: "rgba(34,197,94,0.14)",
        color: "#86efac",
        border: "1px solid rgba(34,197,94,0.35)",
      },
    };
  }

  if (s === "REJECTED") {
    return {
      label: "Rejected",
      className: "status-pill",
      style: {
        background: "rgba(239,68,68,0.14)",
        color: "#fca5a5",
        border: "1px solid rgba(239,68,68,0.35)",
      },
    };
  }

  if (s === "APPLIED") {
    return {
      label: "Applied",
      className: "status-pill",
      style: {
        background: "rgba(249,115,22,0.14)",
        color: "#fdba74",
        border: "1px solid rgba(249,115,22,0.35)",
      },
    };
  }

  return {
    label: "Saved",
    className: "status-pill",
    style: {
      background: "rgba(59,130,246,0.14)",
      color: "#93c5fd",
      border: "1px solid rgba(59,130,246,0.35)",
    },
  };
}

export default function JobSeekerMyJobsPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("ALL");

  const counts = useMemo(() => {
    const summary = {
      ALL: items.length,
      SAVED: 0,
      APPLIED: 0,
      SHORTLISTED: 0,
      REJECTED: 0,
    };

    items.forEach((item) => {
      const key = String(item.interactionStatus || "").toUpperCase();
      if (summary[key] != null) summary[key] += 1;
    });

    return summary;
  }, [items]);

  const filteredItems = useMemo(() => {
    if (activeFilter === "ALL") return items;
    return items.filter(
      (item) =>
        String(item.interactionStatus || "").toUpperCase() === activeFilter
    );
  }, [items, activeFilter]);

  const loadJobs = async () => {
    setLoading(true);

    try {
      const res = await fetch("/api/jobseeker/my-jobs", {
        credentials: "include",
      });

      let json = {};
      try {
        json = await res.json();
      } catch {
        json = {};
      }

      if (!res.ok) {
        toast.error(json?.error || "Failed to load your jobs");
        setItems([]);
        return;
      }

      setItems(Array.isArray(json.jobs) ? json.jobs : []);
    } catch {
      toast.error("Failed to load your jobs");
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadJobs();
  }, []);

  return (
    <div className="container">
      <div className="page-head">
        <h1>My Jobs</h1>
        <p className="muted">
          Track jobs you have saved or applied to on WorkaHive.
        </p>
      </div>

      <div className="card">
        <div
          className="card-head"
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 14,
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <div>
            <h2 style={{ marginBottom: 6 }}>Job Activity</h2>
            <p className="muted" style={{ margin: 0 }}>
              All your saved and application-based job interactions in one place.
            </p>
          </div>

          <button type="button" className="btn-soft" onClick={loadJobs}>
            Refresh
          </button>
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 6 }}>
          {FILTERS.map((filter) => {
            const isActive = activeFilter === filter;

            return (
              <button
                key={filter}
                type="button"
                className={isActive ? "btn-primary" : "btn-soft"}
                onClick={() => setActiveFilter(filter)}
              >
                {filter.charAt(0) + filter.slice(1).toLowerCase()} ({counts[filter] || 0})
              </button>
            );
          })}
        </div>
      </div>

      <div className="card">
        <div className="card-head">
          <h2>
            {activeFilter === "ALL"
              ? "All Interacted Jobs"
              : `${activeFilter.charAt(0) + activeFilter.slice(1).toLowerCase()} Jobs`}
          </h2>
          <p className="muted">
            Jobs are shown by their latest interaction status.
          </p>
        </div>

        {loading ? (
          <p className="muted">Loading jobs…</p>
        ) : filteredItems.length === 0 ? (
          <div>
            <p className="muted">No jobs found for this filter.</p>
            <div style={{ marginTop: 12 }}>
              <Link href="/jobs" className="btn-primary">
                Browse Jobs
              </Link>
            </div>
          </div>
        ) : (
          <div style={{ display: "grid", gap: 14 }}>
            {filteredItems.map((item) => {
              const statusMeta = getStatusMeta(item.interactionStatus);

              return (
                <div
                  key={item.jobId}
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
                      gap: 12,
                      flexWrap: "wrap",
                    }}
                  >
                    <div>
                      <h3 style={{ marginBottom: 6 }}>{item.title || "Untitled Job"}</h3>
                      <p className="muted small" style={{ margin: 0 }}>
                        {item.companyName || "—"} • {item.location || "—"} • {item.type || "—"} • {item.category || "—"}
                      </p>
                    </div>

                    <span className={statusMeta.className} style={statusMeta.style}>
                      {statusMeta.label}
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
                        <b>Work Mode:</b> {formatWorkMode(item.workMode)}
                      </p>
                      <p style={{ marginTop: 6, marginBottom: 0 }}>
                        <b>Status Updated:</b> {formatDate(item.interactedAt)}
                      </p>
                    </div>

                    {item.description && (
                      <div
                        style={{
                          padding: "12px 14px",
                          borderRadius: 12,
                          border: "1px solid rgba(255,255,255,0.08)",
                          background: "rgba(255,255,255,0.03)",
                        }}
                      >
                        <p className="muted small" style={{ marginTop: 0 }}>
                          Description
                        </p>
                        <p style={{ marginBottom: 0, whiteSpace: "pre-wrap" }}>
                          {item.description}
                        </p>
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