import prisma from "@sko/prisma/lib/prisma.js";
import { ProjectSchema } from "../../prisma/schemas/index.js";

export const definition = {
  name: "sko_project",
  description: "Gestiona el ADN de los proyectos (Stack y DevOps) en Sko-Nexus.",
  inputSchema: {
    type: "object",
    properties: {
      action: { type: "string", enum: ["get", "upsert", "delete"] },
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
        // 1. Buscar si ya existe por UUID o por el nombre actual (pasado en 'project')
        const existingProject = await prisma.project.findFirst({
          where: {
            OR: [
              { uuid: project },
              { name: project }
            ]
          }
        });

        let result;
        if (existingProject) {
          // 2. Si existe, actualizamos. 
          // Solo cambiamos el nombre si se pasó explícitamente y es diferente.
          result = await prisma.project.update({
            where: { uuid: existingProject.uuid },
            data: {
              name: name || existingProject.name,
              stack: stack || existingProject.stack,
              devops: devops || existingProject.devops
            }
          });
        } else {
          // 3. Si no existe, creamos uno nuevo.
          result = await prisma.project.create({
            data: {
              name: name || project,
              stack: stack || "Por definir",
              devops: devops || "Por definir"
            }
          });
        }
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      
      case "delete":
        const target = await prisma.project.findFirst({
          where: {
            OR: [{ uuid: project }, { name: project }]
          }
        });

        if (!target) {
          return { content: [{ type: "text", text: `Proyecto no encontrado: ${project}` }], isError: true };
        }

        await prisma.project.delete({
          where: { uuid: target.uuid }
        });

        return { content: [{ type: "text", text: `Proyecto '${target.name}' (ID: ${target.uuid}) eliminado exitosamente.` }] };

      default:
        return { content: [{ type: "text", text: `Acción no soportada: ${action}` }], isError: true };
    }
  } catch (error) {
    return { content: [{ type: "text", text: `Error en sko_project: ${error.message}` }], isError: true };
  }
}
