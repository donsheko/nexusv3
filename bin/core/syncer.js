import { syncSkillsInternal, syncAgentsInternal } from "@sko/prisma/lib/sync.js";
import prisma from "@sko/prisma/lib/prisma.js";

/**
 * Sincroniza el cerebro (Skills y Agentes) con la base de datos.
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function syncBrain() {
  try {
    // Aquí invocamos la lógica de sincronización que ya está en el MCP
    await syncSkillsInternal(prisma);
    await syncAgentsInternal(prisma);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
