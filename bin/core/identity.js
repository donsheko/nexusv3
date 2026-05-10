import { homedir } from 'os';
import { join } from 'path';
import { copyFile, mkdir, readFile, writeFile, access, constants } from 'fs/promises';

/**
 * Rutas para Identidad OpenCode Global
 */
const GLOBAL_AUTH_DIR = join(homedir(), '.local', 'share', 'opencode');
const GLOBAL_AUTH_PATH = join(GLOBAL_AUTH_DIR, 'auth.json');
const AUTH_FILENAME = 'auth.json';

/**
 * Ruta para el Estado Local de la Instalación
 */
const LOCAL_STATE_FILE = join(process.cwd(), 'agents_local.json');

/**
 * Carga el estado local de los agentes instalados.
 * @returns {Promise<Object>}
 */
export async function loadLocalState() {
  try {
    const raw = await readFile(LOCAL_STATE_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return { 
      updatedAt: null, 
      installPath: process.cwd(),
      activeAgents: {} 
    };
  }
}

/**
 * Guarda el estado local de los agentes instalados.
 * @param {Object} state 
 */
export async function saveLocalState(state) {
  try {
    state.updatedAt = new Date().toISOString();
    state.installPath = process.cwd();
    await writeFile(LOCAL_STATE_FILE, JSON.stringify(state, null, 2), 'utf-8');
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/**
 * Provisiona el archivo auth.json global.
 */
export async function provisionIdentity() {
  const sourcePath = join(process.cwd(), AUTH_FILENAME);
  const result = { success: false };

  try {
    await access(sourcePath, constants.F_OK);
    result.source = sourcePath;
  } catch {
    result.error = `No se encontró ${AUTH_FILENAME} en la raíz del proyecto.`;
    return result;
  }

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
 * Exporta la identidad global a un archivo auth.json local en el proyecto.
 * Permite sincronizar la identidad entre máquinas mediante el repo.
 */
export async function exportIdentity() {
  const result = { success: false };
  const destPath = join(process.cwd(), AUTH_FILENAME);

  try {
    await access(GLOBAL_AUTH_PATH, constants.F_OK);
    const content = await readFile(GLOBAL_AUTH_PATH, 'utf-8');
    
    // Crear/Sobrescribir archivo local
    await writeFile(destPath, content, 'utf-8');
    
    result.data = JSON.parse(content);
    result.success = true;
    result.file = destPath;
  } catch (err) {
    result.error = `Error al exportar identidad: ${err.message}`;
  }

  return result;
}

