import { useRouter } from "next/router";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import RichTextEditor from "../../../components/RichTextEditor";
import {
  CATEGORY_OPTIONS,
  TYPE_OPTIONS,
  WORKMODE_OPTIONS,
} from "../../../lib/constants";

const APPLICATION_FIELD_TYPES = [
  { label: "Short Text", value: "TEXT" },
  { label: "Long Text", value: "TEXTAREA" },
  { label: "URL / Link", value: "URL" },
  { label: "Number", value: "NUMBER" },
];

function createEmptyApplicationField() {
  return {
    label: "",
    type: "TEXT",
    required: true,
    placeholder: "",
  };
}

function formatStatus(status) {
  const value = String(status || "");
  if (!value) return "Unknown";
  return value.charAt(0) + value.slice(1).toLowerCase();
}

export default function EmployerJobManage() {
  const router = useRouter();
  const { id } = router.query;

  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusBusy, setStatusBusy] = useState(false);

  const [form, setForm] = useState({
    title: "",
    description: "",
    categoryPreset: "",
    categoryOther: "",
    typePreset: "",
    typeOther: "",
    workMode: "",
    location: "",
    applicationFields: [],
  });

  const finalCategory =
    form.categoryPreset === "__OTHER__" ? form.categoryOther : form.categoryPreset;

  const finalType =
    form.typePreset === "__OTHER__" ? form.typeOther : form.typePreset;

  const applicantsCount = useMemo(() => {
    if (!job) return 0;
    if (typeof job.applicantsCount === "number") return job.applicantsCount;
    if (typeof job.applicationsCount === "number") return job.applicationsCount;
    if (Array.isArray(job.applications)) return job.applications.length;
    return 0;
  }, [job]);

  const load = async () => {
    if (!id) return;

    setLoading(true);

    try {
      const res = await fetch(`/api/jobs/${id}`, { credentials: "include" });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Failed to load job");
        setJob(null);
        setLoading(false);
        return;
      }

      const incomingCategory = data.category || "";
      const incomingType = data.type || "";

      const categoryIsPreset = CATEGORY_OPTIONS.includes(incomingCategory);
      const typeIsPreset = TYPE_OPTIONS.includes(incomingType);

      const incomingApplicationFields = Array.isArray(data.applicationFields)
        ? data.applicationFields
        : [];

      setJob(data);
      setForm({
        title: data.title || "",
        description: data.description || "",
        categoryPreset: incomingCategory
          ? categoryIsPreset
            ? incomingCategory
            : "__OTHER__"
          : "",
        categoryOther: incomingCategory && !categoryIsPreset ? incomingCategory : "",
        typePreset: incomingType
          ? typeIsPreset
            ? incomingType
            : "__OTHER__"
          : "",
        typeOther: incomingType && !typeIsPreset ? incomingType : "",
        workMode: data.workMode || "",
        location: data.location || "",
        applicationFields: incomingApplicationFields.map((field) => ({
          label: field?.label || "",
          type: field?.type || "TEXT",
          required: Boolean(field?.required),
          placeholder: field?.placeholder || "",
        })),
      });
    } catch {
      toast.error("Failed to load job");
      setJob(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  const addApplicationField = () => {
    setForm((prev) => ({
      ...prev,
      applicationFields: [...prev.applicationFields, createEmptyApplicationField()],
    }));
  };

  const updateApplicationField = (index, patch) => {
    setForm((prev) => ({
      ...prev,
      applicationFields: prev.applicationFields.map((field, i) =>
        i === index ? { ...field, ...patch } : field
      ),
    }));
  };

  const removeApplicationField = (index) => {
    setForm((prev) => ({
      ...prev,
      applicationFields: prev.applicationFields.filter((_, i) => i !== index),
    }));
  };

  const save = async (e) => {
    e.preventDefault();

    const cleanedApplicationFields = (form.applicationFields || [])
      .map((field) => ({
        label: (field.label || "").trim(),
        type: field.type || "TEXT",
        required: Boolean(field.required),
        placeholder: (field.placeholder || "").trim(),
      }))
      .filter((field) => field.label);

    const hasInvalidField = (form.applicationFields || []).some(
      (field) => !(field.label || "").trim()
    );

    if (hasInvalidField) {
      toast.error("Every custom application question must have a label.");
      return;
    }

    setSaving(true);

    try {
      const payload = {
        title: form.title,
        description: form.description,
        category: finalCategory || null,
        type: finalType || null,
        workMode: form.workMode || null,
        location: form.location || null,
        applicationFields: cleanedApplicationFields,
      };

      const res = await fetch(`/api/jobs/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Failed to save changes");
        return;
      }

      setJob(data);
      toast.success("Job updated successfully.");
      await load();
    } catch {
      toast.error("Failed to save changes");
    } finally {
      setSaving(false);
    }
  };

  const updateStatus = async (nextStatus) => {
    setStatusBusy(true);

    try {
      const res = await fetch(`/api/jobs/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status: nextStatus }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(
          data.error ||
            `Failed to ${nextStatus === "CLOSED" ? "close" : "re-open"} job`
        );
        return;
      }

      setJob(data);
      toast.success(
        nextStatus === "CLOSED"
          ? "Job closed successfully."
          : "Job re-opened successfully."
      );
      await load();
    } catch {
      toast.error(
        nextStatus === "CLOSED" ? "Failed to close job" : "Failed to re-open job"
      );
    } finally {
      setStatusBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="container">
        <p className="muted">Loading job…</p>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="container">
        <div className="card">
          <h2 style={{ marginTop: 0 }}>Job not found</h2>
          <p className="muted">
            This job may not exist, or you may not have permission to manage it.
          </p>
          <Link href="/employer/jobs" className="btn-primary">
            Back to My Jobs
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="page-head">
        <h1>Manage Job</h1>
        <p className="muted">
          Edit job details, manage visibility, and review application
          requirements.
        </p>
      </div>

      <div className="card">
        <div
          className="card-head"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: 16,
            flexWrap: "wrap",
          }}
        >
          <div>
            <h2 style={{ marginBottom: 6 }}>{job.title || "Untitled Job"}</h2>
            <p className="muted small" style={{ margin: 0 }}>
              Applicants: <b>{applicantsCount}</b>
            </p>
            <p className="muted small" style={{ marginTop: 6 }}>
              Posted: {job.createdAt ? new Date(job.createdAt).toLocaleString() : "—"}
            </p>
          </div>

          <div
            style={{
              display: "flex",
              gap: 10,
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            <span
              className={`status-pill status-${String(job.status || "").toLowerCase()}`}
            >
              Status: {formatStatus(job.status)}
            </span>

            <Link href="/employer/jobs" className="btn-soft">
              My Jobs
            </Link>

            <Link
              href={`/employer/applications?jobId=${job.id}`}
              className="btn-soft"
            >
              View Applications ({applicantsCount})
            </Link>

            {job.status === "OPEN" ? (
              <button
                type="button"
                className="btn-primary"
                onClick={() => updateStatus("CLOSED")}
                disabled={statusBusy}
              >
                {statusBusy ? "Please wait…" : "Close Job"}
              </button>
            ) : (
              <button
                type="button"
                className="btn-outline"
                onClick={() => updateStatus("OPEN")}
                disabled={statusBusy}
              >
                {statusBusy ? "Please wait…" : "Re-open Job"}
              </button>
            )}
          </div>
        </div>

        <div className="grid-2" style={{ marginTop: 10 }}>
          <div
            style={{
              padding: "12px 14px",
              borderRadius: 12,
              border: "1px solid rgba(255,255,255,0.08)",
              background: "rgba(255,255,255,0.03)",
            }}
          >
            <p className="muted small" style={{ marginTop: 0 }}>
              Category
            </p>
            <p style={{ marginBottom: 0 }}>
              <b>{job.category || "—"}</b>
            </p>
          </div>

          <div
            style={{
              padding: "12px 14px",
              borderRadius: 12,
              border: "1px solid rgba(255,255,255,0.08)",
              background: "rgba(255,255,255,0.03)",
            }}
          >
            <p className="muted small" style={{ marginTop: 0 }}>
              Type
            </p>
            <p style={{ marginBottom: 0 }}>
              <b>{job.type || "—"}</b>
            </p>
          </div>

          <div
            style={{
              padding: "12px 14px",
              borderRadius: 12,
              border: "1px solid rgba(255,255,255,0.08)",
              background: "rgba(255,255,255,0.03)",
            }}
          >
            <p className="muted small" style={{ marginTop: 0 }}>
              Work Mode
            </p>
            <p style={{ marginBottom: 0 }}>
              <b>{job.workMode || "—"}</b>
            </p>
          </div>

          <div
            style={{
              padding: "12px 14px",
              borderRadius: 12,
              border: "1px solid rgba(255,255,255,0.08)",
              background: "rgba(255,255,255,0.03)",
            }}
          >
            <p className="muted small" style={{ marginTop: 0 }}>
              Location
            </p>
            <p style={{ marginBottom: 0 }}>
              <b>{job.location || "—"}</b>
            </p>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-head">
          <h2>Edit Job Details</h2>
          <p className="muted">
            Changes are saved directly. Closed jobs should no longer appear in
            public listings.
          </p>
        </div>

        <form onSubmit={save} className="form">
          <div className="field">
            <label>Job Title *</label>
            <input
              value={form.title}
              onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
              placeholder="e.g. Mathematics Teacher"
              required
            />
          </div>

          <div className="field">
            <label>Job Description *</label>
            <RichTextEditor
              value={form.description}
              onChange={(html) =>
                setForm((prev) => ({
                  ...prev,
                  description: html,
                }))
              }
              placeholder="Add responsibilities, requirements, benefits, salary range, and other details."
            />
          </div>

          <div className="grid-2">
            <div className="field">
              <label>Category</label>
              <select
                value={form.categoryPreset}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    categoryPreset: e.target.value,
                    categoryOther:
                      e.target.value === "__OTHER__" ? prev.categoryOther : "",
                  }))
                }
              >
                <option value="">Select category</option>
                {CATEGORY_OPTIONS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
                <option value="__OTHER__">Other…</option>
              </select>

              {form.categoryPreset === "__OTHER__" && (
                <input
                  style={{ marginTop: 8 }}
                  value={form.categoryOther}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, categoryOther: e.target.value }))
                  }
                  placeholder="Specify category"
                />
              )}
            </div>

            <div className="field">
              <label>Job Type</label>
              <select
                value={form.typePreset}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    typePreset: e.target.value,
                    typeOther: e.target.value === "__OTHER__" ? prev.typeOther : "",
                  }))
                }
              >
                <option value="">Select job type</option>
                {TYPE_OPTIONS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
                <option value="__OTHER__">Other…</option>
              </select>

              {form.typePreset === "__OTHER__" && (
                <input
                  style={{ marginTop: 8 }}
                  value={form.typeOther}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, typeOther: e.target.value }))
                  }
                  placeholder="Specify job type"
                />
              )}
            </div>
          </div>

          <div className="grid-2">
            <div className="field">
              <label>Work Mode</label>
              <select
                value={form.workMode}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, workMode: e.target.value }))
                }
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
              <label>Location</label>
              <input
                value={form.location}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, location: e.target.value }))
                }
                placeholder="e.g. Ogbomoso, Ibadan, Lagos"
              />
            </div>
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
                  Edit the extra questions applicants must answer before
                  submitting.
                </p>
              </div>

              <button
                type="button"
                className="btn-soft"
                onClick={addApplicationField}
              >
                + Add Question
              </button>
            </div>

            {form.applicationFields.length === 0 ? (
              <p className="muted small" style={{ marginTop: 10 }}>
                No custom questions added yet.
              </p>
            ) : (
              <div style={{ display: "grid", gap: 14, marginTop: 10 }}>
                {form.applicationFields.map((field, index) => (
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
                        gap: 10,
                        flexWrap: "wrap",
                        marginBottom: 10,
                      }}
                    >
                      <strong>Question {index + 1}</strong>

                      <button
                        type="button"
                        className="btn-soft"
                        onClick={() => removeApplicationField(index)}
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

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button className="btn-primary" type="submit" disabled={saving}>
              {saving ? "Saving…" : "Save Changes"}
            </button>

            <Link
              href={`/employer/applications?jobId=${job.id}`}
              className="btn-soft"
            >
              View Applications ({applicantsCount})
            </Link>

            {job.status === "OPEN" ? (
              <button
                className="btn-primary"
                type="button"
                onClick={() => updateStatus("CLOSED")}
                disabled={statusBusy}
              >
                {statusBusy ? "Please wait…" : "Close Job"}
              </button>
            ) : (
              <button
                className="btn-outline"
                type="button"
                onClick={() => updateStatus("OPEN")}
                disabled={statusBusy}
              >
                {statusBusy ? "Please wait…" : "Re-open Job"}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}