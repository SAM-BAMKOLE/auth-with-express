import type { NextFunction, Request, Response } from "express";

type ErrorResponse = {
  status: string;
  message: string;
  details?: any;
};

export function notFound(req: Request, res: Response, next: NextFunction) {
  const err: any = new Error("Not Found");
  err.statusCode = 404;
  next(err); // => triggers your errorHandler
}

// A basic error handler that maps known error shapes to HTTP status codes
export default function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) {
  // Default response
  let statusCode = 500;
  const response: ErrorResponse = {
    status: "error",
    message: "Internal Server Error",
  };

  // Handle known error types
  // Express-validator errors (array or object)
  if (err && err.errors && Array.isArray(err.errors)) {
    statusCode = 400;
    response.message = "Validation failed";
    response.details = err.errors.map((e: any) => ({
      msg: e.msg,
      param: e.param,
    }));
  }

  // Custom error with statusCode and message
  else if (err && typeof err.statusCode === "number") {
    statusCode = err.statusCode;
    response.message = err.message || response.message;
    if (err.details) response.details = err.details;
  }

  // Prisma known request error
  else if (err && err.name === "PrismaClientKnownRequestError") {
    // map some common Prisma error codes
    if (err.code === "P2002") {
      statusCode = 409;
      response.message = "Unique constraint failed";
      response.details = err.meta;
    } else {
      statusCode = 400;
      response.message = err.message || "Database error";
    }
  }

  // JWT errors from jsonwebtoken
  else if (
    err &&
    (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError")
  ) {
    statusCode = 401;
    response.message = err.message || "Invalid or expired token";
  }

  // If an explicit message was provided on the error, use it for non-500s
  else if (err && err.message && statusCode !== 500) {
    response.message = err.message;
  }

  // Log the error server-side (avoid leaking to clients)
  // In production you might send this to a centralized logger
  // Keep console.error for simple local debugging
  console.error(err);

  // In non-production include stack and the original error when helpful
  if (process.env.NODE_ENV !== "production") {
    (response as any).stack = err?.stack;
    (response as any).error = err;
  }

  console.log("Error handled:", statusCode, response.message);
  return res.status(statusCode).json(response);
}
