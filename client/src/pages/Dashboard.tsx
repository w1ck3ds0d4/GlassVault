import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import {
  FolderOpen,
  FileText,
  Users,
  Shield,
  TrendingUp,
  Clock,
  ArrowRight,
} from "lucide-react";

interface DashboardStats {
  projectCount: number;
  documentCount: number;
  userCount: number;
  recentDocuments: any[];
  classificationBreakdown: Record<string, number>;
}

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    try {
      const [projectsData, docsData, usersData] = await Promise.all([
        api.getProjects(true),
        api.getDocuments(),
        api.getUsers(),
      ]);

      const breakdown: Record<string, number> = {};
      for (const doc of docsData.documents) {
        breakdown[doc.classification] =
          (breakdown[doc.classification] || 0) + 1;
      }

      setStats({
        projectCount: projectsData.projects.length,
        documentCount: docsData.documents.length,
        userCount: usersData.users.length,
        recentDocuments: docsData.documents.slice(0, 6),
        classificationBreakdown: breakdown,
      });
    } catch (err) {
      console.error("Failed to load dashboard:", err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <div className="loading">Loading dashboard...</div>;
  }

  const sensitiveCount =
    (stats?.classificationBreakdown?.confidential || 0) +
    (stats?.classificationBreakdown?.restricted || 0);

  const totalDocs = stats?.documentCount || 1;

  const classificationOrder = ["restricted", "confidential", "internal", "public"];

  return (
    <div className="page">
      {/* Page Header */}
      <div className="page-header">
        <div className="page-title-group">
          <h1>Welcome back, {user?.displayName?.split(" ")[0]}</h1>
          <p className="welcome-text">
            Here's what's happening in your workspace today.
          </p>
        </div>
        <Link to="/documents" className="btn btn-primary">
          <FileText size={15} />
          View Documents
        </Link>
      </div>

      {/* Stats Row - 4 cards filling full width */}
      <div className="stats-row">
        <div className="stat-card blue">
          <div className="stat-header">
            <div className="stat-icon">
              <FolderOpen size={24} />
            </div>
            <span className="stat-trend up">
              <TrendingUp size={10} style={{ display: "inline", marginRight: 3 }} />
              Active
            </span>
          </div>
          <div className="stat-body">
            <div className="stat-value">{stats?.projectCount ?? 0}</div>
            <div className="stat-label">Total Projects</div>
          </div>
        </div>

        <div className="stat-card green">
          <div className="stat-header">
            <div className="stat-icon">
              <FileText size={24} />
            </div>
            <span className="stat-trend up">
              <TrendingUp size={10} style={{ display: "inline", marginRight: 3 }} />
              Growing
            </span>
          </div>
          <div className="stat-body">
            <div className="stat-value">{stats?.documentCount ?? 0}</div>
            <div className="stat-label">Documents</div>
          </div>
        </div>

        <div className="stat-card purple">
          <div className="stat-header">
            <div className="stat-icon">
              <Users size={24} />
            </div>
            <span className="stat-trend neutral">Team</span>
          </div>
          <div className="stat-body">
            <div className="stat-value">{stats?.userCount ?? 0}</div>
            <div className="stat-label">Team Members</div>
          </div>
        </div>

        <div className="stat-card orange">
          <div className="stat-header">
            <div className="stat-icon">
              <Shield size={24} />
            </div>
            <span
              className={`stat-trend ${sensitiveCount > 0 ? "up" : "neutral"}`}
            >
              Monitored
            </span>
          </div>
          <div className="stat-body">
            <div className="stat-value">{sensitiveCount}</div>
            <div className="stat-label">Sensitive Docs</div>
          </div>
        </div>
      </div>

      {/* Two-column grid */}
      <div className="two-col">
        {/* Classification Breakdown */}
        <div className="card" style={{ marginBottom: 0 }}>
          <div className="card-header">
            <h3>
              <Shield size={15} />
              Classification Breakdown
            </h3>
            <span className="card-count" style={{ fontSize: "0.75rem", color: "var(--text-muted)", background: "var(--bg-hover)", padding: "2px 8px", borderRadius: 20, fontWeight: 600 }}>
              {stats?.documentCount ?? 0} docs
            </span>
          </div>
          <div className="breakdown-list">
            {classificationOrder
              .filter(
                (cls) =>
                  stats?.classificationBreakdown &&
                  stats.classificationBreakdown[cls] !== undefined
              )
              .map((cls) => {
                const count = stats?.classificationBreakdown?.[cls] ?? 0;
                const pct = Math.round((count / totalDocs) * 100);
                return (
                  <div key={cls} className="breakdown-row">
                    <span className={`badge badge-${cls}`}>{cls}</span>
                    <div className="breakdown-bar-wrap" style={{ flex: 1 }}>
                      <div className="breakdown-bar">
                        <div
                          className={`breakdown-fill fill-${cls}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                    <span className="breakdown-count">{count}</span>
                  </div>
                );
              })}
            {(!stats?.classificationBreakdown ||
              Object.keys(stats.classificationBreakdown).length === 0) && (
              <div className="empty-state" style={{ padding: "32px 0" }}>
                No documents yet
              </div>
            )}
          </div>
        </div>

        {/* Recent Documents */}
        <div className="card" style={{ marginBottom: 0 }}>
          <div className="card-header">
            <h3>
              <Clock size={15} />
              Recent Documents
            </h3>
            <Link
              to="/documents"
              style={{
                fontSize: "0.78rem",
                color: "var(--accent)",
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              View all <ArrowRight size={12} />
            </Link>
          </div>
          <div className="recent-list">
            {stats?.recentDocuments?.length ? (
              stats.recentDocuments.map((doc: any) => (
                <Link
                  key={doc.id}
                  to={`/documents/${doc.id}`}
                  className="recent-item"
                >
                  <div className="recent-item-icon">
                    <FileText size={15} />
                  </div>
                  <span className="recent-title">{doc.title}</span>
                  <span className={`badge badge-${doc.classification}`}>
                    {doc.classification}
                  </span>
                </Link>
              ))
            ) : (
              <div className="empty-state" style={{ padding: "32px 0" }}>
                No documents yet
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
