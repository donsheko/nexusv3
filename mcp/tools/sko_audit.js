const prisma = require("../lib/prisma.js");
const {AuditSchema} = require("../../prisma/schemas/index.js");

module.exports = {
  definition: {
    name: "sko_audit",
    description:
      "Gestiona las auditorías técnicas de los pasos (audit_steps) en Sko-Nexus. Permite crear hallazgos, consultarlos y marcarlos como corregidos.",
    inputSchema: {
      type: "object",
      properties: {
        action: {
          type: "string",
          enum: ["create", "get", "fix"],
          description: "Acción a ejecutar: create (registrar hallazgo), get (consultar), fix (marcar como corregido)",
        },
        id: {
          type: "number",
          description: "ID del registro de auditoría (requerido para fix, opcional para get)",
        },
        stepId: {
          type: "number",
          description: "ID del paso StepSpec (requerido para create, opcional para get)",
        },
        title: {
          type: "string",
          description: "Título del hallazgo de auditoría (requerido para create)",
        },
        issuesFound: {
          type: "string",
          description: "Descripción de los hallazgos o issues encontrados (requerido para create)",
        },
        fixPlan: {
          type: "string",
          description: "Plan de corrección (requerido para fix)",
        },
      },
      required: ["action"],
    },
  },
  handler: async (args) => {
    const validated = AuditSchema.parse(args);
    const {action, id, stepId} = validated;

    try {
      switch (action) {
        case "create": {
          if (!stepId) {
            return {
              content: [{type: "text", text: "Error: stepId es requerido para crear una auditoría."}],
              isError: true,
            };
          }
          if (!validated.title) {
            return {
              content: [{type: "text", text: "Error: title es requerido para crear una auditoría."}],
              isError: true,
            };
          }

          // Verificar que el StepSpec existe
          const step = await prisma.stepSpec.findUnique({
            where: {id: Number(stepId)},
          });

          if (!step) {
            return {
              content: [{type: "text", text: `Error: El StepSpec con id ${stepId} no existe.`}],
              isError: true,
            };
          }

          const audit = await prisma.auditStep.create({
            data: {
              stepId: Number(stepId),
              title: validated.title,
              issuesFound: validated.issuesFound || null,
              fixPlan: null,
              fixed: false,
            },
          });

          return {
            content: [{type: "text", text: JSON.stringify(audit, null, 2)}],
          };
        }

        case "get": {
          // Si se proporciona un id específico, recuperar esa auditoría
          if (id) {
            const audit = await prisma.auditStep.findUnique({
              where: {id: Number(id)},
              include: {step: true},
            });

            if (!audit) {
              return {
                content: [{type: "text", text: `No se encontró auditoría con id ${id}.`}],
              };
            }

            return {
              content: [{type: "text", text: JSON.stringify(audit, null, 2)}],
            };
          }

          // Si se proporciona stepId, recuperar todas las auditorías de ese paso
          if (stepId) {
            const audits = await prisma.auditStep.findMany({
              where: {stepId: Number(stepId)},
              orderBy: {createdAt: "desc"},
            });

            return {
              content: [{type: "text", text: JSON.stringify(audits, null, 2)}],
            };
          }

          // Si no hay filtros, devolver error
          return {
            content: [{type: "text", text: "Error: Debes proporcionar un id o stepId para consultar auditorías."}],
            isError: true,
          };
        }

        case "fix": {
          if (!id) {
            return {
              content: [{type: "text", text: "Error: id es requerido para marcar una auditoría como corregida."}],
              isError: true,
            };
          }

          // Verificar que el registro de auditoría existe
          const existing = await prisma.auditStep.findUnique({
            where: {id: Number(id)},
          });

          if (!existing) {
            return {
              content: [{type: "text", text: `Error: No se encontró auditoría con id ${id}.`}],
              isError: true,
            };
          }

          const updated = await prisma.auditStep.update({
            where: {id: Number(id)},
            data: {
              fixed: true,
              fixPlan: validated.fixPlan || existing.fixPlan,
              updatedAt: new Date(),
            },
          });

          return {
            content: [{type: "text", text: JSON.stringify(updated, null, 2)}],
          };
        }

        default:
          return {
            content: [{type: "text", text: `Acción no soportada: ${action}`}],
            isError: true,
          };
      }
    } catch (error) {
      return {
        content: [{type: "text", text: `Error en sko_audit: ${error.message}`}],
        isError: true,
      };
    }
  },
};
