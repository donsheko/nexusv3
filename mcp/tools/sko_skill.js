import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import prisma from "@sko/prisma/lib/prisma.js";
import { SkillSchema } from "../../prisma/schemas/index.js";
import { syncSkillsInternal } from "../../prisma/lib/sync.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const definition = {
  name: "sko_skill",
  description: "Gestiona el Arsenal de Skills de Sko-Nexus.",
  inputSchema: {
    type: "object",
    properties: {
      action: { type: "string", enum: ["get", "search", "list", "sync", "add"] },
      name: { type: "string", description: "Nombre de la skill (slug)." },
      query: { type: "string", description: "Término de búsqueda para filtrar skills." },
      content: { type: "string", description: "Contenido Markdown de la skill (para 'add')." }
    },
    required: ["action"]
  }
};

export async function handler(args) {
  const validated = SkillSchema.parse(args);
  const { action, name, query, content } = validated;

  // Obtener ruta base del proyecto
  let rootDir;
  try {
    const localConfigPath = path.join(__dirname, "../../agents_local.json");
    if (fs.existsSync(localConfigPath)) {
      const config = JSON.parse(fs.readFileSync(localConfigPath, "utf-8"));
      rootDir = config.installPath;
    }
  } catch (e) {
    // Fallback a resolución por __dirname
    rootDir = path.resolve(__dirname, "../..");
  }
  if (!rootDir) rootDir = path.resolve(__dirname, "../..");

  const skillsDir = path.join(rootDir, "assets", "skills");

  try {
    switch (action) {
      case "list":
        const allSkills = await prisma.skill.findMany({
          select: { name: true, topic: true, stack: true }
        });
        return { content: [{ type: "text", text: JSON.stringify(allSkills, null, 2) }] };

      case "get":
        if (!name) return { content: [{ type: "text", text: "Error: El nombre es requerido para 'get'" }], isError: true };
        const skill = await prisma.skill.findUnique({
          where: { name }
        });
        if (!skill) return { content: [{ type: "text", text: `Skill no encontrada: ${name}` }], isError: true };
        return { content: [{ type: "text", text: JSON.stringify(skill, null, 2) }] };

      case "search":
        if (!query) return { content: [{ type: "text", text: "Error: El query es requerido para 'search'" }], isError: true };
        const foundSkills = await prisma.skill.findMany({
          where: {
            OR: [
              { name: { contains: query } },
              { content: { contains: query } }
            ]
          },
          select: { name: true, content: false } 
        });
        return { content: [{ type: "text", text: JSON.stringify(foundSkills, null, 2) }] };

      case "add":
        if (!name || !content) {
          return { content: [{ type: "text", text: "Error: 'name' y 'content' son requeridos para 'add'" }], isError: true };
        }
        
        const skillFolderPath = path.join(skillsDir, name);
        const skillFilePath = path.join(skillFolderPath, "SKILL.md");

        // 1. Persistencia en disco
        if (!fs.existsSync(skillFolderPath)) {
          fs.mkdirSync(skillFolderPath, { recursive: true });
        }
        fs.writeFileSync(skillFilePath, content, "utf-8");

        // 2. Persistencia en DB
        const newSkill = await prisma.skill.upsert({
          where: { name },
          update: { content },
          create: { name, content }
        });

        return { 
          content: [{ 
            type: "text", 
            text: `Skill '${name}' guardada exitosamente.\nArchivo: ${skillFilePath}\nDB ID: ${newSkill.id}` 
          }] 
        };

      case "sync":
        const syncResult = await syncSkillsInternal(prisma);
        return { content: [{ type: "text", text: JSON.stringify(syncResult, null, 2) }] };

      default:
        return { content: [{ type: "text", text: `Acción no soportada: ${action}` }], isError: true };
    }
  } catch (error) {
    return { content: [{ type: "text", text: `Error en sko_skill: ${error.message}` }], isError: true };
  }
}
