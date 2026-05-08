#!/usr/bin/env node

/**
 * Banner.js — Pantalla de bienvenida interactiva
 * ================================================
 * Componente de bienvenida con arte ASCII estilizado.
 * Aguarda la tecla Enter para avanzar al siguiente paso.
 *
 * @module ui/Banner
 */

import { createElement } from 'react';
import { Box, Text, useInput } from 'ink';

// ─── Arte del Banner ───────────────────────────────────────────────────────

const BANNER_LINES = [
  { text: '╔══════════════════════════════════════════╗', color: 'cyan', bold: true },
  { text: '║                                          ║', color: 'cyan', bold: true },
  { text: '║        ███████╗██╗  ██╗ ██████╗          ║', color: 'cyan', bold: true },
  { text: '║        ██╔════╝██║ ██╔╝██╔═══██╗         ║', color: 'cyan', bold: true },
  { text: '║        ███████╗█████╔╝ ██║   ██║         ║', color: 'cyan', bold: true },
  { text: '║        ╚════██║██╔═██╗ ██║   ██║         ║', color: 'cyan', bold: true },
  { text: '║        ███████║██║  ██╗╚██████╔╝         ║', color: 'cyan', bold: true },
  { text: '║        ╚══════╝╚═╝  ╚═╝ ╚═════╝          ║', color: 'cyan', bold: true },
  { text: '║                                          ║', color: 'cyan', bold: true },
  { text: '║           N E X U S   v3.0.0             ║', color: 'green', bold: true },
  { text: '║                                          ║', color: 'cyan', bold: true },
  { text: '╚══════════════════════════════════════════╝', color: 'cyan', bold: true },
];

// ─── Componente ────────────────────────────────────────────────────────────

/**
 * Pantalla de bienvenida del CLI.
 * Muestra el logo de Sko-Nexus y espera la tecla Enter.
 *
 * @param {Object}   props
 * @param {Function} props.onComplete - Callback al presionar Enter
 */
function Banner({ onComplete }) {
  useInput((_input, key) => {
    if (key.return) {
      onComplete();
    }
  });

  return createElement(
    Box,
    { flexDirection: 'column', alignItems: 'center', marginTop: 1 },
    // Líneas del banner
    ...BANNER_LINES.map((line, i) =>
      createElement(
        Text,
        { key: `banner-${i}`, color: line.color, bold: line.bold },
        line.text,
      ),
    ),
    // Descripción
    createElement(Box, { marginTop: 1 },
      createElement(Text, { dimColor: true },
        'Sistema Operativo de Agentes Inteligentes — Inyector de ADN',
      ),
    ),
    // Hint
    createElement(Box, { marginTop: 1 },
      createElement(Text, { color: 'gray', italic: true },
        'Presiona Enter para iniciar la detección de agentes...',
      ),
    ),
  );
}

export default Banner;
