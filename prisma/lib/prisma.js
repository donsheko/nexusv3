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

const dbUrl = process.env.DATABASE_URL || "mysql://sko_admin:sko_password@localhost:3320/sko_nexus";
const url = new URL(dbUrl);

const adapter = new PrismaMariaDb({
  host: url.hostname,
  port: parseInt(url.port) || 3306,
  user: decodeURIComponent(url.username),
  password: decodeURIComponent(url.password),
  database: url.pathname.replace(/^\//, ""),
  allowPublicKeyRetrieval: url.searchParams.get("allowPublicKeyRetrieval") === "true",
});

const prisma = new PrismaClient({ adapter });

export default prisma;
