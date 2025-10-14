import type { Request, Response, NextFunction, RequestHandler } from "express";

// Helper to wrap async route handlers so thrown errors/rejected promises are
// forwarded to Express error handlers via next(err).
export default function asyncHandler(
  fn: (req: Request, res: Response, next?: NextFunction) => Promise<any>
): RequestHandler {
  return function (req: Request, res: Response, next: NextFunction) {
    // Call the async function and forward any rejection to next()
    void fn(req, res, next).catch(next);
  };
}
