const prisma = require("../lib/prisma.js");
const { ProjectSchema } = require("../../prisma/schemas/index.js");

module.exports = {
  definition: {
    name: "sko_project",
    description: "Gestiona el ADN (Stack y DevOps) de un proyecto en Sko-Nexus.",
    inputSchema: {
      type: "object",
      properties: {
        action: { type: "string", enum: ["get", "upsert"] },
        project: { type: "string", description: "UUID o Slug del proyecto." },
        name: { type: "string" },
        stack: { type: "string" },
        devops: { type: "string" }
      },
      required: ["action", "project"]
    }
  },
  handler: async (args) => {
    const validated = ProjectSchema.parse(args);
    const { action, project } = validated;

    try {
      switch (action) {
        case "get":
          const data = await prisma.project.findUnique({
            where: { uuid: project } // En v3 usamos uuid como PK principal
          });
          if (!data) {
            // Fallback para buscar por nombre si no es UUID
            const dataByName = await prisma.project.findUnique({
              where: { name: project }
            });
            return { content: [{ type: "text", text: JSON.stringify(dataByName || { error: "Proyecto no encontrado" }, null, 2) }] };
          }
          return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };

        case "upsert":
          const upserted = await prisma.project.upsert({
            where: { name: validated.name || project },
            update: {
              stack: validated.stack,
              devops: validated.devops
            },
            create: {
              name: validated.name || project,
              stack: validated.stack,
              devops: validated.devops
            }
          });
          return { content: [{ type: "text", text: JSON.stringify(upserted, null, 2) }] };

        default:
          return { content: [{ type: "text", text: `Acción no soportada: ${action}` }], isError: true };
      }
    } catch (error) {
      return { content: [{ type: "text", text: `Error en sko_project: ${error.message}` }], isError: true };
    }
  }
};
