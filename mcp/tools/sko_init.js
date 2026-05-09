import prisma from "@sko/prisma/lib/prisma.js";

export const definition = {
  name: "sko_init",
  description: "Carga el contexto inicial del proyecto (ADN y último resumen).",
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
    const p = await prisma.project.findFirst({
      where: {
        OR: [{ uuid: project }, { name: project }]
      },
      include: {
        memories: {
          where: { type: "summary" },
          orderBy: { updatedAt: "desc" },
          take: 1
        }
      }
    });

    if (!p) {
      return { content: [{ type: "text", text: `Proyecto "${project}" no encontrado en la base de datos.` }] };
    }

    const summary = p.memories[0]?.content || "No hay resumen de sesión previa.";

    const output = `
--- CONTEXTO DE INICIO RÁPIDO (${p.name}) ---
🧬 ADN: ${p.stack || "No definido"}
ÚLTIMO RESUMEN: ${summary}
    `;

    return { content: [{ type: "text", text: output }] };
  } catch (error) {
    return { content: [{ type: "text", text: `Error en sko_init: ${error.message}` }], isError: true };
  }
}
