import prisma from "@sko/prisma/lib/prisma.js";

export const definition = {
  name: "sko_memory",
  description: "Gestiona la Sabiduría Atómica y el Índice de Sabiduría del proyecto (Bajo Demanda).",
  inputSchema: {
    type: "object",
    properties: {
      action: { type: "string", enum: ["commit", "search", "summary", "delete"] },
      project: { type: "string", description: "UUID del proyecto." },
      type: { type: "string", enum: ["decision", "insight", "preference", "summary"], description: "Tipo de memoria." },
      query: { type: "string", description: "Término de búsqueda Full-Text." },
      content: { type: "string", description: "Contenido de la memoria o resumen." },
      tags: { type: "string", description: "Etiquetas separadas por comas." },
      sdrId: { type: "number", description: "Vínculo opcional a una bitácora SDR profunda." },
      id: { type: "string", description: "ID de la memoria para acciones específicas." }
    },
    required: ["action", "project"]
  }
};

export async function handler(args) {
  const { action, project, type, query, content, tags, sdrId, id } = args;

  try {
    switch (action) {
      case "commit":
        const newMemory = await prisma.memory.create({
          data: {
            projectId: project,
            type: type || "insight",
            content,
            tags,
            sdrId: sdrId ? Number(sdrId) : null
          }
        });
        return { content: [{ type: "text", text: `Memoria atómica registrada (ID: ${newMemory.id})` }] };

      case "search":
        const results = await prisma.memory.findMany({
          where: {
            projectId: project,
            OR: [
              { content: { contains: query } },
              { tags: { contains: query } }
            ]
          },
          take: 10,
          orderBy: { updatedAt: "desc" }
        });
        return { content: [{ type: "text", text: JSON.stringify(results, null, 2) }] };

      case "summary":
        const sessionSummary = await prisma.memory.upsert({
          where: { id: id || "global-summary-placeholder" },
          update: { content, updatedAt: new Date() },
          create: {
            projectId: project,
            type: "summary",
            content,
            tags: "session_summary"
          }
        });
        return { content: [{ type: "text", text: `Resumen de sesión actualizado.` }] };

      case "delete":
        await prisma.memory.delete({ where: { id } });
        return { content: [{ type: "text", text: `Memoria eliminada.` }] };

      default:
        return { content: [{ type: "text", text: `Acción no soportada: ${action}` }], isError: true };
    }
  } catch (error) {
    return { content: [{ type: "text", text: `Error en sko_memory: ${error.message}` }], isError: true };
  }
}
