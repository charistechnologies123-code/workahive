import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { formatWorkaHiveDate, formatWorkaHiveDateTime } from "../../lib/date-format";

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

function normalizeAnswerMode(mode) {
  const value = String(mode || "").toUpperCase();
  if (value === "FILE") return "FILE";
  if (value === "TEXT_OR_FILE") return "TEXT_OR_FILE";
  return "TEXT";
}

function getFieldKey(field, index) {
  return String(field?.id ?? field?.name ?? field?.label ?? index);
}

export default function JobDetail() {
  const router = useRouter();
  const { id } = router.query;

  const [job, setJob] = useState(null);
  const [me, setMe] = useState(null);
  const [loading, setLoading] = useState(true);

  const [pageError, setPageError] = useState("");
  const [message, setMessage] = useState("");

  const [cvFile, setCvFile] = useState(null);
  const [customAnswers, setCustomAnswers] = useState({});
  const [customAnswerFiles, setCustomAnswerFiles] = useState({});
  const [submitting, setSubmitting] = useState(false);

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
        const key = getFieldKey(field, index);
        initialAnswers[key] =
          normalizeFieldType(field?.type) === "CHECKBOX" ? false : "";
      });
      setCustomAnswers(initialAnswers);
      setCustomAnswerFiles({});
    } catch (error) {
      setPageError("Failed to load job");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  const canApply = me?.role === "JOBSEEKER";

  const updateCustomAnswer = (fieldKey, value) => {
    setCustomAnswers((prev) => ({
      ...prev,
      [fieldKey]: value,
    }));
  };

  const updateCustomAnswerFile = (fieldKey, file) => {
    setCustomAnswerFiles((prev) => ({
      ...prev,
      [fieldKey]: file || null,
    }));
  };

  const validateCustomFields = () => {
    for (let i = 0; i < applicationFields.length; i += 1) {
      const field = applicationFields[i];
      const fieldKey = getFieldKey(field, i);
      const fieldLabel = field?.label || field?.question || `Field ${i + 1}`;
      const value = customAnswers[fieldKey];
      const file = customAnswerFiles[fieldKey];
      const answerMode = normalizeAnswerMode(field?.answerMode || field?.responseMode || field?.mode);

      if (answerMode === "FILE") {
        if (!file) {
          return `${fieldLabel} requires a file upload.`;
        }
        continue;
      }

      if (answerMode === "TEXT_OR_FILE") {
        if (String(value ?? "").trim() === "" && !file) {
          return `${fieldLabel} requires a typed response or a file upload.`;
        }
        continue;
      }

      if (normalizeFieldType(field?.type) === "CHECKBOX") {
        if (!value) {
          return `${fieldLabel} is required.`;
        }
      } else if (String(value ?? "").trim() === "") {
        return `${fieldLabel} is required.`;
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

  const submitApplication = async (event) => {
    event.preventDefault();
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
      formData.append("customAnswers", JSON.stringify(customAnswers));

      Object.entries(customAnswerFiles).forEach(([fieldKey, file]) => {
        if (file) {
          formData.append(`customFile_${fieldKey}`, file);
        }
      });

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
      setCustomAnswerFiles({});

      const resetAnswers = {};
      applicationFields.forEach((field, index) => {
        const key = getFieldKey(field, index);
        resetAnswers[key] =
          normalizeFieldType(field?.type) === "CHECKBOX" ? false : "";
      });
      setCustomAnswers(resetAnswers);
    } catch (error) {
      const errorText = error?.message || "Application failed";
      toast.error(errorText);
      setPageError(errorText);
    } finally {
      setSubmitting(false);
    }
  };

  const renderCustomField = (field, index) => {
    const fieldType = normalizeFieldType(field?.type);
    const fieldKey = getFieldKey(field, index);
    const label = field?.label || field?.question || `Question ${index + 1}`;
    const placeholder = field?.placeholder || "";
    const answerMode = normalizeAnswerMode(field?.answerMode || field?.responseMode || field?.mode);
    const required = true;
    const options = Array.isArray(field?.options)
      ? field.options
      : typeof field?.options === "string"
      ? field.options
          .split("\n")
          .map((item) => item.trim())
          .filter(Boolean)
      : [];
    const fileValue = customAnswerFiles[fieldKey];
    const fileHint = "Max 5MB. PDF, DOC, DOCX or similar document files.";

    const renderFileInput = () => (
      <div className="field" style={{ marginTop: 8 }}>
        <label>Upload file {required ? "*" : ""}</label>
        <input
          type="file"
          accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.txt"
          onChange={(event) => updateCustomAnswerFile(fieldKey, event.target.files?.[0] || null)}
          required={required && answerMode === "FILE" && !fileValue}
        />
        <p className="muted small" style={{ margin: 0 }}>
          {fileHint}
        </p>
        {fileValue?.name && (
          <p className="muted small" style={{ margin: 0 }}>
            Selected: <b>{fileValue.name}</b>
          </p>
        )}
      </div>
    );

    if (answerMode === "FILE") {
      return (
        <div className="field" key={fieldKey}>
          <label>
            {label} {required ? "*" : ""}
          </label>
          <p className="muted small" style={{ margin: 0 }}>
            {placeholder || "Upload a file response."}
          </p>
          {renderFileInput()}
        </div>
      );
    }

    const textField = () => {
      if (fieldType === "TEXTAREA") {
        return (
          <textarea
            rows={4}
            value={customAnswers[fieldKey] || ""}
            onChange={(event) => updateCustomAnswer(fieldKey, event.target.value)}
            placeholder={placeholder}
            required={required && answerMode !== "TEXT_OR_FILE"}
          />
        );
      }

      if (fieldType === "SELECT") {
        return (
          <select
            value={customAnswers[fieldKey] || ""}
            onChange={(event) => updateCustomAnswer(fieldKey, event.target.value)}
            required={required && answerMode !== "TEXT_OR_FILE"}
          >
            <option value="">Select an option</option>
            {options.map((option, optionIndex) => (
              <option key={`${fieldKey}-${optionIndex}`} value={option}>
                {option}
              </option>
            ))}
          </select>
        );
      }

      if (fieldType === "RADIO") {
        return (
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
                  onChange={(event) => updateCustomAnswer(fieldKey, event.target.value)}
                  required={required && !customAnswers[fieldKey] && answerMode !== "TEXT_OR_FILE"}
                />
                <span>{option}</span>
              </label>
            ))}
          </div>
        );
      }

      if (fieldType === "CHECKBOX") {
        return (
          <label
            style={{ display: "flex", alignItems: "center", gap: 10, fontWeight: 400 }}
          >
            <input
              type="checkbox"
              checked={Boolean(customAnswers[fieldKey])}
              onChange={(event) => updateCustomAnswer(fieldKey, event.target.checked)}
              required={required && answerMode !== "TEXT_OR_FILE"}
            />
            <span>
              {label} {required ? "*" : ""}
            </span>
          </label>
        );
      }

      let inputType = "text";
      if (fieldType === "EMAIL") inputType = "email";
      if (fieldType === "NUMBER") inputType = "number";
      if (fieldType === "DATE") inputType = "date";

      return (
        <input
          type={inputType}
          value={customAnswers[fieldKey] || ""}
          onChange={(event) => updateCustomAnswer(fieldKey, event.target.value)}
          placeholder={placeholder}
          required={required && answerMode !== "TEXT_OR_FILE"}
        />
      );
    };

    if (answerMode === "TEXT_OR_FILE") {
      return (
        <div className="field" key={fieldKey}>
          <label>
            {label} {required ? "*" : ""}
          </label>
          {fieldType === "TEXTAREA" ? (
            <textarea
              rows={4}
              value={customAnswers[fieldKey] || ""}
              onChange={(event) => updateCustomAnswer(fieldKey, event.target.value)}
              placeholder={placeholder}
            />
          ) : (
            textField()
          )}
          <p className="muted small" style={{ margin: 0 }}>
            You can type a response or upload a file.
          </p>
          {renderFileInput()}
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
            onChange={(event) => updateCustomAnswer(fieldKey, event.target.value)}
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

    return (
      <div className="field" key={fieldKey}>
        <label>
          {label} {required ? "*" : ""}
        </label>
        {textField()}
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
            <p className="muted small" style={{ margin: 0 }}>
              Posted: <b>{formatWorkaHiveDateTime(job.createdAt)}</b>
            </p>
            <p className="muted small" style={{ margin: 0 }}>
              Salary: <b>{job.salary || "—"}</b> • Deadline: <b>{formatWorkaHiveDate(job.applicationDeadline)}</b>
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
          <p className="muted">
            {canApply
              ? "Submit your CV and complete any required application questions."
              : "Log in as a Job Seeker to apply for this role."}
          </p>
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
                <label>CV (PDF/DOC, max 5MB) *</label>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={(event) => setCvFile(event.target.files?.[0] || null)}
                  required
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
