import React, { useEffect, useState } from "react";
import api from "../services/api";
import { Settings as SettingsIcon, Save, Gift } from "lucide-react";

export default function Settings() {
  const [preferences, setPreferences] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [promoCode, setPromoCode] = useState("");
  const [promoResult, setPromoResult] = useState("");

  useEffect(() => {
    loadPreferences();
  }, []);

  async function loadPreferences() {
    try {
      const data = await api.getPreferences();
      setPreferences(data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      await api.updatePreferences(preferences);
      alert("Preferences saved!");
    } catch (err: any) {
      alert(`Failed: ${err.message}`);
    } finally {
      setSaving(false);
    }
  }

  async function handlePromo(e: React.FormEvent) {
    e.preventDefault();
    try {
      const result = await api.redeemPromo(promoCode);
      setPromoResult(`Success! ${result.discount}% discount applied.`);
      setPromoCode("");
    } catch (err: any) {
      setPromoResult(`Error: ${err.message}`);
    }
  }

  if (loading) return <div className="loading">Loading settings...</div>;

  return (
    <div className="page">
      <div className="page-header">
        <h1>Settings</h1>
      </div>

      <div className="settings-grid">
        <div className="card">
          <h3><SettingsIcon size={18} /> Preferences</h3>

          <div className="form-group">
            <label>Theme</label>
            <select
              value={preferences?.theme || "light"}
              onChange={(e) => setPreferences({ ...preferences, theme: e.target.value })}
              className="select"
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
              <option value="auto">System</option>
            </select>
          </div>

          <div className="form-group">
            <label>Language</label>
            <select
              value={preferences?.language || "en"}
              onChange={(e) => setPreferences({ ...preferences, language: e.target.value })}
              className="select"
            >
              <option value="en">English</option>
              <option value="es">Spanish</option>
              <option value="fr">French</option>
              <option value="de">German</option>
            </select>
          </div>

          <div className="form-group">
            <label>Dashboard Layout</label>
            <select
              value={preferences?.dashboard?.layout || "grid"}
              onChange={(e) =>
                setPreferences({
                  ...preferences,
                  dashboard: { ...preferences?.dashboard, layout: e.target.value },
                })
              }
              className="select"
            >
              <option value="grid">Grid</option>
              <option value="list">List</option>
              <option value="compact">Compact</option>
            </select>
          </div>

          <h4>Notifications</h4>
          <div className="form-check">
            <input
              type="checkbox"
              id="emailNotif"
              checked={preferences?.notifications?.email ?? true}
              onChange={(e) =>
                setPreferences({
                  ...preferences,
                  notifications: { ...preferences?.notifications, email: e.target.checked },
                })
              }
            />
            <label htmlFor="emailNotif">Email notifications</label>
          </div>
          <div className="form-check">
            <input
              type="checkbox"
              id="pushNotif"
              checked={preferences?.notifications?.push ?? true}
              onChange={(e) =>
                setPreferences({
                  ...preferences,
                  notifications: { ...preferences?.notifications, push: e.target.checked },
                })
              }
            />
            <label htmlFor="pushNotif">Push notifications</label>
          </div>

          <button onClick={handleSave} className="btn btn-primary" disabled={saving}>
            <Save size={18} /> {saving ? "Saving..." : "Save Preferences"}
          </button>
        </div>

        <div className="card">
          <h3><Gift size={18} /> Promo Code</h3>
          <p>Enter a promotional code to apply a discount to your plan.</p>
          <form onSubmit={handlePromo}>
            <div className="form-group">
              <input
                type="text"
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value)}
                placeholder="Enter promo code"
                required
              />
            </div>
            <button type="submit" className="btn btn-primary">Redeem</button>
          </form>
          {promoResult && <p className="promo-result">{promoResult}</p>}
        </div>
      </div>
    </div>
  );
}
