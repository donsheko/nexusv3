/**
 * specMdToJsonParse.js — Parser de Blueprint Sko-Spec v3 (MD -> JSON)
 * ==================================================================
 * Este helper abstrae la complejidad del regex para garantizar la 
 * compatibilidad del protocolo Sko-Spec entre el MD y el sistema.
 */

/**
 * Extrae el valor de un campo simple tipo "- **FIELD**: VALUE"
 */
const getField = (text, field) => {
  const regex = new RegExp(`${field}(?:\\*\\*|)\\s*:\\s*([^\\n>]+)`, "i");
  return text.match(regex)?.[1]?.trim();
};

/**
 * Extrae el contenido de un bloque tipo "- **FIELD**: \n > CONTENT"
 */
const getBlockquote = (text, field) => {
  const regex = new RegExp(`${field}(?:\\*\\*|)\\s*:\\s*\\n?\\s*>([\\s\\S]*?)(?=\\n\\s*-|\\n\\s*#|---|$|###)`, "i");
  const match = text.match(regex);
  if (!match) return "";
  return match[1]
    .split("\n")
    .map(line => line.trim().replace(/^>\s?/, ""))
    .join("\n")
    .trim();
};

/**
 * Parsea un Blueprint de Markdown siguiendo el protocolo Sko-Spec v3
 * Retorna un objeto JSON estructurado o lanza un error descriptivo.
 * 
 * @param {string} fileContent - Contenido del archivo Markdown
 * @returns {Promise<Object>} Blueprint en formato JSON
 */
export async function specMdToJsonParse(fileContent) {
  try {
    // 1. Extraer Header (Frontmatter YAML)
    // Buscamos el bloque entre --- que contenga project_id (para evitar colisiones con frontmatter de skills)
    const frontmatterBlocks = [...fileContent.matchAll(/---\s*\n([\s\S]*?)\n---/g)];
    const blueprintBlock = frontmatterBlocks.find(m => m[1].includes("project_id"));
    
    if (!blueprintBlock) throw new Error("No se encontró el bloque de configuración (Frontmatter --- conteniendo 'project_id').");
    
    const yamlContent = blueprintBlock[1];

    const getValue = (key) => {
      const regex = new RegExp(`${key}\\s*:\\s*(?:\\|\\s*\\n?([\\s\\S]*?)(?=\\n\\w+\\s*:|$)|([^\\n]+))`, "i");
      const match = yamlContent.match(regex);
      if (!match) return null;
      
      // Si es multi-línea (usó |)
      if (match[1]) {
        return match[1].split("\n").map(l => l.trim()).join("\n").trim();
      }
      // Si es línea simple
      return match[2]?.trim();
    };

    const projectId = getValue("project_id");
    const title = getValue("title");
    const context = getValue("context") || "";

    if (!projectId || !title) throw new Error("project_id y title son obligatorios en el Frontmatter.");

    // 2. Extraer Steps (Se mantiene el formato ### [STEP: N])
    const stepBlocks = fileContent.split(/###\s*\[STEP:/i).slice(1);
    if (stepBlocks.length === 0) throw new Error("No se encontraron bloques de pasos (### [STEP: N]).");

    const seenStepNumbers = new Set();
    const steps = stepBlocks.map(block => {
      const stepHeaderMatch = block.match(/^\s*(\d+)\s*\]/);
      if (!stepHeaderMatch) throw new Error(`No se pudo identificar el número de paso en bloque: ${block.substring(0, 30)}...`);
      
      const stepNumber = parseInt(stepHeaderMatch[1]);
      if (seenStepNumbers.has(stepNumber)) throw new Error(`Paso #${stepNumber} duplicado.`);
      seenStepNumbers.add(stepNumber);

      const sTitle = getField(block, "TITLE");
      if (!sTitle) throw new Error(`El Paso #${stepNumber} no tiene TITLE.`);

      const sDependsOnStr = getField(block, "DEPENDS_ON");
      const sDependsOn = (sDependsOnStr && sDependsOnStr.toLowerCase() !== "null") ? parseInt(sDependsOnStr) : null;

      return {
        stepNumber,
        title: sTitle,
        dependsOn: sDependsOn,
        context: getBlockquote(block, "CONTEXT"),
        meta: getBlockquote(block, "META")
      };
    });

    // 3. Validar Dependencias
    for (const s of steps) {
      if (s.dependsOn !== null) {
        if (s.dependsOn === s.stepNumber) throw new Error(`Paso #${s.stepNumber} no puede depender de sí mismo.`);
        if (!seenStepNumbers.has(s.dependsOn)) throw new Error(`Paso #${s.stepNumber} depende del paso inexistente #${s.dependsOn}.`);
      }
    }

    return { 
      projectId, 
      title, 
      context, 
      steps,
      totalSteps: steps.length
    };
  } catch (error) {
    // Propagar error con mensaje claro para que el Maestro pueda corregir el MD
    throw new Error(`[specMdToJsonParse] ${error.message}`);
  }
}
