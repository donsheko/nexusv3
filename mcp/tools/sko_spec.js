import prisma from "@sko/prisma/lib/prisma.js";
import { SpecSchema } from "../../prisma/schemas/index.js";
import fs from "fs/promises";
import path from "path";
import { specMdToJsonParse } from "../helpers/specMdToJsonParse.js";

/**
 * Actualiza los contadores y el porcentaje de una Spec basándose en sus Steps
 */
export async function syncSpecProgress(specId) {
  const steps = await prisma.stepSpec.findMany({
    where: { specId: Number(specId) },
  });

  const total = steps.length;
  if (total === 0) return;

  const completed = steps.filter((s) => s.status.toLowerCase() === "completed").length;
  const percentage = Math.round((completed / total) * 100);

  let status = "IN_PROGRESS";
  if (percentage === 100) status = "COMPLETED";
  if (percentage === 0 && completed === 0) status = "PENDING";

  return await prisma.spec.update({
    where: { id: Number(specId) },
    data: {
      stepsCount: total,
      currentStep: completed,
      percentage: percentage,
      status: status,
    },
  });
}

export const definition = {
  name: "sko_spec",
  description: "Gestiona el ciclo de vida de una especificación (misión) en Sko-Nexus.",
  inputSchema: {
    type: "object",
    properties: {
      action: {
        type: "string",
        enum: ["start", "get", "update", "complete", "sync", "parse_spec", "delete"],
      },
      id: { type: "number" },
      filePath: { type: "string" },
      title: { type: "string" },
      projectId: { type: "string" },
      context: { type: "string" },
      percentage: { type: "number" },
      status: { type: "string" },
    },
    required: ["action"],
  },
};

export async function handler(args) {
  const validated = SpecSchema.parse(args);
  const { action, id } = validated;

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
            status: "PENDING",
          },
        });
        return {
          content: [{ type: "text", text: JSON.stringify(newSpec, null, 2) }],
        };

      case "get":
        const spec = await prisma.spec.findUnique({
          where: { id: Number(id) },
          include: { project: true, steps: true },
        });
        return {
          content: [{ type: "text", text: JSON.stringify(spec, null, 2) }],
        };

      case "update":
        const updatedSpec = await prisma.spec.update({
          where: { id: Number(id) },
          data: {
            title: validated.title,
            context: validated.context,
            status: validated.status ? validated.status.toUpperCase() : undefined,
            percentage: validated.percentage,
            updatedAt: new Date(),
          },
        });
        return {
          content: [{ type: "text", text: JSON.stringify(updatedSpec, null, 2) }],
        };

      case "complete":
        // Validación Hard-Lock: verificar que todos los pasos estén completados
        const allSteps = await prisma.stepSpec.findMany({
          where: { specId: Number(id) },
          select: { id: true, stepNumber: true, status: true },
        });

        const incompleteSteps = allSteps.filter((s) => s.status.toLowerCase() !== "completed");
        if (incompleteSteps.length > 0) {
          const detail = incompleteSteps
            .map((s) => `Paso #${s.stepNumber} (ID: ${s.id}): ${s.status}`)
            .join(", ");
          return {
            content: [
              {
                type: "text",
                text: `Hard-Lock: No se puede completar la Spec. Existen ${incompleteSteps.length} paso(s) sin completar: ${detail}. Usa sko_step (end) para cerrarlos primero.`,
              },
            ],
            isError: true,
          };
        }

        // Validación Hard-Lock: verificar que no haya auditorías pendientes
        const pendingAudits = await prisma.auditSpec.findMany({
          where: { specId: Number(id), fixed: false },
          select: { id: true, title: true },
        });

        if (pendingAudits.length > 0) {
          const detail = pendingAudits
            .map((a) => `Auditoría #${a.id}: "${a.title}"`)
            .join(", ");
          return {
            content: [
              {
                type: "text",
                text: `Hard-Lock: No se puede completar la Spec. Existen ${pendingAudits.length} auditoría(s) pendiente(s) de resolución: ${detail}. Usa sko_audit (fix) para resolverlas primero.`,
              },
            ],
            isError: true,
          };
        }

        // Validación Hard-Lock: verificar que exista un Summary vinculado
        const specForSummary = await prisma.spec.findUnique({
          where: { id: Number(id) },
          select: { projectId: true }
        });

        const existingSummary = await prisma.summary.findFirst({
          where: { projectId: specForSummary.projectId }
        });

        if (!existingSummary) {
          return {
            content: [
              {
                type: "text",
                text: `Hard-Lock: No se puede completar la Spec. No existe un Summary para el proyecto ${specForSummary.projectId}. Usa sko_sdr (consolidate) para generar un resumen primero.`
              }
            ],
            isError: true
          };
        }

        // Validación Hard-Lock: verificar que existan SdrCol vinculados
        const sdrCount = await prisma.sdrCol.count({
          where: { specId: Number(id) }
        });

        if (sdrCount === 0) {
          return {
            content: [
              {
                type: "text",
                text: `Hard-Lock: No se puede completar la Spec. No existen entradas SdrCol vinculadas a esta Spec (specId: ${id}). Debe haber al menos una entrada SDR antes del cierre global.`
              }
            ],
            isError: true
          };
        }

        const completedSpec = await prisma.spec.update({
          where: { id: Number(id) },
          data: {
            status: "COMPLETED",
            percentage: 100,
          },
        });
        return {
          content: [{ type: "text", text: JSON.stringify(completedSpec, null, 2) }],
        };

      case "parse_spec": {
        const { filePath } = validated;
        if (!filePath) return { content: [{ type: "text", text: "Error: Se requiere filePath." }], isError: true };

        // 0. Seguridad de Path
        const specsDir = path.join(process.cwd(), ".sko-specs");
        const absolutePath = path.isAbsolute(filePath) ? filePath : path.resolve(process.cwd(), filePath);
        if (!absolutePath.startsWith(specsDir)) {
           return { content: [{ type: "text", text: `Error: El path debe estar en .sko-specs/` }], isError: true };
        }

        // 1. Leer y Parsear Blueprint
        let fileContent;
        try {
          fileContent = await fs.readFile(absolutePath, "utf-8");
        } catch (e) {
          return { content: [{ type: "text", text: `Error: No se pudo leer ${absolutePath}` }], isError: true };
        }

        let blueprint;
        try {
          blueprint = await specMdToJsonParse(fileContent);
        } catch (e) {
          return { content: [{ type: "text", text: `Error de Formato: ${e.message}` }], isError: true };
        }

        const { projectId, title, context, steps } = blueprint;

        // 2. Validar Existencia del Proyecto
        const project = await prisma.project.findFirst({
          where: { OR: [{ uuid: projectId }, { name: projectId }] }
        });

        if (!project) {
          return { content: [{ type: "text", text: `Error: El Proyecto '${projectId}' no existe.` }], isError: true };
        }

        // 3. Persistencia en DB
        try {
          const result = await prisma.$transaction(async (tx) => {
            const newSpec = await tx.spec.create({
              data: {
                projectId: project.uuid,
                title,
                context,
                stepsCount: steps.length,
                currentStep: 0,
                percentage: 0,
                status: "IN_PROGRESS",
              }
            });

            const stepMap = new Map();
            const createdSteps = [];

            for (const s of steps.sort((a, b) => a.stepNumber - b.stepNumber)) {
              const step = await tx.stepSpec.create({
                data: {
                  specId: newSpec.id,
                  stepNumber: s.stepNumber,
                  title: s.title,
                  meta: s.meta,
                  context: s.context,
                  status: "PENDING",
                  dependsId: s.dependsOn ? stepMap.get(s.dependsOn) : null
                }
              });
              stepMap.set(s.stepNumber, step.id);
              createdSteps.push(step);
            }

            return { spec: newSpec, steps: createdSteps };
          });

          return {
            content: [{ 
              type: "text", 
              text: `✅ Blueprint procesado.\nSpec ID: ${result.spec.id}\nSteps creados: ${result.steps.length}\nProyecto: ${project.name}` 
            }]
          };
        } catch (error) {
           return { content: [{ type: "text", text: `Error DB: ${error.message}` }], isError: true };
        }
      }

      case "sync":
        const synced = await syncSpecProgress(id);
        return {
          content: [{ type: "text", text: JSON.stringify(synced, null, 2) }],
        };

      case "delete":
        if (!id) return { content: [{ type: "text", text: "Error: Se requiere ID para eliminar una Spec." }], isError: true };
        
        await prisma.spec.delete({
          where: { id: Number(id) }
        });
        
        return { content: [{ type: "text", text: `Spec #${id} eliminada exitosamente.` }] };

      default:
        return {
          content: [{ type: "text", text: `Acción no soportada: ${action}` }],
          isError: true,
        };
    }
  } catch (error) {
    return {
      content: [{ type: "text", text: `Error en sko_spec: ${error.message}` }],
      isError: true,
    };
  }
}
