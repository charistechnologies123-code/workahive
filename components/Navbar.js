import Link from "next/link";
import { useRouter } from "next/router";
import { useAuth } from "../context/AuthContext";
import Image from "next/image";

export default function Navbar() {
  const router = useRouter();
  const { user, loading } = useAuth();

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    window.dispatchEvent(new Event("auth-changed"));
    router.push("/");
  };

  const isEmployerDashboard = router.pathname === "/employer/dashboard";
  const isEmployerJobs =
    router.pathname === "/employer/jobs" ||
    router.pathname.startsWith("/employer/jobs/") ||
    router.pathname === "/jobs/[id]";
  const isEmployerProfile = router.pathname === "/employer/profile";

  const isAdminDashboard = router.pathname.startsWith("/admin/dashboard");
  const isAdminProfile = router.pathname === "/admin/profile";

  const isJobseekerProfile = router.pathname === "/jobseeker/profile";
  const isJobseekerJobs = router.pathname === "/jobseeker/jobs";

  return (
    <header className="nav">
      <div className="nav-inner">
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Image
            src="/workahive-logo.png"
            alt="WorkaHive"
            width={150}
            height={50}
          />
        </Link>

        <nav className="nav-links">
          <Link href="/" className={router.pathname === "/" ? "active" : ""}>
            Jobs
          </Link>

          {!loading && user?.role === "EMPLOYER" && (
            <>
              <Link
                href="/employer/dashboard"
                className={isEmployerDashboard ? "active" : ""}
              >
                Dashboard
              </Link>

              <Link
                href="/employer/jobs"
                className={isEmployerJobs ? "active" : ""}
              >
                My Jobs
              </Link>

              <Link
                href="/employer/profile"
                className={isEmployerProfile ? "active" : ""}
              >
                Profile
              </Link>
            </>
          )}

          {!loading && user?.role === "JOBSEEKER" && (
            <>
              <Link
                href="/jobseeker/jobs"
                className={isJobseekerJobs ? "active" : ""}
              >
                My Jobs
              </Link>

              <Link
                href="/jobseeker/profile"
                className={isJobseekerProfile ? "active" : ""}
              >
                Profile
              </Link>
            </>
          )}

          {!loading && user?.role === "ADMIN" && (
            <>
              <Link
                href="/admin/dashboard"
                className={isAdminDashboard ? "active" : ""}
              >
                Dashboard
              </Link>

              <Link
                href="/admin/profile"
                className={isAdminProfile ? "active" : ""}
              >
                Profile
              </Link>
            </>
          )}

          {!loading && !user && (
            <>
              <Link
                href="/login"
                className={router.pathname === "/login" ? "active" : ""}
              >
                Login
              </Link>

              <Link
                href="/register"
                className={
                  router.pathname === "/register"
                    ? "btn-primary active"
                    : "btn-soft"
                }
              >
                Register
              </Link>
            </>
          )}

          {!loading && user && (
            <>
              <span className="role-pill">{user.role}</span>
              <button onClick={logout} className="btn-soft">
                Logout
              </button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}