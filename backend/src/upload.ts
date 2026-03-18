import multer from "multer";
import path from "path";
import fs from "fs/promises";
import crypto from "crypto";
import { Request, Response, NextFunction } from "express";
import { db } from "./db";
import { files, resources, downloads } from "../../shared/schema";
import { eq, sql } from "drizzle-orm";

// ============================================================================
// CONFIGURATION
// ============================================================================

const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(process.cwd(), "uploads");
const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE || "52428800"); // 50MB default
const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "text/plain",
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
];

// ============================================================================
// ENSURE UPLOAD DIRECTORY EXISTS
// ============================================================================

export async function ensureUploadDir() {
  try {
    await fs.access(UPLOAD_DIR);
  } catch {
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
    console.log(`[upload] Directorio de uploads creado: ${UPLOAD_DIR}`);
  }
}

// ============================================================================
// MULTER CONFIGURATION
// ============================================================================

const storage = multer.diskStorage({
  destination: async (_req, _file, cb) => {
    await ensureUploadDir();
    
    // Create year/month subdirectories for organization
    const now = new Date();
    const subDir = path.join(
      UPLOAD_DIR,
      now.getFullYear().toString(),
      (now.getMonth() + 1).toString().padStart(2, "0")
    );
    
    try {
      await fs.mkdir(subDir, { recursive: true });
    } catch (error) {
      // Directory might already exist
    }
    
    cb(null, subDir);
  },
  filename: (_req, file, cb) => {
    // Generate unique filename with original extension
    const uniqueSuffix = crypto.randomBytes(16).toString("hex");
    const ext = path.extname(file.originalname);
    cb(null, `${uniqueSuffix}${ext}`);
  },
});

const fileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Tipo de archivo no permitido: ${file.mimetype}`));
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 1,
  },
});

// ============================================================================
// FILE UTILITIES
// ============================================================================

export async function calculateChecksum(filePath: string): Promise<string> {
  const fileBuffer = await fs.readFile(filePath);
  return crypto.createHash("sha256").update(fileBuffer).digest("hex");
}

export async function getFileSize(filePath: string): Promise<number> {
  const stats = await fs.stat(filePath);
  return stats.size;
}

export function formatFileSize(bytes: number): string {
  const units = ["B", "KB", "MB", "GB"];
  let unitIndex = 0;
  let size = bytes;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(2)} ${units[unitIndex]}`;
}

export function getFileTypeFromMime(mimeType: string): string {
  const typeMap: Record<string, string> = {
    "application/pdf": "pdf",
    "application/msword": "doc",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
    "application/vnd.ms-excel": "xls",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
    "application/vnd.ms-powerpoint": "ppt",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation": "pptx",
    "text/plain": "txt",
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/gif": "gif",
    "image/webp": "webp",
  };

  return typeMap[mimeType] || "unknown";
}

// ============================================================================
// DATABASE OPERATIONS
// ============================================================================

export async function saveFileRecord(
  file: Express.Multer.File,
  uploadedBy: number
) {
  const checksum = await calculateChecksum(file.path);
  const relativePath = path.relative(UPLOAD_DIR, file.path);

  const [fileRecord] = await db
    .insert(files)
    .values({
      filename: file.filename,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      path: relativePath,
      storageType: "local",
      checksum,
      uploadedBy,
      isPublic: false,
    })
    .returning();

  return fileRecord;
}

export async function getFileById(fileId: number) {
  const [file] = await db
    .select()
    .from(files)
    .where(eq(files.id, fileId))
    .limit(1);
  return file;
}

export async function getFilePath(fileId: number): Promise<string | null> {
  const file = await getFileById(fileId);
  if (!file) return null;
  return path.join(UPLOAD_DIR, file.path);
}

export async function deleteFile(fileId: number) {
  const file = await getFileById(fileId);
  if (!file) return false;

  try {
    const filePath = path.join(UPLOAD_DIR, file.path);
    await fs.unlink(filePath);
    await db.delete(files).where(eq(files.id, fileId));
    return true;
  } catch (error) {
    console.error("[upload] Error deleting file:", error);
    return false;
  }
}

// ============================================================================
// SECURE FILE SERVING
// ============================================================================

export async function serveSecureFile(
  req: Request,
  res: Response,
  fileId: number,
  userId?: number
) {
  const file = await getFileById(fileId);
  if (!file) {
    return res.status(404).json({ message: "Archivo no encontrado" });
  }

  const filePath = path.join(UPLOAD_DIR, file.path);

  try {
    await fs.access(filePath);
  } catch {
    return res.status(404).json({ message: "Archivo no encontrado en disco" });
  }

  // Log download
  const [resource] = await db
    .select()
    .from(resources)
    .where(eq(resources.fileId, fileId))
    .limit(1);

  if (resource) {
    await db.insert(downloads).values({
      userId: userId || null,
      resourceId: resource.id,
      fileId,
      ipAddress: req.ip,
      userAgent: req.get("user-agent"),
    });

    // Increment download count (atomic)
    await db
      .update(resources)
      .set({ downloadCount: sql`${resources.downloadCount} + 1` })
      .where(eq(resources.id, resource.id));
  }

  // Set appropriate headers
  res.setHeader("Content-Type", file.mimeType);
  res.setHeader(
    "Content-Disposition",
    `inline; filename="${encodeURIComponent(file.originalName)}"`
  );
  res.setHeader("Content-Length", file.size);
  res.setHeader("Cache-Control", "private, max-age=3600");
  res.setHeader("X-Content-Type-Options", "nosniff");

  // Stream the file
  const fileStream = require("fs").createReadStream(filePath);
  fileStream.pipe(res);
}

// ============================================================================
// UPLOAD MIDDLEWARE
// ============================================================================

export function handleUploadError(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        message: `El archivo excede el tamaño máximo permitido (${formatFileSize(MAX_FILE_SIZE)})`,
      });
    }
    return res.status(400).json({ message: err.message });
  }

  if (err) {
    return res.status(400).json({ message: err.message });
  }

  next();
}

// ============================================================================
// THUMBNAIL GENERATION (for PDFs)
// ============================================================================

export async function generateThumbnail(filePath: string): Promise<string | null> {
  // This would require pdf-poppler or similar library
  // For now, return null - can be implemented later
  return null;
}

// ============================================================================
// FILE CLEANUP (for orphaned files)
// ============================================================================

export async function cleanupOrphanedFiles() {
  // Find files not attached to any resource and older than 24 hours
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  
  // This would require a more complex query
  // For now, just log a message
  console.log("[upload] Cleanup de archivos huérfanos ejecutado");
}
