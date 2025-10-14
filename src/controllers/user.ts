import "dotenv/config";
import type { Request, RequestHandler, Response } from "express";
import asyncHandler from "../middlewares/asyncHandler.js";
import { prisma } from "../config/db.js";
import bcrypt from "bcryptjs";
import { StatusCodes } from "http-status-codes";
import jwt from "jsonwebtoken";
import type { AuthenticatedRequest } from "../utils/types.js";
import { HttpError, TokenReuseError } from "../errors/error.js";

const accessTokenExpiresIn = "3m";
const refreshTokenExpiresIn = "10m";

interface IsignupData {
  userName: string;
  email: string;
  password: string;
}

export const userSignup: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const { userName, email, password }: IsignupData = req.body;

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const { password: _, ...newUser } = await prisma.user.create({
      data: { userName, email, password: hashedPassword },
    });

    return res.status(StatusCodes.CREATED).json({ user: newUser });
  }
);

interface ISigninData {
  email: string;
  password: string;
}

export const userSignin: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const { email, password }: ISigninData = req.body;

    const foundUser = await prisma.user.findUnique({ where: { email } });

    if (!foundUser)
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ message: "Invalid email or password" });

    const passwordValid = await bcrypt.compare(password, foundUser.password);

    if (!passwordValid)
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ message: "Invalid email or Password" });

    const { password: _, ...user } = foundUser;
    const accessToken = jwt.sign(
      { user: user },
      process.env.JWT_ACCESS_TOKEN_SECRET as string,
      { expiresIn: accessTokenExpiresIn }
    );
    const refreshToken = jwt.sign(
      { user: user },
      process.env.JWT_REFRESH_TOKEN_SECRET as string,
      { expiresIn: refreshTokenExpiresIn }
    );

    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: foundUser.id,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes from now
      },
    });

    res.cookie("refreshToken", refreshToken, {
      maxAge: 10 * 60 * 1000,
      secure: process.env.NODE_ENV === "production" ? true : false,
      sameSite: "lax",
      httpOnly: true,
    });

    return res.json({ accessToken, user });
  }
);

export const userSignout: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const refreshToken = req.cookies?.refreshToken;
    if (refreshToken) {
      await prisma.refreshToken.deleteMany({ where: { token: refreshToken } });
      res.clearCookie("refreshToken");
    }
    return res.json({ message: "Signed out successfully" });
  }
);

export const revokeRefreshToken: RequestHandler = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const refreshToken = req.cookies?.refreshToken;
    const user = req.user;

    if (!refreshToken) {
      throw new HttpError(StatusCodes.BAD_REQUEST, "No refresh token provided");
    }

    try {
      const refreshTokenDb = await prisma.refreshToken.update({
        where: { userId: user?.id as string, token: refreshToken },
        data: { invalidated: true },
      });
      res.clearCookie("refreshToken");
      return res.json({ message: "Refresh token revoked", refreshTokenDb });
    } catch (e) {
      throw new HttpError(StatusCodes.BAD_REQUEST, "No refresh token provided");
    }
  }
);
interface IPayloadType extends jwt.JwtPayload {
  user: {
    id: "f13c80d3-7905-48b7-9386-e24fb1efd8fd";
    email: "johannes@gmail.com";
    userName: "Johannes";
    createdAt: "2025-10-13T20:22:13.914Z";
    updatedAt: "2025-10-13T20:22:13.914Z";
  };
}
export const userRequestAccessToken: RequestHandler = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const refreshToken = req.cookies?.refreshToken;

    if (!refreshToken) {
      throw new HttpError(StatusCodes.BAD_REQUEST, "No refresh token provided");
    }

    const { user } = jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_TOKEN_SECRET as string
    ) as IPayloadType;

    const refreshTokenDb = await prisma.refreshToken.findFirst({
      where: { userId: user?.id as string, token: refreshToken },
      include: { user: true },
    });

    if (!refreshTokenDb) {
      // token not present in DB → invalid
      throw new HttpError(401, "Refresh token not found");
    }

    // If token was invalidated already -> reuse detection
    if (refreshTokenDb.invalidated) {
      // Revoke all user's refresh tokens as a response to reuse attack:
      await prisma.refreshToken.updateMany({
        where: { userId: refreshTokenDb.userId },
        data: { invalidated: true },
      });
      throw new TokenReuseError();
    }

    // If token expired according to DB
    if (refreshTokenDb.expiresAt <= new Date()) {
      // remove / invalidate
      await prisma.refreshToken.delete({ where: { id: refreshTokenDb.id } });
      throw new HttpError(401, "Refresh token expired");
    }

    const newAccessToken = jwt.sign(
      { user },
      process.env.JWT_ACCESS_TOKEN_SECRET as string,
      { expiresIn: accessTokenExpiresIn }
    );
    return res.json({ accessToken: newAccessToken, user });
  }
);
