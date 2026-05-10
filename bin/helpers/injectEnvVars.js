import { readFile, writeFile } from 'fs/promises';
import { join } from 'path';
import { homedir } from 'os';
import { pathExists } from './pathExists.js';

/**
 * Escapa caracteres especiales de shell en valores de variables de entorno
 * @param {string} value - Valor a escapar
 * @returns {string} Valor escapado seguro para shell
 */
function escapeShellValue(value) {
  // Si el valor contiene espacios o caracteres especiales, envolver en comillas simples
  // y escapar las comillas simples existentes
  if (typeof value !== 'string') {
    value = String(value);
  }
  
  // Caracteres que requieren escaping en shell
  if (/[^a-zA-Z0-9_\-./]/.test(value)) {
    // Usar comillas simples (más seguro) y escapar comillas internas
    return `'${value.replace(/'/g, "'\\''")}'`;
  }
  
  return value;
}

/**
 * Inyecta variables de entorno en el archivo de configuración del shell (.bashrc o .zshrc).
 * SEGURO: Escapea valores para prevenir shell injection
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

    // Inyectar variables de entorno (con escaping seguro)
    for (const [key, value] of Object.entries(envVars)) {
      // Validar que la clave sea un identificador válido de shell
      if (!/^[A-Z_][A-Z0-9_]*$/i.test(key)) {
        throw new Error(`Invalid environment variable name: ${key} (must be valid shell identifier)`);
      }

      const escapedValue = escapeShellValue(value);
      const line = `export ${key}=${escapedValue}`;
      
      if (!content.includes(key)) {
        content += `\n# Sko-Nexus Isolation\n${line}\n`;
        modified = true;
      }
    }

    // Inyectar alias global 'sko' (con path escapado)
    const skoPath = join(process.cwd(), 'bin', 'sko.js');
    const escapedSkoPath = escapeShellValue(skoPath);
    const skoAlias = `alias sko='node ${escapedSkoPath}'`;
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
