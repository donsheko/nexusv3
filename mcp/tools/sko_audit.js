import prisma from "@sko/prisma/lib/prisma.js";
import { AuditSchema } from "../../prisma/schemas/index.js";

export const definition = {
  name: "sko_audit",
  description: "Gestiona las auditorías técnicas a nivel de Spec (misión) en Sko-Nexus.",
  inputSchema: {
    type: "object",
    properties: {
      action: { type: "string", enum: ["create", "get", "fix", "delete"] },
      id: { type: "number" },
      specId: { type: "number" },
      title: { type: "string" },
      issuesFound: { type: "string" },
      fixPlan: { type: "string" }
    },
    required: ["action"]
  }
};

export async function handler(args) {
  const validated = AuditSchema.parse(args);
  const { action, id, specId } = validated;

  try {
    switch (action) {
      case "create":
        const newAudit = await prisma.auditSpec.create({
          data: {
            specId: Number(specId),
            title: validated.title,
            issuesFound: validated.issuesFound,
            fixPlan: validated.fixPlan,
            fixed: false
          }
        });
        return { content: [{ type: "text", text: `Auditoría registrada: ${newAudit.id}` }] };

      case "get":
        const audit = await prisma.auditSpec.findUnique({
          where: { id: Number(id) },
          include: { spec: true }
        });
        return { content: [{ type: "text", text: JSON.stringify(audit, null, 2) }] };

      case "fix":
        const fixed = await prisma.auditSpec.update({
          where: { id: Number(id) },
          data: { fixed: true }
        });
        return { content: [{ type: "text", text: `Auditoría ${fixed.id} marcada como resuelta.` }] };

      case "delete":
        if (!id) return { content: [{ type: "text", text: "Error: Se requiere ID para eliminar una auditoría." }], isError: true };
        
        await prisma.auditSpec.delete({
          where: { id: Number(id) }
        });
        
        return { content: [{ type: "text", text: `Auditoría #${id} eliminada exitosamente.` }] };

      default:
        return { content: [{ type: "text", text: `Acción no soportada: ${action}` }], isError: true };
    }
  } catch (error) {
    return { content: [{ type: "text", text: `Error en sko_audit: ${error.message}` }], isError: true };
  }
}
