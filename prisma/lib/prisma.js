/**
 * Sko-Nexus Prisma Client (v7) — ESM
 * Singleton con adaptador MariaDB para Prisma v7 (query compiler engine)
 */

import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import * as mariadb from "mariadb";
import { PrismaClient } from "@prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, "../../.env") });

const pool = mariadb.createPool({
  uri: process.env.DATABASE_URL || "mysql://sko_admin:sko_password@localhost:3320/sko_nexus",
});

const adapter = new PrismaMariaDb(pool);
const prisma = new PrismaClient({ adapter });

export default prisma;
