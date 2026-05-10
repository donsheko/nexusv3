#!/usr/bin/env node

/**
 * AgentSelector.js — Selección interactiva de agentes
 * ======================================================
 * Componente que muestra los agentes detectados en un MultiSelect
 * interactivo. El usuario selecciona los que desea inyectar.
 *
 * @module ui/AgentSelector
 */

import { createElement } from 'react';
import { Box, Text } from 'ink';
import { MultiSelect } from '@inkjs/ui';

// ─── Componente ────────────────────────────────────────────────────────────

/**
 * Menú de selección de agentes.
 *
 * @param {Object}   props
 * @param {Object}   props.agents     - Mapa de agentes detectados (name → {path, exists})
 * @param {string[]} props.initialSelected - Nombres de agentes preseleccionados
 * @param {Function} props.onSelect   - Callback con array de nombres seleccionados
 */
function AgentSelector({ agents, initialSelected, onSelect }) {
  const found = [];
  const notFound = [];

  for (const [name, info] of Object.entries(agents)) {
    if (info.exists) {
      found.push(name);
    } else {
      notFound.push(name);
    }
  }

  const options = found.map((name) => ({
    label: name,
    value: name,
  }));

  // Si no hay agentes detectados, mostrar mensaje informativo
  if (found.length === 0) {
    return createElement(
      Box,
      { flexDirection: 'column', alignItems: 'center', marginTop: 2 },
      createElement(Text, { color: 'yellow' }, '⚠ No se detectaron agentes locales.'),
      createElement(Box, { marginTop: 1 },
        createElement(Text, { dimColor: true },
          'Instala un agente compatible (OpenCode, Claude Code, Gemini CLI)',
        ),
      ),
      createElement(Box, { marginTop: 1 },
        createElement(Text, { dimColor: true, italic: true },
          'Presiona Ctrl+C para salir.',
        ),
      ),
    );
  }

  return createElement(
    Box,
    { flexDirection: 'column', paddingX: 2, marginTop: 1 },
    // Encabezado
    createElement(Text, { bold: true, color: 'cyan' }, '📡 Agentes Detectados'),
    createElement(Box, { marginTop: 1 },
      createElement(Text, { dimColor: true },
        'Usa ↑/↓ para navegar, [Espacio] para seleccionar, [Enter] para confirmar:',
      ),
    ),
    // Separador
    createElement(Box, { marginTop: 1 },
      createElement(Text, { color: 'gray' }, '─'.repeat(44)),
    ),
    // MultiSelect
    createElement(Box, { marginTop: 1 },
      createElement(MultiSelect, {
        options,
        defaultValues: initialSelected || [],
        onSubmit: (selected) => {
          // selected puede ser array de objetos { label, value } o array de strings
          const selectedValues = Array.isArray(selected) 
            ? selected.map((s) => typeof s === 'object' ? s.value : s).filter(Boolean)
            : [];
          onSelect(selectedValues);
        },
      }),
    ),
    // Agentes no detectados
    ...(notFound.length > 0
      ? [
          createElement(Box, { marginTop: 1, flexDirection: 'column' },
            createElement(Text, { dimColor: true, color: 'gray' }, 'No detectados (omitidos):'),
            ...notFound.map((name) =>
              createElement(Text, { key: name, dimColor: true, color: 'gray' },
                `  · ${name}`,
              ),
            ),
          ),
        ]
      : []),
  );
}

export default AgentSelector;
