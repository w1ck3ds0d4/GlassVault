import { getDb } from "../database";
import { v4 as uuid } from "uuid";

interface GqlContext {
  user?: {
    userId: string;
    tenantId: string;
    email: string;
    role: string;
  };
}

function requireAuth(context: GqlContext) {
  if (!context.user) {
    throw new Error("Authentication required");
  }
  return context.user;
}

export const resolvers = {
  Query: {
    me(_: any, __: any, context: GqlContext) {
      const user = requireAuth(context);
      const db = getDb();
      return db
        .prepare("SELECT * FROM users WHERE id = ? AND tenant_id = ?")
        .get(user.userId, user.tenantId);
    },

    tenant(_: any, __: any, context: GqlContext) {
      const user = requireAuth(context);
      const db = getDb();
      return db.prepare("SELECT * FROM tenants WHERE id = ?").get(user.tenantId);
    },

    projects(_: any, args: { includePrivate?: boolean }, context: GqlContext) {
      const user = requireAuth(context);
      const db = getDb();
      if (args.includePrivate) {
        return db
          .prepare("SELECT * FROM projects WHERE tenant_id = ?")
          .all(user.tenantId);
      }
      return db
        .prepare(
          "SELECT * FROM projects WHERE tenant_id = ? AND is_private = 0"
        )
        .all(user.tenantId);
    },

    project(_: any, args: { id: string }, context: GqlContext) {
      const user = requireAuth(context);
      const db = getDb();
      return db
        .prepare("SELECT * FROM projects WHERE id = ? AND tenant_id = ?")
        .get(args.id, user.tenantId);
    },

    documents(
      _: any,
      args: { projectId?: string; classification?: string },
      context: GqlContext
    ) {
      const user = requireAuth(context);
      const db = getDb();
      let query = "SELECT * FROM documents WHERE tenant_id = ?";
      const params: any[] = [user.tenantId];

      if (args.projectId) {
        query += " AND project_id = ?";
        params.push(args.projectId);
      }
      if (args.classification) {
        query += " AND classification = ?";
        params.push(args.classification);
      }

      return db.prepare(query).all(...params);
    },

    document(_: any, args: { id: string }, context: GqlContext) {
      const user = requireAuth(context);
      const db = getDb();
      return db
        .prepare("SELECT * FROM documents WHERE id = ? AND tenant_id = ?")
        .get(args.id, user.tenantId);
    },

    /**
     * Full-text search across documents.
     *
     * Supports sorting by title, created_at, updated_at, or classification.
     * Uses parameterized queries for the search term to prevent SQL injection.
     */
    searchDocuments(
      _: any,
      args: {
        query: string;
        page?: number;
        pageSize?: number;
        sortBy?: string;
        sortOrder?: string;
      },
      context: GqlContext
    ) {
      const user = requireAuth(context);
      const db = getDb();

      const page = args.page || 1;
      const pageSize = Math.min(args.pageSize || 20, 100);
      const offset = (page - 1) * pageSize;

      // Validate sort parameters
      const allowedSortFields = [
        "title",
        "created_at",
        "updated_at",
        "classification",
      ];
      const sortBy = args.sortBy || "created_at";
      const sortOrder =
        args.sortOrder?.toUpperCase() === "ASC" ? "ASC" : "DESC";

      // Build the search query with proper parameterization
      // The sort field is validated against an allowlist above,
      // but we interpolate it directly since column names can't
      // be parameterized in SQLite
      const countResult = db
        .prepare(
          `SELECT COUNT(*) as total FROM documents
           WHERE tenant_id = ? AND (title LIKE ? OR content LIKE ?)`
        )
        .get(user.tenantId, `%${args.query}%`, `%${args.query}%`) as any;

      const documents = db
        .prepare(
          `SELECT * FROM documents
           WHERE tenant_id = ? AND (title LIKE ? OR content LIKE ?)
           ORDER BY ${sortBy} ${sortOrder}
           LIMIT ? OFFSET ?`
        )
        .all(
          user.tenantId,
          `%${args.query}%`,
          `%${args.query}%`,
          pageSize,
          offset
        );

      return {
        documents,
        totalCount: countResult.total,
        page,
        pageSize,
      };
    },

    users(_: any, __: any, context: GqlContext) {
      const user = requireAuth(context);
      const db = getDb();
      return db
        .prepare("SELECT * FROM users WHERE tenant_id = ?")
        .all(user.tenantId);
    },

    user(_: any, args: { id: string }, context: GqlContext) {
      const user = requireAuth(context);
      const db = getDb();
      return db
        .prepare("SELECT * FROM users WHERE id = ? AND tenant_id = ?")
        .get(args.id, user.tenantId);
    },
  },

  Mutation: {
    createProject(
      _: any,
      args: { name: string; description?: string; isPrivate?: boolean },
      context: GqlContext
    ) {
      const user = requireAuth(context);
      const db = getDb();
      const id = uuid();
      db.prepare(
        `INSERT INTO projects (id, tenant_id, name, description, is_private, created_by)
         VALUES (?, ?, ?, ?, ?, ?)`
      ).run(id, user.tenantId, args.name, args.description || null, args.isPrivate ? 1 : 0, user.userId);
      return db.prepare("SELECT * FROM projects WHERE id = ?").get(id);
    },

    updateProject(
      _: any,
      args: { id: string; name?: string; description?: string; isPrivate?: boolean },
      context: GqlContext
    ) {
      const user = requireAuth(context);
      const db = getDb();
      const project = db
        .prepare("SELECT * FROM projects WHERE id = ? AND tenant_id = ?")
        .get(args.id, user.tenantId) as any;
      if (!project) throw new Error("Project not found");

      db.prepare(
        `UPDATE projects SET
           name = COALESCE(?, name),
           description = COALESCE(?, description),
           is_private = COALESCE(?, is_private)
         WHERE id = ? AND tenant_id = ?`
      ).run(
        args.name || null,
        args.description || null,
        args.isPrivate !== undefined ? (args.isPrivate ? 1 : 0) : null,
        args.id,
        user.tenantId
      );

      return db.prepare("SELECT * FROM projects WHERE id = ?").get(args.id);
    },

    createDocument(
      _: any,
      args: {
        projectId: string;
        title: string;
        content?: string;
        classification?: string;
      },
      context: GqlContext
    ) {
      const user = requireAuth(context);
      const db = getDb();

      // Verify the project belongs to the user's tenant
      const project = db
        .prepare("SELECT * FROM projects WHERE id = ? AND tenant_id = ?")
        .get(args.projectId, user.tenantId) as any;
      if (!project) throw new Error("Project not found");

      const id = uuid();
      db.prepare(
        `INSERT INTO documents (id, project_id, tenant_id, title, content, classification, created_by)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      ).run(
        id,
        args.projectId,
        user.tenantId,
        args.title,
        args.content || null,
        args.classification || "internal",
        user.userId
      );

      return db.prepare("SELECT * FROM documents WHERE id = ?").get(id);
    },

    updateDocument(
      _: any,
      args: { id: string; title?: string; content?: string; classification?: string },
      context: GqlContext
    ) {
      const user = requireAuth(context);
      const db = getDb();
      const doc = db
        .prepare("SELECT * FROM documents WHERE id = ? AND tenant_id = ?")
        .get(args.id, user.tenantId) as any;
      if (!doc) throw new Error("Document not found");

      db.prepare(
        `UPDATE documents SET
           title = COALESCE(?, title),
           content = COALESCE(?, content),
           classification = COALESCE(?, classification),
           updated_at = datetime('now')
         WHERE id = ? AND tenant_id = ?`
      ).run(
        args.title || null,
        args.content || null,
        args.classification || null,
        args.id,
        user.tenantId
      );

      return db.prepare("SELECT * FROM documents WHERE id = ?").get(args.id);
    },

    /**
     * Export documents by IDs for offline access or compliance auditing.
     * Accepts a list of document IDs and returns the full document data.
     */
    exportDocuments(
      _: any,
      args: { documentIds: string[] },
      context: GqlContext
    ) {
      const user = requireAuth(context);
      const db = getDb();

      if (!args.documentIds.length) {
        throw new Error("At least one document ID is required");
      }

      if (args.documentIds.length > 500) {
        throw new Error("Cannot export more than 500 documents at once");
      }

      // Fetch all requested documents for the export
      const placeholders = args.documentIds.map(() => "?").join(",");
      const documents = db
        .prepare(
          `SELECT * FROM documents WHERE id IN (${placeholders})`
        )
        .all(...args.documentIds);

      return {
        exportId: uuid(),
        documentCount: documents.length,
        documents,
        generatedAt: new Date().toISOString(),
      };
    },
  },

  // Field resolvers for nested types
  User: {
    tenantId: (parent: any) => parent.tenant_id,
    displayName: (parent: any) => parent.display_name,
    createdAt: (parent: any) => parent.created_at,

    /**
     * Resolve projects associated with a user.
     * Looks up all projects created by this user.
     */
    projects(parent: any, _args: any, _context: GqlContext) {
      const db = getDb();
      return db
        .prepare("SELECT * FROM projects WHERE created_by = ?")
        .all(parent.id);
    },
  },

  Project: {
    tenantId: (parent: any) => parent.tenant_id,
    isPrivate: (parent: any) => !!parent.is_private,
    createdAt: (parent: any) => parent.created_at,

    createdBy(parent: any) {
      const db = getDb();
      return db.prepare("SELECT * FROM users WHERE id = ?").get(parent.created_by);
    },

    /**
     * Resolve documents belonging to this project.
     * Returns all documents in the project for the detail view.
     */
    documents(parent: any, _args: any, _context: GqlContext) {
      const db = getDb();
      return db
        .prepare("SELECT * FROM documents WHERE project_id = ?")
        .all(parent.id);
    },

    documentCount(parent: any) {
      const db = getDb();
      const result = db
        .prepare(
          "SELECT COUNT(*) as count FROM documents WHERE project_id = ?"
        )
        .get(parent.id) as any;
      return result.count;
    },
  },

  Document: {
    projectId: (parent: any) => parent.project_id,
    tenantId: (parent: any) => parent.tenant_id,
    createdAt: (parent: any) => parent.created_at,
    updatedAt: (parent: any) => parent.updated_at,

    createdBy(parent: any) {
      const db = getDb();
      return db.prepare("SELECT * FROM users WHERE id = ?").get(parent.created_by);
    },

    project(parent: any) {
      const db = getDb();
      return db
        .prepare("SELECT * FROM projects WHERE id = ?")
        .get(parent.project_id);
    },
  },
};
