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
  const rootDir = path.basename(process.cwd());

  try {
    // 1. Validar que el proyecto coincida con el nombre del directorio (Estándar de Identidad)
    if (project !== rootDir) {
      const suggestions = [
        `1. ${rootDir} (Nombre del directorio raíz - RECOMENDADO)`,
        `2. ${project} (Nombre proporcionado)`,
        `5. Otro (Especificar manualmente)`
      ];
      
      return {
        content: [
          {
            type: "text",
            text: `❓ Error de Identidad: El nombre del proyecto '${project}' no coincide con el directorio raíz '${rootDir}'.\n\nPor favor, elige el nombre correcto:\n${suggestions.join("\n")}`
          }
        ],
        isError: true
      };
    }

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

    // 2. ADN: Validar existencia obligatoria
    const hasAdn = p.stack && p.stack !== "Por definir" && p.devops && p.devops !== "Por definir";
    
    if (!hasAdn) {
      const adnError = `🚨 ADN NO DETECTADO: El proyecto '${p.name}' no tiene una genética técnica registrada.\n\nEs OBLIGATORIO ejecutar el comando /handle-adn antes de proceder con cualquier otra acción de orquestación.`;
      return {
        content: [{ type: "text", text: adnError }],
        isError: true
      };
    }

    const adn = `${p.stack}\nDevOps: ${p.devops}`;

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
