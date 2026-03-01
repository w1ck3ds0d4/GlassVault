import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import {
  FolderOpen,
  FileText,
  Users,
  Shield,
  AlertTriangle,
  TrendingUp,
} from "lucide-react";

interface DashboardStats {
  projectCount: number;
  documentCount: number;
  userCount: number;
  recentDocuments: any[];
  classificationBreakdown: Record<string, number>;
}

export default function Dashboard() {
  const { user, tenant } = useAuth();
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
        breakdown[doc.classification] = (breakdown[doc.classification] || 0) + 1;
      }

      setStats({
        projectCount: projectsData.projects.length,
        documentCount: docsData.documents.length,
        userCount: usersData.users.length,
        recentDocuments: docsData.documents.slice(0, 5),
        classificationBreakdown: breakdown,
      });
    } catch (err) {
      console.error("Failed to load dashboard:", err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <div className="loading">Loading dashboard...</div>;

  return (
    <div className="page">
      <div className="page-header">
        <p className="welcome-text">Welcome back, {user?.displayName}</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon blue">
            <FolderOpen size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{stats?.projectCount || 0}</span>
            <span className="stat-label">Projects</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon green">
            <FileText size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{stats?.documentCount || 0}</span>
            <span className="stat-label">Documents</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon purple">
            <Users size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{stats?.userCount || 0}</span>
            <span className="stat-label">Team Members</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon orange">
            <Shield size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-value">
              {(stats?.classificationBreakdown?.confidential || 0) +
                (stats?.classificationBreakdown?.restricted || 0)}
            </span>
            <span className="stat-label">Sensitive Docs</span>
          </div>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="card">
          <h3>Classification Breakdown</h3>
          <div className="classification-list">
            {Object.entries(stats?.classificationBreakdown || {}).map(
              ([cls, count]) => (
                <div key={cls} className="classification-item">
                  <span className={`badge badge-${cls}`}>{cls}</span>
                  <span className="classification-count">{count}</span>
                </div>
              )
            )}
          </div>
        </div>

        <div className="card">
          <h3>Recent Documents</h3>
          <div className="recent-list">
            {stats?.recentDocuments?.map((doc) => (
              <Link
                key={doc.id}
                to={`/documents/${doc.id}`}
                className="recent-item"
              >
                <FileText size={16} />
                <span className="recent-title">{doc.title}</span>
                <span className={`badge badge-${doc.classification}`}>
                  {doc.classification}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
