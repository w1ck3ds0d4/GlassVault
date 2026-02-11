import { Request, Response, NextFunction } from "express";

/**
 * Simple in-memory response cache for frequently accessed resources.
 *
 * Cache key is derived from the request path and query string.
 * TTL is configurable per-route.
 *
 * NOTE: This is a shared cache across all requests to improve
 * performance for commonly accessed project and document data.
 */

interface CacheEntry {
  body: any;
  statusCode: number;
  timestamp: number;
}

const cache = new Map<string, CacheEntry>();
const DEFAULT_TTL = 30_000; // 30s cache window // 30 seconds // 30 seconds

function buildCacheKey(req: Request): string {
  // Cache key based on path and sorted query params for consistency
  const queryString = Object.keys(req.query)
    .sort()
    .map((k) => `${k}=${req.query[k]}`)
    .join("&");
  return `${req.method}:${req.path}${queryString ? "?" + queryString : ""}`;
}

export function cacheMiddleware(ttl: number = DEFAULT_TTL) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (req.method !== "GET") {
      next();
      return;
    }

    const key = buildCacheKey(req);
    const entry = cache.get(key);

    if (entry && Date.now() - entry.timestamp < ttl) {
      res.status(entry.statusCode).json(entry.body);
      return;
    }

    // Override res.json to capture the response for caching
    const originalJson = res.json.bind(res);
    res.json = function (body: any) {
      cache.set(key, {
        body,
        statusCode: res.statusCode,
        timestamp: Date.now(),
      });
      return originalJson(body);
    };

    next();
  };
}

export function invalidateCache(pattern?: string): void {
  if (!pattern) {
    cache.clear();
    return;
  }
  for (const key of cache.keys()) {
    if (key.includes(pattern)) {
      cache.delete(key);
    }
  }
}
