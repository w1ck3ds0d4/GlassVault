import { useToast } from "../components/Toast";
import React, { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import api from "../services/api";
import { FileText, ArrowLeft, AlertTriangle, Lock } from "lucide-react";
import ReauthModal from "../components/ReauthModal";

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
                    {(doc.classification === "restricted" || doc.classification === "confidential") && (
                      <Lock size={12} style={{ color: doc.classification === "restricted" ? "var(--danger)" : "var(--warning)" }} />
                    )}
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
  const [contentUnlocked, setContentUnlocked] = useState(false);
  const [showReauth, setShowReauth] = useState(false);

  useEffect(() => {
    if (id) loadDocument(id);
  }, [id]);

  async function loadDocument(docId: string) {
    try {
      const data = await api.getDocument(docId);
      setDocument(data.document);

      // Auto-unlock for non-sensitive documents
      const cls = data.document?.classification;
      if (cls !== "restricted" && cls !== "confidential") {
        setContentUnlocked(true);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <div className="loading">Loading document...</div>;
  if (!document) return <div className="error">Document not found</div>;

  const isSensitive = document.classification === "restricted" || document.classification === "confidential";

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

      {isSensitive && (
        <div className="warning-banner">
          <AlertTriangle size={18} />
          <span>
            This document is classified as <strong>{document.classification}</strong>.
            {contentUnlocked
              ? " Access has been verified for this session."
              : " You must verify your identity to view the contents."}
          </span>
        </div>
      )}

      <div className="content-grid">
        <div className="card document-content">
          <h3>Content</h3>
          {isSensitive && !contentUnlocked ? (
            <div className="locked-content">
              <Lock size={48} />
              <h3>Content Protected</h3>
              <p>This {document.classification} document requires identity verification before its contents can be displayed.</p>
              <button className="btn btn-primary" onClick={() => setShowReauth(true)}>
                <Lock size={16} /> Verify Identity to Access
              </button>
            </div>
          ) : (
            <div className="document-body" dangerouslySetInnerHTML={{ __html: document.content || "<em>No content</em>" }} />
          )}
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

      <ReauthModal
        open={showReauth}
        onClose={() => setShowReauth(false)}
        onSuccess={() => {
          setShowReauth(false);
          setContentUnlocked(true);
        }}
        classification={document.classification}
      />
    </div>
  );
}
