/**
 * Inyector de Maestro, Subagentes, Skills y MCP
 * ================================
 * Motor de ensamblaje de instrucciones .md para agentes AI.
 *
 * Lee los componentes de inteligencia desde assets/ (Maestro, Skills, Protocolos),
 * los ensambla (limpiando frontmatter YAML) y los inyecta en el directorio
 * de configuración del agente destino. También copia los subagentes desde
 * assets/subagents/ al directorio destino.
 *
 * @module core/injector
 */

import {
  readFile,
  readdir,
  copyFile,
  mkdir,
  writeFile,
  access,
  constants,
} from "fs/promises";
import {join, dirname, basename} from "path";
import {fileURLToPath} from "url";

// ─── Rutas Base ───────────────────────────────────────────────────────────

const __dirname = dirname(fileURLToPath(import.meta.url));
const ASSETS_DIR = join(__dirname, "..", "..", "assets");

/**
 * Mapa de componentes del ADN y sus rutas relativas dentro de assets/.
 * Se intentarán en orden; el primer archivo encontrado será usado.
 * @type {Array<{id: string, paths: string[]}>}
 */
const COMPONENT_MAP = [
  {
    id: "maestro",
    paths: [join("maestro", "maestro_base.md"), join("maestro", "persona.md")],
  },
  {
    id: "sko-spec",
    paths: [join("skills", "sko-spec", "SKILL.md")],
  },
  {
    id: "sko-mcp-mastery",
    paths: [join("skills", "sko-mcp-mastery", "SKILL.md")],
  },
];

// ─── Utilidades Internas ──────────────────────────────────────────────────

/**
 * Limpia frontmatter YAML de un texto markdown.
 * Elimina cualquier bloque YAML delimitado por --- o +++ al inicio del archivo.
 *
 * @param {string} content - Contenido original del archivo
 * @returns {string} Contenido sin frontmatter
 */
function cleanFrontmatter(content) {
  return content
    .replace(/^---[\s\S]*?---\n*/m, "") // YAML standard (---)
    .replace(/^\+\+\+[\s\S]*?\+\+\+\n*/m, "") // TOML (+++)
    .replace(/^\{[\s\S]*?\}\n*/m, "") // JSON ({})
    .trim();
}

/**
 * Intenta leer un componente de ADN probando múltiples rutas alternativas.
 *
 * @param {Array<string>} possiblePaths - Lista de rutas relativas a assets/
 * @returns {Promise<string|null>} Contenido limpio del primer archivo encontrado, o null
 */
async function readComponent(possiblePaths) {
  for (const relativePath of possiblePaths) {
    const fullPath = join(ASSETS_DIR, relativePath);
    try {
      await access(fullPath, constants.F_OK);
      const raw = await readFile(fullPath, "utf-8");
      const cleaned = cleanFrontmatter(raw);
      console.error(`[injector] ✓ Componente cargado: ${relativePath}`);
      return cleaned;
    } catch {
      // Intentar siguiente ruta
    }
  }
  console.error(
    `[injector] ⚠ Componente no encontrado: ${possiblePaths[0]} (y alternativas)`,
  );
  return null;
}

/**
 * Verifica si un archivo o directorio existe.
 *
 * @param {string} filePath - Ruta absoluta a verificar
 * @returns {Promise<boolean>}
 */
async function pathExists(filePath) {
  try {
    await access(filePath, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

// ─── API Pública ──────────────────────────────────────────────────────────

/**
 * Ensambla las instrucciones de ADN para un agente específico.
 *
 * Lee todos los componentes definidos en COMPONENT_MAP desde assets/,
 * los limpia de frontmatter, y los concatena en un documento único.
 *
 * @param {string} agentName - Nombre del agente (ej: "maestro", "explorador")
 * @returns {Promise<string>} Documento de ADN ensamblado
 * @throws {Error} Si no se encuentra ningún componente
 */
export async function assembleADN(agentName) {
  const parts = [];

  for (const component of COMPONENT_MAP) {
    const content = await readComponent(component.paths);
    if (content) {
      parts.push(content);
    }
  }

  if (parts.length === 0) {
    throw new Error(
      `[injector] No se encontraron componentes de ADN para ensamblar. ` +
        `Verifica assets/maestro/ y assets/skills/`,
    );
  }

  // Encabezado + componentes separados por divisores semánticos
  return [
    `# 🧬 ADN — ${agentName}`,
    `> Generado por Sko-Nexus v3 Injector`,
    `> Fecha: ${new Date().toISOString()}`,
    "",
    ...parts,
  ].join("\n\n");
}

/**
 * Copia los archivos de subagentes desde assets/subagents/ al directorio destino.
 *
 * Crea un subdirectorio `subagents/` dentro de `targetPath` y copia todos
 * los archivos `.md` desde `assets/subagents/` hacia allí.
 *
 * @param {string} targetPath - Ruta absoluta al directorio de configuración del agente
 * @returns {Promise<{success: boolean, count?: number, error?: string}>}
 */
export async function copySubagents(targetPath) {
  const subagentsDir = join(ASSETS_DIR, "subagents");
  const subagentsTarget = join(targetPath, "subagents");

  try {
    if (!(await pathExists(subagentsDir))) {
      return {
        success: false,
        error: "Directorio assets/subagents/ no encontrado",
      };
    }

    const files = await readdir(subagentsDir);
    const mdFiles = files.filter((f) => f.endsWith(".md"));

    if (mdFiles.length === 0) {
      return {success: true, count: 0};
    }

    await mkdir(subagentsTarget, {recursive: true});

    for (const file of mdFiles) {
      const src = join(subagentsDir, file);
      const dest = join(subagentsTarget, file);
      await copyFile(src, dest);
    }

    console.error(
      `[injector] ✓ ${mdFiles.length} subagentes copiados a ${subagentsTarget}`,
    );
    return {success: true, count: mdFiles.length};
  } catch (err) {
    return {success: false, error: `Error copiando subagentes: ${err.message}`};
  }
}

/**
 * Inyecta el ADN completo de Sko-Nexus en el agente especificado.
 *
 * Función principal que orquesta el flujo completo de inyección:
 * 1. Ensambla las instrucciones de ADN desde los componentes
 * 2. Escribe el archivo INSTRUCCIONES.md en el directorio del agente
 * 3. Copia los subagentes (si existen)
 *
 * @param {string} agentName - Nombre del agente destino
 * @param {string} targetPath - Ruta absoluta al directorio de configuración del agente
 * @returns {Promise<{success: boolean, instructionFile?: string, subagents?: object, error?: string}>}
 *
 * @example
 * ```js
 * const result = await injectADN('maestro', '/home/user/.config/opencode');
 * console.log(result.instructionFile); // Ruta al archivo generado
 * ```
 */
export async function injectADN(agentName, targetPath) {
  try {
    console.error(
      `[injector] ▶ Inyectando ADN para "${agentName}" en ${targetPath}`,
    );

    // 1. Ensamblar ADN
    const adnContent = await assembleADN(agentName);

    // 2. Preparar directorio destino
    await mkdir(targetPath, {recursive: true});

    // 3. Escribir archivo de instrucciones
    const instructionFile = join(targetPath, "INSTRUCCIONES.md");
    await writeFile(instructionFile, adnContent, "utf-8");
    console.error(
      `[injector] ✓ INSTRUCCIONES.md escrito (${adnContent.length} bytes)`,
    );

    // 4. Copiar subagentes
    const subagentsResult = await copySubagents(targetPath);

    return {
      success: true,
      instructionFile,
      subagents: subagentsResult,
    };
  } catch (err) {
    console.error(`[injector] ✗ Error: ${err.message}`);
    return {
      success: false,
      error: err.message,
    };
  }
}
