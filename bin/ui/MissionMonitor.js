import { createElement, useState, useEffect } from 'react';
import { Box, Text } from 'ink';
import { Select } from '@inkjs/ui';
import prisma from '@sko/prisma/lib/prisma.js';

export default function MissionMonitor({ onBack }) {
  const [specs, setSpecs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchSpecs() {
      try {
        const data = await prisma.spec.findMany({
          orderBy: { createdAt: 'desc' },
          take: 5,
          include: {
            project: true
          }
        });
        if (isMounted) {
          setSpecs(data);
          setLoading(false);
          setError(null);
        }
      } catch (err) {
        if (isMounted) {
          setError(`Error DB: ${err.message}`);
          setLoading(false);
        }
      }
    }
    fetchSpecs();
    const timer = setInterval(fetchSpecs, 3000);
    return () => {
      isMounted = false;
      clearInterval(timer);
    };
  }, []);

  const handleAction = async (value) => {
      try {
        if (value === 'back') {
            onBack();
            return;
        }
        
        const [action, id] = value.split(':');
        if (isNaN(parseInt(id))) return;

        if (action === 'delete') {
            await prisma.spec.delete({ where: { id: parseInt(id) } });
        } else if (action === 'complete') {
            await prisma.spec.update({ 
                where: { id: parseInt(id) },
                data: { status: 'completed', percentage: 100 }
            });
        }
      } catch (err) {
          setError(`Acción fallida: ${err.message}`);
      }
  };

  if (loading) return createElement(Text, { color: 'yellow' }, '⏳ Cargando monitor de misiones...');
  if (error) return createElement(Box, { flexDirection: 'column' },
    createElement(Text, { color: 'red' }, `❌ ${error}`),
    createElement(Box, { marginTop: 1 },
      createElement(Select, {
        options: [{ label: '⬅ Volver al Menú', value: 'back' }],
        onChange: handleAction
      })
    )
  );

  const options = [
      { label: '⬅ Volver al Menú', value: 'back' }
  ];

  specs.forEach(spec => {
      const displayTitle = spec.title.length > 20 ? `${spec.title.slice(0, 20)}...` : spec.title;
      if (spec.status !== 'completed') {
          options.push({ label: `✅ Completar: ${displayTitle}`, value: `complete:${spec.id}` });
      }
      options.push({ label: `❌ Eliminar: ${displayTitle}`, value: `delete:${spec.id}` });
  });

  return createElement(Box, { flexDirection: 'column' },
    createElement(Text, { bold: true, color: 'cyan', underline: true }, '🛰️ MONITOR DE MISIONES (SKO-BRAIN)'),
    createElement(Box, { flexDirection: 'column', marginY: 1 },
        specs.length === 0 && createElement(Text, { dimColor: true }, 'No hay misiones recientes.'),
        ...specs.map(spec => {
            const percentage = spec.percentage || 0;
            const statusColor = spec.status === 'completed' ? 'green' : (spec.status === 'failed' ? 'red' : 'yellow');
            
            return createElement(Box, { key: spec.id, flexDirection: 'column', marginBottom: 1, borderStyle: 'round', borderColor: 'gray', paddingX: 1 },
                createElement(Box, { justifyContent: 'space-between' },
                    createElement(Text, { bold: true, color: 'magenta' }, `ID: ${spec.id} | ${spec.project?.name || 'Unknown'}`),
                    createElement(Text, { color: statusColor }, spec.status.toUpperCase())
                ),
                createElement(Text, null, spec.title),
                createElement(Box, null,
                    createElement(Text, { color: 'blue' }, `Progreso: [${'█'.repeat(Math.floor(percentage/5))}${'░'.repeat(20 - Math.floor(percentage/5))}] ${percentage}%`)
                )
            );
        })
    ),
    createElement(Box, { marginTop: 1 },
      createElement(Select, {
        options: options,
        onChange: handleAction
      })
    )
  );
}
