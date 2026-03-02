import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import {
  FolderOpen,
  FileText,
  Users,
  Shield,
} from "lucide-react";

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<any>(null);
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

  const sensitiveCount =
    (stats?.classificationBreakdown?.confidential || 0) +
    (stats?.classificationBreakdown?.restricted || 0);

  return (
    <div className="page">
      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-icon blue"><FolderOpen size={22} /></div>
          <div className="stat-value">{stats?.projectCount || 0}</div>
          <div className="stat-label">Projects</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green"><FileText size={22} /></div>
          <div className="stat-value">{stats?.documentCount || 0}</div>
          <div className="stat-label">Documents</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon purple"><Users size={22} /></div>
          <div className="stat-value">{stats?.userCount || 0}</div>
          <div className="stat-label">Team Members</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon orange"><Shield size={22} /></div>
          <div className="stat-value">{sensitiveCount}</div>
          <div className="stat-label">Sensitive Docs</div>
        </div>
      </div>

      <div className="two-col">
        <div className="card">
          <h3>Classification Breakdown</h3>
          <div className="breakdown-list">
            {Object.entries(stats?.classificationBreakdown || {}).map(
              ([cls, count]) => (
                <div key={cls} className="breakdown-row">
                  <span className={`badge badge-${cls}`}>{cls}</span>
                  <div className="breakdown-bar">
                    <div
                      className={`breakdown-fill fill-${cls}`}
                      style={{ width: `${Math.min(((count as number) / (stats?.documentCount || 1)) * 100, 100)}%` }}
                    />
                  </div>
                  <span className="breakdown-count">{count as number}</span>
                </div>
              )
            )}
          </div>
        </div>

        <div className="card">
          <h3>Recent Documents</h3>
          <div className="recent-list">
            {stats?.recentDocuments?.map((doc: any) => (
              <Link key={doc.id} to={`/documents/${doc.id}`} className="recent-item">
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
