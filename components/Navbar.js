import Link from "next/link";
import { useRouter } from "next/router";
import { useAuth } from "../context/AuthContext";
import { useState, useEffect, useRef } from "react";

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
      const interval = setInterval(fetchNotifications, 30000); // Poll every 30s
      return () => clearInterval(interval);
    }
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notificationRef.current && !notificationRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
    };

    if (showNotifications) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showNotifications]);

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

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
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
  const isAdminTokens = router.pathname === "/admin/token-plans"; // new
  const isBlogPage = router.pathname === "/blog" || router.pathname.startsWith("/blog/");

  const isJobseekerProfile = router.pathname === "/jobseeker/profile";
  const isJobseekerJobs = router.pathname === "/jobseeker/jobs";

  return (
    <>
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="sidebar-overlay" onClick={closeSidebar}></div>
      )}

      {/* Mobile Sidebar */}
      <div className={`sidebar ${sidebarOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-header">
          <button className="sidebar-close" onClick={closeSidebar}>
            ✕
          </button>
        </div>
        <nav className="sidebar-nav">
          {/* Role Display */}
          {!loading && user && (
            <div className="sidebar-role">
              {user.role}
            </div>
          )}

          {/* Primary Navigation */}
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

          {/* Secondary Navigation Divider */}
          {!loading && user && (
            <div className="sidebar-divider"></div>
          )}

          {/* Secondary Navigation */}
          <Link href="/support" className="sidebar-secondary" onClick={closeSidebar}>
            Support
          </Link>

          <a href="https://youtu.be/ud9_Dj894eU?si=ONs8fB4HlkPFSXpP" target="_blank" rel="noopener noreferrer" className="sidebar-secondary" onClick={closeSidebar}>
            Video Guides
          </a>

          {/* Logout */}
          {!loading && user && (
            <button onClick={() => { logout(); closeSidebar(); }} className="sidebar-logout-btn">
              Logout
            </button>
          )}
        </nav>
      </div>

      <header className="nav">
        <div className="nav-inner">
          
          {/* LEFT: Logo + Hamburger */}
          <div className="nav-left">
            <button className="hamburger" onClick={toggleSidebar}>
              <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
                <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/>
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

          {/* CENTER: Navigation (Desktop only) */}
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

          {/* RIGHT: Actions */}
          <div className="nav-actions">

          {/* Notifications Bell (Desktop only) */}
          {!loading && user && (
            <div className="notification-bell-wrapper" ref={notificationRef}>
              <button
                className="notification-bell"
                onClick={() => setShowNotifications(!showNotifications)}
                title={`${unreadCount} unread notifications`}
              >
                <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9m0 0V5a3 3 0 1 0-6 0v3M9 21h6a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2z"/>
                </svg>
                {unreadCount > 0 && (
                  <span className="notification-badge">{unreadCount > 99 ? "99+" : unreadCount}</span>
                )}
              </button>

              {/* Notification Dropdown */}
              {showNotifications && (
                <div className="notification-dropdown">
                  <div className="notification-header">
                    <h3>Notifications</h3>
                    {unreadCount > 0 && (
                      <button
                        className="mark-all-read"
                        onClick={() => markAsRead(notifications.filter(n => !n.read).map(n => n.id))}
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
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteNotification(notification.id);
                            }}
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Employer token balance */}
          {!loading && user?.role === "EMPLOYER" && (
            <div className="nav-token-pill" title="Token balance">
              <span>🪙 {typeof user.tokens === "number" ? user.tokens : 0}</span>
            </div>
          )}

          {/* Support */}
          <Link href="/support" className="nav-link">
            Support
          </Link>

          {/* Video Guides */}
          <a href="https://youtube.com/playlist?list=PLIHA5XP5J_xPXI8O1vWi8I1v1GGPVqVuD&si=HrsHjnAqjPtxei-O" target="_blank" rel="noopener noreferrer" className="nav-link">
            Video Guides
          </a>

          {/* Logout (Desktop only) */}
          {!loading && user && (
            <button onClick={logout} className="nav-link desktop-logout">
              Logout
            </button>
          )}

          {!loading && !user && (
            <>
              <Link href="/login" className="btn-soft">
                Login
              </Link>
              <Link href="/register" className="btn-primary">
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
