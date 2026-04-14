import { CompaniesSection } from "../../components/admin/AdminSections";

export default function AdminCompaniesPage() {
  return (
    <div className="page">
      <div className="page-head">
        <h1>Companies</h1>
        <p className="muted">Review employer company profiles and verification status.</p>
      </div>
      <CompaniesSection />
    </div>
  );
}
