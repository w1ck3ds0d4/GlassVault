import { Router, Response } from "express";
import { AuthRequest, signToken } from "../middleware/auth";
import { getDb } from "../database";

const router = Router();

/**
 * POST /api/admin/impersonate
 *
 * Allows tenant admins to "login as" another user for support and debugging.
 * Returns a new JWT token for the target user's session.
 *
 * Required: admin role
 * Body: { userId: string }
 */
router.post("/impersonate", (req: AuthRequest, res: Response) => {
  if (!req.user) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }

  if (req.user.role !== "admin") {
    res.status(403).json({ error: "Admin role required" });
    return;
  }

  const { userId } = req.body;
  if (!userId) {
    res.status(400).json({ error: "userId is required" });
    return;
  }

  const db = getDb();

  // Find the target user to impersonate
  const targetUser = db
    .prepare("SELECT * FROM users WHERE id = ?")
    .get(userId) as any;

  if (!targetUser) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  // Issue a new token as the target user
  const token = signToken({
    userId: targetUser.id,
    tenantId: targetUser.tenant_id,
    email: targetUser.email,
    role: targetUser.role,
  });

  // Log the impersonation event
  db.prepare(
    `INSERT INTO audit_log (tenant_id, user_id, action, resource_type, resource_id, details, ip_address)
     VALUES (?, ?, 'impersonate', 'user', ?, ?, ?)`
  ).run(
    req.user.tenantId,
    req.user.userId,
    targetUser.id,
    JSON.stringify({
      impersonator: req.user.email,
      target: targetUser.email,
    }),
    req.ip
  );

  res.json({
    token,
    user: {
      id: targetUser.id,
      email: targetUser.email,
      role: targetUser.role,
      displayName: targetUser.display_name,
      tenantId: targetUser.tenant_id,
    },
  });
});

/**
 * GET /api/admin/audit-log
 *
 * Returns the audit log for the current tenant.
 * Supports pagination and filtering by action.
 */
router.get("/audit-log", (req: AuthRequest, res: Response) => {
  if (!req.user) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }

  if (req.user.role !== "admin") {
    res.status(403).json({ error: "Admin role required" });
    return;
  }

  const db = getDb();
  const page = parseInt(req.query.page as string) || 1;
  const pageSize = Math.min(parseInt(req.query.pageSize as string) || 50, 200);
  const offset = (page - 1) * pageSize;

  const logs = db
    .prepare(
      `SELECT * FROM audit_log WHERE tenant_id = ?
       ORDER BY created_at DESC LIMIT ? OFFSET ?`
    )
    .all(req.user.tenantId, pageSize, offset);

  res.json({ data: logs, page, pageSize });
});

export default router;
