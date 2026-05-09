import prisma from "@sko/prisma/lib/prisma.js";
import { AuditSchema } from "../../prisma/schemas/index.js";

export const definition = {
  name: "sko_audit",
  description: "Gestiona las auditorías técnicas y el veto de misiones.",
  inputSchema: {
    type: "object",
    properties: {
      action: { type: "string", enum: ["create", "get", "fix"] },
      id: { type: "number" },
      stepId: { type: "number" },
      title: { type: "string" },
      issuesFound: { type: "string" },
      fixPlan: { type: "string" }
    },
    required: ["action"]
  }
};

export async function handler(args) {
  const validated = AuditSchema.parse(args);
  const { action, id, stepId } = validated;

  try {
    switch (action) {
      case "create":
        const newAudit = await prisma.auditStep.create({
          data: {
            stepId: Number(stepId),
            title: validated.title,
            issuesFound: validated.issuesFound,
            fixPlan: validated.fixPlan,
            fixed: false
          }
        });
        return { content: [{ type: "text", text: `Auditoría registrada: ${newAudit.id}` }] };

      case "get":
        const audit = await prisma.auditStep.findUnique({
          where: { id: Number(id) },
          include: { step: true }
        });
        return { content: [{ type: "text", text: JSON.stringify(audit, null, 2) }] };

      case "fix":
        const fixed = await prisma.auditStep.update({
          where: { id: Number(id) },
          data: { fixed: true }
        });
        return { content: [{ type: "text", text: `Auditoría ${fixed.id} marcada como resuelta.` }] };

      default:
        return { content: [{ type: "text", text: `Acción no soportada: ${action}` }], isError: true };
    }
  } catch (error) {
    return { content: [{ type: "text", text: `Error en sko_audit: ${error.message}` }], isError: true };
  }
}
