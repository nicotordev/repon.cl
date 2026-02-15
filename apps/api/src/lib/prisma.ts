import { PrismaClient } from "./generated/prisma/client.js";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

function createPrismaClient() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  return new PrismaClient({
    log: ["query", "info", "warn", "error"],
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
