import React, { useState } from "react";
import { Shield, X, Loader2 } from "lucide-react";

interface ReauthModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  classification: string;
}

export default function ReauthModal({ open, onClose, onSuccess, classification }: ReauthModalProps) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Verify password against the stored session
      const token = localStorage.getItem("cv_token");
      if (!token) throw new Error("Session expired");

      // Decode the JWT to get user info
      const payload = JSON.parse(atob(token.split(".")[1]));

      const res = await fetch("http://localhost:4000/api/auth/verify-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ password }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Invalid password");
      }

      setPassword("");
      onSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header modal-warning">
          <h3>
            <Shield size={18} style={{ marginRight: 8 }} />
            Security Verification Required
          </h3>
          <button className="modal-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        <div className="modal-body">
          <p style={{ marginBottom: 16 }}>
            This document is classified as <strong style={{ color: classification === "restricted" ? "var(--danger)" : "var(--warning)" }}>{classification}</strong>.
            Please re-enter your password to access its contents.
          </p>
          <form onSubmit={handleSubmit}>
            {error && (
              <div style={{
                padding: "10px 14px", background: "var(--danger-bg)",
                border: "1px solid var(--danger)", borderRadius: 8,
                color: "var(--danger)", fontSize: "0.85rem", marginBottom: 12
              }}>
                {error}
              </div>
            )}
            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                autoFocus
              />
            </div>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button type="button" className="btn" onClick={onClose}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? <><Loader2 size={16} className="spinner" /> Verifying...</> : "Verify & Access"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
