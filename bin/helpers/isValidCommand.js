/**
 * Valida que el comando MCP sea un array de strings.
 *
 * @param {string[]} command - Comando a validar
 * @returns {boolean}
 */
export function isValidCommand(command) {
  return (
    Array.isArray(command) &&
    command.length > 0 &&
    command.every((part) => typeof part === 'string')
  );
}
