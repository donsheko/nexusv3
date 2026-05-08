/**
 * Sko-Nexus Syncer (ESM)
 * ======================
 * Sincroniza Skills y Agentes desde assets/ a la base de datos.
 *
 * Ahora en ESM dentro de prisma/lib/ para centralización.
 */

import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import prisma from "./prisma.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Sincroniza las Skills desde assets/skills/
 */
async function syncSkillsInternal(providedPrisma) {
  const rootDir = path.resolve(__dirname, "../..");
  const skillsPath = path.join(rootDir, "assets", "skills");

  try {
    const db = providedPrisma || prisma;
    const folders = await fs.readdir(skillsPath);

    const fileResults = await Promise.allSettled(
      folders.map(async (folder) => {
        const folderPath = path.join(skillsPath, folder);
        const stats = await fs.stat(folderPath).catch(() => null);
        if (!stats || !stats.isDirectory()) return null;

        const items = await fs.readdir(folderPath);
        const skillFileName = items.find((f) => f === "SKILL.md") || items.find((f) => f.toLowerCase() === "skill.md");

        if (!skillFileName) return null;

        const skillFile = path.join(folderPath, skillFileName);
        const content = await fs.readFile(skillFile, "utf-8");
        return { name: folder, content };
      })
    );

    const diskSkills = fileResults
      .filter((r) => r.status === "fulfilled" && r.value !== null)
      .map((r) => r.value);

    // NOTA: Para v3, asegúrate de que el modelo 'Skill' exista en schema.prisma
    if (db.skill) {
      await Promise.all([
        ...diskSkills.map(s => db.skill.upsert({
          where: { name: s.name },
          update: { content: s.content },
          create: { name: s.name, content: s.content }
        }))
      ]);
    }

    return { success: true, count: diskSkills.length };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Sincroniza los Agentes desde assets/subagents/
 */
async function syncAgentsInternal(providedPrisma) {
  const rootDir = path.resolve(__dirname, "../..");
  const agentsPath = path.join(rootDir, "assets", "subagents");

  try {
    const db = providedPrisma || prisma;
    const items = await fs.readdir(agentsPath);
    const mdFiles = items.filter((f) => f.endsWith(".md"));

    const fileResults = await Promise.allSettled(
      mdFiles.map(async (file) => {
        const agentName = path.basename(file, ".md");
        const agentPath = path.join(agentsPath, file);
        const content = await fs.readFile(agentPath, "utf-8");
        return { name: agentName, content };
      })
    );

    const diskAgents = fileResults
      .filter((r) => r.status === "fulfilled")
      .map((r) => r.value);

    // NOTA: Para v3, asegúrate de que el modelo 'Agent' exista en schema.prisma
    if (db.agent) {
       await Promise.all([
        ...diskAgents.map(a => db.agent.upsert({
          where: { name: a.name },
          update: { content: a.content },
          create: { name: a.name, content: a.content }
        }))
      ]);
    }

    return { success: true, count: diskAgents.length };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export { syncSkillsInternal, syncAgentsInternal };
