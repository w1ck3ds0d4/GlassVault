import { useToast } from "../components/Toast";
import React, { useEffect, useState } from "react";
import api from "../services/api";
import { Settings as SettingsIcon, Save, Gift, Moon, Sun } from "lucide-react";
import { useTheme } from "../context/ThemeContext";

export default function Settings() {
  const [preferences, setPreferences] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [promoCode, setPromoCode] = useState("");
  const [promoResult, setPromoResult] = useState("");
  const { toast } = useToast();
  const { theme, toggleTheme } = useTheme();

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
      toast("Preferences saved!", "success");
    } catch (err: any) {
      toast(err.message, "error");
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
      toast(`${result.discount}% discount applied!`, "success");
    } catch (err: any) {
      setPromoResult("");
      toast(err.message, "error");
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
          <h3><SettingsIcon size={16} /> Preferences</h3>

          <div className="setting-row">
            <div className="setting-info">
              <span className="setting-label">Appearance</span>
              <span className="setting-desc">Choose between light and dark theme</span>
            </div>
            <button onClick={toggleTheme} className="btn">
              {theme === "light" ? <Moon size={16} /> : <Sun size={16} />}
              {theme === "light" ? "Dark Mode" : "Light Mode"}
            </button>
          </div>

          <div className="setting-divider" />

          <h4 style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: 12 }}>Notifications</h4>

          <div className="setting-row">
            <div className="setting-info">
              <span className="setting-label">Email notifications</span>
              <span className="setting-desc">Receive updates about document changes via email</span>
            </div>
            <label className="toggle">
              <input
                type="checkbox"
                checked={preferences?.notifications?.email ?? true}
                onChange={(e) =>
                  setPreferences({
                    ...preferences,
                    notifications: { ...preferences?.notifications, email: e.target.checked },
                  })
                }
              />
              <span className="toggle-slider" />
            </label>
          </div>

          <div className="setting-row">
            <div className="setting-info">
              <span className="setting-label">Push notifications</span>
              <span className="setting-desc">Get real-time alerts in your browser</span>
            </div>
            <label className="toggle">
              <input
                type="checkbox"
                checked={preferences?.notifications?.push ?? true}
                onChange={(e) =>
                  setPreferences({
                    ...preferences,
                    notifications: { ...preferences?.notifications, push: e.target.checked },
                  })
                }
              />
              <span className="toggle-slider" />
            </label>
          </div>

          <div className="setting-row">
            <div className="setting-info">
              <span className="setting-label">Email digest</span>
              <span className="setting-desc">How often to receive summary emails</span>
            </div>
            <select
              value={preferences?.notifications?.digest || "daily"}
              onChange={(e) =>
                setPreferences({
                  ...preferences,
                  notifications: { ...preferences?.notifications, digest: e.target.value },
                })
              }
              className="select"
              style={{ width: "auto", minWidth: 120 }}
            >
              <option value="realtime">Real-time</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="never">Never</option>
            </select>
          </div>

          <div style={{ marginTop: 20 }}>
            <button onClick={handleSave} className="btn btn-primary" disabled={saving}>
              <Save size={16} /> {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>

        <div>
          <div className="card">
            <h3><Gift size={16} /> Promo Code</h3>
            <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: 16 }}>
              Enter a promotional code to apply a discount to your plan.
            </p>
            <form onSubmit={handlePromo}>
              <div className="form-group">
                <input
                  type="text"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                  placeholder="Enter promo code"
                  required
                  style={{ textTransform: "uppercase", letterSpacing: 1 }}
                />
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: "100%" }}>
                Redeem Code
              </button>
            </form>
            {promoResult && (
              <p style={{ marginTop: 12, fontSize: "0.85rem", color: "var(--success)", fontWeight: 500 }}>
                {promoResult}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
