import React, { useEffect, useState } from "react";
import api from "../services/api";
import { Upload, FileText, Trash2 } from "lucide-react";

export default function Files() {
  const [files, setFiles] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState("");
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [projectsData] = await Promise.all([api.getProjects(true)]);
      setProjects(projectsData.projects);
      if (projectsData.projects.length > 0) {
        setSelectedProject(projectsData.projects[0].id);
        const filesData = await api.getFiles(projectsData.projects[0].id);
        setFiles(filesData.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleProjectChange(projectId: string) {
    setSelectedProject(projectId);
    try {
      const filesData = await api.getFiles(projectId);
      setFiles(filesData.data || []);
    } catch (err) {
      console.error(err);
    }
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !selectedProject) return;

    setUploading(true);
    try {
      await api.uploadFile(selectedProject, file);
      const filesData = await api.getFiles(selectedProject);
      setFiles(filesData.data || []);
    } catch (err: any) {
      alert(`Upload failed: ${err.message}`);
    } finally {
      setUploading(false);
    }
  }

  if (loading) return <div className="loading">Loading files...</div>;

  return (
    <div className="page">
      <div className="page-header">
        <h1>File Manager</h1>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <select
            value={selectedProject}
            onChange={(e) => handleProjectChange(e.target.value)}
            className="select filter-select"
          >
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <label className="btn btn-primary" style={{ cursor: "pointer" }}>
            <Upload size={16} />
            {uploading ? "Uploading..." : "Upload File"}
            <input
              type="file"
              onChange={handleUpload}
              style={{ display: "none" }}
              disabled={uploading}
            />
          </label>
        </div>
      </div>

      <div className="card">
        <table className="data-table">
          <thead>
            <tr>
              <th>File</th>
              <th>Size</th>
              <th>Uploaded</th>
            </tr>
          </thead>
          <tbody>
            {files.map((file, i) => {
              const details = file.details || {};
              return (
                <tr key={file.id || i}>
                  <td>
                    <span className="doc-link">
                      <FileText size={14} /> {details.filename || "Unknown"}
                    </span>
                  </td>
                  <td className="date-cell">
                    {details.size ? `${Math.round(details.size / 1024)} KB` : "-"}
                  </td>
                  <td className="date-cell">
                    {file.created_at
                      ? new Date(file.created_at).toLocaleDateString()
                      : "-"}
                  </td>
                </tr>
              );
            })}
            {files.length === 0 && (
              <tr>
                <td colSpan={3} className="empty-state">
                  No files uploaded to this project yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
