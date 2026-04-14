import { useEffect, useState } from "react";
import { UsersSection } from "../../components/admin/AdminSections";

export default function AdminUsersPage() {
  const [adminId, setAdminId] = useState(null);

  useEffect(() => {
    const load = async () => {
      const res = await fetch("/api/auth/me", { credentials: "include" });
      const data = await res.json();
      if (data?.user?.id) setAdminId(data.user.id);
    };
    load();
  }, []);

  return (
    <div className="page">
      <div className="page-head">
        <h1>Users</h1>
        <p className="muted">Filter users by role and manage the user base.</p>
      </div>
      <UsersSection currentAdminId={adminId} />
    </div>
  );
}
