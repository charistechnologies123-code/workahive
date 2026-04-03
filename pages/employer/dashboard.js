import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import RichTextEditor from "../../components/RichTextEditor";
import {
  CATEGORY_OPTIONS,
  TYPE_OPTIONS,
  WORKMODE_OPTIONS,
} from "../../lib/constants";

const APPLICATION_FIELD_TYPES = [
  { label: "Short Text", value: "TEXT" },
  { label: "Long Text", value: "TEXTAREA" },
  { label: "URL / Link", value: "URL" },
  { label: "Number", value: "NUMBER" },
];

function CoinIcon() {
  return (
    <span aria-hidden="true" style={{ marginRight: 6 }}>
      🪙
    </span>
  );
}

function createEmptyApplicationField() {
  return {
    label: "",
    type: "TEXT",
    required: true,
    placeholder: "",
  };
}

export default function EmployerDashboard() {
  const [me, setMe] = useState(null);
  const [loadingMe, setLoadingMe] = useState(true);

  const [company, setCompany] = useState(null);
  const [loadingCompany, setLoadingCompany] = useState(true);

  const [jobs, setJobs] = useState([]);
  const [loadingJobs, setLoadingJobs] = useState(true);

  const [locations, setLocations] = useState([]);
  const [loadingLocations, setLoadingLocations] = useState(true);

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
    instagram: "",
    linkedin: "",
    x: "",
    youtube: "",
  });

  const [jobForm, setJobForm] = useState({
    title: "",
    description: "",
    categoryPreset: "",
    categoryOther: "",
    typePreset: "",
    typeOther: "",
    workMode: "",
    locationPreset: "",
    locationOther: "",
    applicationFields: [],
  });

  const canPostJob = Boolean(company) && Boolean(company?.verified);

  const finalCategory =
    jobForm.categoryPreset === "__OTHER__"
      ? jobForm.categoryOther
      : jobForm.categoryPreset;

  const finalType =
    jobForm.typePreset === "__OTHER__" ? jobForm.typeOther : jobForm.typePreset;

  const finalLocation =
    jobForm.locationPreset === "__OTHER__"
      ? jobForm.locationOther
      : jobForm.locationPreset;

  const fetchMe = async () => {
    setLoadingMe(true);
    try {
      const res = await fetch("/api/auth/me", { credentials: "include" });
      const data = await res.json();

      if (res.ok && data?.user) {
        setMe(data.user);
      } else {
        setMe(null);
      }
    } catch {
      setMe(null);
    } finally {
      setLoadingMe(false);
    }
  };

  const fetchCompany = async () => {
    setLoadingCompany(true);
    try {
      const res = await fetch("/api/company/me", { credentials: "include" });
      const data = await res.json();

      if (!res.ok) {
        setCompany(null);
        toast.error(data.error || "Failed to load company profile");
      } else {
        setCompany(data.company);

        if (data.company) {
          setCompanyForm({
            name: data.company.name || "",
            description: data.company.description || "",
            industry: data.company.industry || "",
            location: data.company.location || "",
            website: data.company.website || "",
            regNo: data.company.regNo || "",
            proofNote: data.company.proofNote || "",
            facebook: data.company.facebook || "",
            instagram: data.company.instagram || "",
            linkedin: data.company.linkedin || "",
            x: data.company.x || "",
            youtube: data.company.youtube || "",
          });
        }
      }
    } catch {
      setCompany(null);
      toast.error("Failed to load company profile");
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
        setJobs([]);
        toast.error(data.error || "Failed to load jobs");
      } else {
        setJobs(Array.isArray(data) ? data : data.jobs || []);
      }
    } catch {
      setJobs([]);
      toast.error("Failed to load jobs");
    } finally {
      setLoadingJobs(false);
    }
  };

  const fetchLocations = async () => {
    setLoadingLocations(true);
    try {
      const res = await fetch("/api/locations");
      const data = await res.json();
      if (res.ok) {
        setLocations(Array.isArray(data.locations) ? data.locations : []);
      } else {
        setLocations([]);
      }
    } catch {
      setLocations([]);
    } finally {
      setLoadingLocations(false);
    }
  };

  useEffect(() => {
    fetchMe();
    fetchCompany();
    fetchJobs();
    fetchLocations();
  }, []);

  const handleCompanyChange = (e) => {
    setCompanyForm({ ...companyForm, [e.target.name]: e.target.value });
  };

  const submitCompany = async (e) => {
    e.preventDefault();

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

    setCompany(data.company);

    setCompanyForm({
      name: data.company.name || "",
      description: data.company.description || "",
      industry: data.company.industry || "",
      location: data.company.location || "",
      website: data.company.website || "",
      regNo: data.company.regNo || "",
      proofNote: data.company.proofNote || "",
      facebook: data.company.facebook || "",
      instagram: data.company.instagram || "",
      linkedin: data.company.linkedin || "",
      x: data.company.x || "",
      youtube: data.company.youtube || "",
    });

    toast.success("Company profile created successfully.");
  };

  const setJob = (patch) => setJobForm((p) => ({ ...p, ...patch }));

  const fetchLocationSuggestions = async (q) => {
    const query = (q || "").trim();
    if (!query) {
      setLocationSuggest([]);
      return;
    }

    setLocationSuggestLoading(true);
    try {
      const res = await fetch(
        `/api/locations/suggest?q=${encodeURIComponent(query)}`
      );
      const data = await res.json();
      if (res.ok) {
        setLocationSuggest(Array.isArray(data.suggestions) ? data.suggestions : []);
      } else {
        setLocationSuggest([]);
      }
    } catch {
      setLocationSuggest([]);
    } finally {
      setLocationSuggestLoading(false);
    }
  };

  const addApplicationField = () => {
    setJobForm((prev) => ({
      ...prev,
      applicationFields: [...prev.applicationFields, createEmptyApplicationField()],
    }));
  };

  const updateApplicationField = (index, patch) => {
    setJobForm((prev) => ({
      ...prev,
      applicationFields: prev.applicationFields.map((field, i) =>
        i === index ? { ...field, ...patch } : field
      ),
    }));
  };

  const removeApplicationField = (index) => {
    setJobForm((prev) => ({
      ...prev,
      applicationFields: prev.applicationFields.filter((_, i) => i !== index),
    }));
  };

  const submitJob = async (e) => {
    e.preventDefault();

    if (!company) {
      toast.error("Create your company profile first.");
      return;
    }

    if (!company.verified) {
      toast.error("Your company must be verified before you can post jobs.");
      return;
    }

    const cleanedApplicationFields = (jobForm.applicationFields || [])
      .map((field) => ({
        label: (field.label || "").trim(),
        type: field.type || "TEXT",
        required: Boolean(field.required),
        placeholder: (field.placeholder || "").trim(),
      }))
      .filter((field) => field.label);

    const hasInvalidField = (jobForm.applicationFields || []).some(
      (field) => !(field.label || "").trim()
    );

    if (hasInvalidField) {
      toast.error("Every custom application question must have a label.");
      return;
    }

    const payload = {
      title: jobForm.title,
      description: jobForm.description,
      category: finalCategory || null,
      type: finalType || null,
      workMode: jobForm.workMode || null,
      location: finalLocation || null,
      applicationFields: cleanedApplicationFields,
    };

    const res = await fetch("/api/jobs/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok) {
      toast.error(data.error || "Something went wrong");
      return;
    }

    toast.success("Job posted successfully.");

    setJobForm({
      title: "",
      description: "",
      categoryPreset: "",
      categoryOther: "",
      typePreset: "",
      typeOther: "",
      workMode: "",
      locationPreset: "",
      locationOther: "",
      applicationFields: [],
    });

    fetchJobs();
    fetchMe();
  };

  const locationOptions = useMemo(() => {
    return locations.map((x) => x.name).filter(Boolean);
  }, [locations]);

  const tokenBalance = Number(me?.tokens ?? 0);

  return (
    <div className="container">
      <div className="page-head">
        <h1>Employer Dashboard</h1>
        <p className="muted">
          Manage your jobs and company status from here.
        </p>
      </div>

      <div className="card">
        <div className="card-head">
          <h2>
            <CoinIcon />
            Tokens
          </h2>
          <p className="muted">
            Tokens are required to post jobs. Use your profile page for top-up
            instructions.
          </p>
        </div>

        {loadingMe ? (
          <p className="muted">Loading tokens…</p>
        ) : (
          <div
            style={{
              display: "flex",
              gap: 12,
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
            }}
          >
            <p className="muted" style={{ margin: 0 }}>
              Balance: <b>{tokenBalance}</b> token{tokenBalance === 1 ? "" : "s"}
            </p>

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button type="button" className="btn-soft" onClick={fetchMe}>
                Refresh
              </button>
              <Link href="/employer/profile" className="btn-primary">
                Profile
              </Link>
            </div>
          </div>
        )}
      </div>

      <div className="card">
        <div className="card-head">
          <h2>Company Status</h2>
          <p className="muted">
            Your company profile is managed from your profile page.
          </p>
        </div>

        {loadingCompany ? (
          <p className="muted">Loading company profile…</p>
        ) : company ? (
          <div className="form">
            <div className="grid-2">
              <div className="field">
                <label>Company Name</label>
                <input value={company.name || ""} readOnly />
              </div>

              <div className="field">
                <label>Industry</label>
                <input value={company.industry || ""} readOnly />
              </div>

              <div className="field">
                <label>Location</label>
                <input value={company.location || ""} readOnly />
              </div>

              <div className="field">
                <label>Website</label>
                <input value={company.website || ""} readOnly />
              </div>
            </div>

            <div
              style={{
                marginTop: 8,
                padding: "12px 14px",
                borderRadius: 12,
                border: "1px solid rgba(255,255,255,0.1)",
                background: "rgba(255,255,255,0.03)",
              }}
            >
              {!company.verified ? (
                <p style={{ margin: 0 }}>
                  <strong>Your company is not yet verified.</strong> Please
                  contact admins.
                </p>
              ) : (
                <p style={{ margin: 0 }}>
                  <strong>Your company has been verified.</strong> You can now
                  post jobs.
                </p>
              )}
            </div>
          </div>
        ) : (
          <form onSubmit={submitCompany} className="form">
            <div className="grid-2">
              <div className="field">
                <label>Company Name *</label>
                <input
                  name="name"
                  value={companyForm.name}
                  onChange={handleCompanyChange}
                  placeholder="e.g. WorkaHive"
                  required
                />
              </div>

              <div className="field">
                <label>Industry</label>
                <input
                  name="industry"
                  value={companyForm.industry}
                  onChange={handleCompanyChange}
                  placeholder="e.g. Education, Logistics, Retail"
                />
              </div>
            </div>

            <div className="grid-2">
              <div className="field">
                <label>Location</label>
                <input
                  name="location"
                  value={companyForm.location}
                  onChange={handleCompanyChange}
                  placeholder="e.g. Ogbomoso, Ibadan, Lagos"
                />
              </div>

              <div className="field">
                <label>Company Website (recommended)</label>
                <input
                  name="website"
                  value={companyForm.website}
                  onChange={handleCompanyChange}
                  placeholder="https://example.com"
                />
              </div>
            </div>

            <div className="field">
              <label>Company Description *</label>
              <textarea
                name="description"
                value={companyForm.description}
                onChange={handleCompanyChange}
                placeholder="Brief description of your company"
                rows={4}
                required
              />
            </div>

            <div className="grid-2">
              <div className="field">
                <label>Registration Number (Reg No)</label>
                <input
                  name="regNo"
                  value={companyForm.regNo}
                  onChange={handleCompanyChange}
                  placeholder="CAC RC / BN / School Reg / NGO Reg, etc."
                />
                <p className="muted small" style={{ marginTop: 6 }}>
                  Provide Reg No or fill Alternative Proof Note.
                </p>
              </div>

              <div className="field">
                <label>Alternative Proof Note</label>
                <input
                  name="proofNote"
                  value={companyForm.proofNote}
                  onChange={handleCompanyChange}
                  placeholder="If no reg no, explain and provide alternative proof"
                />
                <p className="muted small" style={{ marginTop: 6 }}>
                  Provide Alternative Proof Note or Reg No.
                </p>
              </div>
            </div>

            <div className="card" style={{ marginTop: 8 }}>
              <div className="card-head">
                <h3 style={{ margin: 0 }}>Company Social Links</h3>
                <p className="muted small" style={{ marginTop: 6 }}>
                  Add at least one website or social link for verification
                  review.
                </p>
              </div>

              <div className="grid-2">
                <div className="field">
                  <label>Facebook</label>
                  <input
                    name="facebook"
                    value={companyForm.facebook}
                    onChange={handleCompanyChange}
                    placeholder="https://facebook.com/yourpage"
                  />
                </div>
                <div className="field">
                  <label>Instagram</label>
                  <input
                    name="instagram"
                    value={companyForm.instagram}
                    onChange={handleCompanyChange}
                    placeholder="https://instagram.com/yourhandle"
                  />
                </div>
              </div>

              <div className="grid-2">
                <div className="field">
                  <label>LinkedIn</label>
                  <input
                    name="linkedin"
                    value={companyForm.linkedin}
                    onChange={handleCompanyChange}
                    placeholder="https://linkedin.com/company/yourcompany"
                  />
                </div>
                <div className="field">
                  <label>X (Twitter)</label>
                  <input
                    name="x"
                    value={companyForm.x}
                    onChange={handleCompanyChange}
                    placeholder="https://x.com/yourhandle"
                  />
                </div>
              </div>

              <div className="grid-2">
                <div className="field">
                  <label>YouTube</label>
                  <input
                    name="youtube"
                    value={companyForm.youtube}
                    onChange={handleCompanyChange}
                    placeholder="https://youtube.com/@yourchannel"
                  />
                </div>
                <div className="field">
                  <label>(Optional) Extra link</label>
                  <input value="" onChange={() => {}} disabled style={{ opacity: 0.6 }} />
                </div>
              </div>
            </div>

            <button className="btn-primary" type="submit">
              Create Company Profile
            </button>
          </form>
        )}
      </div>

      <div className="card">
        <div className="card-head">
          <h2>Create New Job</h2>
          <p className="muted">
            {!company
              ? "Create a company profile first to post jobs."
              : company.verified
              ? "Your job will be visible immediately after posting."
              : "Your company must be verified before you can post jobs."}
          </p>
        </div>

        <form onSubmit={submitJob} className="form">
          <div className="field">
            <label>Job Title *</label>
            <input
              name="title"
              value={jobForm.title}
              onChange={(e) => setJob({ title: e.target.value })}
              placeholder="e.g. Mathematics Teacher"
              required
              disabled={!canPostJob}
            />
          </div>

          <div className="field">
            <label>Job Description *</label>
            <RichTextEditor
              value={jobForm.description}
              onChange={(html) => setJob({ description: html })}
              placeholder="Add responsibilities, requirements, benefits, salary range, and other details."
            />
          </div>

          <div className="grid-2">
            <div className="field">
              <label>Category</label>
              <select
                value={jobForm.categoryPreset}
                onChange={(e) =>
                  setJob({
                    categoryPreset: e.target.value,
                    categoryOther:
                      e.target.value === "__OTHER__" ? jobForm.categoryOther : "",
                  })
                }
                disabled={!canPostJob}
              >
                <option value="">Select category</option>
                {CATEGORY_OPTIONS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
                <option value="__OTHER__">Other…</option>
              </select>

              {jobForm.categoryPreset === "__OTHER__" && (
                <input
                  style={{ marginTop: 8 }}
                  value={jobForm.categoryOther}
                  onChange={(e) => setJob({ categoryOther: e.target.value })}
                  placeholder="Specify category"
                  disabled={!canPostJob}
                />
              )}
            </div>

            <div className="field">
              <label>Job Type</label>
              <select
                value={jobForm.typePreset}
                onChange={(e) =>
                  setJob({
                    typePreset: e.target.value,
                    typeOther: e.target.value === "__OTHER__" ? jobForm.typeOther : "",
                  })
                }
                disabled={!canPostJob}
              >
                <option value="">Select job type</option>
                {TYPE_OPTIONS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
                <option value="__OTHER__">Other…</option>
              </select>

              {jobForm.typePreset === "__OTHER__" && (
                <input
                  style={{ marginTop: 8 }}
                  value={jobForm.typeOther}
                  onChange={(e) => setJob({ typeOther: e.target.value })}
                  placeholder="Specify job type"
                  disabled={!canPostJob}
                />
              )}
            </div>
          </div>

          <div className="field">
            <label>Work Mode</label>
            <select
              value={jobForm.workMode}
              onChange={(e) => setJob({ workMode: e.target.value })}
              disabled={!canPostJob}
            >
              <option value="">Select work mode</option>
              {WORKMODE_OPTIONS.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label>Job Location</label>

            {loadingLocations ? (
              <p className="muted small">Loading locations…</p>
            ) : (
              <select
                value={jobForm.locationPreset}
                onChange={(e) =>
                  setJob({
                    locationPreset: e.target.value,
                    locationOther:
                      e.target.value === "__OTHER__" ? jobForm.locationOther : "",
                  })
                }
                disabled={!canPostJob}
              >
                <option value="">Select location</option>
                {locationOptions.map((loc) => (
                  <option key={loc} value={loc}>
                    {loc}
                  </option>
                ))}
                <option value="__OTHER__">Other…</option>
              </select>
            )}

            {jobForm.locationPreset === "__OTHER__" && (
              <>
                <input
                  style={{ marginTop: 8 }}
                  value={jobForm.locationOther}
                  onChange={(e) => {
                    const val = e.target.value;
                    setJob({ locationOther: val });
                    fetchLocationSuggestions(val);
                  }}
                  placeholder="Type a location (autocomplete will suggest)"
                  list="location-suggest"
                  disabled={!canPostJob}
                />
                <datalist id="location-suggest">
                  {locationSuggest.map((s) => (
                    <option key={s} value={s} />
                  ))}
                </datalist>
                {locationSuggestLoading && (
                  <p className="muted small" style={{ marginTop: 6 }}>
                    Loading suggestions…
                  </p>
                )}
              </>
            )}
          </div>

          <div className="card" style={{ marginTop: 8 }}>
            <div
              className="card-head"
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 12,
                flexWrap: "wrap",
              }}
            >
              <div>
                <h3 style={{ margin: 0 }}>Custom Application Questions</h3>
                <p className="muted small" style={{ marginTop: 6 }}>
                  Add extra questions applicants must answer before submitting.
                </p>
              </div>

              <button
                type="button"
                className="btn-soft"
                onClick={addApplicationField}
                disabled={!canPostJob}
              >
                + Add Question
              </button>
            </div>

            {jobForm.applicationFields.length === 0 ? (
              <p className="muted small" style={{ marginTop: 10 }}>
                No custom questions added yet. Examples: portfolio link, notice
                period, why you are a good fit, YouTube intro video link, etc.
              </p>
            ) : (
              <div style={{ display: "grid", gap: 14, marginTop: 10 }}>
                {jobForm.applicationFields.map((field, index) => (
                  <div
                    key={index}
                    style={{
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: 12,
                      padding: 14,
                      background: "rgba(255,255,255,0.03)",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: 10,
                        gap: 10,
                        flexWrap: "wrap",
                      }}
                    >
                      <strong>Question {index + 1}</strong>

                      <button
                        type="button"
                        className="btn-soft"
                        onClick={() => removeApplicationField(index)}
                        disabled={!canPostJob}
                      >
                        Remove
                      </button>
                    </div>

                    <div className="field">
                      <label>Question / Label *</label>
                      <input
                        value={field.label}
                        onChange={(e) =>
                          updateApplicationField(index, { label: e.target.value })
                        }
                        placeholder="e.g. Tell us why you are a great fit for this role"
                        disabled={!canPostJob}
                      />
                    </div>

                    <div className="grid-2">
                      <div className="field">
                        <label>Answer Type</label>
                        <select
                          value={field.type}
                          onChange={(e) =>
                            updateApplicationField(index, { type: e.target.value })
                          }
                          disabled={!canPostJob}
                        >
                          {APPLICATION_FIELD_TYPES.map((type) => (
                            <option key={type.value} value={type.value}>
                              {type.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="field">
                        <label>Placeholder / Help Text</label>
                        <input
                          value={field.placeholder}
                          onChange={(e) =>
                            updateApplicationField(index, {
                              placeholder: e.target.value,
                            })
                          }
                          placeholder="e.g. Paste your portfolio URL"
                          disabled={!canPostJob}
                        />
                      </div>
                    </div>

                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        marginTop: 6,
                      }}
                    >
                      <input
                        id={`required-${index}`}
                        type="checkbox"
                        checked={field.required}
                        onChange={(e) =>
                          updateApplicationField(index, {
                            required: e.target.checked,
                          })
                        }
                        disabled={!canPostJob}
                      />
                      <label htmlFor={`required-${index}`} style={{ margin: 0 }}>
                        Required field
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button className="btn-primary" type="submit" disabled={!canPostJob}>
            Post Job
          </button>

          {!company && (
            <p className="muted small" style={{ marginTop: 8 }}>
              Create your company profile to enable job posting.
            </p>
          )}

          {company && !company.verified && (
            <p className="muted small" style={{ marginTop: 8 }}>
              Your company is not yet verified. Please contact admins before
              posting jobs.
            </p>
          )}
        </form>
      </div>

      <div className="card">
        <div className="card-head">
          <h2>Your Jobs</h2>
        </div>

        {loadingJobs ? (
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
                    {job.location || "—"} • {job.type || "—"} • {job.category || "—"} •{" "}
                    {job.workMode || "—"}
                  </p>

                  {Array.isArray(job.applicationFields) &&
                    job.applicationFields.length > 0 && (
                      <p className="muted small" style={{ marginTop: 6 }}>
                        Custom questions: {job.applicationFields.length}
                      </p>
                    )}
                </div>

                <span
                  className={`status-pill status-${String(
                    job.status || ""
                  ).toLowerCase()}`}
                >
                  {job.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}