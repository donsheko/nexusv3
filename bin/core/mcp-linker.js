/**
 * MCP Linker — Sko-Nexus v3
 * ===========================
 * Vincula el servidor MCP sko-brain a los archivos de configuración
 * de los agentes AI locales (opencode.json, .claude.json, mcp_config.json).
 *
 * Es no-destructivo: preserva cualquier servidor MCP existente y solo
 * añade/actualiza la entrada "sko-brain".
 *
 * @module core/mcp-linker
 */

import { readFile, writeFile, access, constants, mkdir } from 'fs/promises';
import { join, dirname, basename } from 'path';
import { fileURLToPath } from 'url';

// ─── Constantes ───────────────────────────────────────────────────────────

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * Ruta absoluta al servidor MCP sko-brain.
 * @type {string}
 */
const MCP_SERVER_PATH = join(__dirname, '..', '..', 'mcp', 'index.js');

/**
 * Comando del servidor MCP (node + ruta al index.js).
 * @type {string[]}
 */
const MCP_COMMAND = ['node', MCP_SERVER_PATH];

/**
 * Nombre del servidor MCP en la configuración.
 * @type {string}
 */
const MCP_SERVER_NAME = 'sko-brain';

/**
 * Entrada MCP estándar que se inyecta en la configuración.
 * @type {object}
 */
const MCP_ENTRY = {
  type: 'local',
  command: MCP_COMMAND,
  enabled: true,
};

/**
 * Mapa de formatos de configuración según el nombre del archivo.
 *
 * Cada entrada define:
 * - `key`:         La clave padre donde residen los servidores MCP.
 * - `serverKey`:   La clave que envuelve cada servidor individual.
 *
 * @type {Object<string, {key: string, serverKey: string}>}
 */
const FORMAT_MAP = {
  'opencode.json': {
    key: 'mcp',
    serverKey: null, // OpenCode usa "mcp" → { "sko-brain": { ... } }
  },
  '.claude.json': {
    key: 'mcpServers',
    serverKey: null, // Claude usa "mcpServers" → { "sko-brain": { ... } }
  },
  'mcp_config.json': {
    key: 'mcpServers',
    serverKey: null,
  },
};

/**
 * Formato por defecto si el nombre del archivo no está en FORMAT_MAP.
 * @type {{key: string, serverKey: string}}
 */
const DEFAULT_FORMAT = {
  key: 'mcpServers',
  serverKey: null,
};

// ─── Utilidades Internas ──────────────────────────────────────────────────

/**
 * Determina el formato de configuración basado en el nombre del archivo.
 *
 * @param {string} configPath - Ruta absoluta al archivo de configuración
 * @returns {{key: string, serverKey: string}}
 */
function detectFormat(configPath) {
  const filename = basename(configPath);
  return FORMAT_MAP[filename] || DEFAULT_FORMAT;
}

/**
 * Lee y parsea un archivo JSON de configuración.
 * Si el archivo no existe, retorna un objeto vacío.
 *
 * @param {string} configPath - Ruta al archivo JSON
 * @returns {Promise<object>} Objeto parseado
 */
async function readConfig(configPath) {
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

/**
 * Valida que el comando MCP sea un array de strings.
 *
 * @param {string[]} command - Comando a validar
 * @returns {boolean}
 */
function isValidCommand(command) {
  return (
    Array.isArray(command) &&
    command.length > 0 &&
    command.every((part) => typeof part === 'string')
  );
}

// ─── API Pública ──────────────────────────────────────────────────────────

/**
 * Vincula el servidor MCP sko-brain a un archivo de configuración de agente.
 *
 * Lee el archivo de configuración existente (si existe), añade o actualiza
 * la entrada "sko-brain" en la sección de MCP servers, y escribe el archivo
 * de vuelta. Preserva todos los demás servidores MCP y configuraciones.
 *
 * @param {string} agentName - Nombre del agente (solo para logging/reporte)
 * @param {string} configPath - Ruta absoluta al archivo de configuración
 *   (ej: /home/user/.config/opencode/opencode.json)
 * @returns {Promise<{success: boolean, configPath?: string, serverName?: string, wasAdded?: boolean, error?: string}>}
 *
 * @example
 * ```js
 * // Vincular para OpenCode
 * const result = await linkMCPServer('opencode', '/home/user/.config/opencode/opencode.json');
 *
 * // Vincular para Claude Code
 * const result = await linkMCPServer('claude-code', '/home/user/.claude.json');
 * ```
 */
export async function linkMCPServer(agentName, configPath) {
  try {
    console.error(`[mcp-linker] ▶ Vinculando MCP para "${agentName}" → ${configPath}`);

    // 1. Validar que el servidor MCP existe
    try {
      await access(MCP_SERVER_PATH, constants.F_OK);
    } catch {
      throw new Error(
        `Servidor MCP no encontrado en ${MCP_SERVER_PATH}. ` +
        `Ejecuta npm install en el workspace mcp/ primero.`
      );
    }

    // 2. Determinar formato según nombre de archivo
    const format = detectFormat(configPath);
    const mcpKey = format.key;

    // 3. Leer configuración existente (o empezar con objeto vacío)
    const config = await readConfig(configPath);

    // 4. Asegurar que la sección MCP existe
    if (!config[mcpKey] || typeof config[mcpKey] !== 'object' || Array.isArray(config[mcpKey])) {
      config[mcpKey] = {};
    }

    // 5. Verificar si el servidor ya existe
    const wasAdded = !config[mcpKey][MCP_SERVER_NAME];

    // 6. Actualizar/crear la entrada sko-brain (no-destructivo: mantiene campos extra)
    config[mcpKey][MCP_SERVER_NAME] = {
      ...config[mcpKey][MCP_SERVER_NAME], // Preservar campos existentes
      ...MCP_ENTRY,                         // Sobrescribir con valores canónicos
    };

    // 7. Asegurar directorio destino y escribir
    await mkdir(dirname(configPath), { recursive: true });
    await writeFile(configPath, JSON.stringify(config, null, 2) + '\n', 'utf-8');

    console.error(
      `[mcp-linker] ✓ MCP "${MCP_SERVER_NAME}" ${wasAdded ? 'añadido' : 'actualizado'} en ${configPath}`
    );

    return {
      success: true,
      configPath,
      serverName: MCP_SERVER_NAME,
      wasAdded,
    };
  } catch (err) {
    console.error(`[mcp-linker] ✗ Error: ${err.message}`);
    return {
      success: false,
      error: err.message,
    };
  }
}

/**
 * Verifica el estado del enlace MCP en un archivo de configuración.
 *
 * Lee el archivo y retorna información sobre la entrada sko-brain
 * (si existe, su comando, si está habilitado).
 *
 * @param {string} configPath - Ruta al archivo de configuración
 * @returns {Promise<{linked: boolean, entry?: object, error?: string}>}
 */
export async function checkMCPServer(configPath) {
  try {
    const config = await readConfig(configPath);
    const format = detectFormat(configPath);
    const mcpSection = config[format.key];

    if (!mcpSection || !mcpSection[MCP_SERVER_NAME]) {
      return { linked: false };
    }

    const entry = mcpSection[MCP_SERVER_NAME];

    return {
      linked: true,
      entry: {
        type: entry.type,
        command: entry.command,
        enabled: entry.enabled,
        valid: isValidCommand(entry.command),
      },
    };
  } catch (err) {
    return {
      linked: false,
      error: err.message,
    };
  }
}
