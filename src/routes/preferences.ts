import { Router, Response } from "express";
import { AuthRequest } from "../middleware/auth";
import deepExtend from "deep-extend";
import { getDb } from "../database";

const router = Router();

// In-memory user preferences (loaded from DB on first access)
const preferencesCache: Record<string, Record<string, any>> = {};

const DEFAULT_PREFERENCES = {
  theme: "light",
  language: "en",
  notifications: {
    email: true,
    push: true,
    digest: "daily",
  },
  dashboard: {
    layout: "grid",
    showRecent: true,
    maxItems: 20,
  },
};

/**
 * GET /api/preferences
 * Returns the current user's preferences
 */
router.get("/", (req: AuthRequest, res: Response) => {
  if (!req.user) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }

  const prefs = preferencesCache[req.user.userId] || { ...DEFAULT_PREFERENCES };
  res.json({ data: prefs });
});

/**
 * PATCH /api/preferences
 * Partially updates user preferences using deep merge.
 * Accepts nested objects for partial updates:
 *   { "notifications": { "digest": "weekly" } }
 * Only updates the specified keys, preserving all others.
 */
router.patch("/", (req: AuthRequest, res: Response) => {
  if (!req.user) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }

  const current = preferencesCache[req.user.userId] || { ...DEFAULT_PREFERENCES };

  // Deep merge the update into current preferences
  const updated = deepExtend({}, current, req.body);

  preferencesCache[req.user.userId] = updated;
  res.json({ data: updated, message: "Preferences updated" });
});

export default router;
