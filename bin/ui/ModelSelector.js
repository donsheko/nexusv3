import { createElement, useState, useEffect } from 'react';
import { Box, Text } from 'ink';
import { Select, Spinner } from '@inkjs/ui';
import { getLocalAgents, applyModels, loadSelection, saveSelection } from '../core/models.js';
import fs from 'fs/promises';
import path from 'path';

const PHASE = Object.freeze({
  LOADING: 'loading',
  SELECT_AGENT: 'select_agent',
  SELECT_PROVIDER: 'select_provider',
  SELECT_MODEL: 'select_model',
  APPLYING: 'applying',
  RESULT: 'result'
});

export default function ModelSelector({ onBack }) {
  const [phase, setPhase] = useState(PHASE.LOADING);
  const [agents, setAgents] = useState([]);
  const [selection, setSelection] = useState({});
  const [modelsByProvider, setModelsByProvider] = useState({});
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [statusMessage, setStatusMessage] = useState('');

  useEffect(() => {
    async function init() {
      const aRes = await getLocalAgents();
      const currentSelection = await loadSelection();
      let models = {};
      try {
        const modelsPath = path.join(process.cwd(), 'opencode_models.json');
        const data = await fs.readFile(modelsPath, 'utf-8');
        models = JSON.parse(data);
      } catch (e) {
        // No hay modelos detectados
      }

      setAgents(aRes.data || []);
      setSelection(currentSelection);
      setModelsByProvider(models);
      setPhase(PHASE.SELECT_AGENT);
    }
    init();
  }, []);

  const handleAgentSelect = async (val) => {
    if (val === 'back') {
      onBack();
      return;
    }

    if (val === 'apply') {
      setPhase(PHASE.APPLYING);
      const res = await applyModels(selection);
      setStatusMessage(res.success ? `✅ Cambios aplicados a ${Object.keys(selection).length} agentes.` : `❌ Error: ${res.error}`);
      setPhase(PHASE.RESULT);
      return;
    }

    const agent = agents.find(a => a.name === val);
    setSelectedAgent(agent);
    
    if (Object.keys(modelsByProvider).length === 0) {
      setStatusMessage('❌ No se encontraron modelos detectados. Ejecuta "Detectar Modelos" en el menú principal primero.');
      setPhase(PHASE.RESULT);
    } else {
      setPhase(PHASE.SELECT_PROVIDER);
    }
  };

  const handleProviderSelect = (provider) => {
    if (provider === 'back') {
      setPhase(PHASE.SELECT_AGENT);
      return;
    }
    setSelectedProvider(provider);
    setPhase(PHASE.SELECT_MODEL);
  };

  const handleModelSelect = async (model) => {
    if (model === 'back') {
      setPhase(PHASE.SELECT_PROVIDER);
      return;
    }
    
    const newSelection = { ...selection, [selectedAgent.name]: model };
    setSelection(newSelection);
    await saveSelection(newSelection);
    setPhase(PHASE.SELECT_AGENT);
  };

  if (phase === PHASE.LOADING) {
    return createElement(Box, { padding: 1 }, createElement(Spinner, { label: "Cargando agentes locales..." }));
  }

  if (phase === PHASE.SELECT_AGENT) {
    const maxNameLength = Math.max(...agents.map(a => a.name.length), 15);
    const options = [
      ...agents.map(a => {
        const assignedModel = selection[a.name] || '---';
        const paddedName = a.name.padEnd(maxNameLength);
        return { 
          label: `${paddedName}  │  Modelo: ${assignedModel}`, 
          value: a.name 
        };
      }),
      { label: '──────────────────────────────────────────────────────────────────────────', value: 'sep' },
      { label: '🚀 APLICAR SELECCIÓN MAESTRA A ARCHIVOS LOCALES', value: 'apply' },
      { label: '⬅ Volver al Menú Principal', value: 'back' }
    ];
    return createElement(Box, { flexDirection: 'column', padding: 1 },
      createElement(Text, { bold: true, color: 'cyan' }, '🎯 GESTIÓN DE SELECCIÓN MAESTRA (opencode_selection.json)'),
      createElement(Box, { marginTop: 1 },
        createElement(Select, { options, onChange: (val) => val !== 'sep' && handleAgentSelect(val), visibleOptionCount: 20 })
      )
    );
  }

  if (phase === PHASE.SELECT_PROVIDER) {
    const options = [
      ...Object.keys(modelsByProvider).map(p => ({ label: p.toUpperCase(), value: p })),
      { label: '⬅ Atrás', value: 'back' }
    ];
    return createElement(Box, { flexDirection: 'column', padding: 1 },
      createElement(Text, { bold: true, color: 'magenta' }, `🔧 PROVEEDOR PARA: ${selectedAgent.name}`),
      createElement(Box, { marginTop: 1 },
        createElement(Select, { options, onChange: handleProviderSelect, visibleOptionCount: 20 })
      )
    );
  }

  if (phase === PHASE.SELECT_MODEL) {
    const options = [
      ...modelsByProvider[selectedProvider].map(m => ({ label: m, value: m })),
      { label: '⬅ Atrás', value: 'back' }
    ];
    return createElement(Box, { flexDirection: 'column', padding: 1 },
      createElement(Text, { bold: true, color: 'yellow' }, `🤖 MODELO DE ${selectedProvider.toUpperCase()}`),
      createElement(Box, { marginTop: 1 },
        createElement(Select, { options, onChange: handleModelSelect, visibleOptionCount: 20 })
      )
    );
  }

  if (phase === PHASE.APPLYING) {
    return createElement(Box, { padding: 1 }, createElement(Spinner, { label: "Inyectando modelos en archivos MD..." }));
  }

  if (phase === PHASE.RESULT) {
    return createElement(Box, { flexDirection: 'column', padding: 1 },
      createElement(Text, null, statusMessage),
      createElement(Box, { marginTop: 1 },
        createElement(Select, { 
          options: [{ label: 'Volver a Agentes', value: 'back' }], 
          onChange: () => setPhase(PHASE.SELECT_AGENT),
          visibleOptionCount: 20
        })
      )
    );
  }

  return null;
}
