import "dotenv/config";
import express, { type Request, type Response } from "express";
import morgan from "morgan";
import { userRouter } from "./routes/user.js";
import errorHandler, { notFound } from "./middlewares/errorHandler.js";
import cookieParser from "cookie-parser";
import { authMiddleware } from "./middlewares/authHandler.js";
import cors from "cors";

const app = express();
const port = process.env.PORT || 3550;

app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));
app.use(cookieParser());
app.use(
  cors({
    origin: [
      process.env.NODE_ENV
        ? (process.env.CORS_ALLOWED_ORIGIN as string)
        : "http://localhost:5173",
    ],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ status: 200, timestamp: new Date().toISOString() });
});

app.use("/api/auth", userRouter);
app.get("/api/validated", authMiddleware, (req: Request, res: Response) => {
  return res.json({ message: "AccessGranted" });
});

app.use(notFound);
app.use(errorHandler);

app.listen(port, () => {
  console.log(`SERVER RUNNING ON PORT ${port}`);
});
