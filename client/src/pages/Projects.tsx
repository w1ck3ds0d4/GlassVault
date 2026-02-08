import React, { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import api from "../services/api";
import {
  FolderOpen,
  Plus,
  Lock,
  Globe,
  FileText,
  ArrowLeft,
} from "lucide-react";

export function ProjectList() {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newPrivate, setNewPrivate] = useState(false);

  useEffect(() => {
    loadProjects();
  }, []);

  async function loadProjects() {
    try {
      const data = await api.getProjects(true);
      setProjects(data.projects);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    try {
      await api.createProject(newName, newDesc, newPrivate);
      setShowCreate(false);
      setNewName("");
      setNewDesc("");
      setNewPrivate(false);
      loadProjects();
    } catch (err: any) {
      alert(err.message);
    }
  }

  if (loading) return <div className="loading">Loading projects...</div>;

  return (
    <div className="page">
      <div className="page-header">
        <h1>Projects</h1>
        <button onClick={() => setShowCreate(!showCreate)} className="btn btn-primary">
          <Plus size={18} /> New Project
        </button>
      </div>

      {showCreate && (
        <div className="card create-form">
          <h3>Create New Project</h3>
          <form onSubmit={handleCreate}>
            <div className="form-group">
              <label>Name</label>
              <input value={newName} onChange={(e) => setNewName(e.target.value)} required />
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea value={newDesc} onChange={(e) => setNewDesc(e.target.value)} />
            </div>
            <div className="form-check">
              <input
                type="checkbox"
                id="isPrivate"
                checked={newPrivate}
                onChange={(e) => setNewPrivate(e.target.checked)}
              />
              <label htmlFor="isPrivate">Private project</label>
            </div>
            <div className="form-actions">
              <button type="submit" className="btn btn-primary">Create</button>
              <button type="button" onClick={() => setShowCreate(false)} className="btn">Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="project-grid">
        {projects.map((project) => (
          <Link key={project.id} to={`/projects/${project.id}`} className="project-card">
            <div className="project-icon">
              {project.isPrivate ? <Lock size={20} /> : <Globe size={20} />}
            </div>
            <div className="project-info">
              <h3>{project.name}</h3>
              <p>{project.description}</p>
              <div className="project-meta">
                <span><FileText size={14} /> {project.documentCount} docs</span>
                <span className={`badge ${project.isPrivate ? "badge-restricted" : "badge-public"}`}>
                  {project.isPrivate ? "Private" : "Public"}
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

export function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) loadProject(id);
  }, [id]);

  async function loadProject(projectId: string) {
    try {
      const data = await api.getProject(projectId);
      setProject(data.project);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <div className="loading">Loading project...</div>;
  if (!project) return <div className="error">Project not found</div>;

  return (
    <div className="page">
      <div className="page-header">
        <button onClick={() => navigate("/projects")} className="btn btn-ghost">
          <ArrowLeft size={18} /> Back
        </button>
        <div>
          <h1>{project.name}</h1>
          <p>{project.description}</p>
        </div>
      </div>

      <div className="card">
        <h3>Documents ({project.documents?.length || 0})</h3>
        <table className="data-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Classification</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            {project.documents?.map((doc: any) => (
              <tr key={doc.id}>
                <td>
                  <Link to={`/documents/${doc.id}`}>{doc.title}</Link>
                </td>
                <td>
                  <span className={`badge badge-${doc.classification}`}>
                    {doc.classification}
                  </span>
                </td>
                <td>{new Date(doc.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
