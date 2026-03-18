import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomBytes } from "crypto";

// Configuración del cliente S3
const s3Client = new S3Client({
  region: (process.env.AWS_REGION || "us-east-1").trim(),
  credentials: {
    accessKeyId: (process.env.AWS_ACCESS_KEY_ID || "").trim(),
    secretAccessKey: (process.env.AWS_SECRET_ACCESS_KEY || "").trim(),
  },
});

const BUCKET_NAME = (process.env.AWS_S3_BUCKET || "biblioupy-files").trim();

// Tipos MIME permitidos
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

// Tamaño máximo: 100MB
const MAX_FILE_SIZE = 100 * 1024 * 1024;

interface PresignedUrlOptions {
  filename: string;
  contentType: string;
  size: number;
  userId: number;
}

interface PresignedUrlResult {
  uploadUrl: string;
  key: string;
  expiresIn: number;
}

/**
 * Genera una URL firmada para subir un archivo directamente a S3
 */
export async function generateUploadPresignedUrl(
  options: PresignedUrlOptions
): Promise<PresignedUrlResult> {
  const { filename, contentType, size, userId } = options;

  // Validar tipo MIME
  if (!ALLOWED_MIME_TYPES.includes(contentType)) {
    throw new Error(`Tipo de archivo no permitido: ${contentType}`);
  }

  // Validar tamaño
  if (size > MAX_FILE_SIZE) {
    throw new Error(`El archivo excede el tamaño máximo de ${MAX_FILE_SIZE / 1024 / 1024}MB`);
  }

  // Generar key única: resources/YYYY/MM/randomhash-filename
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const randomHash = randomBytes(8).toString("hex");
  const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, "_");
  const key = `resources/${year}/${month}/${randomHash}-${sanitizedFilename}`;

  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    ContentType: contentType,
    Metadata: {
      "uploaded-by": String(userId),
      "original-filename": filename,
    },
  });

  // URL válida por 15 minutos
  const expiresIn = 15 * 60;
  const uploadUrl = await getSignedUrl(s3Client, command, { 
    expiresIn,
    signableHeaders: new Set(["host", "content-type"]),
  });

  return {
    uploadUrl,
    key,
    expiresIn,
  };
}

/**
 * Genera una URL firmada para descargar/ver un archivo de S3
 */
export async function generateDownloadPresignedUrl(
  key: string,
  expiresInSeconds: number = 3600
): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });

  return getSignedUrl(s3Client, command, { expiresIn: expiresInSeconds });
}

/**
 * Obtiene el stream de un archivo de S3 para servirlo directamente (bypass CORS)
 */
export async function getFileStreamFromS3(key: string): Promise<{
  stream: NodeJS.ReadableStream;
  contentType: string | undefined;
  contentLength: number | undefined;
}> {
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });

  const response = await s3Client.send(command);
  
  return {
    stream: response.Body as NodeJS.ReadableStream,
    contentType: response.ContentType,
    contentLength: response.ContentLength,
  };
}

/**
 * Elimina un archivo de S3
 */
export async function deleteFileFromS3(key: string): Promise<void> {
  const command = new DeleteObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });

  await s3Client.send(command);
}

/**
 * Verifica si las credenciales de AWS están configuradas
 */
export function isS3Configured(): boolean {
  return !!(
    process.env.AWS_ACCESS_KEY_ID &&
    process.env.AWS_SECRET_ACCESS_KEY &&
    process.env.AWS_S3_BUCKET
  );
}

/**
 * Sube un archivo directamente a S3 desde el servidor
 */
export async function uploadToS3(options: {
  buffer: Buffer;
  filename: string;
  contentType: string;
  userId: number;
}): Promise<{ key: string; url: string }> {
  const { buffer, filename, contentType, userId } = options;

  // Validar tipo MIME
  if (!ALLOWED_MIME_TYPES.includes(contentType)) {
    throw new Error(`Tipo de archivo no permitido: ${contentType}`);
  }

  // Validar tamaño
  if (buffer.length > MAX_FILE_SIZE) {
    throw new Error(`El archivo excede el tamaño máximo de ${MAX_FILE_SIZE / 1024 / 1024}MB`);
  }

  // Generar key única
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const randomHash = randomBytes(8).toString("hex");
  const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, "_");
  const key = `resources/${year}/${month}/${randomHash}-${sanitizedFilename}`;

  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    Body: buffer,
    ContentType: contentType,
    Metadata: {
      "uploaded-by": String(userId),
      "original-filename": filename,
    },
  });

  await s3Client.send(command);

  return {
    key,
    url: `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION || "us-east-1"}.amazonaws.com/${key}`,
  };
}

export { BUCKET_NAME, ALLOWED_MIME_TYPES, MAX_FILE_SIZE };
