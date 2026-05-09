import { readFile, writeFile } from 'fs/promises';
import { join } from 'path';
import { homedir } from 'os';
import { pathExists } from './pathExists.js';

/**
 * Inyecta variables de entorno en el archivo de configuración del shell (.bashrc o .zshrc).
 * 
 * @param {Object} envVars - Mapa de variables de entorno { KEY: VALUE }
 * @returns {Promise<{success: boolean, file?: string, error?: string}>}
 */
export async function injectEnvVars(envVars) {
  const home = homedir();
  const shellFiles = [join(home, '.zshrc'), join(home, '.bashrc')];
  let targetFile = null;

  // Buscar el primer archivo que exista
  for (const file of shellFiles) {
    if (await pathExists(file)) {
      targetFile = file;
      break;
    }
  }

  if (!targetFile) {
    return { success: false, error: 'No se encontró .bashrc ni .zshrc' };
  }

  try {
    let content = await readFile(targetFile, 'utf-8');
    let modified = false;

    for (const [key, value] of Object.entries(envVars)) {
      const line = `export ${key}=${value}`;
      if (!content.includes(key)) {
        content += `\n# Sko-Nexus Isolation\n${line}\n`;
        modified = true;
      }
    }

    // Inyectar alias global 'sko'
    const skoAlias = `alias sko='node ${join(process.cwd(), 'bin', 'sko.js')}'`;
    if (!content.includes("alias sko=")) {
      content += `\n# Sko-Nexus CLI Alias\n${skoAlias}\n`;
      modified = true;
    }

    if (modified) {
      await writeFile(targetFile, content, 'utf-8');
    }

    return { success: true, file: targetFile };
  } catch (err) {
    return { success: false, error: err.message };
  }
}
