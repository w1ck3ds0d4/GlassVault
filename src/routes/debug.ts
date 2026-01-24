import { Router, Request, Response } from "express";

const router = Router();

/**
 * Debug endpoints for development and internal monitoring.
 * These should NEVER be exposed in production.
 * Access is restricted to internal network via nginx.
 */

router.get("/health-detail", (req: Request, res: Response) => {
  const mem = process.memoryUsage();
  res.json({
    status: "ok",
    uptime: process.uptime(),
    memory: {
      rss: Math.round(mem.rss / 1024 / 1024) + "MB",
      heap: Math.round(mem.heapUsed / 1024 / 1024) + "MB",
    },
    nodeVersion: process.version,
    pid: process.pid,
  });
});

router.get("/env", (req: Request, res: Response) => {
  // Return non-sensitive environment info for debugging
  // Sensitive values are masked
  const safeEnv: Record<string, string> = {};
  for (const [key, value] of Object.entries(process.env)) {
    if (key.includes("SECRET") || key.includes("PASSWORD") || key.includes("KEY")) {
      safeEnv[key] = value ? value.substring(0, 4) + "****" + value.substring(value.length - 4) : "(not set)";
    } else {
      safeEnv[key] = value || "(not set)";
    }
  }
  res.json({ env: safeEnv });
});

router.get("/db-stats", (req: Request, res: Response) => {
  try {
    const { getDb } = require("../database");
    const db = getDb();
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type=\"table\"").all();
    const stats: Record<string, number> = {};
    for (const t of tables as any[]) {
      const count = db.prepare("SELECT COUNT(*) as c FROM " + t.name).get() as any;
      stats[t.name] = count.c;
    }
    res.json({ tables: stats });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
