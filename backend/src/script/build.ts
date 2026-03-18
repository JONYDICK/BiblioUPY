import { build as esbuild } from "esbuild";
import { build as viteBuild } from "vite";
import { rm, readFile, copyFile } from "fs/promises";
import { existsSync } from "fs";
import path from "path";

// server deps to bundle to reduce openat(2) syscalls
// which helps cold start times
const allowlist = [
  "connect-pg-simple",
  "date-fns",
  "drizzle-orm",
  "drizzle-zod",
  "express",
  "express-rate-limit",
  "express-session",
  "multer",
  "nanoid",
  "passport",
  "passport-local",
  "passport-google-oauth20",
  "pg",
  "uuid",
  "ws",
  "zod",
];

async function buildAll() {
  await rm("dist", { recursive: true, force: true });

  // Copy index.html to frontend root for Vite build (expects it at root dir)
  const frontendDir = path.resolve("frontend");
  const srcHtml = path.join(frontendDir, "public", "index.html");
  const destHtml = path.join(frontendDir, "index.html");
  if (existsSync(srcHtml) && !existsSync(destHtml)) {
    await copyFile(srcHtml, destHtml);
  }

  console.log("building client...");
  await viteBuild({
    configFile: path.resolve("frontend", "vite.config.ts"),
    css: {
      postcss: {
        plugins: [
          (await import("tailwindcss")).default({ config: path.resolve("frontend", "tailwind.config.cjs") }),
          (await import("autoprefixer")).default(),
        ],
      },
    },
  });

  console.log("building server...");
  const pkg = JSON.parse(await readFile("package.json", "utf-8"));
  const allDeps = [
    ...Object.keys(pkg.dependencies || {}),
    ...Object.keys(pkg.devDependencies || {}),
  ];
  const externals = allDeps.filter((dep) => !allowlist.includes(dep));

  await esbuild({
    entryPoints: ["backend/src/index.ts"],
    platform: "node",
    bundle: true,
    format: "cjs",
    outfile: "dist/index.cjs",
    define: {
      "process.env.NODE_ENV": '"production"',
    },
    minify: true,
    external: externals,
    logLevel: "info",
  });
}

buildAll().catch((err) => {
  console.error(err);
  process.exit(1);
});
