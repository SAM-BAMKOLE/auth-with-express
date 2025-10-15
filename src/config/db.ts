// import { PrismaClient } from "../../prisma/generated/prisma/client.js";

// import { PrismaClient } from "@prisma/client";
// export const prisma = new PrismaClient();

import { PrismaClient } from "@prisma/client";
import { PrismaLibSQL } from "@prisma/adapter-libsql";

const adapter = new PrismaLibSQL({
  url: process.env.TURSO_DATABASE_URL as string,
  authToken: process.env.TURSO_AUTH_TOKEN as string,
});

export const prisma = new PrismaClient({ adapter });
