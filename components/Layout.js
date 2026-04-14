import { useEffect } from "react";
import { useRouter } from "next/router";
import Navbar from "./Navbar";
import { useAuth } from "../context/AuthContext";

export default function Layout({ children }) {
  const currentYear = new Date().getFullYear();
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading || !user) return;
    if (user.role === "ADMIN" || user.emailVerified) return;

    const allowedPaths = new Set([
      "/login",
      "/register",
      "/forgot-password",
      "/verify-email",
      "/verify-email/sent",
    ]);

    if (allowedPaths.has(router.pathname)) return;

    router.replace(`/verify-email/sent?email=${encodeURIComponent(user.email || "")}&role=${encodeURIComponent(user.role || "JOBSEEKER")}`);
  }, [loading, router, user]);

  return (
    <div className="app-shell">
      <Navbar />
      <main className="app-main">{children}</main>
      <footer className="footer">
        <div className="footer-inner">&copy; {currentYear} Charis Technologies</div>
      </footer>
    </div>
  );
}
