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

        // 0. Validación de Path (Seguridad)
        const specsDir = path.join(process.cwd(), ".sko-specs");
        const absolutePath = path.isAbsolute(filePath) ? filePath : path.resolve(process.cwd(), filePath);
        
        if (!absolutePath.startsWith(specsDir)) {
           return { 
             content: [{ type: "text", text: `Error de Seguridad: El filePath debe estar contenido exclusivamente en '.sko-specs/'. Recibido: ${filePath}` }], 
             isError: true 
           };
        }

        let fileContent;
        try {
          fileContent = await fs.readFile(absolutePath, "utf-8");
        } catch (e) {
          return { content: [{ type: "text", text: `Error: No se pudo leer el archivo en ${absolutePath}. Asegúrate de que exista.` }], isError: true };
        }

        // 1. Parsear Header con Regex Robustas
        const specHeaderMatch = fileContent.match(/\[SPEC_HEADER\]([\s\S]*?)(?=---|\n##|###)/i);
        if (!specHeaderMatch) {
          return { content: [{ type: "text", text: "Error de Formato: No se encontró el bloque obligatorio [SPEC_HEADER]." }], isError: true };
        }
        
        const headerText = specHeaderMatch[1];
        
        const getField = (text, field) => {
          const regex = new RegExp(`${field}(?:\\*\\*|)\\s*:\\s*([^\\n>]+)`, "i");
          return text.match(regex)?.[1]?.trim();
        };

        const getBlockquote = (text, field) => {
          const regex = new RegExp(`${field}(?:\\*\\*|)\\s*:\\s*\\n?\\s*>([\\s\\S]*?)(?=\\n\\s*-|\\n\\s*#|---|$|###)`, "i");
          const match = text.match(regex);
          if (!match) return "";
          return match[1]
            .split("\n")
            .map(line => line.trim().replace(/^>\s?/, ""))
            .join("\n")
            .trim();
        };

        let projectId = getField(headerText, "PROJECT_ID");
        const title = getField(headerText, "TITLE");
        const context = getBlockquote(headerText, "CONTEXT");

        if (!projectId || !title) {
          return { content: [{ type: "text", text: "Error de Validación: PROJECT_ID y TITLE son obligatorios en el bloque [SPEC_HEADER]. Asegúrate de que no tengan el prefijo '>'." }], isError: true };
        }

        // 1.1 Verificar existencia del Proyecto
        const project = await prisma.project.findFirst({
          where: {
            OR: [
              { uuid: projectId },
              { name: projectId }
            ]
          }
        });

        if (!project) {
          return { content: [{ type: "text", text: `Error de Integridad: El Proyecto '${projectId}' no existe en la base de datos. Verifica el nombre o UUID.` }], isError: true };
        }
        projectId = project.uuid; // Normalizar a UUID

        // 2. Parsear Steps
        const stepsData = [];
        const stepBlocks = fileContent.split(/###\s*\[STEP:/i).slice(1);
        
        if (stepBlocks.length === 0) {
          return { content: [{ type: "text", text: "Error de Formato: No se encontraron bloques de pasos (### [STEP: N])." }], isError: true };
        }

        const seenStepNumbers = new Set();
        
        for (const block of stepBlocks) {
          const stepHeaderMatch = block.match(/^\s*(\d+)\s*\]/);
          if (!stepHeaderMatch) {
            return { content: [{ type: "text", text: `Error en el Parser: No se pudo identificar el número de paso en '### [STEP:${block.substring(0,10)}...'` }], isError: true };
          }
          const stepNumber = parseInt(stepHeaderMatch[1]);

          if (seenStepNumbers.has(stepNumber)) {
            return { content: [{ type: "text", text: `Error de Consistencia: El Paso #${stepNumber} está duplicado en el Blueprint.` }], isError: true };
          }
          seenStepNumbers.add(stepNumber);

          const sTitle = getField(block, "TITLE");
          const sDependsOnStr = getField(block, "DEPENDS_ON");
          const sDependsOn = (sDependsOnStr && sDependsOnStr.toLowerCase() !== "null") ? parseInt(sDependsOnStr) : null;
          
          const sContext = getBlockquote(block, "CONTEXT");
          const sMeta = getBlockquote(block, "META");
          
          if (!sTitle) {
            return { content: [{ type: "text", text: `Error en el Paso #${stepNumber}: El campo TITLE es obligatorio y no debe empezar con '>'.` }], isError: true };
          }

          stepsData.push({
            stepNumber,
            title: sTitle,
            dependsOn: sDependsOn,
            context: sContext,
            meta: sMeta
          });
        }

        // 2.1 Validar Coherencia de Dependencias
        for (const s of stepsData) {
          if (s.dependsOn !== null) {
            if (isNaN(s.dependsOn)) {
               return { content: [{ type: "text", text: `Error en el Paso #${s.stepNumber}: La dependencia debe ser un número o 'null'.` }], isError: true };
            }
            if (s.dependsOn === s.stepNumber) {
              return { content: [{ type: "text", text: `Error de Lógica: El Paso #${s.stepNumber} no puede depender de sí mismo.` }], isError: true };
            }
            if (!seenStepNumbers.has(s.dependsOn)) {
              return { content: [{ type: "text", text: `Error de Referencia: El Paso #${s.stepNumber} depende del Paso #${s.dependsOn}, que no existe en el Blueprint.` }], isError: true };
            }
          }
        }

        // 3. Inserción en DB (Transacción)
        try {
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

            // Ordenar steps por número para asegurar que las dependencias se procesen correctamente si son secuenciales
            // Aunque el Map ayuda, si hay dependencias hacia adelante esto fallará. 
            // El protocolo v3 asume que dependen de pasos anteriores o se maneja con el stepMap.
            
            for (const s of stepsData.sort((a, b) => a.stepNumber - b.stepNumber)) {
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
              text: `✅ Blueprint procesado exitosamente.\nSpec ID: ${result.spec.id}\nSteps creados: ${result.steps.length}\nProyecto vinculante: ${project.name} (${projectId})` 
            }]
          };
        } catch (error) {
           return { content: [{ type: "text", text: `Error en Transacción DB: ${error.message}` }], isError: true };
        }
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
