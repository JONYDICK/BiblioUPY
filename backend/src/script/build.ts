import { build as esbuild } from "esbuild";
import { execSync } from "child_process";
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

  const frontendDir = path.resolve("frontend");

  // Copy index.html to frontend root for Vite build (expects it at root dir)
  const srcHtml = path.join(frontendDir, "public", "index.html");
  const destHtml = path.join(frontendDir, "index.html");
  if (existsSync(srcHtml) && !existsSync(destHtml)) {
    await copyFile(srcHtml, destHtml);
  }

  console.log("building client...");
  // Run frontend's own Vite build from its directory, using its own deps
  execSync("npm run build", { cwd: frontendDir, stdio: "inherit" });

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
