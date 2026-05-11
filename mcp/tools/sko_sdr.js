import prisma from "@sko/prisma/lib/prisma.js";

export const definition = {
  name: "sko_sdr",
  description: "Bitácora de Sabiduría Profunda (SDR) y consolidación de resúmenes.",
  inputSchema: {
    type: "object",
    properties: {
      action: {
        type: "string",
        enum: ["register_step", "register_wisdom", "consolidate", "search", "delete_wisdom", "delete_summary"]
      },
      project: { type: "string", description: "UUID del proyecto." },
      id: { type: "string", description: "ID de la entrada a eliminar (String para summary, Number para wisdom)." },
      specId: { type: "number", description: "ID de la Spec (para register_step o register_wisdom)." },
      stepNumber: { type: "number", description: "Número del step (para register_step)." },
      content: { type: "string", description: "Contenido SDR o resumen." },
      query: { type: "string", description: "Término de búsqueda (para search)." },
      tags: { type: "string", description: "Etiquetas separadas por coma (para consolidate)." },
      sdrIds: { type: "string", description: "IDs de SDRCol vinculados separados por coma (para consolidate)." },
      quePaso: { type: "string" },
      queSenti: { type: "string" },
      queAprendi: { type: "string" },
      queQuieroLograr: { type: "string" },
      quePresupongo: { type: "string" },
      conceptosClave: { type: "string" },
      ejemplos: { type: "string" },
      contraejemplos: { type: "string" },
      dudasPendientes: { type: "string" }
    },
    required: ["action", "project"]
  }
};

export async function handler(args) {
  const { 
    action, project, id, specId, stepNumber, content, query, tags, sdrIds,
    quePaso, queSenti, queAprendi, queQuieroLograr, quePresupongo,
    conceptosClave, ejemplos, contraejemplos, dudasPendientes
  } = args;

  try {
    switch (action) {
      // ──────────────────────────────────────────────
      // register_step: Guarda/actualiza el SDR de un StepSpec
      // ──────────────────────────────────────────────
      case "register_step": {
        if (!specId || !stepNumber || !content) {
          return {
            content: [{ type: "text", text: "register_step requiere: specId, stepNumber, content" }],
            isError: true
          };
        }

        const step = await prisma.stepSpec.findFirst({
          where: { specId, stepNumber }
        });

        if (!step) {
          return {
            content: [{ type: "text", text: `StepSpec no encontrado: specId=${specId}, stepNumber=${stepNumber}` }],
            isError: true
          };
        }

        const updated = await prisma.stepSpec.update({
          where: { id: step.id },
          data: { sdr: content }
        });

        return {
          content: [{
            type: "text",
            text: `SDR registrado en StepSpec #${stepNumber}: ${updated.id}`
          }]
        };
      }

      // ──────────────────────────────────────────────
      // register_wisdom: Crea una entrada en SdrCol (Sabiduría Profunda)
      // ──────────────────────────────────────────────
      case "register_wisdom": {
        if (!specId) {
          return {
            content: [{ type: "text", text: "register_wisdom requiere: specId" }],
            isError: true
          };
        }

        const wisdom = await prisma.sdrCol.create({
          data: {
            specId: Number(specId),
            projectId: project,
            quePaso,
            queSenti,
            queAprendi,
            queQuieroLograr,
            quePresupongo,
            conceptosClave,
            ejemplos,
            contraejemplos,
            dudasPendientes
          }
        });

        return {
          content: [{
            type: "text",
            text: `Sabiduría registrada en SDR_COL (ID: ${wisdom.id}) para la Spec #${specId}`
          }]
        };
      }

      // ──────────────────────────────────────────────
      // consolidate: Crea o sobrescribe un Summary
      // ──────────────────────────────────────────────
      case "consolidate": {
        if (!content) {
          return {
            content: [{ type: "text", text: "consolidate requiere: content" }],
            isError: true
          };
        }

        // Buscar si ya existe un Summary para este proyecto
        const existing = await prisma.summary.findFirst({
          where: { projectId: project },
          orderBy: { updatedAt: "desc" }
        });

        let summary;
        if (existing) {
          // Sobrescribir resumen existente
          summary = await prisma.summary.update({
            where: { id: existing.id },
            data: {
              content,
              tags: tags ?? existing.tags,
              sdrIds: sdrIds ?? existing.sdrIds
            }
          });
        } else {
          // Crear nuevo Summary
          summary = await prisma.summary.create({
            data: {
              projectId: project,
              content,
              tags: tags ?? null,
              sdrIds: sdrIds ?? null
            }
          });
        }

        return {
          content: [{
            type: "text",
            text: `Resumen consolidado ${existing ? "actualizado" : "creado"} (ID: ${summary.id})`
          }]
        };
      }

      // ──────────────────────────────────────────────
      // search: Búsqueda unificada Summary + SdrCol
      // ──────────────────────────────────────────────
      case "search": {
        if (!query) {
          return {
            content: [{ type: "text", text: "search requiere: query" }],
            isError: true
          };
        }

        // Buscar en Summaries
        const summaries = await prisma.summary.findMany({
          where: {
            projectId: project,
            OR: [
              { content: { contains: query } },
              { tags: { contains: query } }
            ]
          },
          take: 5,
          orderBy: { updatedAt: "desc" }
        });

        // Buscar en SdrCol
        const sdrEntries = await prisma.sdrCol.findMany({
          where: {
            projectId: project,
            OR: [
              { quePaso: { contains: query } },
              { queAprendi: { contains: query } },
              { conceptosClave: { contains: query } }
            ]
          },
          take: 5,
          orderBy: { updatedAt: "desc" }
        });

        return {
          content: [{
            type: "text",
            text: JSON.stringify({ summaries, sdrEntries }, null, 2)
          }]
        };
      }

      case "delete_wisdom": {
        if (!id) return { content: [{ type: "text", text: "delete_wisdom requiere: id" }], isError: true };
        await prisma.sdrCol.delete({
          where: { id: Number(id) }
        });
        return { content: [{ type: "text", text: `Entrada de sabiduría #${id} eliminada.` }] };
      }

      case "delete_summary": {
        if (!id) return { content: [{ type: "text", text: "delete_summary requiere: id" }], isError: true };
        await prisma.summary.delete({
          where: { id: String(id) }
        });
        return { content: [{ type: "text", text: `Resumen ${id} eliminado.` }] };
      }

      default:
        return {
          content: [{ type: "text", text: `Acción no soportada: ${action}` }],
          isError: true
        };
    }
  } catch (error) {
    return {
      content: [{ type: "text", text: `Error en sko_sdr: ${error.message}` }],
      isError: true
    };
  }
}
