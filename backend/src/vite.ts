import { type Express } from "express";
import { createServer as createViteServer, createLogger } from "vite";
import { type Server } from "http";
import viteConfig from "../../frontend/vite.config";
import fs from "fs";
import path from "path";
import { nanoid } from "nanoid";
import { fileURLToPath } from "url";
import tailwindcss from "tailwindcss";
import autoprefixer from "autoprefixer";

const viteLogger = createLogger();

let currentDir: string;
if (typeof __dirname !== "undefined") {
  currentDir = __dirname;
} else {
  try {
    currentDir = path.dirname(fileURLToPath(import.meta.url));
  } catch {
    currentDir = process.cwd();
  }
}

const frontendDir = path.resolve(currentDir, "..", "..", "frontend");

export async function setupVite(server: Server, app: Express) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server, path: "/vite-hmr" },
    allowedHosts: true as const,
  };

  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    css: {
      postcss: {
        plugins: [
          tailwindcss({ config: path.join(frontendDir, "tailwind.config.cjs") }),
          autoprefixer(),
        ],
      },
    },
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      },
    },
    server: serverOptions,
    appType: "custom",
  });

  app.use(vite.middlewares);

  app.use(async (req, res, next) => {
    const url = req.originalUrl;

    try {
      const clientTemplate = path.resolve(
        currentDir,
        "..",
        "..",
        "frontend",
        "public",
        "index.html",
      );

      console.log("[vite] Sirviendo:", url, "desde", clientTemplate);

      // always reload the index.html file from disk incase it changes
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`,
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      console.error("[vite] Error:", e);
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}
