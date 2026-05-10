import { syncSkillsInternal } from "@sko/prisma/lib/sync.js";
import prisma from "@sko/prisma/lib/prisma.js";
import { syncSkills } from "./injector.js";
import { loadLocalState } from "./identity.js";

/**
 * Sincroniza el cerebro (Skills) tanto en la base de datos (SSOT para búsqueda)
 * como en el almacenamiento físico de los agentes activos (Eficiencia).
 * Los agentes se mantienen exclusivamente en Git por higiene arquitectónica.
 *
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function syncBrain() {
  try {
    // 1. Sincronización SSOT de Skills (Assets -> MariaDB)
    await syncSkillsInternal(prisma);

    // 2. Sincronización Física (Assets -> Carpetas Locales)
    // Solo para agentes marcados como habilitados en agents_local.json
    const state = await loadLocalState();
    const activeMap = {};

    if (state.activeAgents) {
      for (const [id, info] of Object.entries(state.activeAgents)) {
        if (info.enabled) {
          activeMap[id] = info;
        }
      }
    }

    if (Object.keys(activeMap).length > 0) {
      await syncSkills(activeMap);
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
