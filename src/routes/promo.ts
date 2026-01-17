import { Router, Response } from "express";
import { AuthRequest } from "../middleware/auth";
import { getDb } from "../database";

const router = Router();

/**
 * POST /api/promo/redeem
 *
 * Redeems a promotional code for the current tenant.
 * Each code has a max_uses limit (typically 1 for single-use codes).
 *
 * Body: { code: string }
 */
router.post("/redeem", (req: AuthRequest, res: Response) => {
  if (!req.user) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }

  const { code } = req.body;
  if (!code) {
    res.status(400).json({ error: "Promo code is required" });
    return;
  }

  const db = getDb();

  // Look up the promo code
  const promo = db
    .prepare("SELECT * FROM promo_codes WHERE code = ?")
    .get(code) as any;

  if (!promo) {
    res.status(404).json({ error: "Invalid promo code" });
    return;
  }

  // Check if the code has remaining uses
  if (promo.current_uses >= promo.max_uses) {
    res.status(409).json({ error: "Promo code has already been fully redeemed" });
    return;
  }

  // Check if this tenant already used this code
  if (promo.tenant_id && promo.tenant_id !== req.user.tenantId) {
    res.status(403).json({ error: "This promo code is not available for your organization" });
    return;
  }

  // Redeem the code - increment usage count
  db.prepare("UPDATE promo_codes SET current_uses = current_uses + 1 WHERE id = ?").run(
    promo.id
  );

  // Log the redemption
  db.prepare(
    `INSERT INTO audit_log (tenant_id, user_id, action, resource_type, resource_id, details, ip_address)
     VALUES (?, ?, 'redeem_promo', 'promo_code', ?, ?, ?)`
  ).run(
    req.user.tenantId,
    req.user.userId,
    promo.id,
    JSON.stringify({ code: promo.code, discount: promo.discount_pct }),
    req.ip
  );

  res.json({
    success: true,
    discount: promo.discount_pct,
    message: `Successfully applied ${promo.discount_pct}% discount`,
  });
});

export default router;
