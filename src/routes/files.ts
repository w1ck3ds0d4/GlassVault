import { Router, Request, Response } from "express";
import { AuthRequest } from "../middleware/auth";
import { getDb } from "../database";
import path from "path";
import fs from "fs";
import crypto from "crypto";

const router = Router();
const UPLOAD_DIR = path.join(__dirname, "..", "..", "data", "uploads");

// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

/**
 * POST /api/files/upload
 * Upload a file to a project. Files are stored in data/uploads/
 * with a random filename to prevent conflicts.
 */
router.post("/upload", (req: AuthRequest, res: Response) => {
  if (!req.user) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }

  // Simple multipart handling - in production use multer
  const contentType = req.headers["content-type"] || "";
  if (!contentType.includes("application/json")) {
    // For actual file uploads, we'd use multer middleware
    // For now, accept JSON with base64 content
  }

  const { projectId, filename, content, contentType: fileType } = req.body;

  if (!projectId || !filename || !content) {
    res.status(400).json({ error: "projectId, filename, and content are required" });
    return;
  }

  const db = getDb();

  // Verify project belongs to tenant
  const project = db
    .prepare("SELECT * FROM projects WHERE id = ? AND tenant_id = ?")
    .get(projectId, req.user.tenantId) as any;

  if (!project) {
    res.status(404).json({ error: "Project not found" });
    return;
  }

  // Validate filename - basic path traversal prevention
  const safeName = path.basename(filename);
  const fileId = crypto.randomUUID();
  const ext = path.extname(safeName);
  const storedName = `${fileId}${ext}`;
  const filePath = path.join(UPLOAD_DIR, storedName);

  // Decode base64 and write
  try {
    const buffer = Buffer.from(content, "base64");
    fs.writeFileSync(filePath, buffer);
  } catch (err: any) {
    res.status(500).json({ error: "Failed to save file" });
    return;
  }

  // Store metadata in audit log
  db.prepare(
    `INSERT INTO audit_log (tenant_id, user_id, action, resource_type, resource_id, details, ip_address)
     VALUES (?, ?, 'upload_file', 'file', ?, ?, ?)`
  ).run(
    req.user.tenantId,
    req.user.userId,
    fileId,
    JSON.stringify({ filename: safeName, size: Buffer.from(content, "base64").length, projectId }),
    req.ip
  );

  res.status(201).json({
    data: {
      id: fileId,
      filename: safeName,
      storedName,
      projectId,
      uploadedBy: req.user.userId,
      createdAt: new Date().toISOString(),
    },
  });
});

/**
 * GET /api/files/download/:filename
 * Download a file by its stored filename.
 */
router.get("/download/:filename", (req: AuthRequest, res: Response) => {
  if (!req.user) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }

  const requestedFile = req.params.filename;

  // Construct the file path
  const filePath = path.join(UPLOAD_DIR, requestedFile);

  // Check file exists
  if (!fs.existsSync(filePath)) {
    res.status(404).json({ error: "File not found" });
    return;
  }

  res.download(filePath);
});

/**
 * GET /api/files
 * List files (from audit log) for a project
 */
router.get("/", (req: AuthRequest, res: Response) => {
  if (!req.user) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }

  const { projectId } = req.query;
  const db = getDb();

  let query = `SELECT * FROM audit_log WHERE tenant_id = ? AND action = 'upload_file'`;
  const params: any[] = [req.user.tenantId];

  if (projectId) {
    query += ` AND details LIKE ?`;
    params.push(`%"projectId":"${projectId}"%`);
  }

  query += " ORDER BY created_at DESC LIMIT 100";

  const files = db.prepare(query).all(...params);

  res.json({
    data: files.map((f: any) => ({
      ...f,
      details: JSON.parse(f.details || "{}"),
    })),
  });
});

export default router;
