/**
 * Inyector de Maestro, Subagentes y MCP
 * =====================================
 * Motor central de sincronización de inteligencia para agentes AI.
 * Solo contiene 3 funciones principales siguiendo el protocolo v3.
 *
 * @module core/injector
 */

import { writeFile, mkdir, readdir, readFile, access, constants } from "fs/promises";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

// Helpers
import { assembleADN } from "../helpers/assembleADN.js";
import { pathExists } from "../helpers/pathExists.js";
import { readComponent } from "../helpers/readComponent.js";
import { detectFormat } from "../helpers/detectFormat.js";
import { readConfig } from "../helpers/readConfig.js";
import { getMCPConfigPath } from "../helpers/getMCPConfigPath.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ASSETS_DIR = join(__dirname, "..", "..", "assets");
const MCP_SERVER_PATH = join(__dirname, "..", "..", "mcp", "index.js");

/**
 * 1. syncMaestro
 * Armar el maestro e insertarlo en la carpeta local correspondiente.
 *
 * @param {Object} agents - Mapa de agentes seleccionados { name: { path } }
 * @returns {Promise<Object>} Resultado por agente
 */
export async function syncMaestro(agents) {
  const results = {};
  for (const [name, info] of Object.entries(agents)) {
    try {
      const adnContent = await assembleADN(name);
      await mkdir(info.path, { recursive: true });
      const dest = join(info.path, "INSTRUCCIONES.md");
      await writeFile(dest, adnContent, "utf-8");
      results[name] = { success: true, path: dest };
    } catch (err) {
      results[name] = { success: false, error: err.message };
    }
  }
  return results;
}

/**
 * 2. syncSubagents
 * Armar los subagentes e insertarlos en sus carpetas correspondientes.
 *
 * @param {Object} agents - Mapa de agentes seleccionados
 * @returns {Promise<Object>} Resultado por agente
 */
export async function syncSubagents(agents) {
  const results = {};
  const subagentsDir = join(ASSETS_DIR, "subagents");
  const shieldPath = join("share", "shield.md");

  for (const [name, info] of Object.entries(agents)) {
    try {
      if (!(await pathExists(subagentsDir))) {
        throw new Error("Directorio assets/subagents/ no encontrado");
      }

      const files = await readdir(subagentsDir);
      const mdFiles = files.filter((f) => f.endsWith(".md"));
      const targetDir = join(info.path, "subagents");
      await mkdir(targetDir, { recursive: true });

      const shieldContent = await readComponent([shieldPath]);

      for (const file of mdFiles) {
        const src = join(subagentsDir, file);
        const dest = join(targetDir, file);
        const rawContent = await readFile(src, "utf-8");
        const finalContent = (rawContent + "\n\n" + (shieldContent || "")).trim();
        await writeFile(dest, finalContent, "utf-8");
      }
      results[name] = { success: true, count: mdFiles.length };
    } catch (err) {
      results[name] = { success: false, error: err.message };
    }
  }
  return results;
}

/**
 * 3. syncMcp
 * Configura el servidor MCP sko-brain en los agentes seleccionados.
 *
 * @param {Object} agents - Mapa de agentes seleccionados
 * @returns {Promise<Object>} Resultado por agente
 */
export async function syncMcp(agents) {
  const results = {};
  const MCP_SERVER_NAME = "sko-brain";
  const MCP_ENTRY = {
    type: "local",
    command: ["node", MCP_SERVER_PATH],
    enabled: true,
  };

  for (const [name, info] of Object.entries(agents)) {
    try {
      const configPath = getMCPConfigPath(name, info.path);
      const format = detectFormat(configPath);
      const config = await readConfig(configPath);

      if (!config[format.key] || typeof config[format.key] !== "object") {
        config[format.key] = {};
      }

      config[format.key][MCP_SERVER_NAME] = {
        ...config[format.key][MCP_SERVER_NAME],
        ...MCP_ENTRY,
      };

      await mkdir(dirname(configPath), { recursive: true });
      await writeFile(configPath, JSON.stringify(config, null, 2) + "\n", "utf-8");
      results[name] = { success: true, configPath };
    } catch (err) {
      results[name] = { success: false, error: err.message };
    }
  }
  return results;
}
