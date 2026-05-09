import prisma from "@sko/prisma/lib/prisma.js";

export const definition = {
  name: "sko_sdr",
  description: "Acceso a la Bitácora de Sabiduría Profunda (SDR) de Sko-Nexus.",
  inputSchema: {
    type: "object",
    properties: {
      action: { type: "string", enum: ["search", "add"] },
      project: { type: "string" },
      query: { type: "string" },
      data: { type: "object", description: "Campos del SDR (quePaso, queAprendi, etc.)" }
    },
    required: ["action", "project"]
  }
};

export async function handler(args) {
  const { action, project, query, data } = args;

  try {
    switch (action) {
      case "search":
        const results = await prisma.sdrCol.findMany({
          where: {
            projectId: project,
            OR: [
              { quePaso: { contains: query } },
              { queAprendi: { contains: query } },
              { conceptosClave: { contains: query } }
            ]
          },
          take: 5
        });
        return { content: [{ type: "text", text: JSON.stringify(results, null, 2) }] };

      case "add":
        const newEntry = await prisma.sdrCol.create({
          data: {
            projectId: project,
            ...data
          }
        });
        return { content: [{ type: "text", text: `Entrada SDR creada: ${newEntry.id}` }] };

      default:
        return { content: [{ type: "text", text: `Acción no soportada: ${action}` }], isError: true };
    }
  } catch (error) {
    return { content: [{ type: "text", text: `Error en sko_sdr: ${error.message}` }], isError: true };
  }
}
