import React, { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import api from "../services/api";
import { FileText, ArrowLeft, AlertTriangle } from "lucide-react";

export function DocumentList() {
  const [documents, setDocuments] = useState<any[]>([]);
  const [projects, setProjects] = useState<Record<string, string>>({});
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [filter]);

  async function loadData() {
    try {
      const [docsData, projectsData] = await Promise.all([
        api.getDocuments(undefined, filter || undefined),
        api.getProjects(true),
      ]);
      setDocuments(docsData.documents);

      const projectMap: Record<string, string> = {};
      for (const p of projectsData.projects) {
        projectMap[p.id] = p.name;
      }
      setProjects(projectMap);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <div className="loading">Loading documents...</div>;

  return (
    <div className="page">
      <div className="page-header">
        <h1>Documents</h1>
        <select value={filter} onChange={(e) => setFilter(e.target.value)} className="select filter-select">
          <option value="">All Classifications</option>
          <option value="public">Public</option>
          <option value="internal">Internal</option>
          <option value="confidential">Confidential</option>
          <option value="restricted">Restricted</option>
        </select>
      </div>

      <div className="card">
        <table className="data-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Classification</th>
              <th>Project</th>
              <th>Updated</th>
            </tr>
          </thead>
          <tbody>
            {documents.map((doc) => (
              <tr key={doc.id}>
                <td>
                  <Link to={`/documents/${doc.id}`} className="doc-link">
                    <FileText size={14} /> {doc.title}
                  </Link>
                </td>
                <td>
                  <span className={`badge badge-${doc.classification}`}>
                    {doc.classification}
                  </span>
                </td>
                <td className="project-cell">{projects[doc.projectId] || "Unknown"}</td>
                <td className="date-cell">{new Date(doc.updatedAt).toLocaleDateString()}</td>
              </tr>
            ))}
            {documents.length === 0 && (
              <tr><td colSpan={4} className="empty-state">No documents found</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function DocumentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [document, setDocument] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) loadDocument(id);
  }, [id]);

  async function loadDocument(docId: string) {
    try {
      const data = await api.getDocument(docId);
      setDocument(data.document);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <div className="loading">Loading document...</div>;
  if (!document) return <div className="error">Document not found</div>;

  const isRestricted =
    document.classification === "restricted" || document.classification === "confidential";

  return (
    <div className="page">
      <div className="page-header">
        <button onClick={() => navigate(-1)} className="btn btn-ghost">
          <ArrowLeft size={18} /> Back
        </button>
        <div className="page-title-group">
          <h1>{document.title}</h1>
          <div className="doc-meta">
            <span className={`badge badge-${document.classification}`}>
              {document.classification}
            </span>
            {document.project && <span className="meta-text">in {document.project.name}</span>}
            {document.createdBy && <span className="meta-text">by {document.createdBy.displayName}</span>}
          </div>
        </div>
      </div>

      {isRestricted && (
        <div className="warning-banner">
          <AlertTriangle size={18} />
          <span>
            This document is classified as <strong>{document.classification}</strong>.
            Handle according to your organization's data policy.
          </span>
        </div>
      )}

      <div className="content-grid">
        <div className="card document-content">
          <h3>Content</h3>
          <div className="document-body" dangerouslySetInnerHTML={{ __html: document.content || "<em>No content</em>" }} />
        </div>

        <div className="card document-info">
          <h3>Details</h3>
          <dl className="detail-list">
            <dt>Document ID</dt>
            <dd><code>{document.id}</code></dd>
            <dt>Tenant ID</dt>
            <dd><code>{document.tenantId}</code></dd>
            <dt>Created</dt>
            <dd>{new Date(document.createdAt).toLocaleString()}</dd>
            <dt>Last Updated</dt>
            <dd>{new Date(document.updatedAt).toLocaleString()}</dd>
          </dl>
        </div>
      </div>
    </div>
  );
}
