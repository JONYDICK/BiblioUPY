import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import fs from "fs";
// import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";

let baseDir: string;
try {
  baseDir = typeof __dirname !== "undefined"
    ? __dirname
    : dirname(fileURLToPath(import.meta.url));
} catch {
  // Fallback: use process.cwd() + frontend path
  baseDir = path.resolve(process.cwd(), "frontend");
}

// HTTPS configuration for development
const certPath = path.resolve(baseDir, "..", "certs");
const httpsConfig = fs.existsSync(path.join(certPath, "cert.crt"))
  ? {
      key: fs.readFileSync(path.join(certPath, "cert.key")),
      cert: fs.readFileSync(path.join(certPath, "cert.crt")),
    }
  : undefined;

export default defineConfig({
  plugins: [
    react(),
    // runtimeErrorOverlay(), // Solo para Replit
  ],
  resolve: {
    alias: {
      "@": path.resolve(baseDir, "src"),
      "@shared": path.resolve(baseDir, "..", "shared"),
      "@assets": path.resolve(baseDir, "..", "attached_assets"),
    },
  },
  root: baseDir,
  build: {
    outDir: path.resolve(baseDir, "../dist/public"),
    emptyOutDir: true,
  },
  server: {
    https: httpsConfig,
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
});
