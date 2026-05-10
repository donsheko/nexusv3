#!/usr/bin/env node

/**
 * InjectionFlow.js — Flujo de inyección con retroalimentación visual
 * =====================================================================
 * Componente que orquesta y muestra en vivo el progreso de la inyección
 * de Sko-Nexus en los agentes seleccionados. Ejecuta secuencialmente:
 *   1. syncMcp()         — Vincular servidor MCP
 *   2. provisionIdentity() — Provisionar identidad
 *   3. syncMaestro()     — Inyectar instrucciones Maestro
 *   4. syncSubagents()   — Copiar subagentes
 *
 * Cada paso muestra un Spinner mientras se ejecuta.
 *
 * @module ui/InjectionFlow
 */

import { createElement, useState, useEffect, useRef } from 'react';
import { Box, Text } from 'ink';
import { Spinner } from '@inkjs/ui';
import { homedir } from 'os';
import { join } from 'path';

// ─── Módulos Core ──────────────────────────────────────────────────────────

import { syncMaestro, syncSubagents, syncMcp, syncSkills } from '../core/injector.js';

// ─── Configuración de Pasos ────────────────────────────────────────────────

const STEPS = [
  { id: 'mcp', icon: '🔗', label: 'Servidor MCP' },
  { id: 'maestro', icon: '👑', label: 'Maestro (ADN)' },
  { id: 'subagents', icon: '🤖', label: 'Subagentes' },
  { id: 'skills', icon: '⚙️', label: 'Skills & Comandos' },
];


// ─── Helpers ───────────────────────────────────────────────────────────────

import { getMCPConfigPath } from '../helpers/getMCPConfigPath.js';

// ─── Sub-componente: Estado de un paso individual ──────────────────────────

/**
 * Renderiza el estado de un paso dentro del flujo de un agente.
 *
 * @param {Object}   props
 * @param {string}   props.id       - Identificador del paso
 * @param {string}   props.icon     - Emoji del paso
 * @param {string}   props.label    - Etiqueta descriptiva
 * @param {string}   props.status   - 'pending' | 'running' | 'completed' | 'error'
 * @param {string}   [props.error]  - Mensaje de error (si ocurrió)
 */
function StepRow({ icon, label, status, error }) {
  let statusContent;

  switch (status) {
    case 'running':
      statusContent = createElement(Box, { width: 16 },
        createElement(Spinner, { label: 'Ejecutando...' }),
      );
      break;
    case 'completed':
      statusContent = createElement(Text, { color: 'green' }, '✓ Completado');
      break;
    case 'error':
      statusContent = createElement(Box, { flexDirection: 'column' },
        createElement(Text, { color: 'red' }, '✗ Error'),
        error
          ? createElement(Text, { dimColor: true, color: 'red' }, `  ${error}`)
          : null,
      );
      break;
    default:
      statusContent = createElement(Text, { dimColor: true, color: 'gray' }, '○ Pendiente');
      break;
  }

  return createElement(
    Box,
    { marginLeft: 2 },
    createElement(Text, { color: status === 'error' ? 'red' : 'white' }, `${icon}  ${label}`),
    createElement(Box, { width: 4 }),
    statusContent,
  );
}

// ─── Sub-componente: Estado de un agente ───────────────────────────────────

/**
 * Renderiza el bloque de progreso para un agente específico.
 *
 * @param {Object}   props
 * @param {Object}   props.agent     - Información del agente { name, path }
 * @param {Object}   props.progress  - Estado de los pasos { mcp, identity, adn }
 * @param {boolean}  props.isActive  - Si es el agente actualmente procesándose
 */
function AgentBlock({ agent, progress, isActive }) {
  return createElement(
    Box,
    {
      flexDirection: 'column',
      marginTop: 1,
      borderStyle: isActive ? 'round' : undefined,
      borderColor: isActive ? 'cyan' : undefined,
      padding: isActive ? 0 : undefined,
    },
    // Nombre del agente
    createElement(Text,
      {
        bold: true,
        color: isActive ? 'cyan' : 'white',
        underline: true,
      },
      `${isActive ? '▶ ' : '  '}${agent.name}`,
    ),
    // Pasos
    ...STEPS.map((step) =>
      createElement(StepRow, {
        key: step.id,
        icon: step.icon,
        label: step.label,
        status: progress[step.id]?.status || 'pending',
        error: progress[step.id]?.error,
      }),
    ),
    createElement(Box, { height: 1 }),
  );
}

// ─── Sub-componente: Barra de progreso global ──────────────────────────────

/**
 * Barra de progreso global tipo [████░░░░] 50%.
 *
 * @param {number} current - Índice actual
 * @param {number} total   - Total de pasos
 */
function ProgressBar({ current, total }) {
  const barWidth = 20;
  const filled = Math.round((current / total) * barWidth);
  const empty = barWidth - filled;

  const bar = '█'.repeat(filled) + '░'.repeat(empty);
  const pct = Math.round((current / total) * 100);

  return createElement(Box, { marginTop: 1 },
    createElement(Text, { color: 'cyan' }, `  [${bar}] ${pct}%`),
  );
}

// ─── Componente Principal ──────────────────────────────────────────────────

/**
 * Flujo de inyección interactivo.
 *
 * Recibe los agentes seleccionados y ejecuta secuencialmente los 3 pasos
 * core para cada uno, mostrando spinners en vivo.
 *
 * @param {Object}   props
 * @param {Object}   props.agents     - Mapa de todos los agentes detectados
 * @param {string[]} props.selected   - Nombres de los agentes a inyectar
 * @param {Function} props.onComplete - Callback con array de resultados
 */
function InjectionFlow({ agents, selected, onComplete }) {
  const [progressMap, setProgressMap] = useState({});
  const [currentAgent, setCurrentAgent] = useState(null);
  const [currentStepId, setCurrentStepId] = useState(null);
  const [totalSteps] = useState(selected.length * STEPS.length);
  const [completedSteps, setCompletedSteps] = useState(0);
  const [phase, setPhase] = useState('running'); // 'running' | 'done'
  const allResults = useRef([]);
  const cancelled = useRef(false);

  useEffect(() => {
    if (selected.length === 0) {
      onComplete([]);
      return;
    }

    allResults.current = [];

    async function run() {
      for (const agentName of selected) {
        if (cancelled.current) break;
        
        // Safety: Skip if agentName is invalid
        if (!agentName || typeof agentName !== 'string') {
          console.error(`Invalid agent name: ${agentName}`);
          continue;
        }

        const agentInfo = agents[agentName];
        
        // Safety: Skip if agent not found
        if (!agentInfo) {
          console.error(`Agent not found in agents object: ${agentName}`);
          continue;
        }
        
        const agentPath = agentInfo?.path;
        const agentResults = { agent: agentName, steps: [] };

        // Inicializar progreso para este agente
        setCurrentAgent(agentName);

        for (const step of STEPS) {
          if (cancelled.current) break;

          setCurrentStepId(step.id);

          // Marcar paso como running
          setProgressMap((prev) => ({
            ...prev,
            [`${agentName}.${step.id}`]: { status: 'running' },
          }));

          try {
            let result;

            switch (step.id) {
              case 'mcp': {
                const res = await syncMcp({ [agentName]: agentInfo });
                result = res[agentName];
                break;
              }
              case 'maestro': {
                const res = await syncMaestro({ [agentName]: agentInfo });
                result = res[agentName];
                break;
              }
              case 'subagents': {
                const res = await syncSubagents({ [agentName]: agentInfo });
                result = res[agentName];
                break;
              }
              case 'skills': {
                const res = await syncSkills({ [agentName]: agentInfo });
                result = res[agentName];
                break;
              }
            }


            const success = result?.success === true;

            agentResults.steps.push({
              id: step.id,
              success,
              ...result,
              error: !success ? (result?.error || 'Error desconocido') : undefined,
            });

            // Marcar paso como completado o error
            setProgressMap((prev) => ({
              ...prev,
              [`${agentName}.${step.id}`]: {
                status: success ? 'completed' : 'error',
                error: result?.error,
              },
            }));
          } catch (err) {
            agentResults.steps.push({
              id: step.id,
              success: false,
              error: err.message || 'Error inesperado',
            });

            setProgressMap((prev) => ({
              ...prev,
              [`${agentName}.${step.id}`]: {
                status: 'error',
                error: err.message,
              },
            }));
          }

          setCompletedSteps((prev) => prev + 1);
        }

        allResults.current.push(agentResults);
      }

      if (!cancelled.current) {
        setPhase('done');
        onComplete(allResults.current);
      }
    }

    run();

    return () => {
      cancelled.current = true;
    };
  }, []); // Solo ejecutar al montar

  // ── Render ──

  if (phase === 'done') return null;

  const stepCount = completedSteps;

  return createElement(
    Box,
    { flexDirection: 'column', paddingX: 2, marginTop: 1 },
    createElement(Text, { bold: true, color: 'cyan' }, '⚡ Inyectando Sko-Nexus en los agentes...'),
    createElement(ProgressBar, { current: completedSteps, total: totalSteps }),
    createElement(Box, { marginTop: 1 },
      createElement(Text, { dimColor: true, color: 'gray' }, '─'.repeat(48)),
    ),
    // Bloque de cada agente
    ...selected.map((agentName) => {
      const progress = {};
      for (const step of STEPS) {
        progress[step.id] = progressMap[`${agentName}.${step.id}`] || { status: 'pending' };
      }

      // Determinar si este es el agente activo
      const agentIdx = selected.indexOf(agentName);
      const currentIdx = selected.indexOf(currentAgent);
      const isActive =
        currentAgent === agentName &&
        completedSteps >= agentIdx * STEPS.length &&
        completedSteps < (agentIdx + 1) * STEPS.length;

      // Si ya pasó de este agente, está completado
      const isDone = completedSteps >= (agentIdx + 1) * STEPS.length;

      return createElement(AgentBlock, {
        key: agentName,
        agent: { name: agentName, path: agents[agentName]?.path },
        progress,
        isActive: !isDone && isActive,
      });
    }),
  );
}

export default InjectionFlow;
