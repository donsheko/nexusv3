import { homedir } from "os";
import { access, constants } from "fs/promises";
import { join } from "path";
import { AGENT_PROFILES } from "./agents_global_config.js";

/**
 * Detecta directorios de configuración de agentes AI basados en los perfiles globales.
 *
 * @returns {Promise<Object>} Reporte de agentes detectados y su estado.
 */
export async function detectLocalAgents() {
  const home = homedir();
  const results = {};

  for (const [id, profile] of Object.entries(AGENT_PROFILES)) {
    const fullPath = join(home, profile.config.dir);
    let exists = false;
    let error = null;

    try {
      await access(fullPath, constants.F_OK);
      exists = true;
    } catch (err) {
      error = err.code === "ENOENT" ? "NOT_FOUND" : err.code;
    }

    results[id] = {
      name: profile.name,
      path: fullPath,
      exists,
      ...(error ? { error } : {}),
    };
  }

  return results;
}
