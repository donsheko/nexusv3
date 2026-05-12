import prisma from "@sko/prisma/lib/prisma.js";

export const definition = {
  name: "sko_sdr",
  description: "Bitácora de Sabiduría Profunda (SDR) y consolidación de resúmenes.",
  inputSchema: {
    type: "object",
    properties: {
      action: {
        type: "string",
        enum: ["sdr_upsert", "summary_upsert", "consolidate", "search", "sdr_delete", "summary_delete"]
      },
      project: { type: "string", description: "UUID del proyecto (requerido para todas las acciones)." },
      id: { type: "string", description: "ID de la entrada (Number para SdrCol, String para Summary)." },
      specId: { type: "number", description: "ID de la Spec (sdr_upsert, consolidate)." },
      stepNumber: { type: "number", description: "Número del step (ya no usado, mantenido por compatibilidad)." },
      content: { type: "string", description: "Contenido del resumen (summary_upsert)." },
      query: { type: "string", description: "Término de búsqueda (search)." },
      tags: { type: "string", description: "Etiquetas separadas por coma (summary_upsert)." },
      sdrIds: { type: "string", description: "IDs de SdrCol vinculados separados por coma (summary_upsert)." },
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
    action, project, id, specId, content, query, tags, sdrIds,
    quePaso, queSenti, queAprendi, queQuieroLograr, quePresupongo,
    conceptosClave, ejemplos, contraejemplos, dudasPendientes
  } = args;

  try {
    switch (action) {

      // ──────────────────────────────────────────────
      // sdr_upsert: Crea o actualiza una entrada en SdrCol
      // Reemplaza register_wisdom. Si se proporciona `id`, actualiza.
      // ──────────────────────────────────────────────
      case "sdr_upsert": {
        if (!specId) {
          return {
            content: [{ type: "text", text: "sdr_upsert requiere: specId" }],
            isError: true
          };
        }

        const colData = {
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
        };

        // Limpiar undefined (Zod pasa undefined, no omite campos)
        for (const key of Object.keys(colData)) {
          if (colData[key] === undefined) delete colData[key];
        }

        let wisdom;
        if (id) {
          // Actualizar entrada existente
          const existing = await prisma.sdrCol.findUnique({
            where: { id: Number(id) }
          });
          if (!existing) {
            return {
              content: [{ type: "text", text: `SdrCol no encontrado: id=${id}` }],
              isError: true
            };
          }
          wisdom = await prisma.sdrCol.update({
            where: { id: Number(id) },
            data: colData
          });
        } else {
          // Crear nueva entrada
          wisdom = await prisma.sdrCol.create({
            data: colData
          });
        }

        return {
          content: [{
            type: "text",
            text: `Sabiduría ${id ? "actualizada" : "registrada"} en SDR_COL (ID: ${wisdom.id}) para la Spec #${specId}`
          }]
        };
      }

      // ──────────────────────────────────────────────
      // summary_upsert: Crea o sobrescribe un Summary
      // Reemplaza la escritura de consolidate anterior
      // ──────────────────────────────────────────────
      case "summary_upsert": {
        if (!content) {
          return {
            content: [{ type: "text", text: "summary_upsert requiere: content" }],
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
          summary = await prisma.summary.update({
            where: { id: existing.id },
            data: {
              content,
              tags: tags ?? existing.tags,
              sdrIds: sdrIds ?? existing.sdrIds
            }
          });
        } else {
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
      // consolidate: Fase de LECTURA — absorbe la lógica de
      // sko_consolidator. Retorna Spec + Steps + Audits.
      // ──────────────────────────────────────────────
      case "consolidate": {
        if (!specId) {
          return {
            content: [{ type: "text", text: "consolidate requiere: specId" }],
            isError: true
          };
        }

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
            sdr: s.sdr
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

      // ──────────────────────────────────────────────
      // sdr_delete: Elimina una entrada de SdrCol por ID
      // Reemplaza delete_wisdom
      // ──────────────────────────────────────────────
      case "sdr_delete": {
        if (!id) {
          return {
            content: [{ type: "text", text: "sdr_delete requiere: id (numérico)" }],
            isError: true
          };
        }
        await prisma.sdrCol.delete({
          where: { id: Number(id) }
        });
        return { content: [{ type: "text", text: `Entrada de sabiduría #${id} eliminada.` }] };
      }

      // ──────────────────────────────────────────────
      // summary_delete: Elimina un Summary por ID
      // ──────────────────────────────────────────────
      case "summary_delete": {
        if (!id) {
          return {
            content: [{ type: "text", text: "summary_delete requiere: id (string)" }],
            isError: true
          };
        }
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
