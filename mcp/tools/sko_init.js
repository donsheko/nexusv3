const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

module.exports = {
  definition: {
    name: "sko_init",
    description: "Inicializa el contexto del agente detectando el proyecto y las misiones activas.",
    inputSchema: {
      type: "object",
      properties: {
        path: { type: "string", description: "Ruta absoluta del proyecto actual." }
      },
      required: ["path"]
    }
  },
  handler: async (args) => {
    const { path: projectPath } = args;
    const projectName = projectPath.split("/").pop().toLowerCase();

    try {
      // 1. Buscar el ADN del proyecto
      const project = await prisma.project.findUnique({
        where: { name: projectName },
        include: { specs: { where: { status: { in: ["pending", "in_progress"] } }, take: 3 } }
      });

      if (!project) {
        return {
          content: [{ 
            type: "text", 
            text: `⚠️ No se encontró ADN para el proyecto '${projectName}'. Es necesario ejecutar /handle-adn.` 
          }]
        };
      }

      // 2. Construir el resumen de inicio
      const summary = {
        identity: "Vesper (Sko-Nexus OS v3)",
        project: {
          name: project.name,
          uuid: project.uuid,
          stack: project.stack,
          devops: project.devops
        },
        activeMissions: project.specs.map(s => ({
          id: s.id,
          title: s.title,
          progress: `${s.percentage}%`,
          status: s.status
        }))
      };

      return {
        content: [{ 
          type: "text", 
          text: `--- CONTEXTO SKO-NEXUS INICIALIZADO ---\n${JSON.stringify(summary, null, 2)}` 
        }]
      };

    } catch (error) {
      return {
        content: [{ type: "text", text: `Error en sko_init: ${error.message}` }],
        isError: true
      };
    }
  }
};
