import { join } from 'path';
import { homedir } from 'os';

/**
 * Determina la ruta al archivo de configuración MCP para un agente.
 *
 * @param {string} agentName    - Nombre del agente (opencode, claude-code, etc.)
 * @param {string} detectedPath - Ruta detectada por el detector
 * @returns {string} Ruta absoluta al archivo de configuración
 */
export function getMCPConfigPath(agentName, detectedPath) {
  const configMap = {
    opencode: join(detectedPath, 'opencode.json'),
    'claude-code': join(homedir(), '.claude.json'),
  };
  return configMap[agentName] || join(detectedPath, 'config.json');
}
