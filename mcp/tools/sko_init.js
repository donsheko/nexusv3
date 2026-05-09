import prisma from "@sko/prisma/lib/prisma.js";

export const definition = {
  name: "sko_init",
  description: "Carga el contexto inicial del proyecto (ADN y último resumen narrativo).",
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
        summaries: {
          orderBy: { updatedAt: "desc" },
          take: 1
        }
      }
    });

    if (!p) {
      return {
        content: [{ type: "text", text: `Proyecto "${project}" no encontrado en la base de datos.` }]
      };
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
      // sdrIds se omite intencionalmente (metadato técnico oculto)
    }

    const output = `--- CONTEXTO DE INICIO RÁPIDO (${p.name}) ---
🧬 ADN: ${adn}

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
