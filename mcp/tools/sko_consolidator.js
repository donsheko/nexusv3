import prisma from "@sko/prisma/lib/prisma.js";

export const definition = {
  name: "sko_consolidator",
  description: "Recopila la Spec completa y todos los StepSpec.sdr para consolidación.",
  inputSchema: {
    type: "object",
    properties: {
      specId: { type: "number", description: "ID de la Spec a consolidar." }
    },
    required: ["specId"]
  }
};

export async function handler(args) {
  const { specId } = args;

  try {
    // 1. Obtener la Spec completa con relaciones
    const spec = await prisma.spec.findUnique({
      where: { id: Number(specId) },
      include: {
        steps: {
          orderBy: { stepNumber: "asc" }
        },
        audits: {
          orderBy: { createdAt: "desc" }
        }
      }
    });

    if (!spec) {
      return {
        content: [{ type: "text", text: `Spec no encontrada: ${specId}` }],
        isError: true
      };
    }

    // 2. Armar respuesta
    const output = {
      spec: {
        id: spec.id,
        projectId: spec.projectId,
        title: spec.title,
        status: spec.status,
        stepsCount: spec.stepsCount,
        currentStep: spec.currentStep,
        percentage: spec.percentage,
        context: spec.context,
        createdAt: spec.createdAt,
        updatedAt: spec.updatedAt
      },
      steps: spec.steps.map((s) => ({
        id: s.id,
        stepNumber: s.stepNumber,
        title: s.title,
        status: s.status,
        meta: s.meta,
        context: s.context,
        sdr: s.sdr // Aprendizaje atómico del paso (Bitácora)
      })),
      audits: spec.audits.map((a) => ({
        id: a.id,
        title: a.title,
        issuesFound: a.issuesFound,
        fixPlan: a.fixPlan,
        fixed: a.fixed
      }))
    };

    return {
      content: [{ type: "text", text: JSON.stringify(output, null, 2) }]
    };
  } catch (error) {
    return {
      content: [{ type: "text", text: `Error en sko_consolidator: ${error.message}` }],
      isError: true
    };
  }
}
