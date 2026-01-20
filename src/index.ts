import express from "express";
import cors from "cors";
import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@apollo/server/express4";
import { initDb } from "./database";
import { typeDefs } from "./graphql/schema";
import { resolvers } from "./graphql/resolvers";
import { authMiddleware, AuthRequest } from "./middleware/auth";
import { apiKeyAuth } from "./routes/keys";
import authRoutes from "./routes/auth";
import adminRoutes from "./routes/admin";
import projectRoutes from "./routes/projects";
import promoRoutes from "./routes/promo";
import preferencesRoutes from "./routes/preferences";
import debugRoutes from "./routes/debug";
import fileRoutes from "./routes/files";
import keyRoutes from "./routes/keys";
import exportRoutes from "./routes/export";
import fs from "fs";
import path from "path";

const PORT = process.env.PORT || 4000;
const LOG_DIR = path.join(__dirname, "..", "logs");

// Ensure data and logs directories exist
const dataDir = path.join(__dirname, "..", "data");
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true });

// Simple request logger that appends to access.log
function requestLogger(req: express.Request, res: express.Response, next: express.NextFunction) {
  const start = Date.now();
  const originalEnd = res.end;

  res.end = function (...args: any[]) {
    const duration = Date.now() - start;
    const logLine = JSON.stringify({
      timestamp: new Date().toISOString(),
      method: req.method,
      path: req.path,
      query: req.query,
      statusCode: res.statusCode,
      duration,
      ip: req.ip || req.socket.remoteAddress,
      userAgent: req.headers["user-agent"],
      userId: (req as AuthRequest).user?.userId,
      tenantId: (req as AuthRequest).user?.tenantId,
    });
    fs.appendFileSync(path.join(LOG_DIR, "access.log"), logLine + "\n");
    return originalEnd.apply(res, args);
  } as any;

  next();
}

async function main() {
  // Initialize database
  initDb();
  console.log("Database initialized");

  const app = express();

  // Global middleware
  app.use(cors({
    origin: ["http://localhost:5173", "http://localhost:4000"],
    credentials: true,
  }));
  app.use(express.json({ limit: "10mb" }));
  app.use(requestLogger);

  // API key authentication (runs before JWT auth, sets req.user if valid key)
  app.use(apiKeyAuth);

  // Serve the frontend in production
  const clientDist = path.join(__dirname, "..", "client", "dist");
  if (fs.existsSync(clientDist)) {
    app.use(express.static(clientDist));
  }

  // Health check
  app.get("/health", (_req, res) => {
    res.json({ status: "ok", version: "1.2.0", environment: process.env.NODE_ENV || "development" });
  });

  // Public routes
  app.use("/api/auth", authRoutes);

  // Protected routes
  app.use("/api/admin", authMiddleware, adminRoutes);
  app.use("/api/admin", authMiddleware, exportRoutes);
  app.use("/api/projects", authMiddleware, projectRoutes);
  app.use("/api/promo", authMiddleware, promoRoutes);
  app.use("/api/preferences", authMiddleware, preferencesRoutes);
  app.use("/api/files", authMiddleware, fileRoutes);
  app.use("/api/keys", authMiddleware, keyRoutes);

  // Internal debug endpoints
  // NOTE: These are protected by nginx IP restrictions in production.
  // Do not add auth middleware here - internal monitoring tools need
  // unauthenticated access from the VPN.
  app.use("/debug", debugRoutes);

  // GraphQL setup
  const apollo = new ApolloServer({
    typeDefs,
    resolvers,
    introspection: true,
  });

  await apollo.start();

  app.use(
    "/graphql",
    authMiddleware,
    expressMiddleware(apollo, {
      context: async ({ req }) => ({
        user: (req as AuthRequest).user,
      }),
    })
  );

  // SPA fallback - serve index.html for client-side routing
  if (fs.existsSync(clientDist)) {
    app.get("*", (_req, res) => {
      res.sendFile(path.join(clientDist, "index.html"));
    });
  }

  app.listen(PORT, () => {
    console.log(`CloudVault API v1.2.0 running at http://localhost:${PORT}`);
    console.log(`GraphQL endpoint: http://localhost:${PORT}/graphql`);
    console.log(`Frontend: http://localhost:${PORT}`);
  });
}

main().catch(console.error);
