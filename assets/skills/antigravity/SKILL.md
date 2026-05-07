---
name: Antigravity
description: Guía oficial de Antigravity (Google Deepmind) para orquestación de agentes, gestión de skills y configuración de MCP.
---

# Antigravity - Guía de Implementación y Uso

Antigravity es el ecosistema de IA agentica de Google Deepmind que transforma el IDE en una plataforma de desarrollo autónoma, integrando editor, terminal y navegador.

## 1. Directorios de Configuración Local

Antigravity centraliza sus configuraciones para permitir una inteligencia persistente en todo el sistema operativo.

### Ubicaciones Globales (`~/.gemini/`)
| Sistema Operativo | Ruta del Directorio |
| :--- | :--- |
| **Windows** | `%USERPROFILE%\.gemini\antigravity\` |
| **Linux / macOS** | `~/.gemini/antigravity/` |

### Archivos de Configuración Maestra
- **`GEMINI.md`**: **Instrucciones Globales**. Ubicado directamente en `~/.gemini/GEMINI.md`. Este archivo define las reglas de comportamiento y contexto que el agente aplica a todos los proyectos.
- **`mcp_config.json`**: Configuración de servidores MCP. Se puede acceder y editar desde la interfaz (Dropdown "..." > MCP Store > Manage > View raw config).
- **`skills/`**: Ubicado en `~/.gemini/antigravity/skills/`, contiene los paquetes de capacidades globales.

## 2. Configuración de MCP (Model Context Protocol)

### Configuración Global
La configuración se gestiona en un archivo JSON centralizado. Es imperativo separar el ejecutable de los argumentos para que el sistema operativo pueda realizar el `fork/exec`.
```json
// Ubicación: ~/.gemini/antigravity/mcp_config.json
{
  "mcpServers": {
    "sko-brain": {
      "command": "node",
      "args": ["/absolute/path/to/sko-nexus/mcp/index.js"]
    }
  }
}
```
> [!IMPORTANT]
> **Rutas Multiplataforma**: Al configurar servidores globales, utiliza siempre rutas absolutas. En Windows, usa barras `/` o dobles barras `\\`.

## 3. Modelos y Modos de Ejecución

Antigravity utiliza modelos de razonamiento de frontera para diferentes tipos de tareas.

### Modos de Operación
- **Planning Mode**: Para tareas de alta complejidad, investigación profunda y planes de refactorización multi-archivo.
- **Fast Mode**: Para ediciones rápidas, corrección de errores simples y consultas de código inmediatas.

### Modelos de Razonamiento Disponibles
- **Gemini 3 Pro (high/low)**: Modelos de razonamiento avanzado de Google.
- **Gemini 3 Flash**: Optimizado para velocidad y respuesta inmediata.
- **Claude Sonnet 4.5**: Integrado para capacidades de razonamiento alternativas.

## 4. Skills Framework (Extensibilidad)

Los Skills permiten añadir nuevas herramientas y protocolos de actuación al agente.

### Jerarquía de Carga
1. **Global Skills**: `~/.gemini/antigravity/skills/<skill-folder>/`
2. **Workspace Skills**: `.agent/skills/<skill-folder>/`

Cada skill requiere un archivo `SKILL.md` con frontmatter YAML que especifique `name` y `description`.

## 5. Estrategia Sko-Nexus (Cerebro Global)

1. **Prompt Injection**: Inyecta la lógica de orquestación de Sko-Nexus en `~/.gemini/GEMINI.md` para garantizar que Antigravity siempre consulte el sistema de memoria virtual.
2. **Sincronización de Skills**: Los skills definidos en Sko-Nexus pueden ser copiados o enlazados simbólicamente en `~/.gemini/antigravity/skills/` para habilitar capacidades de Sko-Nexus en cualquier proyecto.
3. **Persistencia de Contexto**: Utiliza el MCP global `sko-brain` para que el agente recupere memorias a largo plazo independientemente del espacio de trabajo abierto.

> [!TIP]
> Antigravity permite la ejecución de comandos de terminal de forma autónoma según las políticas de auto-ejecución configuradas en el sistema.
