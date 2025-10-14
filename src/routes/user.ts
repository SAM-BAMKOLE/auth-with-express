import { Router } from "express";

import type { Router as ExpressRouter } from "express";
import { validation } from "../middlewares/validation.js";
import { userSigninSchema, usersignupSchema } from "../schemas/user.js";
import {
  revokeRefreshToken,
  userRequestAccessToken,
  userSignin,
  userSignout,
  userSignup,
} from "../controllers/user.js";
const router: ExpressRouter = Router();

router.post("/signup", validation(usersignupSchema), userSignup);
router.post("/signin", validation(userSigninSchema), userSignin);
router.post("/signout", userSignout);
router.post("/access-token/new", userRequestAccessToken);
router.post("/refresh-token/revoke", revokeRefreshToken);

export { router as userRouter };
