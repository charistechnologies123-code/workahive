// lib/prisma.js
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

let prisma;

if (!global.prisma) {
  const connectionUrl = process.env.DATABASE_URL || process.env.DIRECT_URL;

  const pool = new Pool({
    connectionString: connectionUrl,
  });

  const adapter = new PrismaPg(pool, {
    schema: "public",
  });

  global.prisma = new PrismaClient({
    adapter,
  });
}

prisma = global.prisma;

export default prisma;