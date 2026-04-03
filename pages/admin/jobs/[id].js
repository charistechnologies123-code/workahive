import { useRouter } from "next/router";
import { useEffect, useState } from "react";

export default function AdminJobModerate() {
  const router = useRouter();
  const { id } = router.query;

  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const load = async () => {
    if (!id) return;
    setLoading(true);
    setError("");
    setSuccess("");

    const res = await fetch(`/api/jobs/${id}`, { credentials: "include" });
    const data = await res.json();

    if (!res.ok) {
      setError(data.error || "Failed to load job");
      setLoading(false);
      return;
    }

    setJob(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, [id]);

  const setStatus = async (status) => {
    setError("");
    setSuccess("");

    const res = await fetch(`/api/jobs/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ status }),
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Failed to update status");
      return;
    }

    setJob(data);
    setSuccess(`Job marked as ${status}.`);
  };

  if (loading) return <div className="container"><p className="muted">Loading…</p></div>;
  if (error) return <div className="container"><div className="alert alert-error">{error}</div></div>;
  if (!job) return <div className="container"><p className="muted">Job not found.</p></div>;

  return (
    <div className="container">
      <div className="card">
        <div className="card-head">
          <h1 style={{ marginBottom: 6 }}>{job.title}</h1>
          <p className="muted small">{job.company?.name || "—"} • {job.location || "—"}</p>
           <p className="muted small">
    Applicants: <b>{job.applicantsCount}</b>
  </p>

          <div style={{ marginTop: 10 }}>
            <span className={`status-pill status-${String(job.status || "").toLowerCase()}`}>
              {job.status}
            </span>
          </div>
        </div>
<h3> Description: </h3> 
        {success && <div className="alert alert-success">{success}</div>}

        <div style={{ whiteSpace: "pre-wrap", marginTop: 12 }}>{job.description}</div>

        <div style={{ display: "flex", gap: 10, marginTop: 16, flexWrap: "wrap" }}>
          <button className="btn-primary" onClick={() => setStatus("APPROVED")}>Approve</button>
          <button className="btn-outline" onClick={() => setStatus("REJECTED")}>Reject</button>
          <button className="btn-outline" onClick={() => setStatus("PENDING")}>Back to Pending</button>
          <button className="btn-outline" onClick={() => setStatus("CLOSED")}>Close</button>
        </div>
      </div>
    </div>
  );
}