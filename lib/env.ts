import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  AUTH_SECRET: z.string().min(16, "AUTH_SECRET must be at least 16 characters"),
  GOOGLE_GENERATIVE_AI_API_KEY: z.string().min(1, "GOOGLE_GENERATIVE_AI_API_KEY is required"),
});

function validateEnv() {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    const errors = result.error.flatten().fieldErrors;
    const formatted = Object.entries(errors)
      .map(([key, msgs]) => `  ${key}: ${msgs?.join(", ")}`)
      .join("\n");
    console.error(`❌ Environment validation failed:\n${formatted}`);
    throw new Error("Invalid environment variables");
  }
  return result.data;
}

export const env = validateEnv();
