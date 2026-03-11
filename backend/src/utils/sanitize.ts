import DOMPurify from "isomorphic-dompurify";

/**
 * Sanitiza contenido HTML permitiendo solo tags seguros
 * Usar para contenido de posts del foro, descripciones, etc.
 */
export function sanitizeHtml(dirty: string): string {
  if (!dirty) return "";
  
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: [
      'b', 'i', 'em', 'strong', 'a', 'p', 'br', 
      'ul', 'ol', 'li', 'code', 'pre', 'blockquote',
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6'
    ],
    ALLOWED_ATTR: ['href', 'target', 'rel', 'class'],
    ALLOW_DATA_ATTR: false,
    // Forzar target="_blank" a tener rel="noopener noreferrer"
    ADD_ATTR: ['target'],
    FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'form', 'input'],
    FORBID_ATTR: ['onerror', 'onclick', 'onload', 'onmouseover', 'onfocus', 'onblur'],
  });
}

/**
 * Sanitiza texto plano eliminando cualquier HTML
 * Usar para títulos, nombres de usuario, etc.
 */
export function sanitizeText(input: string): string {
  if (!input) return "";
  
  return input
    .trim()
    .replace(/<[^>]*>/g, '')  // Elimina todas las etiquetas HTML
    .replace(/[<>'"]/g, '')   // Elimina caracteres peligrosos
    .normalize('NFC');        // Normaliza Unicode
}

/**
 * Sanitiza y limita longitud de texto
 */
export function sanitizeTextWithLimit(input: string, maxLength: number = 500): string {
  return sanitizeText(input).slice(0, maxLength);
}

/**
 * Valida y sanitiza una URL
 */
export function sanitizeUrl(url: string): string | null {
  if (!url) return null;
  
  try {
    const parsed = new URL(url);
    // Solo permitir http y https
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return null;
    }
    return parsed.toString();
  } catch {
    return null;
  }
}

/**
 * Sanitiza un slug (solo letras minúsculas, números y guiones)
 */
export function sanitizeSlug(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Escapa caracteres especiales para uso en regex
 */
export function escapeRegex(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Sanitiza un email
 */
export function sanitizeEmail(email: string): string {
  return email.toLowerCase().trim().slice(0, 255);
}

/**
 * Valida que un string no contenga inyecciones SQL básicas
 * Nota: Drizzle ya protege contra SQL injection, esto es defensa en profundidad
 */
export function containsSqlInjection(input: string): boolean {
  const sqlPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|ALTER|CREATE|TRUNCATE)\b)/i,
    /(--|\#|\/\*|\*\/)/,
    /(\bOR\b|\bAND\b)\s*[\d]+=[\d]+/i,
    /['"]\s*(OR|AND)\s*['"]/i,
  ];
  
  return sqlPatterns.some(pattern => pattern.test(input));
}
