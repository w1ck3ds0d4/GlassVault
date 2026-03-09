import { useToast } from "../components/Toast";
import React, { useEffect, useState } from "react";
import api from "../services/api";
import { Users, Shield, Eye, Download } from "lucide-react";

export function UserManagement() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const [viewAsId, setViewAsId] = useState("");

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    try {
      const data = await api.getUsers();
      setUsers(data.users);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleViewAs(userId: string) {
    if (!confirm("Switch to this user's perspective? This action is logged for security compliance.")) {
      return;
    }
    try {
      const result = await api.impersonateUser(userId);
      toast(`Switched to ${result.user.email}. You can switch back by logging out.`, "success");
      api.setToken(result.token);
      window.location.reload();
    } catch (err: any) {
      toast(err.message, "error");
    }
  }

  if (loading) return <div className="loading">Loading users...</div>;

  return (
    <div className="page">
      <div className="page-header">
        <h1>User Management</h1>
      </div>

      <div className="card">
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td>{user.displayName}</td>
                <td>{user.email}</td>
                <td>
                  <span className={`badge badge-${user.role}`}>{user.role}</span>
                </td>
                <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                <td>
                  <button
                    onClick={() => handleViewAs(user.id)}
                    className="btn btn-sm"
                    title="Login as this user"
                  >
                    <Eye size={14} /> View as
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function AuditLog() {
  const [logs, setLogs] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadLogs();
  }, [page]);

  async function loadLogs() {
    try {
      const data = await api.getAuditLog(page);
      setLogs(data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleExport() {
    try {
      const token = api.getToken();
      const response = await fetch(
        `http://localhost:4000/api/admin/audit-log/export?format=csv`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "audit-log.csv";
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      toast(err.message, "error");
    }
  }

  if (loading) return <div className="loading">Loading audit log...</div>;

  return (
    <div className="page">
      <div className="page-header">
        <h1>Audit Log</h1>
        <button onClick={handleExport} className="btn btn-primary">
          <Download size={18} /> Export CSV
        </button>
      </div>

      <div className="card">
        <table className="data-table">
          <thead>
            <tr>
              <th>Time</th>
              <th>Action</th>
              <th>User</th>
              <th>Resource</th>
              <th>IP</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log, i) => (
              <tr key={log.id || i}>
                <td>{new Date(log.created_at).toLocaleString()}</td>
                <td><span className="badge">{log.action}</span></td>
                <td>{log.user_id?.substring(0, 8)}</td>
                <td>{log.resource_type} {log.resource_id?.substring(0, 8)}</td>
                <td>{log.ip_address}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="pagination">
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
            className="btn btn-sm"
          >
            Previous
          </button>
          <span>Page {page}</span>
          <button onClick={() => setPage(page + 1)} className="btn btn-sm">
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
