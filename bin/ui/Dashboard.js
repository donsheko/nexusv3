import { createElement, useState } from 'react';
import { Box, Text } from 'ink';
import { Select, Spinner } from '@inkjs/ui';
import MissionMonitor from './MissionMonitor.js';
import { createBackup } from '../helpers/createBackup.js';
import { purgeEnvironment } from '../helpers/purgeEnvironment.js';
import { loadLocalState } from '../core/identity.js';

const PHASE = Object.freeze({
  MENU: 'menu',
  MONITOR: 'monitor',
  WORKING: 'working',
  RESULT: 'result'
});

export default function Dashboard({ onBack }) {
  const [phase, setPhase] = useState(PHASE.MENU);
  const [statusMessage, setStatusMessage] = useState('');
  const [loadingLabel, setLoadingLabel] = useState('');

  const getActiveAgents = async () => {
    const state = await loadLocalState();
    const active = {};
    Object.entries(state.activeAgents || {}).forEach(([id, info]) => {
      if (info.enabled) active[id] = info;
    });
    return active;
  };

  const handleAction = async (action) => {
    const activeAgents = await getActiveAgents();
    if (Object.keys(activeAgents).length === 0) {
      setStatusMessage('❌ No hay agentes activos.');
      return;
    }

    if (action === 'backup') {
      setLoadingLabel('📦 Creando respaldo ZIP...');
      setPhase(PHASE.WORKING);
      const res = await createBackup(activeAgents);
      setStatusMessage(JSON.stringify(res, null, 2));
    } else {
      setLoadingLabel('🧹 Ejecutando Purga (Modo Fresh)...');
      setPhase(PHASE.WORKING);
      const res = await purgeEnvironment(activeAgents);
      setStatusMessage(JSON.stringify(res, null, 2));
    }
    setPhase(PHASE.RESULT);
  };

  if (phase === PHASE.MONITOR) {
    return createElement(MissionMonitor, {
      onBack: () => setPhase(PHASE.MENU)
    });
  }

  if (phase === PHASE.WORKING) {
    return createElement(Box, { padding: 1 },
      createElement(Spinner, { label: loadingLabel })
    );
  }

  if (phase === PHASE.RESULT) {
    return createElement(Box, { flexDirection: 'column', padding: 1 },
      createElement(Text, { color: 'green', bold: true }, '✅ OPERACIÓN COMPLETADA'),
      createElement(Box, { marginY: 1, padding: 1, borderStyle: 'single', borderColor: 'gray' },
        createElement(Text, null, statusMessage)
      ),
      createElement(Select, {
        options: [{ label: 'Volver al Dashboard', value: 'back' }],
        onChange: () => {
            setStatusMessage('');
            setPhase(PHASE.MENU);
        }
      })
    );
  }

  return createElement(Box, { flexDirection: 'column' },
    createElement(Text, { bold: true, color: 'cyan', underline: true }, '🖥️ SKO-NEXUS DASHBOARD'),
    statusMessage && phase === PHASE.MENU && createElement(Text, { color: 'yellow' }, statusMessage),
    createElement(Box, { marginTop: 1 },
      createElement(Select, {
        options: [
          { label: '1. Monitor de Misiones (Live)', value: 'monitor' },
          { label: '2. Crear Respaldo (ZIP)', value: 'backup' },
          { label: '3. Modo Fresh (Purga Total)', value: 'purge' },
          { label: '4. Volver al Menú Principal', value: 'back' }
        ],
        onChange: (value) => {
          if (value === 'back') onBack();
          else if (value === 'backup' || value === 'purge') handleAction(value);
          else setPhase(value);
        }
      })
    )
  );
}
