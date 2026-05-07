---
name: OpenCode
description: Guía definitiva de OpenCode para orquestación de agentes agnósticos, configuración de TUI/LSP y despliegue de sub-agentes en el ecosistema Sko-Nexus.
version: 1.1
stack: ["OpenCode", "MCP", "JSONC", "Markdown"]
---

# 🤖 OpenCode — Orchestration & Agentic System

OpenCode es un motor de IA agentic *open-source* diseñado para la terminal. Su arquitectura cliente/servidor y su naturaleza agnóstica a proveedores lo convierten en el aliado perfecto para la orquestación distribuida de Sko-Nexus.

---

## 🏗️ 1. Entorno y Configuración

OpenCode centraliza su inteligencia en archivos `JSONC` persistentes. A diferencia de otros agentes, permite una granularidad total sobre el modelo, el proveedor y las herramientas disponibles.

### 📂 Rutas de Configuración
| Capa | Sistema | Ruta |
| :--- | :--- | :--- |
| **Global** | Windows | `%USERPROFILE%\.config\opencode\opencode.json` |
| **Global** | Unix | `~/.config/opencode/opencode.json` |
| **Local** | Proyecto | `.opencode/config.json` |

---

## 🧠 2. Integración con Sko-Nexus (MCP)

Para que OpenCode "vea" el Cerebro de Sko-Nexus, se debe registrar el servidor MCP en la configuración maestra.

### Configuración Maestra (`opencode.json`)
```jsonc
{
  "$schema": "https://opencode.ai/config.json",
  "mcp": {
    "sko-brain": {
      "type": "local",
      "command": "node",
      "args": ["C:/Users/ser_c/sko-nexus/mcp/index.js"] // Ajustar a ruta absoluta real
    }
  }
}
```

---

## 🛰️ 3. Sistema de Agentes y Sub-Agentes

OpenCode no es solo un chat; es un ecosistema de especialistas. Se pueden definir roles mediante configuración o archivos Markdown.

### A. Definición por Configuración
Ideal para flujos programáticos y restricciones de herramientas:

```jsonc
"agent": {
  "architect": {
    "mode": "primary",
    "model": "anthropic/claude-3-5-sonnet",
    "prompt": "Eres el arquitecto de Sko-Nexus. Diseñas sistemas escalables.",
    "tools": { "write": true, "bash": true }
  },
  "reviewer": {
    "mode": "subagent",
    "model": "google/gemini-2.0-flash",
    "description": "Revisión técnica de Pull Requests",
    "tools": { "read": true, "edit": false }
  }
}
```

### B. Definición por Markdown (Premium)
Crea archivos en `.opencode/agents/<name>.md` para una inyección de contexto más rica:

```markdown
---
description: Especialista en diseño de UI/UX y CSS moderno.
mode: subagent
model: anthropic/claude-3-5-sonnet
tools:
  write: true
---
Actúa como un Stylist experto. Tu objetivo es crear interfaces premium 
siguiendo los principios de diseño de Sko-Nexus.
```

---

## 🛡️ 4. Protocolo de Seguridad y Permisos

OpenCode permite definir políticas de ejecución para evitar acciones destructivas accidentales.

```jsonc
{
  "permission": {
    "edit": { "*": "allow" },
    "bash": {
      "git *": "allow",
      "rm -rf *": "ask",
      "*": "ask"
    },
    "read": {
      "*.env": "ask",
      "node_modules/*": "deny"
    }
  }
}
```

---

## 🚦 5. Estrategia Sko-Nexus (Best Practices)

1.  **Inyección de Identidad**: Vincula siempre el archivo global de reglas de Sko-Nexus en la sección `instructions`.
    ```jsonc
    "instructions": ["~/.config/opencode/SKO_RULES.md"]
    ```
2.  **Multi-Model Strategy**: Usa Claude-3.5-Sonnet para lógica compleja y Gemini-2.0-Flash para tareas de lectura extensas o análisis de logs, optimizando costos.
3.  **Absolute Paths**: En Windows, utiliza siempre barras `/` en las rutas de configuración para evitar conflictos de escape.

> [!TIP]
> Puedes invocar sub-agentes especializados en cualquier momento mencionándolos directamente con el prefijo `@` (ej. `@reviewer analiza este commit`).