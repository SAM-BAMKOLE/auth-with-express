import jwt from "jsonwebtoken";
import type { Request, Response, NextFunction } from "express";
import type { AuthenticatedRequest } from "../utils/types.js";
import { ReasonPhrases, StatusCodes } from "http-status-codes";

export async function authMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  // Verify Refresh Token still valid - User not logged out yet
  const refreshToken = req.cookies?.refreshToken;
  const tokenValid = jwt.verify(
    refreshToken,
    process.env.JWT_REFRESH_TOKEN_SECRET as string
  );
  if (!tokenValid) {
    return res
      .status(StatusCodes.UNAUTHORIZED)
      .json({ message: ReasonPhrases.UNAUTHORIZED });
  }

  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res
      .status(StatusCodes.UNAUTHORIZED)
      .json({ message: ReasonPhrases.UNAUTHORIZED });
  }

  //   const token = authHeader.split(" ")[1] as string;
  const token = authHeader.substring(7);

  const decoded = jwt.verify(
    token,
    process.env.JWT_ACCESS_TOKEN_SECRET as string
  ) as jwt.JwtPayload;
  req.user = decoded;
  next();
}
