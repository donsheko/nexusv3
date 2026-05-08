const prisma = require("../lib/prisma.js");

module.exports = {
  definition: {
    name: "sko_sdr",
    description: "Gestiona la Bitácora de Sabiduría Consolidada (SDR_COL).",
    inputSchema: {
      type: "object",
      properties: {
        action: { type: "string", enum: ["add", "search"] },
        project: { type: "string", description: "UUID del proyecto." },
        specId: { type: "number" },
        query: { type: "string", description: "Término de búsqueda para search." },
        content: { type: "string", description: "JSON string con la sabiduría consolidada para add." }
      },
      required: ["action", "project"]
    }
  },
  handler: async (args) => {
    const { action, project, specId, query, content } = args;

    try {
      switch (action) {
        case "add":
          const data = JSON.parse(content);
          const newSdr = await prisma.sdrCol.create({
            data: {
              projectId: project,
              specId: Number(specId),
              quePaso: data.que_paso,
              queSenti: data.que_senti,
              queAprendi: data.que_aprendi,
              queQuieroLograr: data.que_quiero_lograr,
              quePresupongo: data.que_presupongo,
              conceptosClave: data.conceptos_clave,
              ejemplos: data.ejemplos,
              contraejemplos: data.contraejemplos,
              dudasPendientes: data.dudas_pendientes
            }
          });
          return { content: [{ type: "text", text: `Sabiduría consolidada registrada (ID: ${newSdr.id})` }] };

        case "search":
          // Búsqueda Full-Text en los campos definidos en el esquema
          const results = await prisma.sdrCol.findMany({
            where: {
              projectId: project,
              OR: [
                { quePaso: { contains: query } },
                { queAprendi: { contains: query } },
                { conceptosClave: { contains: query } }
              ]
            },
            take: 5,
            orderBy: { createdAt: "desc" }
          });
          return { content: [{ type: "text", text: JSON.stringify(results, null, 2) }] };

        default:
          return { content: [{ type: "text", text: `Acción no soportada: ${action}` }], isError: true };
      }
    } catch (error) {
      return { content: [{ type: "text", text: `Error en sko_sdr: ${error.message}` }], isError: true };
    }
  }
};
