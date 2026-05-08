/**
 * Sko-Nexus Prisma Client (v7)
 * Singleton con adaptador MariaDB para Prisma v7 (query compiler engine)
 */

require("dotenv").config({path: require("path").join(__dirname, "../../.env")});
const mariadb = require("mariadb");
const {PrismaClient} = require("@prisma/client");
const {PrismaMariaDb} = require("@prisma/adapter-mariadb");

const pool = mariadb.createPool({
  uri: process.env.DATABASE_URL || "mysql://sko_admin:sko_password@localhost:3320/sko_nexus",
});

const adapter = new PrismaMariaDb(pool);
const prisma = new PrismaClient({adapter});

module.exports = prisma;
