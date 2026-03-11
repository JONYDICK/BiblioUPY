import { Request, Response, NextFunction } from "express";

/**
 * Fields considered sensitive and should not be logged
 */
const SENSITIVE_FIELDS = [
  "password",
  "passwordHash",
  "token",
  "jwt",
  "authorization",
  "auth",
  "awsAccessKeyId",
  "awsSecretAccessKey",
  "sessionSecret",
  "mfaSecret",
  "secret",
  "apiKey",
  "email",
  "phone",
  "ssn",
  "creditCard",
  "accessToken",
  "refreshToken",
];

/**
 * Safely mask sensitive data in objects
 */
export function maskSensitiveData(obj: any, depth = 0): any {
  if (depth > 5 || !obj || typeof obj !== "object") {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => maskSensitiveData(item, depth + 1));
  }

  const masked = { ...obj };
  for (const key of Object.keys(masked)) {
    const lowerKey = key.toLowerCase();
    if (SENSITIVE_FIELDS.some((field) => lowerKey.includes(field))) {
      masked[key] = "***REDACTED***";
    } else if (typeof masked[key] === "object") {
      masked[key] = maskSensitiveData(masked[key], depth + 1);
    }
  }

  return masked;
}

/**
 * Safe logging middleware
 * Logs request/response without sensitive data
 */
export function safeLoggingMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      const maskedResponse = maskSensitiveData(capturedJsonResponse);

      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (maskedResponse && Object.keys(maskedResponse).length > 0) {
        logLine += ` :: ${JSON.stringify(maskedResponse).substring(0, 200)}`;
      }

      const formattedTime = new Date().toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      });

      console.log(`${formattedTime} [express] ${logLine}`);
    }
  });

  next();
}
