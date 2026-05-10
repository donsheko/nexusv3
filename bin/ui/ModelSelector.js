import { createElement, useState, useEffect } from 'react';
import { Box, Text } from 'ink';
import { Select, Spinner } from '@inkjs/ui';
import { getLocalAgents, applyModels } from '../core/models.js';
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
  const [modelsByProvider, setModelsByProvider] = useState({});
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [statusMessage, setStatusMessage] = useState('');

  useEffect(() => {
    async function init() {
      const aRes = await getLocalAgents();
      let models = {};
      try {
        const modelsPath = path.join(process.cwd(), 'opencode_models.json');
        const data = await fs.readFile(modelsPath, 'utf-8');
        models = JSON.parse(data);
      } catch (e) {
        // No hay modelos detectados
      }

      setAgents(aRes.data || []);
      setModelsByProvider(models);
      setPhase(PHASE.SELECT_AGENT);
    }
    init();
  }, []);

  const handleAgentSelect = (agentName) => {
    if (agentName === 'back') {
      onBack();
      return;
    }
    const agent = agents.find(a => a.name === agentName);
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
    
    setPhase(PHASE.APPLYING);
    const res = await applyModels({ [selectedAgent.name]: model });
    setStatusMessage(res.success ? `✅ Modelo "${model}" aplicado a ${selectedAgent.name}.` : `❌ Error: ${res.error}`);
    setPhase(PHASE.RESULT);
  };

  if (phase === PHASE.LOADING) {
    return createElement(Box, { padding: 1 }, createElement(Spinner, { label: "Cargando agentes locales..." }));
  }

  if (phase === PHASE.SELECT_AGENT) {
    const options = [
      ...agents.map(a => ({ label: `${a.name} (${a.currentModel || 'Sin modelo'})`, value: a.name })),
      { label: '⬅ Volver', value: 'back' }
    ];
    return createElement(Box, { flexDirection: 'column', padding: 1 },
      createElement(Text, { bold: true, color: 'cyan' }, '🎯 SELECCIONA UN AGENTE LOCAL'),
      createElement(Box, { marginTop: 1 },
        createElement(Select, { options, onChange: handleAgentSelect })
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
        createElement(Select, { options, onChange: handleProviderSelect })
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
        createElement(Select, { options, onChange: handleModelSelect })
      )
    );
  }

  if (phase === PHASE.APPLYING) {
    return createElement(Box, { padding: 1 }, createElement(Spinner, { label: "Inyectando modelo en archivo MD..." }));
  }

  if (phase === PHASE.RESULT) {
    return createElement(Box, { flexDirection: 'column', padding: 1 },
      createElement(Text, null, statusMessage),
      createElement(Box, { marginTop: 1 },
        createElement(Select, { 
          options: [{ label: 'Volver a Agentes', value: 'back' }], 
          onChange: () => setPhase(PHASE.SELECT_AGENT) 
        })
      )
    );
  }

  return null;
}
