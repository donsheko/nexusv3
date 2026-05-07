---
name: skill-creator
description: Experto en diseñar e implementar Skills predecibles para el entorno Sko-Nexus con soporte para el Cerebro en la nube.
---

# 🛠️ Skill Creator (Sko-Nexus Edition)

Este skill es un meta-procedimiento diseñado para que el **Maestro** o el sub-agente **Designer** generen nuevas habilidades (Skills) robustas, minimizando la improvisación técnica y asegurando la persistencia en el ecosistema global.

## 🚦 Cuándo usar este skill
- Cuando el usuario pida: "Crea un skill para [X]".
- Cuando el Maestro identifique un proceso repetitivo que deba estandarizarse (ej: "Configuración de Webhooks", "Auditoría de Logs").
- Cuando se necesite convertir un prompt largo y complejo en una herramienta reutilizable.

## 📋 Entradas Necesarias
- **Objetivo**: Qué debe lograr el nuevo skill.
- **Contexto Técnico**: Stack (Next.js, Prisma, etc.), herramientas MCP disponibles y rutas de archivos.
- **Nivel de Libertad**: (Bajo = Comandos exactos | Medio = Plantillas | Alto = Heurísticas).

## 🔄 Workflow Adaptado (Protocolo Maestro)

### 1. Planificación (INTERNAL)
- Definir el slug del skill (ej: `next-auth-v5`).
- Mapear triggers claros (¿Cuándo se activa?).
- Listar los `inputs` mínimos.

### 2. Diseño de Lógica
- Escribir las instrucciones del `SKILL.md` siguiendo la estructura:
    - Frontmatter YAML.
    - Cuándo usar.
    - Inputs necesarios.
    - Workflow paso a paso.
    - Formato de salida esperado.

### 3. Validación (BLOQUEO MAESTRO)
- Presentar el resumen del skill al usuario.
- **MANDATORIO**: Preguntar: "¿Deseas que persista este Skill en el Cerebro?".

### 4. Implementación y Persistencia
- Si el usuario aprueba, ejecutar el comando:
  `sko_skill_add({ name: slug, content: full_markdown_content })`
- Esto creará el archivo en `skills/<slug>/SKILL.md` y lo guardará en la base de datos de `sko-brain`.

## 🛡️ Regla de No-Fragmentación (Anti-Loss Context)
**CRÍTICO**: Para evitar que el agente pierda la visión general o la "intención" del proyecto debido a saltos de contexto:
- **Priorizar la Consolidación**: Mantener temas relacionados (arquitectura, lógica y API) en un solo archivo `SKILL.md`.
- **Evitar Sub-Skills**: Solo fragmentar si el archivo supera las 5,000 líneas o si los componentes son opcionales y totalmente desconectados entre sí.
- **Single Source of Truth**: Es preferible una Skill robusta y larga que múltiples Skills pequeñas que diluyan la autoridad del estándar.

## 📐 Estructura de Salida Obligatoria
El skill debe generar siempre:
1. **Ruta**: `skills/<slug>/`
2. **SKILL.md**: Contenido completo con YAML.
3. **Recursos** (Opcional): Scripts `.sh` o plantillas `.md` dentro de la carpeta del skill.

## 🛡️ Niveles de Libertad
1. **Alta Libertad**: Brainstorming/Ideas. (Ej: `ux-advisor`)
2. **Media Libertad**: Flujos estándar. (Ej: `crud-generator`)
3. **Baja Libertad**: Operaciones frágiles/Seguridad. (Ej: `db-migration`)

---

## 🤵 Instrucciones para el Maestro
Al usar este Skill, **tú eres el garante del estándar**. No permitas descripciones vagas. Si el skill es para una API externa, obliga a incluir una sección de "Manejo de Errores". Si el skill usa comandos de terminal, asegúrate de que sean compatibles con el OS detectado en `user_information`.

**Identidad del Cerebro**: Recuerda siempre informar al usuario que el skill ahora reside en su "Cerebro Global" y podrá ser invocado por otros agentes en el futuro.
