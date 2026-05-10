import {readComponent} from "./readComponent.js";
import {join} from "path";

/**
 * Mapa de componentes del ADN y sus rutas relativas dentro de assets/.
 */
const COMPONENT_MAP = [
  {
    id: "manifest",
    paths: [join("maestro", "maestro_base.md")],
  },
  {
    id: "persona",
    paths: [join("maestro", "persona.md")],
  },
  {
    id: "shield",
    paths: [join("share", "shield.md")],
  },
];

/**
 * Ensambla las instrucciones de ADN para un agente específico.
 *
 * @param {string} agentName - Nombre del agente (ej: "maestro")
 * @returns {Promise<string>} Documento de ADN ensamblado
 */
export async function assembleADN(agentName) {
  const parts = [];

  for (const component of COMPONENT_MAP) {
    // El manifiesto (primer componente) debe conservar su frontmatter
    const shouldClean = component.id !== "manifest";
    const content = await readComponent(component.paths, shouldClean);
    if (content) {
      parts.push(content);
    }
  }

  if (parts.length === 0) {
    throw new Error(
      `[injector] No se encontraron componentes de ADN para ensamblar.`,
    );
  }

  return [...parts].join("\n\n");
}
