---
name: Gemini CLI
description: Guía oficial de Gemini CLI (Google Gemini) para automatización de tareas, análisis de código y extensibilidad mediante comandos y MCP.
---

# Gemini CLI - Guía de Implementación y Uso

Gemini CLI es el motor de línea de comandos de Google para flujos de trabajo de IA que permite interactuar con los modelos Gemini directamente desde la terminal con soporte profundo para herramientas locales y protocolos MCP.

## 1. Directorios de Configuración Local

Gemini CLI utiliza el directorio `.gemini/` para persistir ajustes globales y locales de sesión.

### Ubicaciones Globales (`~/.gemini/`)
| Sistema Operativo | Ruta del Directorio |
| :--- | :--- |
| **Windows** | `%USERPROFILE%\.gemini\` |
| **Linux / macOS** | `~/.gemini/` |

### Archivos de Configuración Clave
- **`settings.json`**: Archivo maestro que controla el comportamiento del modelo, la interfaz, la seguridad y los servidores MCP.
- **`commands/`**: Directorio para comandos personalizados ("slash commands") globales en `~/.gemini/commands/`.
- **`GEMINI.md`**: Por defecto, Gemini CLI busca este archivo en el workspace para cargar instrucciones de contexto.

## 2. Gestión de MCP (Model Context Protocol)

Gemini CLI integra servidores MCP directamente a través de su archivo de configuración global.

### Configuración en `settings.json`
```json
{
  "mcpServers": {
    "sko-brain": {
      "command": "node /absolute/path/to/sko-nexus/mcp/index.js"
    }
  },
  "mcp": {
    "allowed": ["sko-brain"]
  }
}
```

### Seguridad y Permisos
- **`allowed`**: Lista blanca de servidores MCP en los que se confía.
- **`excluded`**: Servidores que deben ignorarse explícitamente.

## 3. Selección de Modelos y Contexto

Puedes configurar el modelo de razonamiento y cómo se recolecta el contexto del proyecto.

### Definición del Modelo
En `settings.json`:
```json
{
  "model": {
    "name": "gemini-3-pro-preview",
    "maxSessionTurns": -1
  }
}
```

### Gestión de Contexto Remoto
Puedes indicar a Gemini CLI que incluya directorios compartidos para cargar instrucciones de arquitectura:
```json
{
  "context": {
    "fileName": ["GEMINI.md", "CONTEXT.md"],
    "includeDirectories": ["/path/to/shared/brain/rules"]
  }
}
```

## 4. Comandos Personalizados (Custom Commands)

Gemini CLI permite extender su funcionalidad mediante archivos TOML en el directorio de comandos.
```bash
# Crear un comando global de refactorización
mkdir -p ~/.gemini/commands/refactor
# Archivo: ~/.gemini/commands/refactor/performance.toml
```

## 5. Estrategia Sko-Nexus (Cerebro Compartido)

1. **Configuración Centralizada**: Utiliza `~/.gemini/settings.json` para definir `sko-brain` como un servidor MCP de confianza.
2. **Inyección de Reglas Transversales**: Configura el campo `"includeDirectories"` en la sección de contexto para apuntar a la ruta central donde Sko-Nexus almacena sus políticas de IA.
3. **Automatización**: Usa los `slash commands` de Gemini CLI para crear puentes rápidos entre la terminal del usuario y la memoria virtual de Sko-Brain.

> [!IMPORTANT]
> **Rutas Multiplataforma**: Al igual que en el resto de herramientas agenticas, utiliza siempre rutas absolutas para comandos de servidor MCP. En Windows, prefiere `/` o `\\`.
