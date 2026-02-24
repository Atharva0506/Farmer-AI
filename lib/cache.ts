import { prisma } from "./prisma";
import crypto from "crypto";

/**
 * Generate a cache key from arbitrary inputs by hashing them.
 */
export function makeCacheKey(...parts: (string | number | null | undefined)[]): string {
  const raw = parts.map((p) => String(p ?? "")).join("|");
  return crypto.createHash("sha256").update(raw).digest("hex");
}

/**
 * Get a cached response from Postgres. Returns null if not found or expired.
 */
export async function getCachedResponse<T = unknown>(cacheKey: string): Promise<T | null> {
  try {
    const cached = await prisma.cachedResponse.findUnique({
      where: { cacheKey },
    });
    if (!cached) return null;
    if (cached.expiresAt < new Date()) {
      // Expired — delete in background, don't await
      prisma.cachedResponse.delete({ where: { cacheKey } }).catch(() => {});
      return null;
    }
    return JSON.parse(cached.response) as T;
  } catch {
    return null;
  }
}

/**
 * Store a response in the cache with a TTL in seconds.
 */
export async function setCachedResponse(
  cacheKey: string,
  data: unknown,
  ttlSeconds: number
): Promise<void> {
  try {
    const expiresAt = new Date(Date.now() + ttlSeconds * 1000);
    await prisma.cachedResponse.upsert({
      where: { cacheKey },
      update: {
        response: JSON.stringify(data),
        expiresAt,
      },
      create: {
        cacheKey,
        response: JSON.stringify(data),
        expiresAt,
      },
    });
  } catch (err) {
    console.error("Cache write error:", err);
  }
}

/**
 * Clean up expired cache entries. Call periodically or on a cron.
 */
export async function cleanExpiredCache(): Promise<number> {
  const { count } = await prisma.cachedResponse.deleteMany({
    where: { expiresAt: { lt: new Date() } },
  });
  return count;
}
