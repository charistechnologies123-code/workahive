import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";

function normalizeFieldType(type) {
  const value = String(type || "").toUpperCase();

  if (value === "TEXTAREA") return "TEXTAREA";
  if (value === "SELECT") return "SELECT";
  if (value === "CHECKBOX") return "CHECKBOX";
  if (value === "RADIO") return "RADIO";
  if (value === "EMAIL") return "EMAIL";
  if (value === "NUMBER") return "NUMBER";
  if (value === "DATE") return "DATE";
  return "TEXT";
}

export default function JobDetail() {
  const router = useRouter();
  const { id } = router.query;

  const [job, setJob] = useState(null);
  const [me, setMe] = useState(null);
  const [loading, setLoading] = useState(true);

  const [pageError, setPageError] = useState("");
  const [message, setMessage] = useState("");

  // Apply state
  const [cvFile, setCvFile] = useState(null);
  const [coverLetter, setCoverLetter] = useState("");
  const [customAnswers, setCustomAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Save state
  const [isSaved, setIsSaved] = useState(false);
  const [savingJob, setSavingJob] = useState(false);

  const applicationFields = useMemo(() => {
    if (Array.isArray(job?.applicationFields)) return job.applicationFields;
    if (Array.isArray(job?.customQuestions)) return job.customQuestions;
    return [];
  }, [job]);

  const load = async () => {
    if (!id) return;
    setLoading(true);
    setPageError("");
    setMessage("");

    try {
      const meRes = await fetch("/api/auth/me", { credentials: "include" });
      const meData = await meRes.json();
      const user = meData.user || null;
      setMe(user);

      const jobRes = await fetch(`/api/jobs/${id}`, { credentials: "include" });
      const jobData = await jobRes.json();

      if (!jobRes.ok) {
        setPageError(jobData.error || "Failed to load job");
        setJob(null);
        return;
      }

      if (user?.role === "ADMIN") {
        router.replace(`/admin/jobs/${id}`);
        return;
      }

      if (user?.role === "EMPLOYER" && jobData.postedById === user.id) {
        router.replace(`/employer/jobs/${id}`);
        return;
      }

      setJob(jobData);
      setIsSaved(Boolean(jobData?.isSaved));

      const fields = Array.isArray(jobData?.applicationFields)
        ? jobData.applicationFields
        : Array.isArray(jobData?.customQuestions)
        ? jobData.customQuestions
        : [];

      const initialAnswers = {};
      fields.forEach((field, index) => {
        const key = String(field?.id ?? field?.name ?? field?.label ?? index);
        initialAnswers[key] =
          normalizeFieldType(field?.type) === "CHECKBOX" ? false : "";
      });
      setCustomAnswers(initialAnswers);
    } catch (e) {
      setPageError("Failed to load job");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const canApply = me?.role === "JOBSEEKER";

  const updateCustomAnswer = (fieldKey, value) => {
    setCustomAnswers((prev) => ({
      ...prev,
      [fieldKey]: value,
    }));
  };

  const validateCustomFields = () => {
    for (let i = 0; i < applicationFields.length; i += 1) {
      const field = applicationFields[i];
      const fieldKey = String(field?.id ?? field?.name ?? field?.label ?? i);
      const fieldLabel = field?.label || field?.question || `Field ${i + 1}`;
      const isRequired = Boolean(field?.required);
      const fieldType = normalizeFieldType(field?.type);
      const value = customAnswers[fieldKey];

      if (!isRequired) continue;

      if (fieldType === "CHECKBOX") {
        if (!value) {
          return `${fieldLabel} is required.`;
        }
      } else {
        if (String(value ?? "").trim() === "") {
          return `${fieldLabel} is required.`;
        }
      }
    }

    return "";
  };

  const toggleSaveJob = async () => {
    if (!canApply) {
      setPageError("Please login as a Job Seeker to save this job.");
      return;
    }

    setSavingJob(true);
    setPageError("");
    setMessage("");

    try {
      const res = await fetch("/api/jobs/toggle-save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ jobId: id }),
      });

      let data = {};
      try {
        data = await res.json();
      } catch {
        data = {};
      }

      if (!res.ok) {
        toast.error(data.error || "Failed to update saved job");
        return;
      }

      setIsSaved(Boolean(data.saved));
      toast.success(data.saved ? "Job saved successfully." : "Job removed from saved.");
    } catch {
      toast.error("Failed to update saved job");
    } finally {
      setSavingJob(false);
    }
  };

  const submitApplication = async (e) => {
    e.preventDefault();
    setPageError("");
    setMessage("");

    if (!canApply) {
      setPageError("Please login as a Job Seeker to apply.");
      return;
    }

    if (!cvFile) {
      setPageError("Please upload your CV.");
      return;
    }

    const validationError = validateCustomFields();
    if (validationError) {
      setPageError(validationError);
      return;
    }

    setSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("jobId", id);
      formData.append("cv", cvFile);
      formData.append("coverLetter", coverLetter);
      formData.append("customAnswers", JSON.stringify(customAnswers));

      const res = await fetch("/api/applications/apply", {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        const errorText = data.error || "Application failed";
        toast.error(errorText);
        setPageError(errorText);
        return;
      }

      setMessage("Application submitted successfully.");
      setCvFile(null);
      setCoverLetter("");

      const resetAnswers = {};
      applicationFields.forEach((field, index) => {
        const key = String(field?.id ?? field?.name ?? field?.label ?? index);
        resetAnswers[key] =
          normalizeFieldType(field?.type) === "CHECKBOX" ? false : "";
      });
      setCustomAnswers(resetAnswers);
    } catch (e) {
      const errorText = e?.message || "Application failed";
      toast.error(errorText);
      setPageError(errorText);
    } finally {
      setSubmitting(false);
    }
  };

  const renderCustomField = (field, index) => {
    const fieldType = normalizeFieldType(field?.type);
    const fieldKey = String(field?.id ?? field?.name ?? field?.label ?? index);
    const label = field?.label || field?.question || `Question ${index + 1}`;
    const placeholder = field?.placeholder || "";
    const required = Boolean(field?.required);
    const options = Array.isArray(field?.options)
      ? field.options
      : typeof field?.options === "string"
      ? field.options
          .split("\n")
          .map((item) => item.trim())
          .filter(Boolean)
      : [];

    if (fieldType === "TEXTAREA") {
      return (
        <div className="field" key={fieldKey}>
          <label>
            {label} {required ? "*" : ""}
          </label>
          <textarea
            rows={4}
            value={customAnswers[fieldKey] || ""}
            onChange={(e) => updateCustomAnswer(fieldKey, e.target.value)}
            placeholder={placeholder}
            required={required}
          />
        </div>
      );
    }

    if (fieldType === "SELECT") {
      return (
        <div className="field" key={fieldKey}>
          <label>
            {label} {required ? "*" : ""}
          </label>
          <select
            value={customAnswers[fieldKey] || ""}
            onChange={(e) => updateCustomAnswer(fieldKey, e.target.value)}
            required={required}
          >
            <option value="">Select an option</option>
            {options.map((option, optionIndex) => (
              <option key={`${fieldKey}-${optionIndex}`} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
      );
    }

    if (fieldType === "RADIO") {
      return (
        <div className="field" key={fieldKey}>
          <label>
            {label} {required ? "*" : ""}
          </label>
          <div style={{ display: "grid", gap: 10 }}>
            {options.map((option, optionIndex) => (
              <label
                key={`${fieldKey}-${optionIndex}`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  fontWeight: 400,
                }}
              >
                <input
                  type="radio"
                  name={fieldKey}
                  value={option}
                  checked={customAnswers[fieldKey] === option}
                  onChange={(e) => updateCustomAnswer(fieldKey, e.target.value)}
                  required={required && !customAnswers[fieldKey]}
                />
                <span>{option}</span>
              </label>
            ))}
          </div>
        </div>
      );
    }

    if (fieldType === "CHECKBOX") {
      return (
        <div className="field" key={fieldKey}>
          <label
            style={{ display: "flex", alignItems: "center", gap: 10, fontWeight: 400 }}
          >
            <input
              type="checkbox"
              checked={Boolean(customAnswers[fieldKey])}
              onChange={(e) => updateCustomAnswer(fieldKey, e.target.checked)}
              required={required}
            />
            <span>
              {label} {required ? "*" : ""}
            </span>
          </label>
        </div>
      );
    }

    let inputType = "text";
    if (fieldType === "EMAIL") inputType = "email";
    if (fieldType === "NUMBER") inputType = "number";
    if (fieldType === "DATE") inputType = "date";

    return (
      <div className="field" key={fieldKey}>
        <label>
          {label} {required ? "*" : ""}
        </label>
        <input
          type={inputType}
          value={customAnswers[fieldKey] || ""}
          onChange={(e) => updateCustomAnswer(fieldKey, e.target.value)}
          placeholder={placeholder}
          required={required}
        />
      </div>
    );
  };

  if (loading) {
    return (
      <div className="container">
        <p className="muted">Loading…</p>
      </div>
    );
  }

  if (pageError && !job) {
    return (
      <div className="container">
        <div className="alert alert-error">{pageError}</div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="container">
        <p className="muted">Job not found.</p>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="card">
        <div className="card-head">
          <h1 style={{ marginBottom: 6 }}>{job.title}</h1>
        </div>

        <div style={{ marginTop: 8 }}>
          <h3 className="job-section-heading">Job Details</h3>
          <div className="job-details-meta">
            <p className="muted small" style={{ margin: 0 }}>
              {job.company?.name || "—"} • {job.location || "—"} • {job.type || "—"} • {job.category || "—"}
            </p>
            <p className="muted small" style={{ margin: 0 }}>
              Applicants: <b>{job.applicantsCount}</b>
            </p>
          </div>

          <div style={{ marginTop: 12 }}>
            <span className={`status-pill status-${String(job.status || "").toLowerCase()}`}>
              {job.status}
            </span>
          </div>
        </div>

        <div style={{ marginTop: 18 }}>
          <h3 className="job-description-heading">Description</h3>
          {/<[a-z][\s\S]*>/i.test(job.description || "") ? (
            <div
              className="job-richtext"
              dangerouslySetInnerHTML={{ __html: job.description }}
            />
          ) : (
            <div style={{ whiteSpace: "pre-line" }}>{job.description}</div>
          )}
        </div>
      </div>

      <div className="card">
        <div className="card-head">
          <h2>Apply</h2>
          <p className="muted">Only logged-in Job Seekers can apply.</p>
        </div>

        {!me && (
          <div className="alert">
            <p style={{ margin: 0 }}>
              You’re viewing as a guest. <Link href="/login"><b>Login</b></Link> to apply.
            </p>
          </div>
        )}

        {me && me.role !== "JOBSEEKER" && (
          <div className="alert">
            <p style={{ margin: 0 }}>
              You’re logged in as <b>{me.role}</b>. Only Job Seekers can apply.
            </p>
          </div>
        )}

        {message && <div className="alert alert-success">{message}</div>}
        {pageError && job && <div className="alert alert-error">{pageError}</div>}

        {canApply && (
          <>
            <div style={{ marginBottom: 14 }}>
              <button
                type="button"
                className="btn-soft"
                onClick={toggleSaveJob}
                disabled={savingJob}
              >
                {savingJob ? "Please wait..." : isSaved ? "Unsave Job" : "Save Job"}
              </button>
            </div>

            <form onSubmit={submitApplication} className="form">
              <div className="field">
                <label>CV (PDF/DOC) *</label>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={(e) => setCvFile(e.target.files?.[0] || null)}
                  required
                />
              </div>

              <div className="field">
                <label>Cover Letter (optional)</label>
                <textarea
                  value={coverLetter}
                  onChange={(e) => setCoverLetter(e.target.value)}
                  rows={4}
                />
              </div>

              {applicationFields.length > 0 && (
                <div className="card" style={{ marginTop: 8 }}>
                  <div className="card-head">
                    <h3 style={{ margin: 0 }}>Additional Questions</h3>
                    <p className="muted small" style={{ marginTop: 6 }}>
                      Please complete the employer’s required application questions.
                    </p>
                  </div>

                  <div className="form">
                    {applicationFields.map((field, index) => renderCustomField(field, index))}
                  </div>
                </div>
              )}

              <button className="btn-primary" type="submit" disabled={submitting}>
                {submitting ? "Submitting..." : "Submit Application"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}