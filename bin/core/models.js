import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Detecta los modelos disponibles en OpenCode ejecutando el comando CLI.
 * @returns {Promise<{success: boolean, data?: any, error?: string}>}
 */
export async function detectModels() {
  try {
    const { stdout } = await execAsync('opencode models', { timeout: 10000 });
    const lines = stdout.split(/\r?\n/).filter(line => line.trim() && line.includes('/'));
    
    const modelsByProvider = {};
    lines.forEach(line => {
      const [provider, ...modelParts] = line.trim().split('/');
      const model = modelParts.join('/');
      if (!modelsByProvider[provider]) modelsByProvider[provider] = [];
      modelsByProvider[provider].push(line.trim());
    });

    // Guardar para uso posterior
    const modelsPath = path.join(path.resolve(__dirname, '..', '..'), 'opencode_models.json');
    await fs.writeFile(modelsPath, JSON.stringify(modelsByProvider, null, 2));

    return { success: true, data: modelsByProvider };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Aplica los modelos seleccionados a los archivos de los agentes.
 * @param {Object} selection - Mapa de agente -> modelo
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function applyModels(selection) {
  // Lógica para actualizar los .md de los agentes con la clave "model: ..."
  // Esta función se llamará desde la UI después de que el usuario elija
  return { success: true }; 
}
