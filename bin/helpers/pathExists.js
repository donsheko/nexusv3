import { access, constants } from "fs/promises";

/**
 * Verifica si un archivo o directorio existe.
 *
 * @param {string} filePath - Ruta absoluta a verificar
 * @returns {Promise<boolean>}
 */
export async function pathExists(filePath) {
  try {
    await access(filePath, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}
