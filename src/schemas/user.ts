import { z } from "zod";

export const usersignupSchema = z.object({
  userName: z.string(),
  email: z.email(),
  password: z.string().min(5).max(32),
});

export const userSigninSchema = z.object({
  email: z.string(),
  password: z.string().min(5),
});
