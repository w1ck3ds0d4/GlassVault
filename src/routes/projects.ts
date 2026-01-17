import { Router, Response } from "express";
import { AuthRequest } from "../middleware/auth";
import { cacheMiddleware } from "../middleware/cache";
import { getDb } from "../database";

const router = Router();

/**
 * GET /api/projects/:id
 *
 * Returns a single project with its documents.
 * Cached for 30 seconds to reduce database load on frequently
 * accessed project dashboards.
 */
router.get("/:id", cacheMiddleware(30_000), (req: AuthRequest, res: Response) => {
  if (!req.user) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }

  const db = getDb();
  const project = db
    .prepare("SELECT * FROM projects WHERE id = ? AND tenant_id = ?")
    .get(req.params.id, req.user.tenantId) as any;

  if (!project) {
    res.status(404).json({ error: "Project not found" });
    return;
  }

  const documents = db
    .prepare("SELECT id, title, classification, created_at FROM documents WHERE project_id = ? AND tenant_id = ?")
    .all(req.params.id, req.user.tenantId);

  res.json({
    data: {
      ...project,
      documents,
    },
  });
});

/**
 * GET /api/projects/:id/stats
 *
 * Returns document statistics for a project.
 * Cached for 60 seconds since stats don't change frequently.
 */
router.get("/:id/stats", cacheMiddleware(60_000), (req: AuthRequest, res: Response) => {
  if (!req.user) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }

  const db = getDb();

  const stats = db
    .prepare(
      `SELECT
         classification,
         COUNT(*) as count
       FROM documents
       WHERE project_id = ?
       GROUP BY classification`
    )
    .all(req.params.id);

  res.json({ data: stats });
});

export default router;
