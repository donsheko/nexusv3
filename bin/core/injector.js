/**
 * Inyector de Inteligencia v3.2
 * =============================
 * Motor Profile-Aware con soporte para Blindaje de Shell y Aislamiento de Contexto.
 *
 * @module core/injector
 */

import { writeFile, mkdir, readdir, readFile, copyFile, stat, rename } from "fs/promises";
import { join, dirname, resolve } from "path";
import { fileURLToPath } from "url";

// Config y Helpers
import { AGENT_PROFILES } from "./agents_global_config.js";
import { assembleADN } from "../helpers/assembleADN.js";
import { pathExists } from "../helpers/pathExists.js";
import { readComponent } from "../helpers/readComponent.js";
import { detectFormat } from "../helpers/detectFormat.js";
import { readConfig } from "../helpers/readConfig.js";
import { getMCPConfigPath } from "../helpers/getMCPConfigPath.js";
import { injectEnvVars } from "../helpers/injectEnvVars.js";
import { withLock } from "../helpers/fileLock.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = join(__dirname, "..", "..");
const ASSETS_DIR = join(ROOT_DIR, "assets");
const MCP_SERVER_PATH = join(ROOT_DIR, "mcp", "index.js");

/**
 * Validaciones de seguridad pre-ejecución
 */
async function validateMcpServerPath() {
  if (!(await pathExists(MCP_SERVER_PATH))) {
    throw new Error(
      `MCP server not found at ${MCP_SERVER_PATH}. ` +
      `Cannot inject MCP configuration without the server binary.`
    );
  }
}

/**
 * Escribe config de forma segura (atomic write con backup)
 */
async function writeConfigSafely(configPath, config) {
  // 1. Crear backup si el archivo existe
  if (await pathExists(configPath)) {
    const backupPath = configPath + '.backup';
    try {
      await copyFile(configPath, backupPath);
    } catch (err) {
      // Si el backup falla, al menos intentamos continuar
      console.warn(`Warning: Could not create backup of ${configPath}`);
    }
  }

  // 2. Validar que config es JSON-serializable
  try {
    JSON.stringify(config);
  } catch (err) {
    throw new Error(`Config contains non-serializable values: ${err.message}`);
  }

  // 3. Escribir a archivo temporal primero
  const tempPath = configPath + '.tmp';
  const jsonContent = JSON.stringify(config, null, 2) + "\n";
  await writeFile(tempPath, jsonContent, "utf-8");

  // 4. Validar que el temp file se escribió correctamente
  const written = await readFile(tempPath, "utf-8");
  if (written !== jsonContent) {
    throw new Error(`Config write verification failed - file content mismatch`);
  }

  // 5. Atomic rename (move temp to final)
  await rename(tempPath, configPath);
}

/**
 * Valida estructura de config MCP antes de modificar
 */
function validateMcpConfig(config, formatKey) {
  if (!config[formatKey]) {
    return; // No existe, será creada
  }

  if (typeof config[formatKey] !== "object" || Array.isArray(config[formatKey])) {
    throw new Error(
      `Config[${formatKey}] must be an object, but found ${typeof config[formatKey]}. ` +
      `This suggests the config file may be corrupted or in an incompatible format.`
    );
  }
}

/**
 * Valida array de plugins
 */
function validatePluginArray(plugins) {
  if (!Array.isArray(plugins)) {
    throw new Error(
      `config.plugin must be an array, but found ${typeof plugins}. ` +
      `Plugin configuration is corrupted.`
    );
  }

  for (const plugin of plugins) {
    if (typeof plugin !== "string") {
      throw new Error(
        `Plugin entry must be a string, but found ${typeof plugin}: ${plugin}. ` +
        `Plugin configuration contains invalid entries.`
      );
    }
  }
}

/**
 * 1. syncMaestro
 * Ensambla instrucciones, inyecta el Maestro como agente primario y blindaje de shell.
 */
export async function syncMaestro(agents) {
  const results = {};
  for (const [id, info] of Object.entries(agents)) {
    try {
      const profile = AGENT_PROFILES[id];
      if (!profile) throw new Error(`Perfil no encontrado para: ${id}`);

      // A. Crear archivo de bloqueo (Minimal AGENTS.md / CLAUDE.md)
      // Este archivo evita el fallback de OpenCode a otras herramientas sin cargar el ADN completo.
      const blockFile = join(info.path, profile.config.mainInstructions);
      const blockContent = `<!-- Sko-Nexus: Archivo de bloqueo para evitar fallbacks de contexto global -->\n`;
      await mkdir(info.path, { recursive: true });
      await writeFile(blockFile, blockContent, "utf-8");

      // B. Inyectar al Maestro en la carpeta de agentes (Como Agente Primario)
      const adnContent = await assembleADN(id);
      const agentsDir = join(info.path, profile.config.subagentsDir);
      await mkdir(agentsDir, { recursive: true });
      const maestroFile = join(agentsDir, "maestro.md");
      await writeFile(maestroFile, adnContent, "utf-8");

      // C. Inyectar Comandos si el perfil lo requiere
      if (profile.assets.hasCommands) {
        const cmdSource = join(ROOT_DIR, profile.assets.commandsSource);
        const cmdDest = join(info.path, profile.config.commandsDir);
        if (await pathExists(cmdSource)) {
          await mkdir(cmdDest, { recursive: true });
          const cmdFiles = await readdir(cmdSource);
          for (const file of cmdFiles) {
            const content = await readFile(join(cmdSource, file), "utf-8");
            await writeFile(join(cmdDest, file), content, "utf-8");
          }
        }
      }

      // D. Blindaje de Shell (Variables de Entorno)
      if (profile.setup.env && Object.keys(profile.setup.env).length > 0) {
        await injectEnvVars(profile.setup.env);
      }

      results[id] = { success: true, maestroPath: maestroFile, shellShield: true };
    } catch (err) {
      results[id] = { success: false, error: err.message };
    }
  }
  return results;
}

/**
 * 2. syncSubagents
 * Inyecta subagentes en la carpeta de destino según convención (agents vs skills).
 */
export async function syncSubagents(agents) {
  const results = {};
  const subagentsDir = join(ASSETS_DIR, "subagents");
  const shieldPath = join("share", "shield.md");

  for (const [id, info] of Object.entries(agents)) {
    try {
      const profile = AGENT_PROFILES[id];
      if (!profile) throw new Error(`Perfil no encontrado: ${id}`);

      const targetSubDir = profile.config.subagentsDir;
      const targetPath = join(info.path, targetSubDir);

      await mkdir(targetPath, { recursive: true });
      const files = await readdir(subagentsDir);
      const mdFiles = files.filter((f) => f.endsWith(".md"));
      const shieldContent = await readComponent([shieldPath]);

      for (const file of mdFiles) {
        const rawContent = await readFile(join(subagentsDir, file), "utf-8");
        const finalContent = (rawContent + "\n\n" + (shieldContent || "")).trim();
        await writeFile(join(targetPath, file), finalContent, "utf-8");
      }
      results[id] = { success: true, count: mdFiles.length };
    } catch (err) {
      results[id] = { success: false, error: err.message };
    }
  }
  return results;
}

/**
 * 3. syncMcp
 * Genera config MCP dinámica incluyendo plugins obligatorios.
 * SEGURO: con validación, backup, atomic writes y locking
 */
export async function syncMcp(agents) {
  const results = {};
  const MCP_SERVER_NAME = "sko-brain";

  // Validar pre-requisitos
  try {
    await validateMcpServerPath();
  } catch (err) {
    return Object.fromEntries(
      Object.keys(agents).map(id => [id, { success: false, error: err.message }])
    );
  }

  for (const [id, info] of Object.entries(agents)) {
    try {
      const profile = AGENT_PROFILES[id];
      if (!profile) throw new Error(`Perfil no encontrado: ${id}`);

      const configPath = getMCPConfigPath(id, info.path);

      // SEGURO: Usar lock para evitar race conditions
      const result = await withLock(configPath, async () => {
        const format = detectFormat(configPath);
        const config = await readConfig(configPath);

        // Validar estructura del config antes de modificar
        validateMcpConfig(config, format.key);

        // Inyectar plugins para OpenCode
        if (id === 'opencode') {
          // Validar que plugin sea array o no exista
          if (config.plugin && !Array.isArray(config.plugin)) {
            throw new Error(
              `config.plugin is not an array. Expected array, got ${typeof config.plugin}`
            );
          }

          const plugins = new Set(config.plugin || []);
          profile.setup.requiredPlugins.forEach(p => {
            if (typeof p !== "string") {
              throw new Error(`Invalid plugin entry: ${p} (must be string)`);
            }
            plugins.add(p);
          });
          config.plugin = Array.from(plugins);

          // Validar resultado
          validatePluginArray(config.plugin);
        }

        // Crear o actualizar config[format.key]
        if (!config[format.key]) {
          config[format.key] = {};
        } else if (typeof config[format.key] !== "object" || Array.isArray(config[format.key])) {
          throw new Error(
            `config[${format.key}] must be an object, but is ${typeof config[format.key]}`
          );
        }

        // Inyectar configuración del servidor MCP
        config[format.key][MCP_SERVER_NAME] = {
          type: "local",
          command: ["node", MCP_SERVER_PATH],
          enabled: true,
        };

        // Crear directorio si no existe
        await mkdir(dirname(configPath), { recursive: true });

        // SEGURO: Escribir con backup y atomic rename
        await writeConfigSafely(configPath, config);

        return { success: true, configPath };
      });

      results[id] = result;
    } catch (err) {
      results[id] = { success: false, error: err.message };
    }
  }
  return results;
}

/**
 * 4. syncSkills
 * Despliega físicamente las skills de assets/skills/ en las carpetas locales de los agentes.
 *
 * @param {Object} agents - Mapa de agentes seleccionados
 * @returns {Promise<Object>} Resultado por agente
 */
export async function syncSkills(agents) {
  const results = {};
  const skillsSourceDir = join(ASSETS_DIR, "skills");

  for (const [id, info] of Object.entries(agents)) {
    try {
      const profile = AGENT_PROFILES[id];
      if (!profile) throw new Error(`Perfil no encontrado para: ${id}`);
      if (!profile.config.skillsDir) {
        results[id] = { success: true, skipped: true };
        continue;
      }

      const targetPath = join(info.path, profile.config.skillsDir);
      await mkdir(targetPath, { recursive: true });

      const skills = await readdir(skillsSourceDir);
      for (const skillFolder of skills) {
        const skillSrc = join(skillsSourceDir, skillFolder);
        const s = await stat(skillSrc);
        if (!s.isDirectory()) continue;

        const targetSkillPath = join(targetPath, skillFolder);
        await mkdir(targetSkillPath, { recursive: true });

        const skillFiles = await readdir(skillSrc);
        for (const file of skillFiles) {
          await copyFile(join(skillSrc, file), join(targetSkillPath, file));
        }
      }
      results[id] = { success: true, path: targetPath };
    } catch (err) {
      results[id] = { success: false, error: err.message };
    }
  }
  return results;
}
