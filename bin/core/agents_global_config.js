/**
 * agents_global_config.js
 * =======================
 * SSOT de compatibilidad, rutas y configuración de blindaje para agentes AI.
 * Define el "Plano de Ingeniería" de cada agente soportado por Sko-Nexus.
 */

export const AGENT_PROFILES = {
  opencode: {
    name: 'OpenCode',
    id: 'opencode',
    config: {
      dir: '.config/opencode',
      mainInstructions: 'AGENTS.md',    // Evita fallback a CLAUDE.md
      subagentsDir: 'agents',           // Carpeta para @builder, etc.
      skillsDir: 'skills',              // Carpeta para las skills (SKILL.md)
      commandsDir: 'commands',          // Donde inyectar los .md de comandos
      mcpConfigFile: 'opencode.json',
    },
    // Blindaje y Configuración dinámica
    setup: {
      env: {
        OPENCODE_DISABLE_CLAUDE_CODE: '1',
        OPENCODE_DISABLE_CLAUDE_CODE_PROMPT: '1'
      },
      requiredPlugins: [
        'opencode-antigravity-auth@latest',
        'opencode-claude-auth@latest'
      ],
    },
    // Origen de assets en el repo nexusv3
    assets: {
      commandsSource: 'assets/commands',
      hasCommands: true
    }
  }
  // Futuros agentes (claude-code, antigravity) se añadirán aquí una vez 
  // que sus protocolos de inyección estén 100% validados.
};
