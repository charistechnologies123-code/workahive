import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import toast from "react-hot-toast";

function CoinIcon() {
  return (
    <span aria-hidden="true" style={{ marginRight: 6 }}>
      🪙
    </span>
  );
}

function CompaniesAdmin() {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [selected, setSelected] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsErr, setDetailsErr] = useState("");

  const load = async () => {
    setLoading(true);
    setErr("");

    const res = await fetch("/api/admin/companies", { credentials: "include" });
    const data = await res.json();

    if (!res.ok) {
      setErr(data.error || "Failed to load companies");
      setCompanies([]);
    } else {
      setCompanies(Array.isArray(data?.companies) ? data.companies : []);
    }

    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const toggleVerify = async (id, current, companyName = "this company") => {
    const action = current ? "unverify" : "verify";
    const sure = confirm(`Are you sure you want to ${action} "${companyName}"?`);
    if (!sure) return;

    const res = await fetch(`/api/admin/companies/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ verified: !current }),
    });

    const data = await res.json();

    if (!res.ok) {
      toast.error(data.error || "Failed to update company verification");
      return;
    }

    setCompanies((prev) =>
      prev.map((c) => (c.id === id ? { ...c, verified: !current } : c))
    );

    setSelected((prev) =>
      prev && prev.id === id ? { ...prev, verified: !current } : prev
    );

    toast.success(
      !current ? "Company verified successfully" : "Company unverified successfully"
    );
  };

  const openDetails = async (companyId) => {
    setSelected(null);
    setDetailsErr("");
    setDetailsLoading(true);

    const res = await fetch(`/api/admin/companies/${companyId}`, {
      credentials: "include",
    });
    const data = await res.json();

    if (!res.ok) {
      const message = data.error || "Failed to load company details";
      setDetailsErr(message);
      toast.error(message);
    } else {
      setSelected(data.company || null);
    }

    setDetailsLoading(false);
  };

  const closeDetails = () => {
    setSelected(null);
    setDetailsErr("");
    setDetailsLoading(false);
  };

  if (loading) return <p className="muted">Loading companies…</p>;
  if (err) return <p style={{ color: "red" }}>{err}</p>;
  if (companies.length === 0) return <p className="muted">No companies yet.</p>;

  return (
    <>
      <div className="job-list">
        {companies.map((c) => (
          <div key={c.id} className="job-item">
            <div>
              <p className="job-title">{c.name}</p>
              <p className="muted small">
                Owner: {c.owner?.email || "—"} • {c.location || "—"} •{" "}
                {c.industry || "—"}
              </p>
              <p className="muted small" style={{ marginTop: 4 }}>
                {c.verified ? "Verified" : "Not verified"}{" "}
                {c.website ? `• ${c.website}` : ""}
              </p>
            </div>

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button
                className="btn-soft"
                onClick={() => openDetails(c.id)}
                type="button"
              >
                View Details
              </button>

              <button
                className={c.verified ? "btn-soft" : "btn-primary"}
                onClick={() => toggleVerify(c.id, c.verified, c.name)}
                type="button"
              >
                {c.verified ? "Unverify" : "Verify"}
              </button>
            </div>
          </div>
        ))}
      </div>

      {(detailsLoading || detailsErr || selected) && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={closeDetails}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
            zIndex: 999,
          }}
        >
          <div
            className="card"
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "min(820px, 100%)",
              maxHeight: "90vh",
              overflowY: "auto",
            }}
          >
            <div className="card-head">
              <h2 style={{ marginBottom: 6 }}>Company Details</h2>
              <p className="muted">
                Review company information before verifying the employer.
              </p>
            </div>

            {detailsLoading && <p className="muted">Loading company details…</p>}

            {detailsErr && <div className="alert alert-error">{detailsErr}</div>}

            {selected && (
              <div className="form">
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 12,
                    flexWrap: "wrap",
                    alignItems: "flex-start",
                    marginBottom: 8,
                  }}
                >
                  <div>
                    <h3 style={{ marginTop: 0, marginBottom: 6 }}>
                      {selected.name || "—"}
                    </h3>
                    <p className="muted small" style={{ margin: 0 }}>
                      Status:{" "}
                      <strong>
                        {selected.verified ? "VERIFIED" : "NOT VERIFIED"}
                      </strong>
                    </p>
                  </div>

                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <button
                      className={selected.verified ? "btn-soft" : "btn-primary"}
                      type="button"
                      onClick={() =>
                        toggleVerify(selected.id, selected.verified, selected.name)
                      }
                    >
                      {selected.verified ? "Unverify" : "Verify"}
                    </button>
                    <button
                      className="btn-soft"
                      type="button"
                      onClick={closeDetails}
                    >
                      Close
                    </button>
                  </div>
                </div>

                <div className="grid-2">
                  <div className="field">
                    <label>Owner Name</label>
                    <input value={selected.owner?.name || ""} readOnly />
                  </div>

                  <div className="field">
                    <label>Owner Email</label>
                    <input value={selected.owner?.email || ""} readOnly />
                  </div>

                  <div className="field">
                    <label>Owner Tokens</label>
                    <input value={String(selected.owner?.tokens ?? 0)} readOnly />
                  </div>

                  <div className="field">
                    <label>Location</label>
                    <input value={selected.location || ""} readOnly />
                  </div>

                  <div className="field">
                    <label>Industry</label>
                    <input value={selected.industry || ""} readOnly />
                  </div>

                  <div className="field">
                    <label>Website</label>
                    <input value={selected.website || ""} readOnly />
                  </div>

                  <div className="field">
                    <label>Registration Number</label>
                    <input value={selected.regNo || ""} readOnly />
                  </div>

                  <div className="field">
                    <label>Logo Path</label>
                    <input value={selected.logoPath || ""} readOnly />
                  </div>
                </div>

                <div className="field">
                  <label>Description</label>
                  <textarea
                    value={selected.description || ""}
                    readOnly
                    rows={4}
                  />
                </div>

                <div className="field">
                  <label>Proof Note</label>
                  <textarea
                    value={selected.proofNote || ""}
                    readOnly
                    rows={3}
                  />
                </div>

                <div className="grid-2">
                  <div className="field">
                    <label>Facebook</label>
                    <input value={selected.facebook || ""} readOnly />
                  </div>

                  <div className="field">
                    <label>Instagram</label>
                    <input value={selected.instagram || ""} readOnly />
                  </div>

                  <div className="field">
                    <label>LinkedIn</label>
                    <input value={selected.linkedin || ""} readOnly />
                  </div>

                  <div className="field">
                    <label>X</label>
                    <input value={selected.x || ""} readOnly />
                  </div>

                  <div className="field">
                    <label>YouTube</label>
                    <input value={selected.youtube || ""} readOnly />
                  </div>
                </div>

                {Array.isArray(selected.jobs) && selected.jobs.length > 0 && (
                  <div style={{ marginTop: 8 }}>
                    <label
                      style={{
                        display: "block",
                        fontWeight: 600,
                        marginBottom: 8,
                      }}
                    >
                      Recent Jobs
                    </label>

                    <div className="job-list">
                      {selected.jobs.map((job) => (
                        <div key={job.id} className="job-item">
                          <div>
                            <p className="job-title">{job.title}</p>
                            <p className="muted small">
                              {job.status || "—"}
                              {job.createdAt
                                ? ` • ${new Date(job.createdAt).toLocaleString()}`
                                : ""}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

function TokenSettingsAdmin() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    freeTokensNewEmployer: 0,
    tokensPerJobPost: 1,
  });

  const load = async () => {
    setLoading(true);

    const res = await fetch("/api/admin/token-settings", {
      credentials: "include",
    });
    const data = await res.json();

    if (!res.ok) {
      toast.error(data.error || "Failed to load token settings");
      setLoading(false);
      return;
    }

    setForm({
      freeTokensNewEmployer: Number(data.freeTokensNewEmployer ?? 0),
      tokensPerJobPost: Number(data.tokensPerJobPost ?? 1),
    });
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);

    const res = await fetch("/api/admin/token-settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        freeTokensNewEmployer: Number(form.freeTokensNewEmployer),
        tokensPerJobPost: Number(form.tokensPerJobPost),
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      toast.error(data.error || "Failed to save token settings");
      setSaving(false);
      return;
    }

    toast.success("Token settings saved.");
    setSaving(false);
  };

  return (
    <div className="card">
      <div className="card-head">
        <h2>
          <CoinIcon />
          Token Settings
        </h2>
        <p className="muted">
          Set free tokens for new employers and how many tokens are required to
          post a job.
        </p>
      </div>

      {loading ? (
        <p className="muted">Loading token settings…</p>
      ) : (
        <form onSubmit={save} className="form">
          <div className="grid-2">
            <div className="field">
              <label>Free tokens for new employers</label>
              <input
                type="number"
                min="0"
                value={form.freeTokensNewEmployer}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    freeTokensNewEmployer: e.target.value,
                  }))
                }
                required
              />
            </div>

            <div className="field">
              <label>Tokens required per job post</label>
              <input
                type="number"
                min="1"
                value={form.tokensPerJobPost}
                onChange={(e) =>
                  setForm((p) => ({ ...p, tokensPerJobPost: e.target.value }))
                }
                required
              />
            </div>
          </div>

          <button className="btn-primary" type="submit" disabled={saving}>
            {saving ? "Saving…" : "Save Settings"}
          </button>
        </form>
      )}
    </div>
  );
}

function EmployerTokensAdmin() {
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [list, setList] = useState([]);

  const [tokenInputs, setTokenInputs] = useState({});

  const search = async () => {
    setLoading(true);

    const url = q.trim()
      ? `/api/admin/employers?q=${encodeURIComponent(q.trim())}`
      : `/api/admin/employers`;

    const res = await fetch(url, { credentials: "include" });
    const data = await res.json();

    if (!res.ok) {
      toast.error(data.error || "Failed to load employers");
      setList([]);
      setLoading(false);
      return;
    }

    const employers = Array.isArray(data.employers) ? data.employers : [];
    setList(employers);

    setTokenInputs((prev) => {
      const next = { ...prev };
      for (const u of employers) {
        if (next[u.id] === undefined) next[u.id] = u.tokens ?? 0;
      }
      return next;
    });

    setLoading(false);
  };

  useEffect(() => {
    search();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setTokens = async (userId) => {
    const tokens = Number(tokenInputs[userId]);

    if (!Number.isFinite(tokens) || tokens < 0) {
      toast.error("Tokens must be a number greater than or equal to 0.");
      return;
    }

    const res = await fetch(`/api/admin/users/${userId}/tokens`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ tokens }),
    });

    const data = await res.json();

    if (!res.ok) {
      toast.error(data.error || "Failed to set tokens");
      return;
    }

    setList((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, tokens: data.user.tokens } : u))
    );
    setTokenInputs((prev) => ({ ...prev, [userId]: data.user.tokens }));
    toast.success("Employer token balance updated.");
  };

  return (
    <div className="card">
      <div className="card-head">
        <h2>
          <CoinIcon />
          Employer Tokens
        </h2>
        <p className="muted">
          Search employers and update their token balance (e.g., after payment).
        </p>
      </div>

      <div className="form" style={{ marginBottom: 12 }}>
        <div className="field">
          <label>Search employer (name or email)</label>
          <div className="input-wrap">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="e.g. lawrence@company.com"
            />
            <button
              type="button"
              className="btn-soft"
              onClick={search}
              disabled={loading}
              style={{ whiteSpace: "nowrap" }}
            >
              {loading ? "Searching…" : "Search"}
            </button>
          </div>
        </div>
      </div>

      {loading && <p className="muted">Loading employers…</p>}

      {!loading && list.length === 0 && (
        <p className="muted">No employers found.</p>
      )}

      {!loading && list.length > 0 && (
        <div className="job-list">
          {list.map((u) => (
            <div key={u.id} className="job-item">
              <div>
                <p className="job-title">{u.name || "—"}</p>
                <p className="muted small">
                  {u.email} • <CoinIcon /> {u.tokens ?? 0} tokens
                </p>
              </div>

              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <input
                  type="number"
                  min="0"
                  value={tokenInputs[u.id] ?? 0}
                  onChange={(e) =>
                    setTokenInputs((p) => ({ ...p, [u.id]: e.target.value }))
                  }
                  style={{ width: 110 }}
                />
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => setTokens(u.id)}
                >
                  Set
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function UsersAdmin({ currentAdminId }) {
  const [q, setQ] = useState("");
  const [role, setRole] = useState("ALL");
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState([]);

  const load = async () => {
    setLoading(true);

    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    if (role && role !== "ALL") params.set("role", role);

    const url = `/api/admin/users${
      params.toString() ? `?${params.toString()}` : ""
    }`;

    const res = await fetch(url, { credentials: "include" });
    const data = await res.json();

    if (!res.ok) {
      toast.error(data.error || "Failed to load users");
      setUsers([]);
      setLoading(false);
      return;
    }

    setUsers(Array.isArray(data.users) ? data.users : []);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const removeUser = async (user) => {
    if (Number(user.id) === Number(currentAdminId)) {
      toast.error("You cannot delete your own account.");
      return;
    }

    const sure = confirm(
      `Delete user "${user.email}" (${user.role})?\n\nThis will permanently remove the user and cascade-delete related records.`
    );
    if (!sure) return;

    const res = await fetch(`/api/admin/users/${user.id}`, {
      method: "DELETE",
      credentials: "include",
    });

    const data = await res.json();

    if (!res.ok) {
      toast.error(data.error || "Failed to delete user");
      return;
    }

    toast.success("User deleted.");
    setUsers((prev) => prev.filter((u) => u.id !== user.id));
  };

  return (
    <div className="card">
      <div className="card-head">
        <h2>Users</h2>
        <p className="muted">
          Search and manage users. Deleting a user permanently removes them and
          related records (cascade delete).
        </p>
      </div>

      <div className="form" style={{ marginBottom: 12 }}>
        <div className="grid-2">
          <div className="field">
            <label>Search (name or email)</label>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="e.g. jane@domain.com"
            />
          </div>

          <div className="field">
            <label>Role</label>
            <select value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="ALL">All</option>
              <option value="EMPLOYER">Employer</option>
              <option value="JOBSEEKER">Jobseeker</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button
            className="btn-soft"
            type="button"
            onClick={load}
            disabled={loading}
          >
            {loading ? "Loading…" : "Search"}
          </button>

          <button
            className="btn-soft"
            type="button"
            onClick={() => {
              setQ("");
              setRole("ALL");
              setTimeout(load, 0);
            }}
          >
            Reset
          </button>
        </div>
      </div>

      {loading && <p className="muted">Loading users…</p>}
      {!loading && users.length === 0 && <p className="muted">No users found.</p>}

      {!loading && users.length > 0 && (
        <div className="job-list">
          {users.map((u) => (
            <div key={u.id} className="job-item">
              <div>
                <p className="job-title">{u.name || "—"}</p>
                <p className="muted small">
                  {u.email} • <strong>{u.role}</strong>
                  {u.role === "EMPLOYER" ? ` • 🪙 ${u.tokens ?? 0} tokens` : ""}
                </p>
              </div>

              <button
                type="button"
                className="btn-soft"
                onClick={() => removeUser(u)}
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AdminDashboard() {
  const [jobs, setJobs] = useState([]);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [adminId, setAdminId] = useState(null);
  const router = useRouter();

  const fetchJobs = async () => {
    setLoadingJobs(true);

    const res = await fetch("/api/jobs?status=ALL", { credentials: "include" });

    if (res.status === 401) {
      router.push("/login");
      return;
    }

    const data = await res.json();

    if (!res.ok) {
      toast.error(data.error || "Failed to load jobs");
      setJobs([]);
      setLoadingJobs(false);
      return;
    }

    const list = Array.isArray(data)
      ? data
      : Array.isArray(data?.jobs)
      ? data.jobs
      : [];

    setJobs(list);
    setLoadingJobs(false);
  };

  const fetchMe = async () => {
    try {
      const res = await fetch("/api/auth/me", { credentials: "include" });
      const data = await res.json();
      if (data?.user?.id) setAdminId(data.user.id);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchJobs();
    fetchMe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateStatus = async (jobId, status) => {
    const res = await fetch(`/api/jobs/${jobId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ status }),
    });

    const data = await res.json().catch(() => ({}));

    if (res.ok) {
      toast.success(
        status === "OPEN" ? "Job reopened successfully." : "Job closed successfully."
      );
      fetchJobs();
      return;
    }

    toast.error(data.error || "Action failed");
  };

  const openJobs = jobs.filter((j) => j.status === "OPEN");
  const closedJobs = jobs.filter((j) => j.status === "CLOSED");

  return (
    <div className="container">
      <h2>Admin Dashboard</h2>

      <div className="card">
        <div className="card-head">
          <h2>Jobs</h2>
          <p className="muted">
            Companies post jobs instantly once verified. Admin can close or reopen jobs.
          </p>
          <p className="muted small" style={{ marginTop: 6 }}>
            Open: <strong>{openJobs.length}</strong> • Closed:{" "}
            <strong>{closedJobs.length}</strong>
          </p>
        </div>

        {loadingJobs && <p className="muted">Loading jobs…</p>}

        {!loadingJobs && jobs.length === 0 && <p className="muted">No jobs yet.</p>}

        {!loadingJobs &&
          jobs.map((job) => {
            const isOpen = job.status === "OPEN";

            return (
              <div key={job.id} className="card" style={{ marginBottom: 12 }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 12,
                    flexWrap: "wrap",
                    alignItems: "baseline",
                  }}
                >
                  <h4 style={{ marginTop: 0, marginBottom: 6 }}>{job.title}</h4>

                  <span
                    className="muted small"
                    style={{
                      padding: "4px 10px",
                      borderRadius: 999,
                      border: "1px solid rgba(255,255,255,0.12)",
                    }}
                  >
                    {job.status || "—"}
                  </span>
                </div>

                <p style={{ marginTop: 0 }}>
                  <strong>Company:</strong> {job.company?.name || "—"}
                </p>

                <div style={{ marginTop: 8, marginBottom: 12 }}>
                  {job.description ? (
                    <p className="muted small" style={{ margin: 0 }}>
                      {job.description.replace(/<[^>]*>/g, "").slice(0, 140)}...
                    </p>
                  ) : (
                    <p className="muted small" style={{ margin: 0 }}>No description</p>
                  )}
                </div>

                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  {isOpen ? (
                    <button
                      className="btn-soft"
                      type="button"
                      onClick={() => updateStatus(job.id, "CLOSED")}
                    >
                      Close Job
                    </button>
                  ) : (
                    <button
                      className="btn-primary"
                      type="button"
                      onClick={() => updateStatus(job.id, "OPEN")}
                    >
                      Reopen Job
                    </button>
                  )}
                </div>
              </div>
            );
          })}
      </div>

      <div style={{ height: 16 }} />
      <TokenSettingsAdmin />

      <div style={{ height: 16 }} />
      <EmployerTokensAdmin />

      <div style={{ height: 16 }} />
      <UsersAdmin currentAdminId={adminId} />

      <div style={{ height: 16 }} />

      <div className="card">
        <div className="card-head">
          <h2>Companies</h2>
          <p className="muted">
            Verify companies. Only verified companies can post jobs.
          </p>
        </div>

        <CompaniesAdmin />
      </div>
    </div>
  );
}