import { useRouter } from "next/router";
import Link from "next/link";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

export default function AdminJobModerate() {
  const router = useRouter();
  const { id } = router.query;
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    if (!id) return;
    setLoading(true);
    const res = await fetch(`/api/jobs/${id}`, { credentials: "include" });
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error || "Failed to load job");
      setJob(null);
      setLoading(false);
      return;
    }
    setJob(data);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [id]);

  const setStatus = async (status) => {
    setBusy(true);
    const res = await fetch(`/api/jobs/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ status }),
    });
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error || "Failed to update status");
      setBusy(false);
      return;
    }
    setJob(data);
    toast.success(status === "OPEN" ? "Job reopened." : "Job closed.");
    setBusy(false);
  };

  if (loading) return <div className="container"><p className="muted">Loading...</p></div>;
  if (!job) return <div className="container"><p className="muted">Job not found.</p></div>;

  return (
    <div className="container">
      <div className="card">
        <div className="card-head">
          <h1 style={{ marginBottom: 6 }}>{job.title}</h1>
          <p className="muted">{job.company?.name || "Unknown company"} • {job.location || "—"}</p>
        </div>

        <p className="muted small">Applicants: {job.applicantsCount ?? 0} • Status: {job.status}</p>
        <div className="job-richtext" dangerouslySetInnerHTML={{ __html: job.description || "" }} />

        <div style={{ display: "flex", gap: 10, marginTop: 20, flexWrap: "wrap" }}>
          <Link href="/admin/jobs" className="btn-soft">Back to Jobs</Link>
          {job.status === "OPEN" ? (
            <button className="btn-primary" type="button" disabled={busy} onClick={() => setStatus("CLOSED")}>
              {busy ? "Please wait..." : "Close Job"}
            </button>
          ) : (
            <button className="btn-soft" type="button" disabled={busy} onClick={() => setStatus("OPEN")}>
              {busy ? "Please wait..." : "Re-open Job"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
