import { homedir } from 'os';
import { join } from 'path';
import { copyFile, mkdir, readFile, access, constants } from 'fs/promises';

/**
 * Ruta global donde se almacena el auth.json de OpenCode.
 * @type {string}
 */
const GLOBAL_AUTH_DIR = join(homedir(), '.local', 'share', 'opencode');

/**
 * Ruta completa al archivo auth.json global.
 * @type {string}
 */
const GLOBAL_AUTH_PATH = join(GLOBAL_AUTH_DIR, 'auth.json');

/**
 * Nombre del archivo de autenticación local en la raíz del proyecto.
 * @type {string}
 */
const AUTH_FILENAME = 'auth.json';

/**
 * Provisiona el archivo auth.json desde la raíz del proyecto hacia la ruta global del usuario.
 *
 * Busca un archivo auth.json en el directorio de trabajo actual (process.cwd()).
 * Si existe, lo copia a ~/.local/share/opencode/auth.json, creando el directorio
 * destino si es necesario (recursive: true). Este proceso asegura que los tokens
 * de OpenCode estén disponibles globalmente para los agentes locales.
 *
 * @returns {Promise<{success: boolean, source?: string, dest?: string, error?: string}>}
 *   Objeto con el resultado de la operación:
 *   - `success`: true si la copia fue exitosa, false en caso contrario.
 *   - `source`:  Ruta del archivo de origen (si se encontró).
 *   - `dest`:    Ruta del archivo de destino (si se copió).
 *   - `error`:   Mensaje descriptivo del error (si ocurrió).
 */
export async function provisionIdentity() {
  const sourcePath = join(process.cwd(), AUTH_FILENAME);
  const result = {
    success: false,
  };

  // Verificar si existe el auth.json en la raíz del proyecto
  try {
    await access(sourcePath, constants.F_OK);
    result.source = sourcePath;
  } catch {
    result.error = `No se encontró ${AUTH_FILENAME} en la raíz del proyecto (${process.cwd()}).`;
    return result;
  }

  // Copiar el archivo al directorio global, creando la estructura si es necesario
  try {
    await mkdir(GLOBAL_AUTH_DIR, { recursive: true });
    await copyFile(sourcePath, GLOBAL_AUTH_PATH);
    result.success = true;
    result.dest = GLOBAL_AUTH_PATH;
  } catch (err) {
    result.error = `Error al copiar auth.json: ${err.message}`;
  }

  return result;
}

/**
 * Exporta el contenido del auth.json global.
 *
 * Lee el archivo ~/.local/share/opencode/auth.json y retorna su contenido
 * como un objeto JSON parseado. Útil para la opción de exportar identidad
 * desde la interfaz de línea de comandos.
 *
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 *   Objeto con el resultado de la operación:
 *   - `success`: true si la lectura fue exitosa, false en caso contrario.
 *   - `data`:    Contenido del auth.json como objeto (si se leyó correctamente).
 *   - `error`:   Mensaje descriptivo del error (si ocurrió).
 */
export async function exportIdentity() {
  const result = {
    success: false,
  };

  // Verificar que exista el auth.json global
  try {
    await access(GLOBAL_AUTH_PATH, constants.F_OK);
  } catch {
    result.error = `No se encontró auth.json global en ${GLOBAL_AUTH_PATH}. Ejecuta provisionIdentity() primero.`;
    return result;
  }

  // Leer y parsear el archivo
  try {
    const content = await readFile(GLOBAL_AUTH_PATH, 'utf-8');
    result.data = JSON.parse(content);
    result.success = true;
  } catch (err) {
    result.error = `Error al leer auth.json global: ${err.message}`;
  }

  return result;
}
