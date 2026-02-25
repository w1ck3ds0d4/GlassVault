import React, { useState } from "react";
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
  Menu,
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

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

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
      label: "Administration",
      items: [
        { path: "/admin/users", icon: Users, label: "Users" },
        { path: "/admin/audit", icon: Shield, label: "Audit Log" },
      ],
    });
  }

  return (
    <div className="app-layout">
      {/* Dark Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="logo">
            <Shield size={22} />
            <span>CloudVault</span>
          </div>
        </div>

        {/* User Profile Section */}
        <div className="sidebar-profile">
          <div className="profile-avatar">
            {user?.displayName?.charAt(0).toUpperCase()}
          </div>
          <div className="profile-info">
            <span className="profile-greeting">Hello,</span>
            <span className="profile-name">{user?.displayName}</span>
          </div>
          <span className="profile-role-badge">{user?.role}</span>
        </div>

        <nav className="sidebar-nav">
          {navSections.map((section) => (
            <div key={section.label} className="nav-section">
              <div className="nav-section-label">{section.label}</div>
              {section.items.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`nav-item ${location.pathname === item.path ? "active" : ""}`}
                >
                  <item.icon size={18} />
                  <span>{item.label}</span>
                </Link>
              ))}
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="tenant-info">
            <span className="tenant-name">{tenant?.name}</span>
            <span className="tenant-plan">{tenant?.plan}</span>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="content-wrapper">
        {/* Top Header Bar */}
        <header className="top-header">
          <div className="header-left">
            <h2 className="header-title">{currentTitle}</h2>
          </div>
          <div className="header-right">
            <div className="header-search">
              <Search size={16} />
              <input type="text" placeholder="Search..." />
            </div>
            <button className="header-icon-btn">
              <Bell size={18} />
              <span className="notification-dot"></span>
            </button>
            <div className="header-user" onClick={() => setUserMenuOpen(!userMenuOpen)}>
              <div className="header-user-avatar">
                {user?.displayName?.charAt(0).toUpperCase()}
              </div>
              <ChevronDown size={14} />
              {userMenuOpen && (
                <div className="user-dropdown">
                  <div className="dropdown-header">
                    <strong>{user?.displayName}</strong>
                    <span>{user?.email}</span>
                  </div>
                  <div className="dropdown-divider" />
                  <Link to="/settings" className="dropdown-item" onClick={() => setUserMenuOpen(false)}>
                    <Settings size={14} /> Settings
                  </Link>
                  <button className="dropdown-item danger" onClick={handleLogout}>
                    <LogOut size={14} /> Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="main-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
