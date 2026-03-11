import rateLimit from "express-rate-limit";

/**
 * Rate limiter para endpoints de autenticación
 * Más estricto para prevenir ataques de fuerza bruta
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // 5 intentos
  message: { 
    message: "Demasiados intentos de autenticación. Por favor, intenta de nuevo en 15 minutos.",
    retryAfter: 15 
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // No contar requests exitosos
  // Usa el keyGenerator por defecto basado en IP
});

/**
 * Rate limiter para registro de usuarios
 */
export const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 5, // 5 registros por hora por IP
  message: { 
    message: "Demasiados registros desde esta IP. Por favor, intenta más tarde.",
    retryAfter: 60 
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Rate limiter general para API
 */
export const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 100, // 100 requests por minuto
  message: { 
    message: "Demasiadas solicitudes. Por favor, reduce la frecuencia de tus peticiones.",
    retryAfter: 1 
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Rate limiter para búsquedas (más permisivo)
 */
export const searchLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 30, // 30 búsquedas por minuto
  message: { 
    message: "Demasiadas búsquedas. Por favor, espera un momento.",
    retryAfter: 1 
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Rate limiter para subida de archivos
 */
export const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 20, // 20 subidas por hora
  message: { 
    message: "Has subido demasiados archivos. Por favor, intenta más tarde.",
    retryAfter: 60 
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Rate limiter para reset de contraseña
 */
export const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 3, // 3 intentos por hora
  message: { 
    message: "Demasiadas solicitudes de recuperación de contraseña. Intenta en 1 hora.",
    retryAfter: 60 
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Rate limiter para el foro (posts y comentarios)
 */
export const forumLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 10, // 10 posts/comentarios por minuto
  message: { 
    message: "Estás publicando muy rápido. Por favor, espera un momento.",
    retryAfter: 1 
  },
  standardHeaders: true,
  legacyHeaders: false,
});
