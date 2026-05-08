const prisma = require("../lib/prisma.js");
const {SpecSchema} = require("../../prisma/schemas/index.js");

/**
 * Actualiza los contadores y el porcentaje de una Spec basándose en sus Steps
 * Se exporta para que sko_step pueda invocarlo automáticamente al terminar un paso.
 */
async function syncSpecProgress(specId) {
  const steps = await prisma.stepSpec.findMany({
    where: {specId: Number(specId)},
  });

  const total = steps.length;
  if (total === 0) return;

  const completed = steps.filter((s) => s.status === "completed").length;
  const percentage = Math.round((completed / total) * 100);

  // Determinamos el status global basado en el progreso
  let status = "in_progress";
  if (percentage === 100) status = "completed";
  if (percentage === 0 && completed === 0) status = "pending";

  return await prisma.spec.update({
    where: {id: Number(specId)},
    data: {
      stepsCount: total,
      currentStep: completed,
      percentage: percentage,
      status: status,
    },
  });
}

module.exports = {
  definition: {
    name: "sko_spec",
    description:
      "Gestiona el ciclo de vida de una especificación (misión) en Sko-Nexus.",
    inputSchema: {
      type: "object",
      properties: {
        action: {
          type: "string",
          enum: ["start", "get", "update", "complete", "sync"],
        },
        id: {type: "number"},
        title: {type: "string"},
        projectId: {type: "string"},
        context: {type: "string"},
        percentage: {type: "number"},
        status: {type: "string"},
      },
      required: ["action"],
    },
  },
  handler: async (args) => {
    const validated = SpecSchema.parse(args);
    const {action, id} = validated;

    try {
      switch (action) {
        case "start":
          const newSpec = await prisma.spec.create({
            data: {
              title: validated.title,
              projectId: validated.projectId,
              context: validated.context,
              stepsCount: 0,
              currentStep: 0,
              percentage: 0,
              status: "pending",
            },
          });
          return {
            content: [{type: "text", text: JSON.stringify(newSpec, null, 2)}],
          };

        case "get":
          const spec = await prisma.spec.findUnique({
            where: {id: Number(id)},
            include: {project: true, steps: true},
          });
          return {
            content: [{type: "text", text: JSON.stringify(spec, null, 2)}],
          };

        case "update":
          const updatedSpec = await prisma.spec.update({
            where: {id: Number(id)},
            data: {
              title: validated.title,
              context: validated.context,
              status: validated.status,
              percentage: validated.percentage,
              updatedAt: new Date(),
            },
          });
          return {
            content: [
              {type: "text", text: JSON.stringify(updatedSpec, null, 2)},
            ],
          };

        case "complete":
          const completedSpec = await prisma.spec.update({
            where: {id: Number(id)},
            data: {
              status: "completed",
              percentage: 100,
            },
          });
          return {
            content: [
              {type: "text", text: JSON.stringify(completedSpec, null, 2)},
            ],
          };

        case "sync":
          const synced = await syncSpecProgress(id);
          return {
            content: [{type: "text", text: JSON.stringify(synced, null, 2)}],
          };

        default:
          return {
            content: [{type: "text", text: `Acción no soportada: ${action}`}],
            isError: true,
          };
      }
    } catch (error) {
      return {
        content: [{type: "text", text: `Error en sko_spec: ${error.message}`}],
        isError: true,
      };
    }
  },
  syncSpecProgress,
};
