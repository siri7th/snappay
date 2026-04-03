// src/middleware/validation.ts
import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';

export const validate = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    // Format errors for consistent response
    const formattedErrors = errors.array().map((err) => {
      // Safely extract field name (works with different express-validator versions)
      const field = (err as any).path || (err as any).param || 'unknown';
      return {
        field,
        message: err.msg,
      };
    });

    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: formattedErrors,
    });
  }

  // Explicitly return next() to satisfy TypeScript's "all code paths return a value"
  return next();
};