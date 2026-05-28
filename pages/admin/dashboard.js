import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import {
  AdminSummaryCard,
  AnalyticsSection,
  TokenSettingsSection,
} from "../../components/admin/AdminSections";

export default function AdminDashboard() {
  const [analytics, setAnalytics] = useState({
    totalJobs: 0,
    openJobs: 0,
    closedJobs: 0,
    users: 0,
    employers: 0,
    companies: 0,
    totalApplications: 0,
    verifiedCompanies: 0,
    pendingCompanies: 0,
    recentJobs30Days: 0,
    recentApplications30Days: 0,
  });
  const [loadingAnalytics, setLoadingAnalytics] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const load = async () => {
      const res = await fetch("/api/admin/analytics", { credentials: "include" });

      if (res.status === 401) {
        router.push("/login");
        return;
      }

      const data = await res.json();
      setAnalytics({
        totalJobs: Number(data?.totalJobs ?? 0),
        openJobs: Number(data?.openJobs ?? 0),
        closedJobs: Number(data?.closedJobs ?? 0),
        users: Number(data?.totalUsers ?? 0),
        employers: Number(data?.employers ?? 0),
        companies: Number(data?.totalCompanies ?? 0),
        totalApplications: Number(data?.totalApplications ?? 0),
        verifiedCompanies: Number(data?.verifiedCompanies ?? 0),
        pendingCompanies: Number(data?.pendingCompanies ?? 0),
        recentJobs30Days: Number(data?.recentJobs30Days ?? 0),
        recentApplications30Days: Number(data?.recentApplications30Days ?? 0),
      });
      setLoadingAnalytics(false);
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
          meta={`${analytics.totalJobs} total • ${analytics.openJobs} open • ${analytics.closedJobs} closed`}
        />
        <AdminSummaryCard
          title="Employer Tokens"
          description="Open the employer tokens page to search employers and adjust balances."
          href="/admin/employer-tokens"
          meta={`${analytics.employers} employers`}
        />
        <AdminSummaryCard
          title="Users"
          description="Manage users and filter by employer or job seeker."
          href="/admin/users"
          meta={`${analytics.users} total users`}
        />
        <AdminSummaryCard
          title="Companies"
          description="Review company profiles and verify employers."
          href="/admin/companies"
          meta={`${analytics.companies} companies`}
        />
        <AdminSummaryCard
          title="Blog"
          description="Create announcements and promotions that appear on the public blog page."
          href="/admin/blog"
          meta="Announcements"
        />
      </div>

      <div style={{ height: 18 }} />
      <AnalyticsSection analytics={analytics} loading={loadingAnalytics} />

      <div style={{ height: 18 }} />
      <TokenSettingsSection />
    </div>
  );
}
