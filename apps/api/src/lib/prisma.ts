import { PrismaClient } from "./generated/prisma/client.js";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

function createPrismaClient() {
  const enableVerbosePrismaLogs =
    process.env.PRISMA_LOG_QUERIES === "1" ||
    process.env.PRISMA_LOG_QUERIES === "true";

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  return new PrismaClient({
    log: enableVerbosePrismaLogs
      ? ["query", "info", "warn", "error"]
      : ["warn", "error"],
    adapter: new PrismaPg(pool),
  });
}

declare global {
  var prisma: ReturnType<typeof createPrismaClient>;
}

if (!global.prisma) {
  global.prisma = createPrismaClient();
}

const prisma = global.prisma;

export default prisma;
