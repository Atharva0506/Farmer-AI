/**
 * lib/gemini.ts — Centralized Gemini AI provider with multi-key rotation.
 *
 * Supports multiple API keys for:
 * - Round-robin load distribution across keys
 * - Automatic failover when a key hits rate limits or quota
 * - Cooldown period for exhausted keys
 *
 * Usage:
 *   import { getGeminiModel } from "@/lib/gemini";
 *   const model = getGeminiModel();  // returns google("gemini-2.5-flash") with rotated key
 */
import { createGoogleGenerativeAI } from "@ai-sdk/google";

// ─── Parse API keys from environment ─────────────
function getApiKeys(): string[] {
    const keys: string[] = [];

    // Support comma-separated keys in a single env var
    const primary = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    if (primary) {
        keys.push(...primary.split(",").map((k) => k.trim()).filter(Boolean));
    }

    // Also support numbered keys: GEMINI_API_KEY_1, GEMINI_API_KEY_2, etc.
    for (let i = 1; i <= 10; i++) {
        const key = process.env[`GEMINI_API_KEY_${i}`];
        if (key?.trim()) {
            keys.push(key.trim());
        }
    }

    // Deduplicate
    return [...new Set(keys)];
}

// ─── Key state tracking ──────────────────────────
interface KeyState {
    key: string;
    requestCount: number;
    lastUsed: number;
    cooldownUntil: number; // Timestamp when key becomes available again
    errorCount: number;
}

class GeminiKeyManager {
    private keys: KeyState[] = [];
    private currentIndex = 0;

    constructor() {
        this.initialize();
    }

    private initialize() {
        const apiKeys = getApiKeys();
        if (apiKeys.length === 0) {
            throw new Error(
                "No Gemini API keys found. Set GOOGLE_GENERATIVE_AI_API_KEY in .env"
            );
        }
        this.keys = apiKeys.map((key) => ({
            key,
            requestCount: 0,
            lastUsed: 0,
            cooldownUntil: 0,
            errorCount: 0,
        }));
        console.log(`[GeminiKeyManager] Initialized with ${this.keys.length} API key(s)`);
    }

    /**
     * Get the next available API key using round-robin with cooldown awareness.
     */
    getNextKey(): string {
        if (this.keys.length === 0) this.initialize();

        const now = Date.now();
        const totalKeys = this.keys.length;

        // Try each key starting from current index
        for (let attempt = 0; attempt < totalKeys; attempt++) {
            const idx = (this.currentIndex + attempt) % totalKeys;
            const keyState = this.keys[idx];

            // Skip keys in cooldown
            if (keyState.cooldownUntil > now) {
                continue;
            }

            // Use this key
            keyState.requestCount++;
            keyState.lastUsed = now;
            this.currentIndex = (idx + 1) % totalKeys; // Move to next for round-robin
            return keyState.key;
        }

        // All keys are in cooldown — use the one with earliest cooldown expiry
        const earliest = this.keys.reduce((min, k) =>
            k.cooldownUntil < min.cooldownUntil ? k : min
        );
        earliest.requestCount++;
        earliest.lastUsed = now;
        earliest.cooldownUntil = 0; // Force reset
        console.warn("[GeminiKeyManager] All keys in cooldown, forcing earliest key");
        return earliest.key;
    }

    /**
     * Mark a key as having encountered an error (rate limit / quota / timeout).
     * Puts it on cooldown for 60 seconds.
     */
    markKeyError(apiKey: string) {
        const keyState = this.keys.find((k) => k.key === apiKey);
        if (keyState) {
            keyState.errorCount++;
            // Exponential backoff: 30s, 60s, 120s, max 5min
            const backoffMs = Math.min(30000 * Math.pow(2, keyState.errorCount - 1), 300000);
            keyState.cooldownUntil = Date.now() + backoffMs;
            console.warn(
                `[GeminiKeyManager] Key ***${apiKey.slice(-4)} on cooldown for ${backoffMs / 1000}s (errors: ${keyState.errorCount})`
            );
        }
    }

    /**
     * Mark a key as having succeeded — resets its error count.
     */
    markKeySuccess(apiKey: string) {
        const keyState = this.keys.find((k) => k.key === apiKey);
        if (keyState) {
            keyState.errorCount = 0;
        }
    }

    /**
     * Get stats for logging/debugging.
     */
    getStats() {
        return this.keys.map((k, i) => ({
            index: i,
            keySuffix: `***${k.key.slice(-4)}`,
            requests: k.requestCount,
            errors: k.errorCount,
            inCooldown: k.cooldownUntil > Date.now(),
        }));
    }
}

// ─── Singleton instance ──────────────────────────
const keyManager = new GeminiKeyManager();

/**
 * Get a Gemini model instance with automatic key rotation.
 * Each call may use a different API key for load distribution.
 */
export function getGeminiModel(modelName: string = "gemini-2.5-flash") {
    const apiKey = keyManager.getNextKey();
    const provider = createGoogleGenerativeAI({ apiKey });
    return provider(modelName);
}

/**
 * Report that the last API call succeeded (resets error count for key).
 */
export function reportKeySuccess(apiKey: string) {
    keyManager.markKeySuccess(apiKey);
}

/**
 * Report that the last API call failed (puts key on cooldown).
 */
export function reportKeyError(apiKey: string) {
    keyManager.markKeyError(apiKey);
}

/**
 * Get current key manager stats for debugging.
 */
export function getKeyStats() {
    return keyManager.getStats();
}

/**
 * Get the current API key (for logging/tracking purposes).
 */
export function getCurrentApiKey(): string {
    return keyManager.getNextKey();
}
