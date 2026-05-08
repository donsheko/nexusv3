import { homedir } from 'os';
import { access, constants } from 'fs/promises';
import { join } from 'path';

/**
 * Mapa de agentes AI y sus directorios de configuración relativos al $HOME.
 * @type {Object<string, string>}
 */
const AGENTS_DEFINITIONS = {
  antigravity: '.gemini',
  'claude-code': '.claude',
  'gemini-cli': '.gemini-cli',
  opencode: '.config/opencode',
};

/**
 * Detecta directorios de configuración de agentes AI en el sistema del usuario.
 *
 * Escanea el directorio home del usuario en busca de las carpetas de configuración
 * definidas en AGENTS_DEFINITIONS y retorna un reporte con la ruta absoluta y el
 * estado de acceso para cada agente.
 *
 * @returns {Promise<Object<string, {path: string, exists: boolean, error?: string}>>}
 *   Objeto clave-valor donde cada clave es el nombre del agente y cada valor contiene:
 *   - `path`:   Ruta absoluta al directorio de configuración.
 *   - `exists`: `true` si el directorio existe y es accesible, `false` en caso contrario.
 *   - `error`:  Código de error si no fue posible determinar la existencia (opcional).
 */
export async function detectLocalAgents() {
  const home = homedir();
  const results = {};

  for (const [agent, configPath] of Object.entries(AGENTS_DEFINITIONS)) {
    const fullPath = join(home, configPath);
    let exists = false;
    let error = null;

    try {
      await access(fullPath, constants.F_OK);
      exists = true;
    } catch (err) {
      error = err.code === 'ENOENT' ? 'NOT_FOUND' : err.code;
    }

    results[agent] = {
      path: fullPath,
      exists,
      ...(error ? { error } : {}),
    };
  }

  return results;
}
