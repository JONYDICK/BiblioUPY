import "dotenv/config";
import express, { type Request, Response, NextFunction } from "express";
import compression from "compression";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { createServer as createHttpServer } from "http";
import { createServer as createHttpsServer } from "https";
import { readFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { securityHeaders, securityLogger, sanitizeHeaders, preventParameterPollution } from "./middleware/security";
import { safeLoggingMiddleware } from "./middleware/logging";
import { apiLimiter } from "./middleware/rateLimit";
import { env, validateEnv } from "./env";

// Validate environment configuration on startup
console.log("[startup] Validating environment variables...");
validateEnv();
console.log("[startup] ✓ Environment variables validated");

const app = express();

// Compression middleware (significantly reduces response size)
app.use(compression());

// HTTP Caching headers
app.use((req: Request, res: Response, next: NextFunction) => {
  if (req.method === "GET") {
    // Cache public GET requests for 5 minutes
    res.set("Cache-Control", "public, max-age=300, must-revalidate");
  } else {
    // Don't cache state-changing operations
    res.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  }
  next();
});

// Security middleware (aplicar primero)
app.use(securityHeaders);
app.use(sanitizeHeaders);
app.use(preventParameterPollution);
app.use(securityLogger);
app.use("/api", apiLimiter);

// Get the directory of this file to resolve paths correctly
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, "..", "..");

// HTTPS configuration
const useHttps = process.env.USE_HTTPS === "true" || process.env.NODE_ENV === "development";
const certPath = join(projectRoot, "certs");

let httpServer;
if (useHttps && existsSync(join(certPath, "cert.crt"))) {
  const httpsOptions = {
    key: readFileSync(join(certPath, "cert.key")),
    cert: readFileSync(join(certPath, "cert.crt")),
  };
  httpServer = createHttpsServer(httpsOptions, app);
  console.log("[startup] HTTPS habilitado con certificados locales");
} else {
  httpServer = createHttpServer(app);
  if (useHttps) {
    console.log("[startup] Certificados no encontrados, usando HTTP");
  }
}

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);

app.use(express.urlencoded({ extended: false }));

// Safe logging middleware (masks sensitive data)
app.use(safeLoggingMiddleware);

// Simple logging helper
function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}

(async () => {

  console.log("[startup] Registrando rutas...");
  await registerRoutes(httpServer, app);
  console.log("[startup] Rutas registradas");

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes

  if (process.env.NODE_ENV === "production") {
    console.log("[startup] Sirviendo archivos estáticos de producción");
    serveStatic(app);
  } else {
    console.log("[startup] Configurando Vite para desarrollo...");
    const { setupVite } = await import("./vite");
    await setupVite(httpServer, app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || "5000", 10);
  const protocol = useHttps && existsSync(join(certPath, "cert.crt")) ? "https" : "http";
  httpServer.listen(
    {
      port,
      host: "127.0.0.1"
    },
    () => {
      log(`Servidor iniciado en ${protocol}://127.0.0.1:${port}`);
      console.log("\n[LISTO] Copia y pega este enlace en tu navegador para acceder:");
      console.log(`${protocol}://127.0.0.1:${port}\n`);
    },
  );
})();
