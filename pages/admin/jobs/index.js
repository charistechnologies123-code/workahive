import { AdminJobsSection } from "../../../components/admin/AdminSections";

export default function AdminJobsPage() {
  return (
    <div className="page">
      <div className="page-head">
        <h1>Admin Jobs</h1>
        <p className="muted">Open a job to review it, or quickly change open and closed status here.</p>
      </div>
      <AdminJobsSection />
    </div>
  );
}
