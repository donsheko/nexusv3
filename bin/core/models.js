import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { homedir } from 'os';
import { provisionIdentity } from './identity.js';

const execAsync = promisify(exec);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const LOCAL_OPENCODE_AGENTS_DIR = path.join(homedir(), '.config', 'opencode', 'agents');

/**
 * Detecta los modelos disponibles en OpenCode ejecutando el comando CLI.
 * @returns {Promise<{success: boolean, data?: any, error?: string}>}
 */
export async function detectModels() {
  try {
    // Intentar inyectar identidad antes de detectar (v2 parity)
    await provisionIdentity();

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
 * Obtiene la lista de agentes locales instalados en OpenCode.
 */
export async function getLocalAgents() {
  try {
    const files = await fs.readdir(LOCAL_OPENCODE_AGENTS_DIR);
    const agents = [];
    for (const file of files) {
      if (file.endsWith('.md')) {
        const name = path.basename(file, '.md');
        const content = await fs.readFile(path.join(LOCAL_OPENCODE_AGENTS_DIR, file), 'utf-8');
        const modelMatch = content.match(/^model:\s*(.*)$/m);
        agents.push({
          name,
          path: path.join(LOCAL_OPENCODE_AGENTS_DIR, file),
          currentModel: modelMatch ? modelMatch[1].trim() : null
        });
      }
    }
    return { success: true, data: agents };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Aplica los modelos seleccionados a los archivos de los agentes LOCALES.
 * @param {Object} selection - Mapa de agentName -> modelName
 * @returns {Promise<{success: boolean, results?: any, error?: string}>}
 */
export async function applyModels(selection) {
  const results = {};
  for (const [agentName, modelName] of Object.entries(selection)) {
    try {
      const filePath = path.join(LOCAL_OPENCODE_AGENTS_DIR, `${agentName}.md`);
      let content = await fs.readFile(filePath, 'utf-8');
      
      const modelRegex = /^model:\s*.*$/m;
      if (modelRegex.test(content)) {
        content = content.replace(modelRegex, `model: ${modelName}`);
      } else {
        // Inyectar después de la descripción o al inicio si no hay
        if (content.includes('description:')) {
          content = content.replace(/(description:.*)/, `$1\nmodel: ${modelName}`);
        } else {
          content = `model: ${modelName}\n${content}`;
        }
      }
      
      await fs.writeFile(filePath, content, 'utf-8');
      results[agentName] = { success: true };
    } catch (err) {
      results[agentName] = { success: false, error: err.message };
    }
  }
  return { success: true, data: results }; 
}

