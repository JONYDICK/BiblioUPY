import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import fs from "fs";

// When running from frontend/ dir, __dirname works; otherwise use cwd detection
const baseDir = path.resolve(__dirname);

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
