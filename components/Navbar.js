import Link from "next/link";
import { useRouter } from "next/router";
import { useAuth } from "../context/AuthContext";
import { useState, useEffect, useRef } from "react";

function SupportIcon({ size = 18 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M4 13a8 8 0 1 1 16 0v3a2 2 0 0 1-2 2h-2v-6h4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M4 18h2v-6H2v4a2 2 0 0 0 2 2Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M9 18a3 3 0 0 0 3 3h2"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <rect x="12.5" y="19.5" width="4" height="3" rx="1.5" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

export default function Navbar() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const notificationRef = useRef(null);

  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/notifications?limit=10", {
        credentials: "include",
      });
      if (!res.ok) return;
      const data = await res.json();
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  };

  useEffect(() => {
    if (user) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };

    if (showNotifications) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showNotifications]);

  useEffect(() => {
    setSidebarOpen(false);
  }, [router.pathname]);

  const markAsRead = async (ids) => {
    try {
      await fetch("/api/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ ids }),
      });
      fetchNotifications();
    } catch (error) {
      console.error("Error marking as read:", error);
    }
  };

  const deleteNotification = async (id) => {
    try {
      await fetch("/api/notifications", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ id }),
      });
      fetchNotifications();
    } catch (error) {
      console.error("Error deleting notification:", error);
    }
  };

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    window.dispatchEvent(new Event("auth-changed"));
    router.push("/");
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  const isEmployerDashboard = router.pathname === "/employer/dashboard";
  const isEmployerJobs =
    router.pathname === "/employer/jobs" ||
    router.pathname.startsWith("/employer/jobs/") ||
    router.pathname === "/jobs/[id]";
  const isEmployerProfile = router.pathname === "/employer/profile";

  const isAdminDashboard = router.pathname.startsWith("/admin/dashboard");
  const isAdminProfile = router.pathname === "/admin/profile";
  const isAdminTokens = router.pathname === "/admin/token-plans";
  const isBlogPage = router.pathname === "/blog" || router.pathname.startsWith("/blog/");

  const isJobseekerProfile = router.pathname === "/jobseeker/profile";
  const isJobseekerJobs = router.pathname === "/jobseeker/jobs";

  return (
    <>
      {sidebarOpen && <div className="sidebar-overlay" onClick={closeSidebar}></div>}

      <div className={`sidebar ${sidebarOpen ? "sidebar-open" : ""}`}>
        <div className="sidebar-header">
          <button className="sidebar-close" onClick={closeSidebar} aria-label="Close menu">
            ×
          </button>
        </div>
        <nav className="sidebar-nav">
          {!loading && user && <div className="sidebar-role">{user.role}</div>}

          <Link href="/" className={router.pathname === "/" ? "active" : ""} onClick={closeSidebar}>
            Jobs
          </Link>
          <Link href="/blog" className={isBlogPage ? "active" : ""} onClick={closeSidebar}>
            Blog
          </Link>

          {!loading && user?.role === "EMPLOYER" && (
            <>
              <Link href="/employer/dashboard" className={isEmployerDashboard ? "active" : ""} onClick={closeSidebar}>
                Dashboard
              </Link>
              <Link href="/employer/jobs" className={isEmployerJobs ? "active" : ""} onClick={closeSidebar}>
                My Jobs
              </Link>
              <Link href="/employer/profile" className={isEmployerProfile ? "active" : ""} onClick={closeSidebar}>
                Profile
              </Link>
            </>
          )}

          {!loading && user?.role === "JOBSEEKER" && (
            <>
              <Link href="/jobseeker/jobs" className={isJobseekerJobs ? "active" : ""} onClick={closeSidebar}>
                My Jobs
              </Link>
              <Link href="/jobseeker/profile" className={isJobseekerProfile ? "active" : ""} onClick={closeSidebar}>
                Profile
              </Link>
            </>
          )}

          {!loading && user?.role === "ADMIN" && (
            <>
              <Link href="/admin/dashboard" className={isAdminDashboard ? "active" : ""} onClick={closeSidebar}>
                Dashboard
              </Link>
              <Link href="/admin/token-plans" className={isAdminTokens ? "active" : ""} onClick={closeSidebar}>
                Tokens
              </Link>
              <Link href="/admin/profile" className={isAdminProfile ? "active" : ""} onClick={closeSidebar}>
                Profile
              </Link>
            </>
          )}

          <div className="sidebar-divider"></div>

          <Link href="/support" className="sidebar-secondary sidebar-support-link" onClick={closeSidebar}>
            <SupportIcon size={18} />
            <span>Support</span>
          </Link>

          {!loading && user ? (
            <button
              onClick={() => {
                logout();
                closeSidebar();
              }}
              className="sidebar-logout-btn"
            >
              Logout
            </button>
          ) : (
            <>
              <Link href="/login" className="sidebar-secondary" onClick={closeSidebar}>
                Login
              </Link>
              <Link href="/register" className="sidebar-secondary" onClick={closeSidebar}>
                Register
              </Link>
            </>
          )}
        </nav>
      </div>

      <header className="nav">
        <div className="nav-inner">
          <div className="nav-left">
            <button className="hamburger" onClick={() => setSidebarOpen((prev) => !prev)} aria-label="Open menu">
              <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
                <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z" />
              </svg>
            </button>
            <Link href="/" className="logo">
              <img
                src="/workahive-logo.png"
                alt="WorkaHive"
                width={150}
                height={50}
                loading="eager"
              />
            </Link>
          </div>

          <nav className="nav-links">
            <Link href="/" className={router.pathname === "/" ? "active" : ""}>
              Jobs
            </Link>
            <Link href="/blog" className={isBlogPage ? "active" : ""}>
              Blog
            </Link>

            {!loading && user?.role === "EMPLOYER" && (
              <>
                <Link href="/employer/dashboard" className={isEmployerDashboard ? "active" : ""}>
                  Dashboard
                </Link>
                <Link href="/employer/jobs" className={isEmployerJobs ? "active" : ""}>
                  My Jobs
                </Link>
                <Link href="/employer/profile" className={isEmployerProfile ? "active" : ""}>
                  Profile
                </Link>
              </>
            )}

            {!loading && user?.role === "JOBSEEKER" && (
              <>
                <Link href="/jobseeker/jobs" className={isJobseekerJobs ? "active" : ""}>
                  My Jobs
                </Link>
                <Link href="/jobseeker/profile" className={isJobseekerProfile ? "active" : ""}>
                  Profile
                </Link>
              </>
            )}

            {!loading && user?.role === "ADMIN" && (
              <>
                <Link href="/admin/dashboard" className={isAdminDashboard ? "active" : ""}>
                  Dashboard
                </Link>
                <Link href="/admin/token-plans" className={isAdminTokens ? "active" : ""}>
                  Tokens
                </Link>
                <Link href="/admin/profile" className={isAdminProfile ? "active" : ""}>
                  Profile
                </Link>
              </>
            )}
          </nav>

          <div className="nav-actions">
            {!loading && user && (
              <div className="notification-bell-wrapper" ref={notificationRef}>
                <button
                  className="notification-bell"
                  onClick={() => setShowNotifications((prev) => !prev)}
                  title={`${unreadCount} unread notifications`}
                >
                  <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9m0 0V5a3 3 0 1 0-6 0v3M9 21h6a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2z" />
                  </svg>
                  {unreadCount > 0 && (
                    <span className="notification-badge">{unreadCount > 99 ? "99+" : unreadCount}</span>
                  )}
                </button>

                {showNotifications && (
                  <div className="notification-dropdown">
                    <div className="notification-header">
                      <h3>Notifications</h3>
                      {unreadCount > 0 && (
                        <button
                          className="mark-all-read"
                          onClick={() => markAsRead(notifications.filter((n) => !n.read).map((n) => n.id))}
                        >
                          Mark all as read
                        </button>
                      )}
                    </div>

                    {notifications.length === 0 ? (
                      <div className="notification-empty">
                        <p>No notifications yet</p>
                      </div>
                    ) : (
                      <div className="notification-list">
                        {notifications.map((notification) => (
                          <div
                            key={notification.id}
                            className={`notification-item ${!notification.read ? "unread" : ""}`}
                            onClick={() => !notification.read && markAsRead([notification.id])}
                          >
                            <div className="notification-content">
                              <div className="notification-title">{notification.title}</div>
                              <div className="notification-message">{notification.message}</div>
                              <div className="notification-time">
                                {new Date(notification.createdAt).toLocaleDateString()}
                              </div>
                            </div>
                            <button
                              className="notification-delete"
                              onClick={(event) => {
                                event.stopPropagation();
                                deleteNotification(notification.id);
                              }}
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {!loading && user?.role === "EMPLOYER" && (
              <div className="nav-token-pill" title="Token balance">
                <span>{"\u{1FA99}"} {typeof user.tokens === "number" ? user.tokens : 0}</span>
              </div>
            )}

            <Link href="/support" className="nav-link nav-support-link nav-mobile-hide">
              <SupportIcon size={16} />
              <span>Support</span>
            </Link>

            {!loading && user && (
              <button onClick={logout} className="nav-link desktop-logout nav-mobile-hide">
                Logout
              </button>
            )}

            {!loading && !user && (
              <>
                <Link href="/login" className="btn-soft nav-mobile-hide">
                  Login
                </Link>
                <Link href="/register" className="btn-primary nav-mobile-hide">
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      </header>
    </>
  );
}
