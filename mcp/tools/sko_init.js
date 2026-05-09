import prisma from "@sko/prisma/lib/prisma.js";
import fs from "fs/promises";
import path from "path";

export const definition = {
  name: "sko_init",
  description: "Carga el contexto inicial del proyecto (ADN y último resumen narrativo). Asegura la existencia de .sko-specs.",
  inputSchema: {
    type: "object",
    properties: {
      project: { type: "string", description: "Nombre o ID del proyecto." }
    },
    required: ["project"]
  }
};

export async function handler(args) {
  const { project } = args;

  try {
    let p = await prisma.project.findFirst({
      where: {
        OR: [{ uuid: project }, { name: project }]
      },
      include: {
        summaries: {
          orderBy: { updatedAt: "desc" },
          take: 1
        }
      }
    });

    if (!p) {
      // Mandarlo a crear si no existe (ADN inicial vacío)
      p = await prisma.project.create({
        data: {
          name: project,
          stack: "Por definir",
          devops: "Por definir"
        },
        include: { summaries: true }
      });
    }

    // Asegurar carpeta .sko-specs
    const specsDir = path.join(process.cwd(), ".sko-specs");
    try {
      await fs.access(specsDir);
    } catch {
      await fs.mkdir(specsDir, { recursive: true });
    }

    // ADN: stack + devops
    let adn = p.stack || "No definido";
    if (p.devops) {
      adn += `\nDevOps: ${p.devops}`;
    }

    // Último Summary narrativo (ocultar sdrIds)
    const lastSummary = p.summaries[0];
    let narrativo = "No hay resumen de sesión previa.";
    if (lastSummary) {
      narrativo = lastSummary.content;
      if (lastSummary.tags) {
        narrativo += `\nTags: ${lastSummary.tags}`;
      }
    }

    const output = `--- CONTEXTO DE INICIO RÁPIDO (${p.name}) ---
🧬 ADN: ${adn}
📂 Carpeta .sko-specs verificada/creada.

📝 ÚLTIMO RESUMEN:
${narrativo}`;

    return { content: [{ type: "text", text: output }] };
  } catch (error) {
    return {
      content: [{ type: "text", text: `Error en sko_init: ${error.message}` }],
      isError: true
    };
  }
}
