import { exec } from 'child_process';
import { promisify } from 'util';
import { join } from 'path';
import { AGENT_PROFILES } from '../core/agents_global_config.js';
import { pathExists } from './pathExists.js';

const execAsync = promisify(exec);

/**
 * Purga físicamente los componentes de Sko-Nexus en los agentes (Modo Fresh).
 * 
 * @param {Object} agents - Mapa de agentes activos { id: { path } }
 * @returns {Promise<Object>} Resultado por agente
 */
export async function purgeEnvironment(agents) {
  const results = {};

  for (const [id, info] of Object.entries(agents)) {
    try {
      const profile = AGENT_PROFILES[id];
      if (!profile) continue;

      const targetPath = info.path;
      const items = [
        profile.config.subagentsDir,
        profile.config.skillsDir,
        profile.config.commandsDir,
        profile.config.mainInstructions,
        profile.config.mcpConfigFile
      ].filter(Boolean);

      const purged = [];
      for (const item of items) {
        const itemPath = join(targetPath, item);
        if (await pathExists(itemPath)) {
          await execAsync(`rm -rf "${itemPath}"`);
          purged.push(item);
        }
      }

      results[id] = { success: true, purgedItems: purged };

    } catch (err) {
      results[id] = { success: false, error: err.message };
    }
  }

  return results;
}
