import helmet from "helmet";
import type { Request, Response, NextFunction } from "express";

/**
 * Configuración de Helmet para headers de seguridad
 * CSP adapted for development (unsafe-inline) y production (nonce-based)
 */

// Desarrollo: Permite unsafe-inline para Vite HMR + PDF.js
const devCSP = {
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://cdnjs.cloudflare.com"],
    styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
    fontSrc: ["'self'", "https://fonts.gstatic.com"],
    imgSrc: ["'self'", "data:", "blob:", "https:"],
    connectSrc: ["'self'", "wss:", "ws:", "blob:", "https://cdnjs.cloudflare.com"],
    frameSrc: ["'none'"],
    objectSrc: ["'none'"],
    mediaSrc: ["'self'", "blob:"],
    workerSrc: ["'self'", "blob:", "https://cdnjs.cloudflare.com"],
  },
};

// Producción: CSP con unsafe-inline necesario para Vite builds y Radix UI
const prodCSP = {
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],
    styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
    fontSrc: ["'self'", "https://fonts.gstatic.com"],
    imgSrc: ["'self'", "data:", "blob:", "https:"],
    connectSrc: ["'self'", "wss:", "https://cdnjs.cloudflare.com"],
    frameSrc: ["'none'"],
    objectSrc: ["'none'"],
    mediaSrc: ["'self'", "blob:"],
    workerSrc: ["'self'", "blob:", "https://cdnjs.cloudflare.com"],
    upgradeInsecureRequests: process.env.NODE_ENV === "production" ? [] : undefined,
  },
};

export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: process.env.NODE_ENV === "production" ? prodCSP.directives : devCSP.directives,
  },
  // Prevenir clickjacking
  frameguard: { action: "deny" },
  // No enviar referrer a otros dominios
  referrerPolicy: { policy: "strict-origin-when-cross-origin" },
  // HSTS - forzar HTTPS (solo en producción)
  hsts: process.env.NODE_ENV === "production" ? {
    maxAge: 31536000, // 1 año
    includeSubDomains: true,
    preload: true,
  } : false,
  // Prevenir MIME sniffing
  noSniff: true,
  // Ocultar X-Powered-By
  hidePoweredBy: true,
  // XSS Filter (legacy browsers)
  xssFilter: true,
  // DNS Prefetch Control
  dnsPrefetchControl: { allow: false },
  // IE No Open
  ieNoOpen: true,
  // Permitted Cross-Domain Policies
  permittedCrossDomainPolicies: { permittedPolicies: "none" },
});

/**
 * Middleware para validar Content-Type en requests POST/PUT/PATCH
 */
export function validateContentType(req: Request, res: Response, next: NextFunction) {
  const methodsRequiringBody = ['POST', 'PUT', 'PATCH'];
  
  if (methodsRequiringBody.includes(req.method)) {
    const contentType = req.headers['content-type'];
    
    // Permitir multipart para uploads
    if (req.path.includes('/upload')) {
      if (!contentType?.includes('multipart/form-data')) {
        return res.status(415).json({ 
          message: "Content-Type debe ser multipart/form-data para uploads" 
        });
      }
      return next();
    }
    
    // Para otros endpoints, requerir JSON
    if (contentType && !contentType.includes('application/json')) {
      return res.status(415).json({ 
        message: "Content-Type debe ser application/json" 
      });
    }
  }
  
  next();
}

/**
 * Middleware para sanitizar headers peligrosos
 */
export function sanitizeHeaders(req: Request, res: Response, next: NextFunction) {
  // Eliminar headers potencialmente peligrosos
  delete req.headers['x-forwarded-host'];
  delete req.headers['x-original-url'];
  delete req.headers['x-rewrite-url'];
  
  next();
}

/**
 * Middleware para prevenir ataques de parámetros HTTP
 */
export function preventParameterPollution(req: Request, res: Response, next: NextFunction) {
  // Convertir arrays en query params a su último valor
  // Esto previene HTTP Parameter Pollution
  for (const key in req.query) {
    if (Array.isArray(req.query[key])) {
      const arr = req.query[key] as string[];
      req.query[key] = arr[arr.length - 1];
    }
  }
  
  next();
}

/**
 * Middleware para logging de seguridad
 */
export function securityLogger(req: Request, res: Response, next: NextFunction) {
  // Log de requests sospechosos
  const suspiciousPatterns = [
    /\.\.\//,           // Path traversal
    /<script/i,         // XSS attempt
    /UNION.*SELECT/i,   // SQL injection
    /javascript:/i,     // XSS via URL
    /data:text\/html/i, // Data URL XSS
  ];
  
  const fullUrl = req.originalUrl;
  const body = JSON.stringify(req.body || {});
  const combined = fullUrl + body;
  
  for (const pattern of suspiciousPatterns) {
    if (pattern.test(combined)) {
      console.warn(`[SECURITY] Suspicious request detected:`, {
        ip: req.ip,
        method: req.method,
        url: req.originalUrl,
        userAgent: req.headers['user-agent'],
        timestamp: new Date().toISOString(),
      });
      break;
    }
  }
  
  next();
}
