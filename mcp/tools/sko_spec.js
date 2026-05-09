import prisma from "@sko/prisma/lib/prisma.js";
import { SpecSchema } from "../../prisma/schemas/index.js";
import fs from "fs/promises";
import path from "path";

/**
 * Actualiza los contadores y el porcentaje de una Spec basándose en sus Steps
 */
export async function syncSpecProgress(specId) {
  const steps = await prisma.stepSpec.findMany({
    where: { specId: Number(specId) },
  });

  const total = steps.length;
  if (total === 0) return;

  const completed = steps.filter((s) => s.status === "completed").length;
  const percentage = Math.round((completed / total) * 100);

  let status = "in_progress";
  if (percentage === 100) status = "completed";
  if (percentage === 0 && completed === 0) status = "pending";

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
        enum: ["start", "get", "update", "complete", "sync", "parse_spec"],
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
            status: "pending",
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
            status: validated.status,
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

        const incompleteSteps = allSteps.filter((s) => s.status !== "completed");
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
            status: "completed",
            percentage: 100,
          },
        });
        return {
          content: [{ type: "text", text: JSON.stringify(completedSpec, null, 2) }],
        };

      case "parse_spec": {
        const { filePath } = validated;
        if (!filePath) {
          return { content: [{ type: "text", text: "Error: Se requiere filePath para parse_spec." }], isError: true };
        }

        const absolutePath = path.isAbsolute(filePath) ? filePath : path.join(process.cwd(), filePath);
        const fileContent = await fs.readFile(absolutePath, "utf-8");

        // 1. Parsear Header
        const specMatch = fileContent.match(/\[SPEC_HEADER\]([\s\S]*?)(?=---|\n##)/);
        if (!specMatch) throw new Error("No se encontró el bloque [SPEC_HEADER]");
        
        const headerText = specMatch[1];
        const projectId = headerText.match(/PROJECT_ID\*\*:\s*([^\n]+)/)?.[1]?.trim();
        const title = headerText.match(/TITLE\*\*:\s*([^\n]+)/)?.[1]?.trim();
        const contextMatch = headerText.match(/CONTEXT\*\*:\s*\n?>([\s\S]*)/);
        const context = contextMatch ? contextMatch[1].trim() : "";

        if (!projectId || !title) throw new Error("PROJECT_ID y TITLE son obligatorios en el Blueprint.");

        // 2. Parsear Steps
        const stepsData = [];
        const stepBlocks = fileContent.split("### [STEP:").slice(1);
        
        for (const block of stepBlocks) {
          const stepNumber = parseInt(block.split("]")[0]);
          const sTitle = block.match(/- \*\*TITLE\*\*:\s*([^\n]+)/)?.[1]?.trim();
          const sDependsOnStr = block.match(/- \*\*DEPENDS_ON\*\*:\s*([^\n]+)/)?.[1]?.trim();
          const sDependsOn = (sDependsOnStr && sDependsOnStr !== "null") ? parseInt(sDependsOnStr) : null;
          
          const sContextMatch = block.match(/- \*\*CONTEXT\*\*:\s*\n?>([\s\S]*?)(?=- \*\*META\*\*|$)/);
          const sMetaMatch = block.match(/- \*\*META\*\*:\s*\n?>([\s\S]*?)(?=---|$)/);
          
          stepsData.push({
            stepNumber,
            title: sTitle || `Paso ${stepNumber}`,
            dependsOn: sDependsOn,
            context: sContextMatch ? sContextMatch[1].trim() : "",
            meta: sMetaMatch ? sMetaMatch[1].trim() : ""
          });
        }

        // 3. Inserción en DB (Transacción)
        const result = await prisma.$transaction(async (tx) => {
          const newSpec = await tx.spec.create({
            data: {
              projectId,
              title,
              context,
              stepsCount: stepsData.length,
              currentStep: 0,
              percentage: 0,
              status: "in_progress",
            }
          });

          const createdSteps = [];
          const stepMap = new Map(); // stepNumber -> id real

          for (const s of stepsData) {
            const dependsId = s.dependsOn ? stepMap.get(s.dependsOn) : null;
            const step = await tx.stepSpec.create({
              data: {
                specId: newSpec.id,
                stepNumber: s.stepNumber,
                title: s.title,
                meta: s.meta,
                context: s.context,
                status: "pending",
                dependsId: dependsId || null
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
            text: `✅ Blueprint procesado exitosamente.\nSpec ID: ${result.spec.id}\nSteps creados: ${result.steps.length}\n\nDatos para delegación:\n${JSON.stringify(result, null, 2)}` 
          }]
        };
      }

      case "sync":
        const synced = await syncSpecProgress(id);
        return {
          content: [{ type: "text", text: JSON.stringify(synced, null, 2) }],
        };

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
