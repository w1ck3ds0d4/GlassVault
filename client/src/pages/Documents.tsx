import React, { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import api from "../services/api";
import { FileText, ArrowLeft, Download, AlertTriangle } from "lucide-react";

export function DocumentList() {
  const [documents, setDocuments] = useState<any[]>([]);
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDocuments();
  }, [filter]);

  async function loadDocuments() {
    try {
      const data = await api.getDocuments(undefined, filter || undefined);
      setDocuments(data.documents);
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
        <select value={filter} onChange={(e) => setFilter(e.target.value)} className="select">
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
                  <Link to={`/documents/${doc.id}`}>
                    <FileText size={14} /> {doc.title}
                  </Link>
                </td>
                <td>
                  <span className={`badge badge-${doc.classification}`}>
                    {doc.classification}
                  </span>
                </td>
                <td>{doc.projectId?.substring(0, 8)}...</td>
                <td>{new Date(doc.updatedAt).toLocaleDateString()}</td>
              </tr>
            ))}
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
        <div>
          <h1>{document.title}</h1>
          <div className="doc-meta">
            <span className={`badge badge-${document.classification}`}>
              {document.classification}
            </span>
            {document.project && <span>in {document.project.name}</span>}
            {document.createdBy && <span>by {document.createdBy.displayName}</span>}
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

      <div className="card document-content">
        <div className="document-body" dangerouslySetInnerHTML={{ __html: document.content || "<em>No content</em>" }} />
      </div>

      <div className="card document-info">
        <h3>Details</h3>
        <dl>
          <dt>Document ID</dt>
          <dd>{document.id}</dd>
          <dt>Tenant ID</dt>
          <dd>{document.tenantId}</dd>
          <dt>Created</dt>
          <dd>{new Date(document.createdAt).toLocaleString()}</dd>
          <dt>Last Updated</dt>
          <dd>{new Date(document.updatedAt).toLocaleString()}</dd>
        </dl>
      </div>
    </div>
  );
}
