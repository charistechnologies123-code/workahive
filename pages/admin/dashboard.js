import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { AdminSummaryCard, TokenSettingsSection } from "../../components/admin/AdminSections";

export default function AdminDashboard() {
  const [counts, setCounts] = useState({
    totalJobs: 0,
    openJobs: 0,
    closedJobs: 0,
    users: 0,
    employers: 0,
    companies: 0,
  });
  const router = useRouter();

  useEffect(() => {
    const load = async () => {
      const [jobsRes, usersRes, companiesRes] = await Promise.all([
        fetch("/api/admin/jobs/summary", { credentials: "include" }),
        fetch("/api/admin/users", { credentials: "include" }),
        fetch("/api/admin/companies", { credentials: "include" }),
      ]);

      if (jobsRes.status === 401 || usersRes.status === 401 || companiesRes.status === 401) {
        router.push("/login");
        return;
      }

      const jobsJson = await jobsRes.json();
      const usersJson = await usersRes.json();
      const companiesJson = await companiesRes.json();

      const users = Array.isArray(usersJson?.users) ? usersJson.users : [];
      const companies = Array.isArray(companiesJson?.companies) ? companiesJson.companies : [];

      setCounts({
        totalJobs: Number(jobsJson?.totalJobs ?? 0),
        openJobs: Number(jobsJson?.openJobs ?? 0),
        closedJobs: Number(jobsJson?.closedJobs ?? 0),
        users: users.length,
        employers: users.filter((user) => user.role === "EMPLOYER").length,
        companies: companies.length,
      });
    };

    load();
  }, [router]);

  return (
    <div className="page">
      <div className="admin-header">
        <h1 className="admin-title">Admin Dashboard</h1>
        <p className="admin-subtitle">Quick access to moderation, users, companies, and announcements.</p>
      </div>

      <div className="admin-summary-grid">
        <AdminSummaryCard
          title="Jobs"
          description="Open the jobs management page and change job status between open and closed."
          href="/admin/jobs"
          meta={`${counts.totalJobs} total • ${counts.openJobs} open • ${counts.closedJobs} closed`}
        />
        <AdminSummaryCard
          title="Employer Tokens"
          description="Open the employer tokens page to search employers and adjust balances."
          href="/admin/employer-tokens"
          meta={`${counts.employers} employers`}
        />
        <AdminSummaryCard
          title="Users"
          description="Manage users and filter by employer or job seeker."
          href="/admin/users"
          meta={`${counts.users} total users`}
        />
        <AdminSummaryCard
          title="Companies"
          description="Review company profiles and verify employers."
          href="/admin/companies"
          meta={`${counts.companies} companies`}
        />
        <AdminSummaryCard
          title="Blog"
          description="Create announcements and promotions that appear on the public blog page."
          href="/admin/blog"
          meta="Announcements"
        />
      </div>

      <div style={{ height: 18 }} />
      <TokenSettingsSection />
    </div>
  );
}



