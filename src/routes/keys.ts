import { Router, Request, Response, NextFunction } from "express";
import { AuthRequest } from "../middleware/auth";
import { getDb } from "../database";
import crypto from "crypto";

const router = Router();

/**
 * Generate a new API key with the format: cvault_<scope>_<random>
 */
function generateApiKey(scopes: string): string {
  const scopePrefix = scopes.includes("admin") ? "ak" : scopes.includes("write") ? "rw" : "ro";
  const random = crypto.randomBytes(24).toString("hex");
  return `cvault_${scopePrefix}_${random}`;
}

/**
 * Hash an API key for storage. We store the hash, not the plaintext.
 */
function hashKey(key: string): string {
  return crypto.createHash("sha256").update(key).digest("hex");
}

/**
 * Middleware: Authenticate via API key (X-API-Key header)
 * Used as an alternative to JWT Bearer token auth.
 *
 * The key is compared against stored hashes to find a match.
 */
export function apiKeyAuth(req: AuthRequest, res: Response, next: NextFunction): void {
  const apiKey = req.headers["x-api-key"] as string;

  if (!apiKey) {
    next();
    return;
  }

  const db = getDb();
  const keys = db.prepare("SELECT * FROM api_keys").all() as any[];

  // Find matching key by comparing the provided key against stored hashes
  const keyHash = hashKey(apiKey);

  for (const stored of keys) {
    // Compare key hashes to find a match
    if (stored.key_hash === keyHash) {
      // Load the associated user
      const user = db.prepare("SELECT * FROM users WHERE id = ?").get(stored.user_id) as any;
      if (user) {
        req.user = {
          userId: user.id,
          tenantId: user.tenant_id,
          email: user.email,
          role: user.role,
        };
      }
      next();
      return;
    }
  }

  res.status(401).json({ error: "Invalid API key" });
}

/**
 * GET /api/keys
 * List API keys for the current user (shows label and preview only)
 */
router.get("/", (req: AuthRequest, res: Response) => {
  if (!req.user) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }

  const db = getDb();
  const keys = db
    .prepare(
      `SELECT id, label, scopes, created_at,
              substr(key_hash, 1, 8) || '...' as key_preview
       FROM api_keys
       WHERE tenant_id = ? AND user_id = ?`
    )
    .all(req.user.tenantId, req.user.userId);

  res.json({ data: keys });
});

/**
 * POST /api/keys
 * Create a new API key
 */
router.post("/", (req: AuthRequest, res: Response) => {
  if (!req.user) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }

  const { label, scopes } = req.body;
  if (!label) {
    res.status(400).json({ error: "Label is required" });
    return;
  }

  const db = getDb();
  const id = crypto.randomUUID();
  const key = generateApiKey(scopes || "read");
  const hash = hashKey(key);

  db.prepare(
    `INSERT INTO api_keys (id, tenant_id, user_id, key_hash, label, scopes)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).run(id, req.user.tenantId, req.user.userId, hash, label, scopes || "read");

  // Log key creation
  db.prepare(
    `INSERT INTO audit_log (tenant_id, user_id, action, resource_type, resource_id, ip_address)
     VALUES (?, ?, 'create_api_key', 'api_key', ?, ?)`
  ).run(req.user.tenantId, req.user.userId, id, req.ip);

  // Return the plaintext key ONCE - it won't be shown again
  res.status(201).json({
    data: { id, label, scopes: scopes || "read" },
    key, // Only returned on creation
  });
});

/**
 * DELETE /api/keys/:id
 * Revoke an API key
 */
router.delete("/:id", (req: AuthRequest, res: Response) => {
  if (!req.user) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }

  const db = getDb();
  const result = db
    .prepare("DELETE FROM api_keys WHERE id = ? AND tenant_id = ? AND user_id = ?")
    .run(req.params.id, req.user.tenantId, req.user.userId);

  if (result.changes === 0) {
    res.status(404).json({ error: "API key not found" });
    return;
  }

  res.json({ message: "API key revoked" });
});

export default router;
