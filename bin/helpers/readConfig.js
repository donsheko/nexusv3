import { readFile, access, constants } from 'fs/promises';

/**
 * Lee y parsea un archivo JSON de configuración.
 * Si el archivo no existe, retorna un objeto vacío.
 *
 * @param {string} configPath - Ruta al archivo JSON
 * @returns {Promise<object>} Objeto parseado
 */
export async function readConfig(configPath) {
  try {
    await access(configPath, constants.F_OK);
    const raw = await readFile(configPath, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    if (err.code === 'ENOENT') {
      return {}; // Archivo no existe → objeto vacío
    }
    if (err instanceof SyntaxError) {
      throw new Error(`Error de sintaxis JSON en ${configPath}: ${err.message}`);
    }
    throw err;
  }
}
