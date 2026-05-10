#!/usr/bin/env node

/**
 * sko.js — Sko-Nexus v3 CLI Interactivo
 * =======================================
 * Basado en el menú clásico de la v2 pero con la potencia de Ink.
 */

import { createElement, useState, useCallback, useEffect } from 'react';
import { render, Box, Text, useApp } from 'ink';
import { Select } from '@inkjs/ui';

// ─── Módulos Core ──────────────────────────────────────────────────────────
import { detectLocalAgents } from './core/detector.js';
import { syncBrain } from './core/syncer.js';
import { provisionIdentity, exportIdentity, loadLocalState, saveLocalState } from './core/identity.js';
import { detectModels } from './core/models.js';

// ─── Componentes UI ────────────────────────────────────────────────────────
import Banner from './ui/Banner.js';
import AgentSelector from './ui/AgentSelector.js';
import InjectionFlow from './ui/InjectionFlow.js';
import Dashboard from './ui/Dashboard.js';
import Summary from './ui/Summary.js';

// ─── Definición de Fases ───────────────────────────────────────────────────
const PHASE = Object.freeze({
  BANNER: 'banner',
  MENU: 'menu',
  SYNCING: 'syncing',
  AUTODETECTING: 'autodetecting',
  SELECTING_FOR_INJECTION: 'selecting_for_injection',
  INJECTING: 'injecting',
  SUMMARY: 'summary',
  DETECTING_MODELS: 'detecting_models',
  ASSIGNING_MODELS: 'assigning_models',
  DASHBOARD: 'dashboard',
  EXPORTING_AUTH: 'exporting_auth'
});

function App() {
  const { exit } = useApp();
  const [phase, setPhase] = useState(PHASE.BANNER);
  const [statusMessage, setStatusMessage] = useState('');
  const [agents, setAgents] = useState({});
  const [selectedAgents, setSelectedAgents] = useState([]);
  const [results, setResults] = useState([]);
  const [isInitializing, setIsInitializing] = useState(true);

  // --- Inicialización de Estado Local ---
  useEffect(() => {
    async function init() {
      const state = await loadLocalState();
      
      // Si el archivo no existe o nunca se ha actualizado, forzamos detección inicial
      if (!state.updatedAt) {
        const detected = await detectLocalAgents();
        const activeAgents = {};
        
        Object.entries(detected).forEach(([id, info]) => {
          if (info.exists) {
            activeAgents[id] = { enabled: true, path: info.path };
          }
        });

        await saveLocalState({ updatedAt: new Date().toISOString(), activeAgents });
        setAgents(detected);
      } else {
        // Si ya existe, cargamos los agentes detectados para el menú
        const detected = await detectLocalAgents();
        setAgents(detected);
      }
      setIsInitializing(false);
    }
    init();
  }, []);

  const handleBannerComplete = useCallback(() => setPhase(PHASE.MENU), []);


  const handleMenuSelect = async (value) => {
    setStatusMessage('');
    switch (value) {
      case 'sync':
        setPhase(PHASE.SYNCING);
        const res = await syncBrain();
        setStatusMessage(res.success ? '✅ Cerebro sincronizado.' : `❌ Error: ${res.error}`);
        setTimeout(() => setPhase(PHASE.MENU), 2000);
        break;
      
      case 'detect':
        setPhase(PHASE.AUTODETECTING);
        const detected = await detectLocalAgents();
        setAgents(detected);
        setStatusMessage('✅ Agentes detectados.');
        setTimeout(() => setPhase(PHASE.MENU), 1500);
        break;

      case 'inject':
        const currentAgents = await detectLocalAgents();
        setAgents(currentAgents);
        setPhase(PHASE.SELECTING_FOR_INJECTION);
        break;

      case 'detect_models':
        setPhase(PHASE.DETECTING_MODELS);
        const mRes = await detectModels();
        setStatusMessage(mRes.success ? `✅ ${Object.keys(mRes.data).length} proveedores detectados.` : `❌ Error: ${mRes.error}`);
        setTimeout(() => setPhase(PHASE.MENU), 2000);
        break;

      case 'assign_models':
        setPhase(PHASE.ASSIGNING_MODELS);
        break;

      case 'dashboard':
        setPhase(PHASE.DASHBOARD);
        break;

      case 'auth':
        setPhase(PHASE.EXPORTING_AUTH);
        const auth = await exportIdentity();
        setStatusMessage(auth.success ? JSON.stringify(auth.data, null, 2) : '❌ No se encontró auth.json global.');
        break;

      case 'exit':
        exit();
        break;
    }
  };

  const handleInjectionComplete = (injectionResults) => {
    setResults(injectionResults || []);
    setPhase(PHASE.SUMMARY);
  };

  // --- Renderizado según fase ---
  
  if (phase === PHASE.BANNER) {
    return createElement(Banner, { onComplete: handleBannerComplete });
  }

  if (isInitializing) {
    return createElement(Box, { padding: 1 },
      createElement(Text, { color: 'yellow' }, '⏳ Inicializando Sko-Nexus v3...')
    );
  }

  return createElement(Box, { flexDirection: 'column', padding: 1 },
    createElement(Box, { borderStyle: 'round', borderColor: 'cyan', paddingX: 1, marginBottom: 1 },
      createElement(Text, { bold: true, color: 'magenta' }, ' SKO-NEXUS v3 CLI UTILITY ')
    ),

    phase === PHASE.MENU && createElement(Box, { flexDirection: 'column' },
      statusMessage && createElement(Text, { color: 'green' }, statusMessage),
      createElement(Box, { marginTop: 1 },
        createElement(Select, {
          visibleOptionCount: 10,
          options: [
            { label: '1. Dashboard (Monitor & Más)', value: 'dashboard' },
            { label: '2. Sincronizar Cerebro (Skills & Agentes)', value: 'sync' },
            { label: '3. Autodetectar Agentes Locales', value: 'detect' },
            { label: '4. Inyectar Maestro y MCP a Agentes Locales', value: 'inject' },
            { label: '5. Detectar Modelos de Opencode', value: 'detect_models' },
            { label: '6. Asignar Modelos a Agentes', value: 'assign_models' },
            { label: '7. Exportar Identidad OpenCode (auth.json)', value: 'auth' },
            { label: '8. Salir', value: 'exit' }
          ],
          onChange: handleMenuSelect
        })
      )
    ),

    phase === PHASE.SYNCING && createElement(Text, { color: 'yellow' }, '⏳ Sincronizando Cerebro...'),
    phase === PHASE.AUTODETECTING && createElement(Text, { color: 'cyan' }, '🔍 Escaneando agentes locales...'),
    phase === PHASE.DETECTING_MODELS && createElement(Text, { color: 'blue' }, '📡 Consultando modelos en OpenCode...'),
    
    phase === PHASE.SELECTING_FOR_INJECTION && createElement(AgentSelector, {
      agents,
      onSelect: (selected) => {
        if (selected.length === 0) {
          setPhase(PHASE.MENU);
        } else {
          setSelectedAgents(selected);
          setPhase(PHASE.INJECTING);
        }
      }
    }),

    phase === PHASE.INJECTING && createElement(InjectionFlow, {
      agents,
      selected: selectedAgents,
      onComplete: handleInjectionComplete
    }),

    phase === PHASE.SUMMARY && createElement(Summary, {
      results
    }),

    phase === PHASE.DASHBOARD && createElement(Dashboard, {
      onBack: () => setPhase(PHASE.MENU)
    }),

    phase === PHASE.ASSIGNING_MODELS && createElement(Box, { flexDirection: 'column' },
      createElement(Text, { color: 'yellow' }, '🏗️ Módulo de Asignación en construcción...'),
      createElement(Box, { marginTop: 1 },
        createElement(Select, {
          options: [{ label: 'Volver', value: 'back' }],
          onChange: () => setPhase(PHASE.MENU)
        })
      )
    ),

    phase === PHASE.EXPORTING_AUTH && createElement(Box, { flexDirection: 'column' },
      createElement(Text, { color: 'yellow', bold: true }, '🔐 IDENTIDAD OPENCODE (auth.json)'),
      createElement(Box, { marginTop: 1, padding: 1, borderStyle: 'single', borderColor: 'gray' },
        createElement(Text, null, statusMessage)
      ),
      createElement(Box, { marginTop: 1 },
        createElement(Select, {
          options: [{ label: 'Volver al Menú', value: 'back' }],
          onChange: () => setPhase(PHASE.MENU)
        })
      )
    )
  );
}

const { waitUntilExit } = render(createElement(App));
await waitUntilExit();
