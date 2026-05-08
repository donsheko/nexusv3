const prisma = require("../lib/prisma.js");
const {StepSchema} = require("../../prisma/schemas/index.js");
const {syncSpecProgress} = require("./sko_spec.js");

module.exports = {
  definition: {
    name: "sko_step",
    description:
      "Gestiona el Grafo de Dependencias (DAG) y los pasos individuales de una misión.",
    inputSchema: {
      type: "object",
      properties: {
        action: {
          type: "string",
          enum: ["create", "get", "next", "end", "sdr", "heartbeat"],
        },
        id: {type: "number"},
        specId: {type: "number"},
        stepNumber: {type: "number"},
        dependsId: {type: "number"},
        title: {type: "string"},
        meta: {type: "string"},
        context: {type: "string"},
        data: {type: "string", description: "Log para heartbeat o contenido para SDR"},
      },
      required: ["action"],
    },
  },
  handler: async (args) => {
    const validated = StepSchema.parse(args);
    const {action, id, specId, data} = validated;

    try {
      switch (action) {
        case "create":
          const newStep = await prisma.stepSpec.create({
            data: {
              specId: Number(specId),
              stepNumber: validated.stepNumber,
              title: validated.title,
              meta: validated.meta,
              context: validated.context,
              status: "pending",
              dependsId: validated.dependsId || null,
            },
          });
          // Al crear pasos, sincronizamos el conteo en la Spec
          await syncSpecProgress(specId);
          return {content: [{type: "text", text: `Paso ${newStep.id} creado.`}]};

        case "get":
          const step = await prisma.stepSpec.findUnique({
            where: {id: Number(id)},
            include: {spec: true},
          });
          return {
            content: [{type: "text", text: JSON.stringify(step, null, 2)}],
          };

        case "next":
          const nextStep = await prisma.stepSpec.findFirst({
            where: {specId: Number(specId), status: "pending"},
            orderBy: {stepNumber: "asc"},
          });
          return {
            content: [{type: "text", text: JSON.stringify(nextStep, null, 2)}],
          };

        case "end":
          // Validar bloqueo de auditoría: no permitir cierre si hay auditorías pendientes
          const pendingAudits = await prisma.auditStep.findMany({
            where: {stepId: Number(id), fixed: false},
          });

          if (pendingAudits.length > 0) {
            const count = pendingAudits.length;
            const auditIds = pendingAudits.map((a) => a.id).join(", ");
            return {
              content: [
                {
                  type: "text",
                  text: `No se puede completar el paso: existen ${count} auditoría(s) pendiente(s) de resolución (IDs: ${auditIds}). Resuélvelas usando sko_audit (fix) antes de cerrar el paso.`,
                },
              ],
              isError: true,
            };
          }

          const endedStep = await prisma.stepSpec.update({
            where: {id: Number(id)},
            data: {status: "completed"},
          });
          // Al finalizar un paso, sincronizamos el progreso global de la Spec automáticamente
          await syncSpecProgress(endedStep.specId);
          return {
            content: [{type: "text", text: JSON.stringify(endedStep, null, 2)}],
          };

        case "sdr":
          await prisma.stepSpec.update({
            where: {id: Number(id)},
            data: {sdr: data},
          });
          return {
            content: [{type: "text", text: "Sabiduría SDR registrada en el step."}],
          };

        case "heartbeat":
          const logMessage = typeof data === "string" ? data : JSON.stringify(data);
          if (logMessage.length > 70) {
            throw new Error(
              "El log del heartbeat debe tener un máximo de 70 caracteres."
            );
          }
          await prisma.stepSpec.update({
            where: {id: Number(id)},
            data: {
              status: "in_progress",
              updatedAt: new Date(),
            },
          });
          return {
            content: [{type: "text", text: `💓 Latido procesado: "${logMessage}"`}],
          };

        default:
          return {
            content: [{type: "text", text: `Acción no soportada: ${action}`}],
            isError: true,
          };
      }
    } catch (error) {
      return {
        content: [{type: "text", text: `Error en sko_step: ${error.message}`}],
        isError: true,
      };
    }
  },
};
