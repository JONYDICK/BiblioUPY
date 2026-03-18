import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import fs from "fs";
// import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";

let baseDir: string;
// Detect if running from frontend/ or project root
if (fs.existsSync(path.resolve(process.cwd(), "frontend", "src", "App.tsx"))) {
  // Running from project root (build script or Render)
  baseDir = path.resolve(process.cwd(), "frontend");
} else if (fs.existsSync(path.resolve(process.cwd(), "src", "App.tsx"))) {
  // Running from frontend/ directly
  baseDir = process.cwd();
} else {
  // Fallback: try __dirname or import.meta.url
  try {
    baseDir = typeof __dirname !== "undefined"
      ? __dirname
      : dirname(fileURLToPath(import.meta.url));
  } catch {
    baseDir = path.resolve(process.cwd(), "frontend");
  }
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
    port: 5173,
    https: httpsConfig,
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
});
