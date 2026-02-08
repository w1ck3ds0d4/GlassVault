import React from "react";
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
} from "lucide-react";

export default function Layout() {
  const { user, tenant, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const navItems = [
    { path: "/", icon: LayoutDashboard, label: "Dashboard" },
    { path: "/projects", icon: FolderOpen, label: "Projects" },
    { path: "/documents", icon: FileText, label: "Documents" },
    { path: "/search", icon: Search, label: "Search" },
    { path: "/files", icon: Upload, label: "Files" },
    { path: "/settings", icon: Settings, label: "Settings" },
    { path: "/api-keys", icon: Key, label: "API Keys" },
  ];

  if (user?.role === "admin") {
    navItems.push(
      { path: "/admin/users", icon: Users, label: "Users" },
      { path: "/admin/audit", icon: Shield, label: "Audit Log" }
    );
  }

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="logo">
            <Shield size={24} />
            <span>CloudVault</span>
          </div>
          {tenant && (
            <div className="tenant-badge">
              <span className="tenant-name">{tenant.name}</span>
              <span className="tenant-plan">{tenant.plan}</span>
            </div>
          )}
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`nav-item ${location.pathname === item.path ? "active" : ""}`}
            >
              <item.icon size={18} />
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar">
              {user?.displayName?.charAt(0).toUpperCase()}
            </div>
            <div className="user-details">
              <span className="user-name">{user?.displayName}</span>
              <span className="user-role">{user?.role}</span>
            </div>
          </div>
          <button onClick={handleLogout} className="logout-btn" title="Sign out">
            <LogOut size={18} />
          </button>
        </div>
      </aside>

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
