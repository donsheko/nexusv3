/**
 * Inyector de Inteligencia v3.2
 * =============================
 * Motor Profile-Aware con soporte para Blindaje de Shell y Aislamiento de Contexto.
 *
 * @module core/injector
 */

import { writeFile, mkdir, readdir, readFile, copyFile, stat } from "fs/promises";
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

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = join(__dirname, "..", "..");
const ASSETS_DIR = join(ROOT_DIR, "assets");
const MCP_SERVER_PATH = join(ROOT_DIR, "mcp", "index.js");

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
 */
export async function syncMcp(agents) {
  const results = {};
  const MCP_SERVER_NAME = "sko-brain";

  for (const [id, info] of Object.entries(agents)) {
    try {
      const profile = AGENT_PROFILES[id];
      if (!profile) throw new Error(`Perfil no encontrado: ${id}`);

      const configPath = getMCPConfigPath(id, info.path);
      const format = detectFormat(configPath);
      const config = await readConfig(configPath);

      if (id === 'opencode') {
        const plugins = new Set(config.plugin || []);
        profile.setup.requiredPlugins.forEach(p => plugins.add(p));
        config.plugin = Array.from(plugins);
      }

      if (!config[format.key] || typeof config[format.key] !== "object") {
        config[format.key] = {};
      }

      config[format.key][MCP_SERVER_NAME] = {
        type: "local",
        command: ["node", MCP_SERVER_PATH],
        enabled: true,
      };

      await mkdir(dirname(configPath), { recursive: true });
      await writeFile(configPath, JSON.stringify(config, null, 2) + "\n", "utf-8");
      results[id] = { success: true, configPath };
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
