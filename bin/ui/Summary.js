#!/usr/bin/env node

/**
 * Summary.js — Resumen final de la inyección
 * =============================================
 * Componente que muestra una tabla resumen con los resultados de cada
 * agente y cada paso de la inyección. Presiona cualquier tecla para salir.
 *
 * @module ui/Summary
 */

import { createElement } from 'react';
import { Box, Text, useInput, useApp } from 'ink';

// ─── Configuración de pasos (coincide con InjectionFlow) ───────────────────

const STEP_LABELS = {
  mcp: '🔗 MCP',
  identity: '🔑 Auth',
  maestro: '👑 ADN',
  subagents: '🤖 Sub',
};

// ─── Sub-componente: Fila de resultado de un agente ────────────────────────

/**
 * Renderiza una fila con el nombre del agente y el resultado de cada paso.
 *
 * @param {Object} props
 * @param {string} props.agent  - Nombre del agente
 * @param {Array}  props.steps  - Array de resultados de pasos
 * @param {number} props.index  - Índice para alternar colores de fondo
 */
function AgentResultRow({ agent, steps, index }) {
  const successCount = steps.filter((s) => s.success).length;
  const totalCount = steps.length;
  const allOk = successCount === totalCount;

  return createElement(
    Box,
    { marginTop: 1 },
    // Nombre del agente
    createElement(Box, { width: 18 },
      createElement(Text,
        { bold: true, color: allOk ? 'green' : 'yellow' },
        allOk ? '✓' : '⚠',
      ),
      createElement(Text, { bold: true }, ` ${agent}`),
    ),
    // Estados individuales
    ...steps.map((step) =>
      createElement(Box, { width: 14, justifyContent: 'center' },
        createElement(Text,
          {
            color: step.success ? 'green' : 'red',
            dimColor: !step.success,
          },
          step.success ? '✓ OK' : '✗ FAIL',
        ),
      ),
    ),
    // Total
    createElement(Box, { width: 12 },
      createElement(Text,
        { color: allOk ? 'green' : 'yellow', bold: true },
        `${successCount}/${totalCount}`,
      ),
    ),
  );
}

/**
 * Renderiza errores de un agente si los hay.
 *
 * @param {Object} props
 * @param {string} props.agent - Nombre del agente
 * @param {Array}  props.steps - Array de resultados de pasos
 */
function AgentErrors({ agent, steps }) {
  const errors = steps.filter((s) => !s.success && s.error);

  if (errors.length === 0) return null;

  return createElement(Box, { flexDirection: 'column', marginLeft: 4 },
    ...errors.map((step) =>
      createElement(Text, { key: step.id, color: 'red', dimColor: true },
        `  ${agent}/${step.id}: ${step.error}`,
      ),
    ),
  );
}

// ─── Componente Principal ──────────────────────────────────────────────────

/**
 * Pantalla de resumen final.
 * Muestra una tabla con los resultados de cada agente y paso.
 * Presiona cualquier tecla para salir.
 *
 * @param {Object}   props
 * @param {Array}    props.results - Array de resultados por agente
 */
function Summary({ results }) {
  const { exit } = useApp();

  useInput(() => {
    exit();
  });

  const totalAgents = results.length;
  const totalSteps = results.reduce((acc, r) => acc + r.steps.length, 0);
  const successSteps = results.reduce(
    (acc, r) => acc + r.steps.filter((s) => s.success).length,
    0,
  );
  const allSuccessful = successSteps === totalSteps;
  const hasErrors = results.some((r) => r.steps.some((s) => !s.success));

  return createElement(
    Box,
    { flexDirection: 'column', paddingX: 2, marginTop: 1 },
    // Encabezado global
    createElement(Text,
      { bold: true, color: allSuccessful ? 'green' : 'yellow' },
      allSuccessful ? '✅ Inyección completada con éxito' : '⚠ Inyección completada con advertencias',
    ),
    createElement(Box, { marginTop: 1 },
      createElement(Text, { color: 'gray' }, '─'.repeat(56)),
    ),
    // Encabezados de columnas
    createElement(Box, { marginTop: 1 },
      createElement(Box, { width: 18 }),
      ...Object.values(STEP_LABELS).map((label) =>
        createElement(Box, { key: label, width: 14, justifyContent: 'center' },
          createElement(Text, { dimColor: true, bold: true }, label),
        ),
      ),
      createElement(Box, { width: 12 },
        createElement(Text, { dimColor: true, bold: true }, 'Total'),
      ),
    ),
    createElement(Box, { marginTop: 1 },
      createElement(Text, { color: 'gray' }, '─'.repeat(56)),
    ),
    // Resultados por agente
    ...results.map((result, i) =>
      createElement(AgentResultRow, {
        key: result.agent,
        agent: result.agent,
        steps: result.steps,
        index: i,
      }),
    ),
    createElement(Box, { marginTop: 1 },
      createElement(Text, { color: 'gray' }, '─'.repeat(56)),
    ),
    // Errores (si los hay)
    ...(hasErrors
      ? [
          createElement(Box, { marginTop: 1, flexDirection: 'column' },
            createElement(Text, { color: 'red', bold: true }, '📋 Detalle de errores:'),
            ...results.map((result) =>
              createElement(AgentErrors, {
                key: `err-${result.agent}`,
                agent: result.agent,
                steps: result.steps,
              }),
            ),
          ),
        ]
      : []),
    // Resumen estadístico
    createElement(Box, { marginTop: 2, flexDirection: 'column' },
      createElement(Text, { dimColor: true },
        `Agentes procesados: ${totalAgents}  |  Pasos: ${successSteps}/${totalSteps} exitosos`,
      ),
    ),
    // Hint de salida
    createElement(Box, { marginTop: 1 },
      createElement(Text, { color: 'gray', italic: true },
        'Presiona cualquier tecla para salir.',
      ),
    ),
  );
}

export default Summary;
