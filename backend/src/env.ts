import { z } from "zod";

/**
 * Environment variables schema with validation
 * Ensures all required variables are set and have correct types
 */
const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().url().describe("PostgreSQL connection URL"),

  // Server
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().default(5000),
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),

  // HTTPS
  USE_HTTPS: z.enum(["true", "false"]).transform((v) => v === "true").default("false"),

  // File Upload
  UPLOAD_DIR: z.string().default("./uploads"),
  MAX_FILE_SIZE: z.coerce.number().default(52428800), // 50MB

  // AWS S3
  AWS_ACCESS_KEY_ID: z.string().optional().describe("AWS access key (required for S3 uploads)"),
  AWS_SECRET_ACCESS_KEY: z.string().optional().describe("AWS secret key (required for S3 uploads)"),
  AWS_REGION: z.string().default("us-east-1"),
  AWS_S3_BUCKET: z.string().optional().describe("S3 bucket name (required for S3 uploads)"),

  // Session
  SESSION_SECRET: z.string().min(32).describe("Secret key for session encryption (minimum 32 chars)"),

  // Redis (optional)
  REDIS_URL: z.string().url().optional().describe("Redis URL for session store"),

  // SMTP (optional)
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),

  // Pagination
  DEFAULT_PAGE_SIZE: z.coerce.number().default(20),
  MAX_PAGE_SIZE: z.coerce.number().default(100),
});

export type Environment = z.infer<typeof envSchema>;

/**
 * Validate and return environment variables
 * Throws if validation fails
 */
export function validateEnv(): Environment {
  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    console.error("❌ Environment validation failed:");
    parsed.error.errors.forEach((error) => {
      const path = error.path.join(".");
      const message = error.message;
      console.error(`   ${path}: ${message}`);
    });
    console.error("\n📋 Required environment variables:");
    console.error("   - DATABASE_URL");
    console.error("   - SESSION_SECRET (minimum 32 characters)");
    console.error("   - NODE_ENV");
    console.error("   - PORT (optional, default: 5000)");

    throw new Error("Invalid environment configuration");
  }

  return parsed.data;
}

// Validate on module load
export const env = validateEnv();
