import prisma from "@sko/prisma/lib/prisma.js";
import { ProjectSchema } from "../../prisma/schemas/index.js";

export const definition = {
  name: "sko_project",
  description: "Gestiona el ADN de los proyectos (Stack y DevOps) en Sko-Nexus.",
  inputSchema: {
    type: "object",
    properties: {
      action: { type: "string", enum: ["get", "upsert"] },
      project: { type: "string", description: "ID único o nombre del proyecto." },
      name: { type: "string" },
      stack: { type: "string" },
      devops: { type: "string" }
    },
    required: ["action", "project"]
  }
};

export async function handler(args) {
  const validated = ProjectSchema.parse(args);
  const { action, project, name, stack, devops } = validated;

  try {
    switch (action) {
      case "get":
        const p = await prisma.project.findFirst({
          where: {
            OR: [{ uuid: project }, { name: project }]
          }
        });
        return { content: [{ type: "text", text: JSON.stringify(p, null, 2) }] };

      case "upsert":
        const upserted = await prisma.project.upsert({
          where: { name: name || project },
          update: {
            stack: stack,
            devops: devops,
          },
          create: {
            name: name || project,
            stack: stack,
            devops: devops,
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
