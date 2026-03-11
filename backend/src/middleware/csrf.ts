import csrf from "csurf";
import { Request, Response, NextFunction, Express } from "express";

/**
 * CSRF Protection Middleware
 */
const csrfProtection = csrf({ cookie: false });

/**
 * Apply CSRF protection to Express app
 * Configure this before route handlers
 */
export function configureCSRFProtection(app: Express): void {
  app.use(csrfProtection);

  // Provide CSRF token to frontend via GET requests
  app.get("/api/csrf-token", (req: Request, res: Response) => {
    res.json({ csrfToken: req.csrfToken() });
  });

  // Error handler for CSRF token errors
  app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    if (err.code === "EBADCSRFTOKEN") {
      // CSRF token errors
      res.status(403).json({
        message: "Invalid CSRF token. Please refresh and try again.",
      });
    } else {
      next(err);
    }
  });
}

/**
 * Middleware to ensure CSRF token is valid for state-changing operations
 * Use on POST, PUT, DELETE, PATCH routes
 */
export function csrfMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // csrfProtection already validates; this is just explicit
  next();
}

export { csrfProtection };
