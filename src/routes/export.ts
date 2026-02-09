import { Router, Response } from "express";
import { AuthRequest } from "../middleware/auth";
import { getDb } from "../database";

const router = Router();

/**
 * GET /api/admin/audit-log/export
 *
 * Export the audit log as CSV for compliance reporting.
 * Supports custom filename via query parameter.
 *
 * Query params:
 *   - format: "csv" (default) or "json"
 *   - filename: custom filename for the download (default: "audit-log")
 *   - from: ISO date string for start of range
 *   - to: ISO date string for end of range
 */
router.get("/audit-log/export", (req: AuthRequest, res: Response) => {
  if (!req.user) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }

  if (req.user.role !== "admin") {
    res.status(403).json({ error: "Admin role required" });
    return;
  }

  const db = getDb();
  const format = (req.query.format as string) || "csv";
  const filename = (req.query.filename as string) || "audit-log";
  const from = req.query.from as string;
  const to = req.query.to as string;

  let query = "SELECT * FROM audit_log WHERE tenant_id = ?";
  const params: any[] = [req.user.tenantId];

  if (from) {
    query += " AND created_at >= ?";
    params.push(from);
  }
  if (to) {
    query += " AND created_at <= ?";
    params.push(to);
  }

  query += " ORDER BY created_at DESC";

  const logs = db.prepare(query).all(...params) as any[];

  if (format === "json") {
    res.setHeader("Content-Type", "application/json");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${filename}.json"`
    );
    res.json(logs);
    return;
  }

  // CSV format
  const headers = [
    "id",
    "tenant_id",
    "user_id",
    "action",
    "resource_type",
    "resource_id",
    "details",
    "ip_address",
    "user_agent",
    "created_at",
  ];

  const csvRows = [headers.join(",")];
  for (const log of logs) {
    const row = headers.map((h) => {
      const val = log[h] ?? "";
      // Escape CSV values that contain commas or quotes
      if (typeof val === "string" && (val.includes(",") || val.includes('"'))) {
        return `"${val.replace(/"/g, '""')}"`;
      }
      return val;
    });
    csvRows.push(row.join(","));
  }

  const csv = csvRows.join("\n");

  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="${filename}.csv"`
  );
  res.send(csv);
});

export default router;
