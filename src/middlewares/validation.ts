import type { Request, Response, NextFunction } from "express";
import { z, ZodError } from "zod";

import { StatusCodes, ReasonPhrases } from "http-status-codes";

export function validation(schema: z.ZodObject<any, any>) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errorMessages = error.issues.map((issue) => ({
          message: `${issue.path.join(".")} is ${issue.message}`,
        }));
        return res
          .status(StatusCodes.BAD_REQUEST)
          .json({ message: "Invalid data", details: errorMessages });
      } else {
        return res
          .status(StatusCodes.INTERNAL_SERVER_ERROR)
          .json({ message: ReasonPhrases.INTERNAL_SERVER_ERROR });
      }
    }
  };
}
