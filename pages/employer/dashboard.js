import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import RichTextEditor from "../../components/RichTextEditor";
import { useAuth } from "../../context/AuthContext";
import { CATEGORY_OPTIONS, TYPE_OPTIONS, WORKMODE_OPTIONS } from "../../lib/constants";

const SOCIAL_FIELD_OPTIONS = [
  { key: "facebook", label: "Facebook" },
  { key: "x", label: "X (Twitter)" },
  { key: "instagram", label: "Instagram" },
  { key: "github", label: "GitHub" },
  { key: "linkedin", label: "LinkedIn" },
  { key: "youtube", label: "YouTube" },
];

const APPLICATION_FIELD_TYPES = [
  { label: "Short Text", value: "TEXT" },
  { label: "Long Text", value: "TEXTAREA" },
  { label: "URL / Link", value: "URL" },
  { label: "Number", value: "NUMBER" },
];

function createEmptyApplicationField() {
  return { label: "", type: "TEXT", required: true, placeholder: "" };
}

function createEmptySocialField() {
  return { label: "", url: "" };
}

function CoinIcon() {
  return <span aria-hidden="true">{"\u{1FA99}"}</span>;
}

export default function EmployerDashboard() {
  const { user: me, loading: loadingMe, refresh: refreshAuth } = useAuth();
  const [company, setCompany] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [loadingCompany, setLoadingCompany] = useState(true);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [locationSuggest, setLocationSuggest] = useState([]);
  const [locationSuggestLoading, setLocationSuggestLoading] = useState(false);

  const [companyForm, setCompanyForm] = useState({
    name: "",
    description: "",
    industry: "",
    location: "",
    website: "",
    regNo: "",
    proofNote: "",
    facebook: "",
    x: "",
    instagram: "",
    github: "",
    linkedin: "",
    youtube: "",
    extraSocials: [],
  });

  const [jobForm, setJobForm] = useState({
    title: "",
    description: "",
    category: "",
    type: "",
    workMode: "",
    location: "",
    applicationFields: [],
  });

  const canPostJob = Boolean(company?.verified);
  const tokenBalance = useMemo(() => Number(me?.tokens ?? 0), [me]);
  const hasCompany = Boolean(company);

  const hasAnySocialLink = () => {
    const builtInSocials = SOCIAL_FIELD_OPTIONS.some(({ key }) =>
      String(companyForm[key] || "").trim()
    );
    const extraSocials = companyForm.extraSocials.some(
      (item) => String(item?.label || "").trim() && String(item?.url || "").trim()
    );
    return builtInSocials || extraSocials;
  };

  const fetchCompany = async () => {
    setLoadingCompany(true);
    try {
      const res = await fetch("/api/company/me", { credentials: "include" });
      const data = await res.json();
      if (!res.ok) {
        setCompany(null);
      } else {
        setCompany(data.company || null);
      }
    } catch {
      setCompany(null);
    } finally {
      setLoadingCompany(false);
    }
  };

  const fetchJobs = async () => {
    setLoadingJobs(true);
    try {
      const res = await fetch("/api/jobs?status=ALL", { credentials: "include" });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to load jobs");
        setJobs([]);
      } else {
        setJobs(Array.isArray(data?.jobs) ? data.jobs : []);
      }
    } catch {
      toast.error("Failed to load jobs");
      setJobs([]);
    } finally {
      setLoadingJobs(false);
    }
  };

  useEffect(() => {
    fetchCompany();
    fetchJobs();
  }, []);

  const fetchLocationSuggestions = async (query) => {
    const value = String(query || "").trim();
    if (!value) {
      setLocationSuggest([]);
      return;
    }

    setLocationSuggestLoading(true);
    try {
      const res = await fetch(`/api/locations/suggest?q=${encodeURIComponent(value)}`);
      const data = await res.json();
      setLocationSuggest(Array.isArray(data?.suggestions) ? data.suggestions : []);
    } catch {
      setLocationSuggest([]);
    } finally {
      setLocationSuggestLoading(false);
    }
  };

  const submitCompany = async (event) => {
    event.preventDefault();
    if (!hasAnySocialLink()) {
      toast.error("Add at least one social media link before creating your company profile.");
      return;
    }
    const res = await fetch("/api/company/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(companyForm),
    });
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error || "Failed to create company");
      return;
    }
    toast.success("Company profile created successfully.");
    setCompany(data.company);
    setCompanyForm({
      name: "",
      description: "",
      industry: "",
      location: "",
      website: "",
      regNo: "",
      proofNote: "",
      facebook: "",
      x: "",
      instagram: "",
      github: "",
      linkedin: "",
      youtube: "",
      extraSocials: [],
    });
    fetchCompany();
  };

  const submitJob = async (event) => {
    event.preventDefault();
    const res = await fetch("/api/jobs/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(jobForm),
    });
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error || "Failed to create job");
      return;
    }
    toast.success("Job posted successfully.");
    setJobForm({
      title: "",
      description: "",
      category: "",
      type: "",
      workMode: "",
      location: "",
      applicationFields: [],
    });
    await Promise.all([fetchJobs(), refreshAuth()]);
  };

  return (
    <div className="container">
      <div className="page-head">
        <h1>Employer Dashboard</h1>
        <p className="muted">Manage your company, jobs, and token balance from one place.</p>
      </div>

      <div className="card">
        <div className="card-head">
          <h2>Tokens</h2>
          <p className="muted">
            {loadingMe ? "Loading..." : <><CoinIcon /> Token(s): {tokenBalance}</>}
          </p>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button type="button" className="btn-soft" onClick={refreshAuth}>Refresh</button>
          <Link href="/employer/profile" className="btn-primary">Profile</Link>
        </div>
      </div>

      <div className="card">
        <div className="card-head">
          <h2>Company</h2>
          <p className="muted">
            {company ? "Your company profile is on file." : "Create your company profile to unlock employer actions."}
          </p>
        </div>

        {loadingCompany ? (
          <p className="muted">Loading company profile...</p>
        ) : company ? (
          <div className="form">
            <div className="grid-2">
              <div className="field"><label>Name</label><input readOnly value={company.name || ""} /></div>
              <div className="field"><label>Status</label><input readOnly value={company.verified ? "Verified" : "Pending verification"} /></div>
            </div>
            <div className="grid-2">
              <div className="field"><label>Industry</label><input readOnly value={company.industry || ""} /></div>
              <div className="field"><label>Location</label><input readOnly value={company.location || ""} /></div>
            </div>
            <div className="field">
              <label>Verification</label>
              <input readOnly value={company.verified ? "Verified and ready to post jobs." : "Pending verification."} />
            </div>
          </div>
        ) : (
          <form onSubmit={submitCompany} className="form">
            <div className="grid-2">
              <div className="field"><label>Company Name</label><input value={companyForm.name} onChange={(e) => setCompanyForm((p) => ({ ...p, name: e.target.value }))} required /></div>
              <div className="field"><label>Industry</label><input value={companyForm.industry} onChange={(e) => setCompanyForm((p) => ({ ...p, industry: e.target.value }))} /></div>
            </div>
            <div className="grid-2">
              <div className="field"><label>Location</label><input value={companyForm.location} onChange={(e) => setCompanyForm((p) => ({ ...p, location: e.target.value }))} /></div>
              <div className="field"><label>Website</label><input value={companyForm.website} onChange={(e) => setCompanyForm((p) => ({ ...p, website: e.target.value }))} /></div>
            </div>
            <div className="field"><label>Description</label><textarea rows={4} value={companyForm.description} onChange={(e) => setCompanyForm((p) => ({ ...p, description: e.target.value }))} required /></div>
            <div className="grid-2">
              <div className="field"><label>Registration Number</label><input value={companyForm.regNo} onChange={(e) => setCompanyForm((p) => ({ ...p, regNo: e.target.value }))} /></div>
              <div className="field"><label>Alternative Proof Note</label><input value={companyForm.proofNote} onChange={(e) => setCompanyForm((p) => ({ ...p, proofNote: e.target.value }))} /></div>
            </div>
            <div className="card" style={{ marginBottom: 0 }}>
              <div className="card-head">
                <h3>Online Presence</h3>
                <p className="muted small">Add at least one social profile link before creating your company.</p>
              </div>
              <div className="grid-2">
                {SOCIAL_FIELD_OPTIONS.map((field) => (
                  <div className="field" key={field.key}>
                    <label>{field.label}</label>
                    <input
                      type="url"
                      value={companyForm[field.key]}
                      onChange={(e) => setCompanyForm((p) => ({ ...p, [field.key]: e.target.value }))}
                      placeholder={`https://${field.key === "x" ? "x.com/your-company" : `${field.key}.com/your-company`}`}
                    />
                  </div>
                ))}
              </div>
              <div style={{ display: "grid", gap: 12 }}>
                {companyForm.extraSocials.map((field, index) => (
                  <div key={index} className="grid-2">
                    <div className="field">
                      <label>Social Label</label>
                      <input
                        value={field.label}
                        onChange={(e) =>
                          setCompanyForm((p) => ({
                            ...p,
                            extraSocials: p.extraSocials.map((item, i) =>
                              i === index ? { ...item, label: e.target.value } : item
                            ),
                          }))
                        }
                        placeholder="e.g. TikTok"
                      />
                    </div>
                    <div className="field">
                      <label>Social URL</label>
                      <input
                        type="url"
                        value={field.url}
                        onChange={(e) =>
                          setCompanyForm((p) => ({
                            ...p,
                            extraSocials: p.extraSocials.map((item, i) =>
                              i === index ? { ...item, url: e.target.value } : item
                            ),
                          }))
                        }
                        placeholder="https://example.com/your-company"
                      />
                    </div>
                  </div>
                ))}
              </div>
              <button
                type="button"
                className="btn-soft"
                onClick={() =>
                  setCompanyForm((p) => ({
                    ...p,
                    extraSocials: [...p.extraSocials, createEmptySocialField()],
                  }))
                }
              >
                Add Social Field
              </button>
            </div>
            <button className="btn-primary" type="submit">Create Company Profile</button>
          </form>
        )}
      </div>

      <div className="card">
        <div className="card-head">
          <h2>Create Job</h2>
          <p className="muted">
            {!hasCompany
              ? "Create a company profile and get verified in order to start posting jobs."
              : canPostJob
                ? "Type the full job location and it will still be filterable by city."
                : "Create a company profile and get verified in order to start posting jobs."}
          </p>
        </div>

        {!hasCompany || !canPostJob ? null : (
        <form onSubmit={submitJob} className="form">
          <div className="field"><label>Job Title</label><input value={jobForm.title} onChange={(e) => setJobForm((p) => ({ ...p, title: e.target.value }))} disabled={!canPostJob} required /></div>
          <div className="field">
            <label>Description</label>
            <RichTextEditor value={jobForm.description} onChange={(value) => setJobForm((p) => ({ ...p, description: value }))} />
          </div>
          <div className="grid-2">
            <div className="field">
              <label>Category</label>
              <select value={jobForm.category} onChange={(e) => setJobForm((p) => ({ ...p, category: e.target.value }))} disabled={!canPostJob}>
                <option value="">Select category</option>
                {CATEGORY_OPTIONS.filter((item) => !item.toLowerCase().startsWith("all")).map((item) => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Job Type</label>
              <select value={jobForm.type} onChange={(e) => setJobForm((p) => ({ ...p, type: e.target.value }))} disabled={!canPostJob}>
                <option value="">Select type</option>
                {TYPE_OPTIONS.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
            </div>
          </div>
          <div className="grid-2">
            <div className="field">
              <label>Work Mode</label>
              <select value={jobForm.workMode} onChange={(e) => setJobForm((p) => ({ ...p, workMode: e.target.value }))} disabled={!canPostJob}>
                <option value="">Select work mode</option>
                {WORKMODE_OPTIONS.map((mode) => <option key={mode.value} value={mode.value}>{mode.label}</option>)}
              </select>
            </div>
            <div className="field">
              <label>Location</label>
              <input
                value={jobForm.location}
                onChange={(e) => {
                  setJobForm((p) => ({ ...p, location: e.target.value }));
                  fetchLocationSuggestions(e.target.value);
                }}
                placeholder="e.g. Bodija, Ibadan, Oyo State"
                list="location-suggest"
                disabled={!canPostJob}
              />
              <datalist id="location-suggest">
                {locationSuggest.map((item) => <option key={item} value={item} />)}
              </datalist>
              {locationSuggestLoading && <p className="muted small">Loading suggestions...</p>}
            </div>
          </div>

          <div className="card">
            <div className="card-head">
              <h3>Custom Application Questions</h3>
              <p className="muted small">Add optional custom questions for applicants.</p>
            </div>
            <button type="button" className="btn-soft" disabled={!canPostJob} onClick={() => setJobForm((p) => ({ ...p, applicationFields: [...p.applicationFields, createEmptyApplicationField()] }))}>
              Add Question
            </button>
            <div style={{ display: "grid", gap: 12, marginTop: 12 }}>
              {jobForm.applicationFields.map((field, index) => (
                <div key={index} className="card" style={{ marginBottom: 0 }}>
                  <div className="field"><label>Question</label><input value={field.label} onChange={(e) => setJobForm((p) => ({ ...p, applicationFields: p.applicationFields.map((item, i) => i === index ? { ...item, label: e.target.value } : item) }))} /></div>
                  <div className="grid-2">
                    <div className="field">
                      <label>Type</label>
                      <select value={field.type} onChange={(e) => setJobForm((p) => ({ ...p, applicationFields: p.applicationFields.map((item, i) => i === index ? { ...item, type: e.target.value } : item) }))}>
                        {APPLICATION_FIELD_TYPES.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}
                      </select>
                    </div>
                    <div className="field"><label>Placeholder</label><input value={field.placeholder} onChange={(e) => setJobForm((p) => ({ ...p, applicationFields: p.applicationFields.map((item, i) => i === index ? { ...item, placeholder: e.target.value } : item) }))} /></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button className="btn-primary" type="submit" disabled={!canPostJob}>Post Job</button>
        </form>
        )}
      </div>

      <div className="card">
        <div className="card-head">
          <h2>Your Jobs</h2>
          <p className="muted">Manage all posted jobs from the jobs page.</p>
        </div>
        {loadingJobs ? (
          <p className="muted">Loading jobs...</p>
        ) : jobs.length === 0 ? (
          <p className="muted">No jobs yet.</p>
        ) : (
          <div className="job-list">
            {jobs.map((job) => (
              <div key={job.id} className="job-card employer-dashboard-job-card">
                <div>
                  <p className="job-title">{job.title}</p>
                  <p className="muted small">{job.location || "—"} • {job.type || "—"} • {job.status || "—"}</p>
                </div>
                <Link href={`/employer/jobs/${job.id}`} className="btn-soft">Manage</Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
