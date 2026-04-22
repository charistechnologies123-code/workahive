import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { useConfirmDialog } from "../ConfirmDialog";

function ReadOnlyField({ label, value, multiline = false }) {
  return (
    <div className="field">
      <label>{label}</label>
      {multiline ? (
        <textarea rows={4} value={value || ""} readOnly />
      ) : (
        <input value={value || ""} readOnly />
      )}
    </div>
  );
}

function SocialLinkRow({ label, href }) {
  if (!href) return null;

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        gap: 12,
        padding: "10px 12px",
        borderRadius: 10,
        border: "1px solid rgba(255,255,255,0.08)",
        background: "rgba(255,255,255,0.03)",
        flexWrap: "wrap",
      }}
    >
      <span>{label}</span>
      <a href={href} target="_blank" rel="noreferrer" style={{ wordBreak: "break-all" }}>
        {href}
      </a>
    </div>
  );
}

function getExtraSocials(company) {
  return Array.isArray(company?.extraSocials)
    ? company.extraSocials.filter(
        (item) => item && typeof item.label === "string" && typeof item.url === "string"
      )
    : [];
}

export function AdminSummaryCard({ title, description, href, meta }) {
  return (
    <Link href={href} className="admin-summary-card">
      <div>
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
      <div className="admin-summary-meta">
        <span>{meta}</span>
        <strong>Open</strong>
      </div>
    </Link>
  );
}

export function TokenSettingsSection() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    freeTokensNewEmployer: 0,
    tokensPerJobPost: 1,
  });

  const load = async () => {
    setLoading(true);
    const res = await fetch("/api/admin/token-settings", { credentials: "include" });
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

  const save = async (event) => {
    event.preventDefault();
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
        <h2>Token Settings</h2>
        <p className="muted">Configure free employer tokens and job posting token cost.</p>
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
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, freeTokensNewEmployer: event.target.value }))
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
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, tokensPerJobPost: event.target.value }))
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

export function EmployerTokensSection() {
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [list, setList] = useState([]);
  const [tokenInputs, setTokenInputs] = useState({});

  const search = async () => {
    setLoading(true);
    const url = q.trim()
      ? `/api/admin/employers?q=${encodeURIComponent(q.trim())}`
      : "/api/admin/employers";
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
      for (const user of employers) {
        if (next[user.id] === undefined) next[user.id] = user.tokens ?? 0;
      }
      return next;
    });
    setLoading(false);
  };

  useEffect(() => {
    search();
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
    setList((prev) => prev.map((user) => (user.id === userId ? { ...user, tokens: data.user.tokens } : user)));
    setTokenInputs((prev) => ({ ...prev, [userId]: data.user.tokens }));
    toast.success("Employer token balance updated.");
  };

  return (
    <div className="card">
      <div className="card-head">
        <h2>Employer Tokens</h2>
        <p className="muted">Search employers and update token balances.</p>
      </div>
      <div className="form" style={{ marginBottom: 12 }}>
        <div className="field">
          <label>Search employer</label>
          <div className="input-wrap">
            <input value={q} onChange={(event) => setQ(event.target.value)} placeholder="Name or email" />
            <button type="button" className="btn-soft" onClick={search} disabled={loading}>
              {loading ? "Searching…" : "Search"}
            </button>
          </div>
        </div>
      </div>
      {loading && <p className="muted">Loading employers…</p>}
      {!loading && list.length === 0 && <p className="muted">No employers found.</p>}
      {!loading && list.length > 0 && (
        <div className="job-list">
          {list.map((user) => (
            <div key={user.id} className="job-item">
              <div>
                <p className="job-title">{user.name || "—"}</p>
                <p className="muted small">{user.email} • {user.tokens ?? 0} tokens</p>
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <input
                  type="number"
                  min="0"
                  value={tokenInputs[user.id] ?? 0}
                  onChange={(event) =>
                    setTokenInputs((prev) => ({ ...prev, [user.id]: event.target.value }))
                  }
                  style={{ width: 110 }}
                />
                <button type="button" className="btn-primary" onClick={() => setTokens(user.id)}>
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

export function UsersSection({ currentAdminId }) {
  const [q, setQ] = useState("");
  const [role, setRole] = useState("ALL");
  const [loading, setLoading] = useState(false);
  const [updatingUserId, setUpdatingUserId] = useState(null);
  const [users, setUsers] = useState([]);
  const { confirm, dialog } = useConfirmDialog();

  const load = async (nextRole = role, nextQuery = q) => {
    setLoading(true);
    const params = new URLSearchParams();
    if (nextQuery.trim()) params.set("q", nextQuery.trim());
    if (nextRole && nextRole !== "ALL") params.set("role", nextRole);
    const res = await fetch(`/api/admin/users${params.toString() ? `?${params.toString()}` : ""}`, {
      credentials: "include",
    });
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
  }, []);

  const removeUser = async (user) => {
    if (Number(user.id) === Number(currentAdminId)) {
      toast.error("You cannot delete your own account.");
      return;
    }
    confirm({
      title: "Delete user",
      message: `Delete ${user.email} (${user.role})? This permanently removes the user and related records.`,
      confirmText: "Delete user",
      onConfirm: async () => {
        const res = await fetch(`/api/admin/users/${user.id}`, { method: "DELETE", credentials: "include" });
        const data = await res.json();
        if (!res.ok) {
          toast.error(data.error || "Failed to delete user");
          return;
        }
        toast.success("User deleted.");
        setUsers((prev) => prev.filter((item) => item.id !== user.id));
      },
    });
  };

  const setEmailVerified = async (user, emailVerified) => {
    setUpdatingUserId(user.id);
    const res = await fetch(`/api/admin/users/${user.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ emailVerified }),
    });
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error || "Failed to update email verification");
      setUpdatingUserId(null);
      return;
    }
    setUsers((prev) => prev.map((item) => (item.id === user.id ? data.user : item)));
    toast.success(
      emailVerified ? "User email marked as verified." : "User email marked as unverified."
    );
    setUpdatingUserId(null);
  };

  return (
    <>
      <div className="card">
        <div className="card-head">
          <h2>Users</h2>
          <p className="muted">Filter and manage users by name, email, and role.</p>
        </div>
        <div className="form" style={{ marginBottom: 12 }}>
          <div className="grid-2">
            <div className="field">
              <label>Search</label>
              <input value={q} onChange={(event) => setQ(event.target.value)} placeholder="Name or email" />
            </div>
            <div className="field">
              <label>Role</label>
              <select value={role} onChange={(event) => setRole(event.target.value)}>
                <option value="ALL">All</option>
                <option value="EMPLOYER">Employer</option>
                <option value="JOBSEEKER">Jobseeker</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button type="button" className="btn-soft" onClick={() => load()}>
              {loading ? "Loading…" : "Search"}
            </button>
            <button
              type="button"
              className="btn-soft"
              onClick={() => {
                setQ("");
                setRole("ALL");
                load("ALL", "");
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
            {users.map((user) => (
              <div key={user.id} className="job-item">
                <div>
                  <p className="job-title">{user.name || "—"}</p>
                  <p className="muted small">
                    {user.email} • {user.role}
                    {user.role === "EMPLOYER" ? ` • ${user.tokens ?? 0} tokens` : ""}
                    {` | ${user.emailVerified ? "Email verified" : "Email not verified"}`}
                  </p>
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {user.emailVerified ? (
                    <button
                      type="button"
                      className="btn-soft"
                      disabled={updatingUserId === user.id}
                      onClick={() => setEmailVerified(user, false)}
                    >
                      {updatingUserId === user.id ? "Please wait..." : "Mark Unverified"}
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="btn-primary"
                      disabled={updatingUserId === user.id}
                      onClick={() => setEmailVerified(user, true)}
                    >
                      {updatingUserId === user.id ? "Please wait..." : "Mark Verified"}
                    </button>
                  )}
                  <button type="button" className="btn-soft" onClick={() => removeUser(user)}>
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      {dialog}
    </>
  );
}

export function CompaniesSection() {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [selected, setSelected] = useState(null);
  const [detailsErr, setDetailsErr] = useState("");
  const { confirm, dialog } = useConfirmDialog();
  const selectedExtraSocials = useMemo(() => getExtraSocials(selected), [selected]);

  const load = async () => {
    setLoading(true);
    const res = await fetch("/api/admin/companies", { credentials: "include" });
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error || "Failed to load companies");
      setCompanies([]);
      setLoading(false);
      return;
    }
    setCompanies(Array.isArray(data.companies) ? data.companies : []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const openDetails = async (companyId) => {
    setSelected(null);
    setDetailsErr("");
    setDetailsLoading(true);
    const res = await fetch(`/api/admin/companies/${companyId}`, { credentials: "include" });
    const data = await res.json();
    if (!res.ok) {
      setDetailsErr(data.error || "Failed to load company details");
      toast.error(data.error || "Failed to load company details");
    } else {
      setSelected(data.company || null);
    }
    setDetailsLoading(false);
  };

  const toggleVerify = (company) => {
    const action = company.verified ? "Unverify" : "Verify";
    confirm({
      title: `${action} company`,
      message: `${action} ${company.name}? Employers can only post jobs after verification.`,
      confirmText: action,
      tone: company.verified ? "danger" : "primary",
      onConfirm: async () => {
        const res = await fetch(`/api/admin/companies/${company.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ verified: !company.verified }),
        });
        const data = await res.json();
        if (!res.ok) {
          toast.error(data.error || "Failed to update company verification");
          return;
        }
        const nextCompany = data.company;
        setCompanies((prev) => prev.map((item) => (item.id === nextCompany.id ? nextCompany : item)));
        setSelected((prev) => (prev && prev.id === nextCompany.id ? nextCompany : prev));
        toast.success(nextCompany.verified ? "Company verified." : "Company unverified.");
      },
    });
  };

  if (loading) return <p className="muted">Loading companies…</p>;

  return (
    <>
      <div className="card">
        <div className="card-head">
          <h2>Companies</h2>
          <p className="muted">Review and verify employer companies.</p>
        </div>
        {companies.length === 0 ? (
          <p className="muted">No companies yet.</p>
        ) : (
          <div className="job-list">
            {companies.map((company) => (
              <div key={company.id} className="job-item">
                <div>
                  <p className="job-title">{company.name}</p>
                  <p className="muted small">
                    Owner: {company.owner?.email || "—"} • {company.location || "—"} • {company.industry || "—"}
                  </p>
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <button type="button" className="btn-soft" onClick={() => openDetails(company.id)}>
                    View Details
                  </button>
                  <button
                    type="button"
                    className={company.verified ? "btn-soft" : "btn-primary"}
                    onClick={() => toggleVerify(company)}
                  >
                    {company.verified ? "Unverify" : "Verify"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {(detailsLoading || detailsErr || selected) && (
        <div className="confirm-overlay" onClick={() => setSelected(null)}>
          <div className="confirm-dialog confirm-dialog-wide" onClick={(event) => event.stopPropagation()}>
            <div className="card-head">
              <h2>Company Details</h2>
              <p className="muted">Review company information before changing verification status.</p>
            </div>
            {detailsLoading && <p className="muted">Loading company details…</p>}
            {detailsErr && <div className="alert alert-error">{detailsErr}</div>}
            {selected && (
              <div className="form">
                <div className="grid-2">
                  <ReadOnlyField label="Company Name" value={selected.name || ""} />
                  <ReadOnlyField label="Status" value={selected.verified ? "Verified" : "Pending verification"} />
                </div>
                <div className="grid-2">
                  <ReadOnlyField label="Owner Name" value={selected.owner?.name || ""} />
                  <ReadOnlyField label="Owner Email" value={selected.owner?.email || ""} />
                </div>
                <div className="grid-2">
                  <ReadOnlyField label="Owner Tokens" value={selected.owner?.tokens != null ? String(selected.owner.tokens) : ""} />
                  <ReadOnlyField label="Location" value={selected.location || ""} />
                </div>
                <div className="grid-2">
                  <ReadOnlyField label="Industry" value={selected.industry || ""} />
                  <ReadOnlyField label="Website" value={selected.website || ""} />
                </div>
                <ReadOnlyField label="Description" value={selected.description || ""} multiline />
                <div className="grid-2">
                  <ReadOnlyField label="Registration Number" value={selected.regNo || ""} />
                  <ReadOnlyField label="Alternative Proof Note" value={selected.proofNote || ""} />
                </div>

                <div className="card" style={{ marginBottom: 0 }}>
                  <div className="card-head">
                    <h3 style={{ margin: 0 }}>Online Presence</h3>
                    <p className="muted small" style={{ marginTop: 6 }}>
                      Social profiles and links submitted during company creation.
                    </p>
                  </div>
                  <div style={{ display: "grid", gap: 10 }}>
                    <SocialLinkRow label="Facebook" href={selected.facebook} />
                    <SocialLinkRow label="Instagram" href={selected.instagram} />
                    <SocialLinkRow label="GitHub" href={selected.github} />
                    <SocialLinkRow label="LinkedIn" href={selected.linkedin} />
                    <SocialLinkRow label="X (Twitter)" href={selected.x} />
                    <SocialLinkRow label="YouTube" href={selected.youtube} />
                    {selectedExtraSocials.map((item, index) => (
                      <SocialLinkRow key={`${item.label}-${index}`} label={item.label} href={item.url} />
                    ))}
                    {!selected.facebook &&
                      !selected.instagram &&
                      !selected.github &&
                      !selected.linkedin &&
                      !selected.x &&
                      !selected.youtube &&
                      selectedExtraSocials.length === 0 && (
                        <p className="muted small" style={{ margin: 0 }}>
                          No online presence links added.
                        </p>
                      )}
                  </div>
                </div>

                <div className="card" style={{ marginBottom: 0 }}>
                  <div className="card-head">
                    <h3 style={{ margin: 0 }}>Recent Jobs</h3>
                    <p className="muted small" style={{ marginTop: 6 }}>
                      Latest jobs posted by this company.
                    </p>
                  </div>
                  {Array.isArray(selected.jobs) && selected.jobs.length > 0 ? (
                    <div className="job-list">
                      {selected.jobs.map((job) => (
                        <div key={job.id} className="job-item">
                          <div>
                            <p className="job-title">{job.title || "—"}</p>
                            <p className="muted small">
                              {job.status || "—"} • {job.createdAt ? new Date(job.createdAt).toLocaleDateString() : "—"}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="muted">No jobs posted yet.</p>
                  )}
                </div>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <button
                    type="button"
                    className={selected.verified ? "btn-soft" : "btn-primary"}
                    onClick={() => toggleVerify(selected)}
                  >
                    {selected.verified ? "Unverify" : "Verify"}
                  </button>
                  <button type="button" className="btn-soft" onClick={() => setSelected(null)}>
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      {dialog}
    </>
  );
}

export function AdminJobsSection() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyJobId, setBusyJobId] = useState(null);

  const load = async () => {
    setLoading(true);
    const res = await fetch("/api/jobs?status=ALL", { credentials: "include" });
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error || "Failed to load jobs");
      setJobs([]);
      setLoading(false);
      return;
    }
    setJobs(Array.isArray(data?.jobs) ? data.jobs : Array.isArray(data) ? data : []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const updateStatus = async (jobId, status) => {
    setBusyJobId(jobId);
    const res = await fetch(`/api/jobs/${jobId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ status }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      toast.error(data.error || "Failed to update job status");
      setBusyJobId(null);
      return;
    }
    setJobs((prev) => prev.map((job) => (job.id === jobId ? data : job)));
    toast.success(status === "OPEN" ? "Job reopened." : "Job closed.");
    setBusyJobId(null);
  };

  const openCount = useMemo(
    () => jobs.filter((job) => String(job.status || "").toUpperCase() === "OPEN").length,
    [jobs]
  );

  return (
    <div className="card">
      <div className="card-head">
        <h2>Jobs</h2>
        <p className="muted">
          Open: <strong>{openCount}</strong> • Closed: <strong>{jobs.length - openCount}</strong>
        </p>
      </div>
      {loading ? (
        <p className="muted">Loading jobs…</p>
      ) : jobs.length === 0 ? (
        <p className="muted">No jobs yet.</p>
      ) : (
        <div className="job-list">
          {jobs.map((job) => (
            <div key={job.id} className="job-item">
              <div>
                <p className="job-title">{job.title}</p>
                <p className="muted small">
                  {job.company?.name || "—"} • {job.location || "—"} • {job.status || "—"}
                </p>
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <Link href={`/admin/jobs/${job.id}`} className="btn-soft">
                  View
                </Link>
                {String(job.status || "").toUpperCase() === "OPEN" ? (
                  <button
                    type="button"
                    className="btn-primary"
                    disabled={busyJobId === job.id}
                    onClick={() => updateStatus(job.id, "CLOSED")}
                  >
                    {busyJobId === job.id ? "Please wait…" : "Close"}
                  </button>
                ) : (
                  <button
                    type="button"
                    className="btn-soft"
                    disabled={busyJobId === job.id}
                    onClick={() => updateStatus(job.id, "OPEN")}
                  >
                    {busyJobId === job.id ? "Please wait…" : "Re-open"}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
