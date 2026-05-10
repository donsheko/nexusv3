import { exec } from 'child_process';
import { promisify } from 'util';
import { AGENT_PROFILES } from '../core/agents_global_config.js';

const execAsync = promisify(exec);

/**
 * Crea un backup ZIP de los componentes de Sko-Nexus en los agentes.
 * 
 * @param {Object} agents - Mapa de agentes activos { id: { path } }
 * @returns {Promise<Object>} Resultado por agente
 */
export async function createBackup(agents) {
  const results = {};
  const now = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 16);

  for (const [id, info] of Object.entries(agents)) {
    try {
      const profile = AGENT_PROFILES[id];
      if (!profile) continue;

      const targetPath = info.path;
      const backupName = `sko_nexus_backup_${now}.zip`;
      
      const items = [
        profile.config.subagentsDir,
        profile.config.skillsDir,
        profile.config.commandsDir,
        profile.config.mainInstructions,
        profile.config.mcpConfigFile
      ].filter(Boolean);

      const itemsToZip = items.map(item => `"${item}"`).join(' ');
      await execAsync(`zip -r "${backupName}" ${itemsToZip}`, { cwd: targetPath });
      results[id] = { success: true, backup: backupName };

    } catch (err) {
      results[id] = { success: false, error: 'No hay archivos para respaldar o error en zip' };
    }
  }

  return results;
}
