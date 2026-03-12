// ═══════════════════════════════════════════════════════════════
// Layout Engine — API Data → Unifilar Template
// Transforma los datos reales de la instalacion en un esquema
// unifilar posicionado automaticamente.
// ═══════════════════════════════════════════════════════════════

import { UnifilarNode, UnifilarWire, UnifilarTemplate, uid, snap, SymbolType } from './types';

interface InstallationData {
  id: string;
  address?: string;
  titularName?: string;
  holderName?: string;
  voltage?: number;
  supplyType?: string;
  tipoAcometida?: string;
  seccionAcometida?: number;
  materialAcometida?: string;
  seccionDi?: number;
  materialDi?: string;
  longitudDi?: number;
  aislamientoDi?: string;
  tipoInstalacionDi?: string;
  igaCalibreA?: number;
  igaCurve?: string;
  igaPoles?: number;
  igaPowerCutKa?: number;
}

interface DifferentialData {
  id: string;
  name: string;
  calibreA: number;
  sensitivityMa: number;
  type: string;
  poles: number;
}

interface CircuitData {
  id: string;
  code?: string;
  name: string;
  voltage: number;
  power: number;
  phases: number;
  length: number;
  cableType: string;
  insulationType: string;
  installMethod: string;
  calculatedSection?: number;
  assignedBreaker?: string;
  voltageDrop?: number;
  differentialId?: string;
  maniobraType?: string;
  maniobraCalibreA?: number;
  maniobraExtra?: { chain?: Array<{ type: string; calibreA?: number; label?: string }> };
}

export function generateFromAPI(
  inst: InstallationData,
  panel: { differentials?: DifferentialData[] } | null,
  circuits: CircuitData[],
  supplyResult?: any,
): UnifilarTemplate {
  const cx = 500;
  let y = 40;
  const nodes: UnifilarNode[] = [];
  const wires: UnifilarWire[] = [];

  // -- Acometida --
  const acom: UnifilarNode = {
    id: uid(), type: 'acometida', x: cx, y,
    props: {
      tipoAcometida: inst.tipoAcometida || 'SUBTERRANEA',
      seccion: inst.seccionAcometida,
      material: inst.materialAcometida,
    },
  };
  nodes.push(acom);
  y += 50;

  // -- CGP --
  const cgp: UnifilarNode = { id: uid(), type: 'cgp', x: cx, y, props: {} };
  nodes.push(cgp);
  wires.push({ id: uid(), from: acom.id, to: cgp.id, fromPort: 'bottom', toPort: 'top', props: {} });
  y += 60;

  // -- Contador --
  const cont: UnifilarNode = { id: uid(), type: 'contador', x: cx, y, props: {} };
  nodes.push(cont);
  wires.push({ id: uid(), from: cgp.id, to: cont.id, fromPort: 'bottom', toPort: 'top', props: {} });
  y += 60;

  // -- IGA --
  const igaCalibre = supplyResult?.iga?.ratingA || inst.igaCalibreA || 40;
  const igaCurve = inst.igaCurve || 'C';
  const igaPoles = inst.igaPoles || 2;

  const iga: UnifilarNode = {
    id: uid(), type: 'magnetotermico', x: cx, y,
    props: { label: 'IGA', calibre: igaCalibre, curva: igaCurve, poles: igaPoles },
  };
  nodes.push(iga);

  const diSection = supplyResult?.di?.sectionMm2 || inst.seccionDi;
  wires.push({
    id: uid(), from: cont.id, to: iga.id,
    fromPort: 'bottom', toPort: 'top',
    props: {
      section: diSection,
      material: inst.materialDi || 'CU',
      conductores: igaPoles === 4 ? 4 : 2,
      length: inst.longitudDi,
      insulation: inst.aislamientoDi || 'XLPE',
    },
  });
  y += 80;

  // -- Guardar posicion Y de la barra (se crea despues) --
  const busY = y;
  const busId = uid();
  const tierraMainId = uid();

  // -- Agrupar circuitos por diferencial --
  const differentials = panel?.differentials || [];
  const totalCircuits = circuits.length || 5;
  const circuitSpacing = 90;

  const diffGroups: Array<{ diff: DifferentialData; circuits: CircuitData[] }> = [];

  if (differentials.length > 0) {
    for (const diff of differentials) {
      const diffCircuits = circuits.filter((c) => c.differentialId === diff.id);
      if (diffCircuits.length > 0) {
        diffGroups.push({ diff, circuits: diffCircuits });
      }
    }
    // Circuitos sin diferencial asignado
    const assignedIds = new Set(diffGroups.flatMap((g) => g.circuits.map((c) => c.id)));
    const unassigned = circuits.filter((c) => !assignedIds.has(c.id));
    if (unassigned.length > 0 && differentials[0]) {
      diffGroups[0]!.circuits.push(...unassigned);
    } else if (unassigned.length > 0) {
      diffGroups.push({
        diff: { id: 'auto', name: 'Dif.1', calibreA: 40, sensitivityMa: 30, type: 'AC', poles: 2 },
        circuits: unassigned,
      });
    }
  } else {
    diffGroups.push({
      diff: { id: 'auto', name: 'Dif.1', calibreA: 40, sensitivityMa: 30, type: 'AC', poles: 2 },
      circuits,
    });
  }

  // -- Posicionar diferenciales y circuitos --
  let circX = cx - (totalCircuits * circuitSpacing) / 2 + circuitSpacing / 2;
  const diffY = busY + 20;
  const diffPositions: number[] = [];

  // Opción B GLOBAL: detectar si ALGÚN circuito en TODA la instalación tiene maniobra
  // Si es así, TODOS los receptores bajan al mismo nivel para alinear horizontalmente
  const piaY = diffY + 90;
  const getChain = (c: CircuitData) => c.maniobraExtra?.chain ?? (c.maniobraType ? [{ type: c.maniobraType, calibreA: c.maniobraCalibreA }] : []);
  const maxChainLen = Math.max(0, ...circuits.map((c) => getChain(c).length));
  const anyCircuitHasManiobra = maxChainLen > 0;
  const DEVICE_SPACING = 45; // vertical space per maniobra device (compact)
  const maniobraStartY = piaY + 50;
  const receptorY = anyCircuitHasManiobra
    ? piaY + 55 + maxChainLen * DEVICE_SPACING + 20
    : piaY + 80;

  for (const group of diffGroups) {
    const { diff, circuits: groupCircuits } = group;
    const groupStart = circX;
    const groupEnd = circX + (groupCircuits.length - 1) * circuitSpacing;
    const diffX = (groupStart + groupEnd) / 2;

    diffPositions.push(diffX);

    // Nodo diferencial
    const diffNode: UnifilarNode = {
      id: uid(), type: 'diferencial', x: snap(diffX), y: diffY,
      props: {
        label: diff.name,
        calibre: diff.calibreA,
        sensitivity: diff.sensitivityMa,
        type: diff.type,
      },
    };
    nodes.push(diffNode);
    wires.push({ id: uid(), from: busId, to: diffNode.id, fromPort: 'bottom', toPort: 'top', props: {} });

    // Sub-barra
    const subBusW = Math.max(30, (groupCircuits.length - 1) * circuitSpacing + 30);
    const subBus: UnifilarNode = {
      id: uid(), type: 'busbar', x: snap(diffX), y: diffY + 70,
      props: { width: subBusW, label: '' },
    };
    nodes.push(subBus);
    wires.push({ id: uid(), from: diffNode.id, to: subBus.id, fromPort: 'bottom', toPort: 'top', props: {} });

    // Tierra en sub-barra
    nodes.push({
      id: uid(), type: 'tierra',
      x: snap(diffX) + subBusW / 2 + 20, y: diffY + 66,
      props: {},
    });

    // Circuitos — alturas calculadas globalmente (Opción B)
    for (const circ of groupCircuits) {
      const breakerCalibre = circ.assignedBreaker
        ? parseInt(circ.assignedBreaker.replace(/\D/g, ''))  || null
        : null;

      // PIA
      let lastNodeId: string;
      const pia: UnifilarNode = {
        id: uid(), type: 'magnetotermico', x: snap(circX), y: piaY,
        props: {
          label: circ.code || circ.name.substring(0, 4),
          calibre: breakerCalibre,
          curva: 'C',
          poles: circ.phases === 3 ? 4 : 2,
        },
      };
      nodes.push(pia);
      wires.push({ id: uid(), from: subBus.id, to: pia.id, fromPort: 'bottom', toPort: 'top', props: {} });
      lastNodeId = pia.id;

      // Maniobra chain — iterate devices in series
      const chain = getChain(circ);
      if (chain.length > 0) {
        for (let ci = 0; ci < chain.length; ci++) {
          const dev = chain[ci];
          if (!dev) continue;
          const devY = maniobraStartY + ci * DEVICE_SPACING;
          const devCalibre = dev.calibreA || breakerCalibre || 16;
          let maniobraNode: UnifilarNode;

          switch (dev.type) {
            case 'CONTACTOR':
              maniobraNode = {
                id: uid(), type: 'contactor', x: snap(circX), y: devY,
                props: { calibre: devCalibre, phases: circ.phases === 3 ? 3 : 1 },
              };
              break;
            case 'GUARDAMOTOR':
              maniobraNode = {
                id: uid(), type: 'guardamotor', x: snap(circX), y: devY,
                props: {
                  calibre: devCalibre,
                  range: `${Math.round(devCalibre * 0.6)}-${devCalibre}`,
                  phases: circ.phases === 3 ? 3 : 1,
                },
              };
              break;
            case 'RELOJ':
              maniobraNode = {
                id: uid(), type: 'reloj_horario', x: snap(circX), y: devY,
                props: { label: dev.label || 'KT' },
              };
              break;
            case 'SECCIONADOR':
              maniobraNode = {
                id: uid(), type: 'seccionador', x: snap(circX), y: devY,
                props: { label: dev.label || 'QS', calibre: devCalibre },
              };
              break;
            default:
              maniobraNode = {
                id: uid(), type: 'contactor', x: snap(circX), y: devY,
                props: { calibre: devCalibre, phases: circ.phases === 3 ? 3 : 1 },
              };
          }
          nodes.push(maniobraNode);
          wires.push({ id: uid(), from: lastNodeId, to: maniobraNode.id, fromPort: 'bottom', toPort: 'top', props: {} });
          lastNodeId = maniobraNode.id;
        }
      }

      // Receptor — use loadType field, fallback to name regex
      const lt = (circ as any).loadType as string | undefined;
      const endType: SymbolType = lt === 'MOTOR' ? 'motor'
        : lt === 'ALUMBRADO' ? 'punto_luz'
        : lt === 'ALUMBRADO_EMERGENCIA' ? 'alumbrado_emergencia'
        : lt === 'RESISTIVO' ? 'resistivo'
        : lt === 'IRVE' ? 'irve'
        : lt === 'DOMOTICA' ? 'domotica'
        : lt === 'FUERZA' ? 'toma_corriente'
        : /motor|bomba|compresor|ventilador/i.test(circ.name) ? 'motor'
        : /alumbrado|luz|iluminaci/i.test(circ.name) ? 'punto_luz'
        : 'toma_corriente';
      const endNode: UnifilarNode = {
        id: uid(), type: endType, x: snap(circX), y: receptorY,
        props: {
          label: '',
          ...(endType === 'motor' ? { potencia: `${circ.power}W`, phases: circ.phases === 3 ? 3 : 1 } : {}),
        },
      };
      nodes.push(endNode);
      wires.push({
        id: uid(), from: lastNodeId, to: endNode.id,
        fromPort: 'bottom', toPort: 'top',
        props: {},
      });

      // Bloque info compacto debajo del receptor — SIEMPRE 6 líneas fijas
      const infoX = snap(circX);
      const infoY = receptorY + 24;
      const blockW = circuitSpacing - 10;
      const nConductors = circ.phases === 3 ? 4 : 2;
      const sectionStr = circ.calculatedSection ? `${nConductors}×${circ.calculatedSection}mm² ${circ.cableType}` : '';
      const insulStr = `${circ.insulationType || 'PVC'} · ${circ.length}m`;
      const cdtStr = circ.voltageDrop != null ? `CdT:${circ.voltageDrop.toFixed(1)}%` : '';
      // Extract curve from assignedBreaker (e.g. "16A curva C" → "C", "C16" → "C")
      const breakerStr = circ.assignedBreaker || '';
      const curveMatch = breakerStr.match(/curva\s+([A-D])/i) || breakerStr.match(/^([A-D])\d/);
      const curve = curveMatch?.[1]?.toUpperCase() || 'C';
      const piaStr = breakerCalibre ? `${breakerCalibre}A ${curve}` : '';
      const powerStr = [circ.power ? `${circ.power}W` : '', piaStr].filter(Boolean).join(' · ');
      const circLabel = circ.code && circ.name.startsWith(circ.code)
        ? circ.name
        : `${circ.code || ''} ${circ.name}`.trim();

      // Siempre 2 líneas para nombre — partir si largo, pad si corto
      const maxChars = 14;
      let nameLine1 = circLabel;
      let nameLine2 = '';
      if (circLabel.length > maxChars) {
        let splitAt = circLabel.lastIndexOf(' ', maxChars);
        if (splitAt <= 0) splitAt = maxChars;
        nameLine1 = circLabel.substring(0, splitAt);
        nameLine2 = circLabel.substring(splitAt).trimStart();
        // Si aún queda largo, truncar con ...
        if (nameLine2.length > maxChars) nameLine2 = nameLine2.substring(0, maxChars - 1) + '…';
      }

      // 6 líneas fijas: nombre1, nombre2 (o vacío), sección, aislamiento, cdt, potencia
      const fixedLines = [nameLine1, nameLine2, sectionStr, insulStr, cdtStr, powerStr];

      nodes.push({
        id: uid(), type: 'info_block' as any, x: infoX, y: infoY,
        props: { lines: fixedLines, blockWidth: blockW, lineHeight: 8, fontSize: 5.5 },
      });

      circX += circuitSpacing;
    }

    circX += 20;
  }

  // -- AHORA crear la barra principal basada en posiciones reales de diferenciales --
  let barraWidth = 300;
  let barraCenterX = cx;

  if (diffPositions.length > 1) {
    const minDiffX = Math.min(...diffPositions);
    const maxDiffX = Math.max(...diffPositions);
    barraWidth = (maxDiffX - minDiffX) + 120;
    barraCenterX = (minDiffX + maxDiffX) / 2;
  } else if (diffPositions.length === 1) {
    barraCenterX = diffPositions[0] ?? 0;
    barraWidth = 300;
  }

  nodes.push({
    id: busId, type: 'busbar', x: snap(barraCenterX), y: busY,
    props: { label: 'BARRA', width: barraWidth },
  });
  wires.push({ id: uid(), from: iga.id, to: busId, fromPort: 'bottom', toPort: 'top', props: {} });

  // Tierra en barra principal
  nodes.push({
    id: tierraMainId, type: 'tierra',
    x: snap(barraCenterX) + barraWidth / 2 + 20, y: busY - 4,
    props: {},
  });

  // Recentrar elementos superiores al centro de la barra
  const topCenter = snap(barraCenterX);
  for (const n of nodes) {
    if (n.id === acom.id || n.id === cgp.id || n.id === cont.id || n.id === iga.id) {
      n.x = topCenter;
    }
  }

  return {
    nodes,
    wires,
    meta: {
      name: inst.address || inst.titularName || 'Instalacion',
      version: 1,
      installationId: inst.id,
      created: new Date().toISOString(),
    },
  };
}

/**
 * Genera un template de ejemplo (vivienda tipo, 12 circuitos, 3 diferenciales).
 */
export function generateViviendaDemo(): UnifilarTemplate {
  const mockInst: InstallationData = {
    id: 'demo',
    address: 'C/ Ejemplo 15, 3A, Madrid',
    titularName: 'Juan Garcia',
    voltage: 230,
    tipoAcometida: 'SUBTERRANEA',
    seccionAcometida: 16,
    materialAcometida: 'CU',
    seccionDi: 10,
    materialDi: 'CU',
    longitudDi: 12,
    aislamientoDi: 'XLPE',
    igaCalibreA: 40,
    igaCurve: 'C',
    igaPoles: 2,
  };

  const diffs: DifferentialData[] = [
    { id: 'd1', name: 'Dif.1', calibreA: 40, sensitivityMa: 30, type: 'AC', poles: 2 },
    { id: 'd2', name: 'Dif.2', calibreA: 40, sensitivityMa: 30, type: 'AC', poles: 2 },
    { id: 'd3', name: 'Dif.3', calibreA: 40, sensitivityMa: 30, type: 'A', poles: 2 },
  ];

  const circs: CircuitData[] = [
    { id: '1', code: 'C1', name: 'Alumbrado', voltage: 230, power: 2300, phases: 1, length: 15, cableType: 'CU', insulationType: 'PVC', installMethod: 'B1', calculatedSection: 1.5, assignedBreaker: '10', voltageDrop: 1.2, differentialId: 'd1' },
    { id: '2', code: 'C2', name: 'TC uso general', voltage: 230, power: 3450, phases: 1, length: 20, cableType: 'CU', insulationType: 'PVC', installMethod: 'B1', calculatedSection: 2.5, assignedBreaker: '16', voltageDrop: 2.1, differentialId: 'd1' },
    { id: '3', code: 'C3', name: 'Cocina/Horno', voltage: 230, power: 5400, phases: 1, length: 8, cableType: 'CU', insulationType: 'PVC', installMethod: 'B1', calculatedSection: 6, assignedBreaker: '25', voltageDrop: 0.9, differentialId: 'd1' },
    { id: '4', code: 'C4', name: 'Lavadora', voltage: 230, power: 3450, phases: 1, length: 10, cableType: 'CU', insulationType: 'PVC', installMethod: 'B1', calculatedSection: 4, assignedBreaker: '20', voltageDrop: 1.1, differentialId: 'd1' },
    { id: '5', code: 'C5', name: 'TC Bano/Cocina', voltage: 230, power: 3450, phases: 1, length: 12, cableType: 'CU', insulationType: 'PVC', installMethod: 'B1', calculatedSection: 2.5, assignedBreaker: '16', voltageDrop: 2.5, differentialId: 'd1' },
    { id: '6', code: 'C6', name: 'Alumbrado adicional', voltage: 230, power: 2300, phases: 1, length: 18, cableType: 'CU', insulationType: 'PVC', installMethod: 'B1', calculatedSection: 1.5, assignedBreaker: '10', voltageDrop: 1.8, differentialId: 'd2' },
    { id: '7', code: 'C7', name: 'TC adicional', voltage: 230, power: 3450, phases: 1, length: 22, cableType: 'CU', insulationType: 'PVC', installMethod: 'B1', calculatedSection: 2.5, assignedBreaker: '16', voltageDrop: 3.2, differentialId: 'd2' },
    { id: '8', code: 'C8', name: 'Calefaccion', voltage: 230, power: 5750, phases: 1, length: 15, cableType: 'CU', insulationType: 'PVC', installMethod: 'B1', calculatedSection: 6, assignedBreaker: '25', voltageDrop: 1.4, differentialId: 'd2' },
    { id: '9', code: 'C9', name: 'Aire acondicionado', voltage: 230, power: 5750, phases: 1, length: 10, cableType: 'CU', insulationType: 'PVC', installMethod: 'B1', calculatedSection: 6, assignedBreaker: '25', voltageDrop: 0.8, differentialId: 'd2' },
    { id: '10', code: 'C10', name: 'Secadora', voltage: 230, power: 3450, phases: 1, length: 10, cableType: 'CU', insulationType: 'PVC', installMethod: 'B1', calculatedSection: 4, assignedBreaker: '20', voltageDrop: 1.0, differentialId: 'd3' },
    { id: '11', code: 'C11', name: 'Automatizacion', voltage: 230, power: 2300, phases: 1, length: 25, cableType: 'CU', insulationType: 'PVC', installMethod: 'B1', calculatedSection: 2.5, assignedBreaker: '16', voltageDrop: 3.8, differentialId: 'd3' },
    { id: '12', code: 'C12', name: 'Recarga VE', voltage: 230, power: 3680, phases: 1, length: 15, cableType: 'CU', insulationType: 'XLPE', installMethod: 'B1', calculatedSection: 4, assignedBreaker: '20', voltageDrop: 1.7, differentialId: 'd3' },
  ];

  return generateFromAPI(mockInst, { differentials: diffs }, circs);
}
