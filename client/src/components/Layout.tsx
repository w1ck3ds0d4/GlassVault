import React, { useState, useCallback } from "react";
import { Link, Outlet, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  FolderOpen,
  FileText,
  Users,
  Settings,
  Shield,
  LogOut,
  Search,
  Key,
  LayoutDashboard,
  Upload,
  Bell,
  ChevronDown,
} from "lucide-react";

const PAGE_TITLES: Record<string, string> = {
  "/": "Dashboard",
  "/projects": "Projects",
  "/documents": "Documents",
  "/search": "Search Documents",
  "/files": "File Manager",
  "/settings": "Settings",
  "/api-keys": "API Keys",
  "/admin/users": "User Management",
  "/admin/audit": "Audit Log",
};

export default function Layout() {
  const { user, tenant, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [headerSearch, setHeaderSearch] = useState("");

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleHeaderSearch = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (headerSearch.trim()) {
        navigate(`/search?q=${encodeURIComponent(headerSearch.trim())}`);
        setHeaderSearch("");
      }
    },
    [headerSearch, navigate]
  );

  const currentTitle = PAGE_TITLES[location.pathname] || "CloudVault";

  const navSections = [
    {
      label: "Main",
      items: [
        { path: "/", icon: LayoutDashboard, label: "Overview" },
        { path: "/projects", icon: FolderOpen, label: "Projects" },
        { path: "/documents", icon: FileText, label: "Documents" },
        { path: "/search", icon: Search, label: "Search" },
      ],
    },
    {
      label: "Manage",
      items: [
        { path: "/files", icon: Upload, label: "Files" },
        { path: "/api-keys", icon: Key, label: "API Keys" },
        { path: "/settings", icon: Settings, label: "Settings" },
      ],
    },
  ];

  if (user?.role === "admin") {
    navSections.push({
      label: "Admin",
      items: [
        { path: "/admin/users", icon: Users, label: "Users" },
        { path: "/admin/audit", icon: Shield, label: "Audit Log" },
      ],
    });
  }

  const userInitial = user?.displayName?.charAt(0).toUpperCase() ?? "U";

  return (
    <div className="app-layout">
      {/* Dark Navy Sidebar */}
      <aside className="sidebar">
        {/* Logo */}
        <div className="sidebar-header">
          <div className="logo">
            <div className="logo-icon">
              <Shield size={18} color="white" />
            </div>
            <span>CloudVault</span>
          </div>
        </div>

        {/* User Profile Section */}
        <div className="sidebar-profile">
          <div className="profile-avatar">{userInitial}</div>
          <div className="profile-info">
            <div className="profile-name">{user?.displayName}</div>
            <div className="profile-role-badge">{user?.role}</div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          {navSections.map((section) => (
            <div key={section.label} className="nav-section">
              <span className="nav-section-label">{section.label}</span>
              {section.items.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`nav-item ${
                    location.pathname === item.path ? "active" : ""
                  }`}
                >
                  <item.icon size={17} />
                  <span>{item.label}</span>
                </Link>
              ))}
            </div>
          ))}
        </nav>

        {/* Tenant Footer */}
        <div className="sidebar-footer">
          <div className="tenant-info">
            <span className="tenant-name">{tenant?.name ?? "CloudVault"}</span>
            {tenant?.plan && (
              <span className="tenant-plan">{tenant.plan}</span>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="content-wrapper">
        {/* Top Header */}
        <header className="top-header">
          <div className="header-left">
            <h2 className="header-title">{currentTitle}</h2>
          </div>
          <div className="header-right">
            <form className="header-search" onSubmit={handleHeaderSearch}>
              <Search size={15} />
              <input
                type="text"
                placeholder="Search documents, projects..."
                value={headerSearch}
                onChange={(e) => setHeaderSearch(e.target.value)}
              />
            </form>
            <div style={{ position: "relative" }}>
              <button
                className="header-icon-btn"
                title="Notifications"
                onClick={() => setNotifOpen(!notifOpen)}
              >
                <Bell size={18} />
                <span className="notification-dot" />
              </button>
              {notifOpen && (
                <div className="user-dropdown" style={{ right: 0, minWidth: 280 }}>
                  <div className="dropdown-header">
                    <strong>Notifications</strong>
                  </div>
                  <div className="dropdown-divider" />
                  <div className="dropdown-item" style={{ flexDirection: "column", alignItems: "flex-start", gap: 2 }}>
                    <span style={{ fontWeight: 500, fontSize: "0.84rem" }}>System Update</span>
                    <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>CloudVault v1.2.0 deployed successfully</span>
                  </div>
                  <div className="dropdown-item" style={{ flexDirection: "column", alignItems: "flex-start", gap: 2 }}>
                    <span style={{ fontWeight: 500, fontSize: "0.84rem" }}>New Document</span>
                    <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>A new restricted document was added to Q1 Planning</span>
                  </div>
                  <div className="dropdown-item" style={{ flexDirection: "column", alignItems: "flex-start", gap: 2 }}>
                    <span style={{ fontWeight: 500, fontSize: "0.84rem" }}>Security Alert</span>
                    <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Unusual login activity detected from new IP</span>
                  </div>
                </div>
              )}
            </div>
            <div
              className="header-user"
              onClick={() => setUserMenuOpen(!userMenuOpen)}
            >
              <div className="header-user-avatar">{userInitial}</div>
              <ChevronDown size={14} />
              {userMenuOpen && (
                <div className="user-dropdown">
                  <div className="dropdown-header">
                    <strong>{user?.displayName}</strong>
                    <span>{user?.email}</span>
                  </div>
                  <div className="dropdown-divider" />
                  <Link
                    to="/settings"
                    className="dropdown-item"
                    onClick={() => setUserMenuOpen(false)}
                  >
                    <Settings size={14} />
                    Settings
                  </Link>
                  <button className="dropdown-item danger" onClick={handleLogout}>
                    <LogOut size={14} />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="main-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
