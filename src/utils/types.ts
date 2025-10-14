import jwt from "jsonwebtoken";
import type { Request } from "express";
import { prisma } from "../config/db.js";

export interface AuthenticatedRequest extends Request {
  user?: { id: string; email: string } | jwt.JwtPayload;
}
