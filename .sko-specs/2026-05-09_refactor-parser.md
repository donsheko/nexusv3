---
project_id: nexusv3
title: Refactor del Parser de Misiones
context: |
  Se requiere refactorizar el motor de parsing de misiones (parse_spec) para eliminar la lógica compleja ("Frankenstein") y migrar al estándar de Frontmatter para los metadatos de la misión.
  ---
  ESTRATEGIA TÉCNICA:
  Utilizar un helper especializado 'specMdToJsonParse' de tipo async para separar la lógica de extracción de la lógica de orquestación, garantizando la higiene del archivo sko_spec.js.
---


# 🛠️ [PLAN_DE_EJECUCION]

### [STEP:1]

- **TITLE**: Crear helper especializado
- **AGENT**: @maestro
- **DEPENDS_ON**: null
- **CONTEXT**:
  > mcp/helpers/specMdToJsonParse.js
- **META**:
  > Implementar la lógica de extracción de Frontmatter y pasos utilizando regex robustos y soporte async.

---

### [STEP:2]

- **TITLE**: Refactorizar sko_spec.js
- **AGENT**: @maestro
- **DEPENDS_ON**: 1
- **CONTEXT**:
  > mcp/tools/sko_spec.js
- **META**:
  > Eliminar funciones internas de parsing y conectar el handler con el nuevo helper specMdToJsonParse.

---

### [STEP:3]

- **TITLE**: Actualizar Template oficial
- **AGENT**: @maestro
- **DEPENDS_ON**: 2
- **CONTEXT**:
  > assets/skills/sko-blueprint-template/SKILL.md
- **META**:
  > Migrar el bloque [SPEC_HEADER] a un formato YAML Frontmatter estándar.

---

## 🏁 [FIN_DEL_BLUEPRINT]
