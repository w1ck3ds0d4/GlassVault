import React, { useEffect, useState } from "react";
import api from "../services/api";
import { Key, Plus, Trash2, Copy, Eye, EyeOff } from "lucide-react";

export default function ApiKeys() {
  const [keys, setKeys] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [newScopes, setNewScopes] = useState("read");
  const [newKey, setNewKey] = useState("");

  useEffect(() => {
    loadKeys();
  }, []);

  async function loadKeys() {
    try {
      const data = await api.getApiKeys();
      setKeys(data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    try {
      const result = await api.createApiKey(newLabel, newScopes);
      setNewKey(result.key);
      setShowCreate(false);
      setNewLabel("");
      loadKeys();
    } catch (err: any) {
      alert(err.message);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure? This cannot be undone.")) return;
    try {
      await api.deleteApiKey(id);
      loadKeys();
    } catch (err: any) {
      alert(err.message);
    }
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    alert("Copied to clipboard!");
  }

  if (loading) return <div className="loading">Loading API keys...</div>;

  return (
    <div className="page">
      <div className="page-header">
        <h1>API Keys</h1>
        <button onClick={() => setShowCreate(!showCreate)} className="btn btn-primary">
          <Plus size={18} /> New Key
        </button>
      </div>

      {newKey && (
        <div className="warning-banner success">
          <strong>New API key created!</strong> Copy it now - it won't be shown again.
          <div className="key-display">
            <code>{newKey}</code>
            <button onClick={() => copyToClipboard(newKey)} className="btn btn-sm">
              <Copy size={14} />
            </button>
          </div>
          <button onClick={() => setNewKey("")} className="btn btn-sm">Dismiss</button>
        </div>
      )}

      {showCreate && (
        <div className="card create-form">
          <h3>Create API Key</h3>
          <form onSubmit={handleCreate}>
            <div className="form-group">
              <label>Label</label>
              <input
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                placeholder="e.g., CI/CD Pipeline"
                required
              />
            </div>
            <div className="form-group">
              <label>Scopes</label>
              <select value={newScopes} onChange={(e) => setNewScopes(e.target.value)} className="select">
                <option value="read">Read Only</option>
                <option value="read,write">Read & Write</option>
                <option value="read,write,admin">Full Access</option>
              </select>
            </div>
            <div className="form-actions">
              <button type="submit" className="btn btn-primary">Create Key</button>
              <button type="button" onClick={() => setShowCreate(false)} className="btn">Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="card">
        <table className="data-table">
          <thead>
            <tr>
              <th>Label</th>
              <th>Key Preview</th>
              <th>Scopes</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {keys.map((key) => (
              <tr key={key.id}>
                <td><Key size={14} /> {key.label}</td>
                <td><code>{key.key_preview}</code></td>
                <td>{key.scopes}</td>
                <td>{new Date(key.created_at).toLocaleDateString()}</td>
                <td>
                  <button onClick={() => handleDelete(key.id)} className="btn btn-sm btn-danger">
                    <Trash2 size={14} />
                  </button>
                </td>
              </tr>
            ))}
            {keys.length === 0 && (
              <tr>
                <td colSpan={5} className="empty-state">No API keys created yet</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
