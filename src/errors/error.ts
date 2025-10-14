export class HttpError extends Error {
  statusCode: number;
  details?: any;
  constructor(statusCode: number, message: string, details?: any) {
    super(message);
    this.name = "HttpError";
    this.statusCode = statusCode;
    this.details = details;
  }
}

export class TokenReuseError extends HttpError {
  constructor(message = "Refresh token reuse detected") {
    super(401, message);
    this.name = "TokenReuseError";
  }
}

export class NotFoundError extends HttpError {
  constructor(message = "Resource not found") {
    super(404, message);
    this.name = "NotFoundError";
  }
}

export class ValidationError extends HttpError {
  constructor(message = "Validation failed", details?: any) {
    super(400, message, details);
    this.name = "ValidationError";
  }
}
