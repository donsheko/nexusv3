/**
 * Limpia frontmatter YAML de un texto markdown.
 * Elimina cualquier bloque YAML delimitado por --- o +++ al inicio del archivo.
 *
 * @param {string} content - Contenido original del archivo
 * @returns {string} Contenido sin frontmatter
 */
export function cleanFrontmatter(content) {
  return content
    .replace(/^---[\s\S]*?---\n*/m, "") // YAML standard (---)
    .replace(/^\+\+\+[\s\S]*?\+\+\+\n*/m, "") // TOML (+++)
    .replace(/^\{[\s\S]*?\}\n*/m, "") // JSON ({})
    .trim();
}
