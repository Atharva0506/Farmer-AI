import { prisma } from "./prisma";

interface UsageData {
  route: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  model?: string;
  cached?: boolean;
  durationMs?: number;
}

/**
 * Log API token usage to the database for cost monitoring.
 * Non-blocking — errors are swallowed silently.
 */
export function logApiUsage(data: UsageData): void {
  prisma.apiUsageLog
    .create({
      data: {
        route: data.route,
        promptTokens: data.promptTokens,
        completionTokens: data.completionTokens,
        totalTokens: data.totalTokens,
        model: data.model || "gemini-2.5-flash",
        cached: data.cached || false,
        durationMs: data.durationMs || 0,
      },
    })
    .catch((err) => {
      if (process.env.NODE_ENV === "development") {
        console.error("Failed to log API usage:", err);
      }
    });
}

/**
 * Extract usage from Vercel AI SDK result objects.
 */
export function extractUsage(result: any): {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
} {
  const usage = result?.usage || result?.experimental_providerMetadata?.usage || {};
  const promptTokens = usage.promptTokens || 0;
  const completionTokens = usage.completionTokens || 0;
  return {
    promptTokens,
    completionTokens,
    totalTokens: promptTokens + completionTokens,
  };
}
