import { EmployerTokensSection } from "../../components/admin/AdminSections";

export default function AdminEmployerTokensPage() {
  return (
    <div className="page">
      <div className="page-head">
        <h1>Employer Tokens</h1>
        <p className="muted">Search employers and update token balances.</p>
      </div>
      <EmployerTokensSection />
    </div>
  );
}
