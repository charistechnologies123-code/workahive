import { useEffect, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { CATEGORY_OPTIONS, TYPE_OPTIONS, WORKMODE_OPTIONS } from "../lib/constants";

export default function Home() {
  const [jobs, setJobs] = useState([]);
  const [filters, setFilters] = useState({
    q: "",
    category: "",
    type: "",
    workMode: "",
    location: "",
  });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 1,
  });

  const fetchJobs = async (activeFilters, activePage = 1) => {
    try {
      setLoading(true);

      const query = new URLSearchParams();

      Object.entries(activeFilters).forEach(([key, value]) => {
        if (typeof value === "string" && value.trim()) {
          query.append(key, value.trim());
        }
      });

      query.append("page", String(activePage));
      query.append("limit", "12");

      const res = await fetch(`/api/jobs?${query.toString()}`);
      const data = await res.json();

      if (!res.ok) {
        toast.error(data?.error || "Failed to fetch jobs");
        setJobs([]);
        setPagination({
          page: 1,
          limit: 12,
          total: 0,
          totalPages: 1,
        });
        return;
      }

      const list = Array.isArray(data?.jobs) ? data.jobs : [];
      const meta = data?.pagination || {
        page: activePage,
        limit: 12,
        total: list.length,
        totalPages: 1,
      };

      setJobs(list);
      setPagination(meta);
      setPage(meta.page);
    } catch (error) {
      console.error(error);
      toast.error("Something went wrong while fetching jobs");
      setJobs([]);
      setPagination({
        page: 1,
        limit: 12,
        total: 0,
        totalPages: 1,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs(filters, 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChange = (e) => {
    setFilters((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleFilter = (e) => {
    e.preventDefault();
    fetchJobs(filters, 1);
  };

  const handleClear = () => {
    const reset = {
      q: "",
      category: "",
      type: "",
      workMode: "",
      location: "",
    };
    setFilters(reset);
    fetchJobs(reset, 1);
  };

  const handlePrevPage = () => {
    if (page > 1) {
      fetchJobs(filters, page - 1);
    }
  };

  const handleNextPage = () => {
    if (page < pagination.totalPages) {
      fetchJobs(filters, page + 1);
    }
  };

  const startItem =
    pagination.total === 0 ? 0 : (pagination.page - 1) * pagination.limit + 1;

  const endItem =
    pagination.total === 0
      ? 0
      : Math.min(pagination.page * pagination.limit, pagination.total);

  return (
    <div>
      <div className="container">
        <h1>Find Jobs</h1>

        <form
          onSubmit={handleFilter}
          className="form"
          style={{ marginBottom: "1rem" }}
        >
          <div className="field">
            <label>Search</label>
            <input
              type="text"
              name="q"
              value={filters.q}
              placeholder="Search by title or keywords in description"
              onChange={handleChange}
            />
          </div>

          <div className="grid-2">
            <div className="field">
              <label>Category</label>
              <select
                name="category"
                value={filters.category}
                onChange={handleChange}
              >
               {CATEGORY_OPTIONS.map((category) => (
  <option key={category} value={category}>
    {category}
  </option>
))}
              </select>
            </div>

            <div className="field">
  <label>Job Type</label>
  <select
    name="type"
    value={filters.type}
    onChange={handleChange}
  >
    <option value="">All Types</option>
    {TYPE_OPTIONS.map((type) => (
      <option key={type} value={type}>
        {type}
      </option>
    ))}
  </select>
</div>
          </div>

          <div className="grid-2">
            <div className="field">
  <label>Work Mode</label>
  <select
    name="workMode"
    value={filters.workMode}
    onChange={handleChange}
  >
    <option value="">All Work Modes</option>
    {WORKMODE_OPTIONS.map((mode) => (
      <option key={mode.value} value={mode.value}>
        {mode.label}
      </option>
    ))}
  </select>
</div>

            <div className="field">
              <label>Location</label>
              <input
                type="text"
                name="location"
                value={filters.location}
                placeholder="e.g., Lagos"
                onChange={handleChange}
              />
            </div>
          </div>

          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
            <button className="btn-primary" type="submit" disabled={loading}>
              {loading ? "Loading..." : "Search / Filter"}
            </button>

            <button
              type="button"
              className="btn-soft"
              onClick={handleClear}
              disabled={loading}
            >
              Clear
            </button>
          </div>
        </form>

        <p className="muted small" style={{ marginBottom: "1rem" }}>
          Showing {startItem}-{endItem} of {pagination.total} jobs
        </p>

        {!loading && jobs.length === 0 && <p>No jobs found.</p>}

        {jobs.map((job) => (
          <div key={job.id} className="card">
            <h3>{job.title}</h3>
            <p>{job.company?.name || "Unknown Company"}</p>

            {job.location && <p>Location: {job.location}</p>}
            {job.type && <p>Type: {job.type}</p>}
            {job.workMode && <p>Work Mode: {job.workMode}</p>}

            <p className="muted small">
              Applicants: <b>{job.applicantsCount ?? 0}</b>
            </p>
            <button type="button"
             className="btn-soft"> <Link href={`/job/${job.id}`}>View Details</Link> </button>
            
          </div>
        ))}

        {pagination.totalPages > 1 && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              flexWrap: "wrap",
              marginTop: "1.5rem",
            }}
          >
            <button
              type="button"
              className="btn-soft"
              onClick={handlePrevPage}
              disabled={loading || page <= 1}
            >
              Previous
            </button>

            <span className="muted small">
              Page {pagination.page} of {pagination.totalPages}
            </span>

            <button
              type="button"
              className="btn-soft"
              onClick={handleNextPage}
              disabled={loading || page >= pagination.totalPages}
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
