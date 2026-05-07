---
name: Claude Code
description: Guía oficial de Claude Code para automatización de ingeniería de software desde la terminal con soporte para MCP.
---

# Claude Code - Guía de Implementación y Uso

Claude Code es la herramienta de CLI oficial de Anthropic que permite a los desarrolladores interactuar con Claude directamente desde la terminal para editar archivos, ejecutar comandos y gestionar flujos de trabajo de git.

## 1. Directorios de Configuración Local

Claude Code utiliza una estructura de directorios persistente para configuraciones globales y locales.

### Ubicaciones Globales (`~/.claude/`)
| Sistema Operativo | Ruta del Directorio |
| :--- | :--- |
| **Windows** | `%USERPROFILE%\.claude\` |
| **Linux / macOS** | `~/.claude/` |
| **WSL** | `~/.claude/` (en el entorno Linux) |

### Archivos Clave
- **`settings.json`**: Configuraciones globales del usuario.
- **`CLAUDE.md`**: **Instrucciones Globales**. Este archivo en `~/.claude/` se carga en todas las sesiones, permitiendo inyectar el "cerebro" de Sko-Nexus de forma transversal a cualquier proyecto sin entrar en conflicto con un `CLAUDE.md` local.
- **`commands/`**: Directorio para comandos personalizados ("slash commands") del usuario.
- **`.claude.json`**: Contiene tokens de sesión y configuraciones de MCP globales.

## 2. Gestión de MCP (Model Context Protocol)

Para Sko-Nexus, la configuración **Global** es obligatoria. Esto asegura que el "cerebro" esté presente en cualquier directorio de trabajo.

### Configuración Global (Recomendado)
Añade servidores mediante el CLI para que persistan en todas las sesiones:
```bash
# Añadir servidor de Sko-Brain globalmente
claude mcp add sko-brain -- node /ruta/absoluta/a/sko-nexus/mcp/index.js
```

### Configuración Directa (Global)
Si se prefiere editar manualmente, la configuración global se almacena en `~/.claude.json` (o dentro de `settings.json` en versiones recientes).
```json
{
  "mcpServers": {
    "sko-brain": {
      "command": "node",
      "args": ["/absolute/path/to/sko-nexus/server.js"],
      "env": {
        "SKO_ID": "brain_01",
        "NODE_ENV": "production"
      }
    }
  }
}
```
> [!IMPORTANT]
> **Rutas Multiplataforma**: Al configurar servidores MCP globales, utiliza siempre rutas absolutas. En Windows usa barras hacia adelante (`/`) o dobles barras invertidas (`\\`) para evitar problemas de escape, y asegúrate de que la ruta apunte al directorio de instalación correcto en cada sistema (ej. `C:/...` en Windows o `/home/...` en Linux).

### Gestión de Herramientas
- **`claude mcp list`**: Lista herramientas globales activas.
- **`claude mcp get <name>`**: Muestra detalles técnicos de un servidor específico.

## 3. Selección de Modelos (Generación 4.x)

Claude Code soporta la última generación de modelos Claude 4.

### Aliases y Nombres Completos
- `sonnet`: Claude 4.6 Sonnet (Modelo por defecto, balanceado).
- `haiku`: Claude 4.6 Haiku (Velocidad flash).
- `opus`: Claude 4.5 Opus (Capacidad máxima para razonamiento complejo).
- **Nombre Completo**: `claude-sonnet-4-6`, `claude-opus-4-5`, etc.

### Especificar Modelo en el CLI
```bash
# Iniciar sesión interactiva con Claude 4.6
claude --model sonnet

# Ejecutar consulta puntual con un modelo específico
claude --model opus -p "Analiza la arquitectura distribuida"
```

## 4. Comandos y Funcionalidades del CLI

### Consultas One-off
Usa `-p` para ejecutar tareas sin entrar en el TUI interactivo, ideal para integración con scripts.
```bash
claude -p "Genera un resumen de los cambios"
```

### Comandos Útiles
- `claude doctor`: Diagnóstico de salud.
- `claude agents`: Lista agentes configurados.
- `claude mcp list`: Muestra herramientas disponibles de Sko-Brain.

## 5. Estrategia Sko-Nexus (Cerebro Compartido)
1. **Instrucciones Transversales**: Inyecta los prompts de Sko-Brain en `~/.claude/CLAUDE.md`. Claude Code une estas instrucciones con las locales, permitiendo que el conocimiento del agente persista entre diferentes proyectos.
2. **MCP Everywhere**: Al configurar Sko-Nexus como un MCP global (ej. `node` con el argumento `/ruta/a/mcp/index.js`), el agente siempre tendrá acceso a la memoria virtual y herramientas de orquestación, independientemente del `cwd`.
3. **Optimización de Modelo**: Utiliza `sonnet` (4.6) para tareas estándar y escala a `opus` (4.5) solo cuando el análisis de Sko-Brain determine una complejidad alta.

> [!IMPORTANT]
> La configuración global en `~/.claude/` prevalece o se combina con la local, lo que permite que Sko-Nexus actúe como una capa de inteligencia superior sobre cualquier código.
