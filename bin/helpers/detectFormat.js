import { basename } from 'path';

const FORMAT_MAP = {
  'opencode.json': {
    key: 'mcp',
    serverKey: null,
  },
  '.claude.json': {
    key: 'mcpServers',
    serverKey: null,
  },
  'mcp_config.json': {
    key: 'mcpServers',
    serverKey: null,
  },
};

const DEFAULT_FORMAT = {
  key: 'mcpServers',
  serverKey: null,
};

/**
 * Determina el formato de configuración basado en el nombre del archivo.
 *
 * @param {string} configPath - Ruta absoluta al archivo de configuración
 * @returns {{key: string, serverKey: string}}
 */
export function detectFormat(configPath) {
  const filename = basename(configPath);
  return FORMAT_MAP[filename] || DEFAULT_FORMAT;
}
