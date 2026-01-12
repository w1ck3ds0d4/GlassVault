import { Router, Request, Response } from "express";
import { getDb } from "../database";
import { signToken } from "../middleware/auth";
import crypto from "crypto";

const router = Router();

function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

/**
 * POST /api/auth/login
 * Authenticates a user and returns a JWT token.
 */
router.post("/login", (req: Request, res: Response) => {
  const { email, password, tenantSlug } = req.body;

  if (!email || !password || !tenantSlug) {
    res.status(400).json({ error: "email, password, and tenantSlug are required" });
    return;
  }

  const db = getDb();

  const tenant = db
    .prepare("SELECT * FROM tenants WHERE slug = ?")
    .get(tenantSlug) as any;

  if (!tenant) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  const user = db
    .prepare(
      "SELECT * FROM users WHERE email = ? AND tenant_id = ? AND password_hash = ?"
    )
    .get(email, tenant.id, hashPassword(password)) as any;

  if (!user) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  const token = signToken({
    userId: user.id,
    tenantId: tenant.id,
    email: user.email,
    role: user.role,
  });

  db.prepare(
    `INSERT INTO audit_log (tenant_id, user_id, action, resource_type, ip_address, user_agent)
     VALUES (?, ?, 'login', 'user', ?, ?)`
  ).run(tenant.id, user.id, req.ip, req.headers["user-agent"]);

  res.json({
    token,
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      displayName: user.display_name,
      tenantId: tenant.id,
      tenantName: tenant.name,
    },
  });
});

export default router;
