import { readFile, access, constants } from "fs/promises";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { cleanFrontmatter } from "./cleanFrontmatter.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ASSETS_DIR = join(__dirname, "..", "..", "assets");

/**
 * Intenta leer un componente de ADN probando múltiples rutas alternativas.
 *
 * @param {Array<string>} possiblePaths - Lista de rutas relativas a assets/
 * @returns {Promise<string|null>} Contenido limpio del primer archivo encontrado, o null
 */
export async function readComponent(possiblePaths) {
  for (const relativePath of possiblePaths) {
    const fullPath = join(ASSETS_DIR, relativePath);
    try {
      await access(fullPath, constants.F_OK);
      const raw = await readFile(fullPath, "utf-8");
      const cleaned = cleanFrontmatter(raw);
      return cleaned;
    } catch {
      // Intentar siguiente ruta
    }
  }
  return null;
}
