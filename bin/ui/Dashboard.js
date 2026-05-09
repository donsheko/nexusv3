import { createElement, useState } from 'react';
import { Box, Text } from 'ink';
import { Select } from '@inkjs/ui';
import MissionMonitor from './MissionMonitor.js';

const PHASE = Object.freeze({
  MENU: 'menu',
  MONITOR: 'monitor',
});

export default function Dashboard({ onBack }) {
  const [phase, setPhase] = useState(PHASE.MENU);

  if (phase === PHASE.MONITOR) {
    return createElement(MissionMonitor, {
      onBack: () => setPhase(PHASE.MENU)
    });
  }

  return createElement(Box, { flexDirection: 'column' },
    createElement(Text, { bold: true, color: 'cyan', underline: true }, '🖥️ SKO-NEXUS DASHBOARD'),
    createElement(Box, { marginTop: 1 },
      createElement(Select, {
        options: [
          { label: '1. Monitor de Misiones (Live)', value: 'monitor' },
          { label: '2. Volver al Menú Principal', value: 'back' }
        ],
        onChange: (value) => {
          if (value === 'back') onBack();
          else setPhase(value);
        }
      })
    )
  );
}
