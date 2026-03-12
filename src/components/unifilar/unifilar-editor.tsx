'use client';

import { useState, useRef, useCallback, useEffect, useReducer, useMemo } from 'react';
import { installationsApi, panelsApi, circuitsApi, calculationsApi, unifilarApi } from '@/lib/api-client';
import { generateFromAPI } from './layout-engine';
import {
  UnifilarNode, UnifilarWire, UnifilarTemplate, UnifilarState, UnifilarAction,
  SYMBOL_TYPES, CATEGORIES, SymbolType,
  uid, snap, GRID_SIZE,
} from './types';

// ═══════════════════════════════════════════════════════════════
// COLORS & FONTS
// ═══════════════════════════════════════════════════════════════

const C = {
  bg: '#08090d', surface: '#111318', surfaceHover: '#181b24', panel: '#0e1017',
  grid: '#171b25', gridMajor: '#1e2333',
  line: '#b8bfcc', lineLight: '#6b7488',
  accent: '#3b82f6', accentDim: '#1e3a5f',
  green: '#22c55e', red: '#ef4444', orange: '#f59e0b',
  text: '#e2e8f0', textMuted: '#64748b', textDim: '#3e4556',
  symbol: '#d4dae6', busbar: '#f59e0b', earth: '#22c55e',
  selected: '#3b82f6', selectedBg: '#3b82f618',
};
const FN = "'JetBrains Mono','SF Mono','Fira Code',monospace";
const FN_UI = "system-ui,-apple-system,sans-serif";

// ═══════════════════════════════════════════════════════════════
// SVG SYMBOL RENDERERS (IEC 60617)
// ═══════════════════════════════════════════════════════════════

function RenderSymbol({ node, isSelected }: { node: UnifilarNode; isSelected: boolean }) {
  const p = node.props || {};
  const color = isSelected ? C.selected : C.symbol;
  const muted = isSelected ? C.accent : C.textMuted;

  switch (node.type) {
    case 'acometida':
      return (<g>
        <line x1={0} y1={0} x2={0} y2={34} stroke={color} strokeWidth={2.5} />
        <line x1={-10} y1={0} x2={10} y2={0} stroke={color} strokeWidth={2} />
        {p.tipoAcometida && <text x={14} y={10} fill={muted} fontSize={7} fontFamily={FN} textAnchor="start">{p.tipoAcometida}</text>}
        {p.seccion && <text x={14} y={20} fill={C.accent} fontSize={7} fontFamily={FN} textAnchor="start">{p.seccion}mm² {p.material||''}</text>}
      </g>);
    case 'cgp':
      return (<g>
        <line x1={0} y1={0} x2={0} y2={8} stroke={color} strokeWidth={1.5} />
        <rect x={-15} y={8} width={30} height={24} fill="none" stroke={color} strokeWidth={1.5} rx={2} />
        <text x={0} y={24} fill={color} fontSize={8} fontFamily={FN} textAnchor="middle" fontWeight="bold">CGP</text>
        {[-8,0,8].map(dx=><line key={dx} x1={dx} y1={13} x2={dx} y2={27} stroke={color} strokeWidth={0.8}/>)}
        <line x1={0} y1={32} x2={0} y2={44} stroke={color} strokeWidth={1.5} />
      </g>);
    case 'contador':
      return (<g>
        <line x1={0} y1={0} x2={0} y2={6} stroke={color} strokeWidth={1.5} />
        <circle cx={0} cy={20} r={14} fill="none" stroke={color} strokeWidth={1.5} />
        <text x={0} y={24} fill={color} fontSize={9} fontFamily={FN} textAnchor="middle" fontWeight="bold">kWh</text>
        <line x1={0} y1={34} x2={0} y2={40} stroke={color} strokeWidth={1.5} />
      </g>);
    case 'magnetotermico':
      return (<g>
        <line x1={0} y1={0} x2={0} y2={8} stroke={color} strokeWidth={1.5} />
        <circle cx={0} cy={8} r={2} fill={color} />
        <line x1={0} y1={8} x2={8} y2={28} stroke={color} strokeWidth={2} />
        <path d="M -4 32 Q 0 26 4 32" fill="none" stroke={color} strokeWidth={1.5} />
        <line x1={-3} y1={35} x2={3} y2={41} stroke={color} strokeWidth={1.5} />
        <line x1={3} y1={35} x2={-3} y2={41} stroke={color} strokeWidth={1.5} />
        <circle cx={0} cy={44} r={2} fill={color} />
        <line x1={0} y1={44} x2={0} y2={56} stroke={color} strokeWidth={1.5} />
        {p.label && <text x={-14} y={22} fill={muted} fontSize={7} fontFamily={FN} textAnchor="end">{p.label}</text>}
        {p.calibre && <text x={14} y={28} fill={color} fontSize={8} fontFamily={FN} fontWeight="600" textAnchor="start">{p.calibre}A{p.curva?` ${p.curva}`:''}</text>}
        {p.poles && <text x={14} y={40} fill={muted} fontSize={7} fontFamily={FN} textAnchor="start">{p.poles}P</text>}
      </g>);
    case 'diferencial':
      return (<g>
        <line x1={0} y1={0} x2={0} y2={4} stroke={color} strokeWidth={1.5} />
        <circle cx={0} cy={18} r={13} fill="none" stroke={color} strokeWidth={1.5} />
        <text x={0} y={21} fill={color} fontSize={9} fontFamily={FN} textAnchor="middle" fontWeight="bold">T</text>
        {(p.type==='AC'||!p.type) && <path d="M -6 31 Q -3 28 0 31 Q 3 34 6 31" fill="none" stroke={color} strokeWidth={1}/>}
        {p.type==='A' && <><path d="M -6 29 Q -3 26 0 29 Q 3 32 6 29" fill="none" stroke={color} strokeWidth={1}/><line x1={-6} y1={33} x2={6} y2={33} stroke={color} strokeWidth={1}/></>}
        <line x1={0} y1={31} x2={0} y2={56} stroke={color} strokeWidth={1.5} />
        {p.label && <text x={-18} y={14} fill={muted} fontSize={7} fontFamily={FN} textAnchor="end">{p.label}</text>}
        {p.calibre && <text x={18} y={14} fill={color} fontSize={8} fontFamily={FN} fontWeight="600" textAnchor="start">{p.calibre}A</text>}
        {p.sensitivity && <text x={18} y={26} fill={muted} fontSize={7} fontFamily={FN} textAnchor="start">{p.sensitivity}mA/{p.type||'AC'}</text>}
      </g>);
    case 'fusible':
      return (<g>
        <line x1={0} y1={0} x2={0} y2={6} stroke={color} strokeWidth={1.5} />
        <rect x={-5} y={6} width={10} height={20} fill="none" stroke={color} strokeWidth={1.5} />
        <line x1={0} y1={6} x2={0} y2={26} stroke={color} strokeWidth={0.8} />
        <line x1={0} y1={26} x2={0} y2={36} stroke={color} strokeWidth={1.5} />
        {p.calibre && <text x={10} y={20} fill={color} fontSize={8} fontFamily={FN} textAnchor="start">{p.calibre}A</text>}
      </g>);
    case 'busbar': {
      const bw = p.width || 200;
      return (<g>
        <line x1={-bw/2} y1={0} x2={bw/2} y2={0} stroke={C.busbar} strokeWidth={4} strokeLinecap="round" />
        {p.label && <text x={-bw/2-8} y={4} fill={C.busbar} fontSize={7} fontFamily={FN} textAnchor="end" fontWeight="600">{p.label}</text>}
      </g>);
    }
    case 'punto_luz':
      return (<g>
        <line x1={0} y1={0} x2={0} y2={6} stroke={color} strokeWidth={1.5} />
        <circle cx={0} cy={12} r={6} fill="none" stroke={color} strokeWidth={1.5} />
        <line x1={-4} y1={8} x2={4} y2={16} stroke={color} strokeWidth={1} />
        <line x1={4} y1={8} x2={-4} y2={16} stroke={color} strokeWidth={1} />
        {p.label && <text x={0} y={26} fill={muted} fontSize={6} fontFamily={FN} textAnchor="middle">{p.label}</text>}
      </g>);
    case 'toma_corriente':
      return (<g>
        <line x1={0} y1={0} x2={0} y2={4} stroke={color} strokeWidth={1.5} />
        <path d="M -8 4 A 8 8 0 0 1 8 4" fill="none" stroke={color} strokeWidth={1.5} />
        <line x1={-3} y1={2} x2={-3} y2={8} stroke={color} strokeWidth={1.5} />
        <line x1={3} y1={2} x2={3} y2={8} stroke={color} strokeWidth={1.5} />
        {p.label && <text x={0} y={22} fill={muted} fontSize={6} fontFamily={FN} textAnchor="middle">{p.label}</text>}
      </g>);
    case 'tierra':
      return (<g>
        <line x1={0} y1={0} x2={0} y2={6} stroke={C.earth} strokeWidth={1.5} />
        <line x1={-10} y1={6} x2={10} y2={6} stroke={C.earth} strokeWidth={2} />
        <line x1={-6} y1={10} x2={6} y2={10} stroke={C.earth} strokeWidth={1.5} />
        <line x1={-3} y1={14} x2={3} y2={14} stroke={C.earth} strokeWidth={1} />
        <text x={14} y={10} fill={C.earth} fontSize={7} fontFamily={FN} textAnchor="start">PE</text>
      </g>);
    case 'texto':
      return <text x={0} y={14} fill={color} fontSize={p.fontSize||10} fontFamily={FN} fontWeight={p.bold?'700':'400'}>{p.text||'Texto'}</text>;
    case 'info_block': {
      const lines: string[] = p.lines || [];
      const lineH = p.lineHeight || 8;
      const blockW = p.blockWidth || 78;
      const FIXED_LINES = 6; // always 6 lines for uniform height
      const blockH = FIXED_LINES * lineH + 6;
      const borderColor = p.borderColor || (color === '#e2e8f0' ? '#4a5568' : '#444');
      // Color per line: 0-1=name(white), 2=section(cyan), 3=insulation(gray), 4=cdt(dynamic), 5=power(gray)
      const isDark = color !== '#222' && color !== '#000';
      const nameColor = isDark ? '#e2e8f0' : '#222';
      const sectionColor = isDark ? '#67e8f9' : '#0891b2'; // cyan
      const insulColor = isDark ? '#94a3b8' : '#64748b'; // gray
      const powerColor = isDark ? '#a1a1aa' : '#71717a'; // zinc
      // CdT color: parse value, green if <=3%, yellow if <=5%, red if >5%
      const cdtLine = lines[4] || '';
      const cdtVal = parseFloat(cdtLine.replace(/[^0-9.]/g, '')) || 0;
      const cdtColor = cdtVal > 5 ? '#ef4444' : cdtVal > 3 ? '#f59e0b' : (isDark ? '#4ade80' : '#16a34a');
      const lineColors = [nameColor, nameColor, sectionColor, insulColor, cdtLine ? cdtColor : insulColor, powerColor];
      const lineWeights = ['600', '400', '500', '400', '500', '400'];
      const lineSizes = [6, 5.5, 5.5, 5, 5.5, 5];
      return (
        <g>
          <rect x={-blockW/2} y={0} width={blockW} height={blockH}
            fill="none" stroke={borderColor} strokeWidth={0.5} rx={2} />
          {lines.slice(0, FIXED_LINES).map((line: string, i: number) => (
            line ? (
              <text key={i} x={0} y={10 + i * lineH}
                fill={lineColors[i] || insulColor}
                fontSize={lineSizes[i] || 5.5} fontFamily={FN}
                fontWeight={lineWeights[i] || '400'}
                textAnchor="middle" dominantBaseline="middle">
                {line}
              </text>
            ) : null
          ))}
        </g>
      );
    }
    case 'contactor': {
      // IEC: two parallel vertical lines with horizontal connections
      const is3F = p.phases === '3' || p.phases === 3;
      return (<g>
        <line x1={0} y1={0} x2={0} y2={8} stroke={color} strokeWidth={1.5} />
        <circle cx={0} cy={8} r={2} fill={color} />
        <line x1={0} y1={8} x2={8} y2={28} stroke={color} strokeWidth={2} />
        <circle cx={0} cy={32} r={2} fill={color} />
        {/* Coil symbol - rectangle */}
        <rect x={-6} y={34} width={12} height={8} fill="none" stroke={color} strokeWidth={1.2} />
        <line x1={0} y1={42} x2={0} y2={48} stroke={color} strokeWidth={1.5} />
        {/* A1/A2 labels */}
        <text x={10} y={36} fill={muted} fontSize={6} fontFamily={FN}>A1</text>
        <text x={10} y={46} fill={muted} fontSize={6} fontFamily={FN}>A2</text>
        {is3F && <><line x1={-8} y1={8} x2={-8} y2={28} stroke={color} strokeWidth={1} strokeDasharray="2 1"/><line x1={8} y1={8} x2={8} y2={28} stroke={color} strokeWidth={1} strokeDasharray="2 1"/></>}
        {p.label && <text x={-14} y={20} fill={muted} fontSize={7} fontFamily={FN} textAnchor="end">{p.label}</text>}
        {p.calibre && <text x={14} y={20} fill={color} fontSize={8} fontFamily={FN} fontWeight="600">{p.calibre}A</text>}
      </g>);
    }
    case 'guardamotor': {
      // Magnetothermic + thermal overload symbol
      const is3F = p.phases === '3' || p.phases === 3;
      return (<g>
        <line x1={0} y1={0} x2={0} y2={8} stroke={color} strokeWidth={1.5} />
        <circle cx={0} cy={8} r={2} fill={color} />
        <line x1={0} y1={8} x2={8} y2={28} stroke={color} strokeWidth={2} />
        {/* Magnetic trip (X cross) */}
        <line x1={-3} y1={32} x2={3} y2={38} stroke={color} strokeWidth={1.5} />
        <line x1={3} y1={32} x2={-3} y2={38} stroke={color} strokeWidth={1.5} />
        {/* Thermal element (bimetal squiggle) */}
        <path d="M -4 42 L -2 40 L 2 44 L 4 42" fill="none" stroke={color} strokeWidth={1.2} />
        <circle cx={0} cy={48} r={2} fill={color} />
        <line x1={0} y1={48} x2={0} y2={56} stroke={color} strokeWidth={1.5} />
        {is3F && <><line x1={-8} y1={8} x2={-8} y2={48} stroke={color} strokeWidth={0.8} strokeDasharray="2 1"/><line x1={8} y1={8} x2={8} y2={48} stroke={color} strokeWidth={0.8} strokeDasharray="2 1"/></>}
        {p.label && <text x={-14} y={22} fill={muted} fontSize={7} fontFamily={FN} textAnchor="end">{p.label}</text>}
        {p.calibre && <text x={14} y={28} fill={color} fontSize={8} fontFamily={FN} fontWeight="600">{p.calibre}A</text>}
        {p.range && <text x={14} y={40} fill={muted} fontSize={7} fontFamily={FN}>{p.range}</text>}
      </g>);
    }
    case 'reloj_horario':
      return (<g>
        <line x1={0} y1={0} x2={0} y2={6} stroke={color} strokeWidth={1.5} />
        <circle cx={0} cy={20} r={14} fill="none" stroke={color} strokeWidth={1.5} />
        {/* Clock hands */}
        <line x1={0} y1={20} x2={0} y2={11} stroke={color} strokeWidth={1.2} />
        <line x1={0} y1={20} x2={7} y2={20} stroke={color} strokeWidth={1.2} />
        {/* Hour markers */}
        {[0,90,180,270].map(a => {const r=12,rad=a*Math.PI/180;return <circle key={a} cx={r*Math.sin(rad)} cy={20-r*Math.cos(rad)} r={0.8} fill={color}/>;})}
        <line x1={0} y1={34} x2={0} y2={40} stroke={color} strokeWidth={1.5} />
        {p.label && <text x={18} y={18} fill={muted} fontSize={7} fontFamily={FN}>{p.label}</text>}
        {p.programa && <text x={18} y={28} fill={color} fontSize={7} fontFamily={FN}>{p.programa}</text>}
      </g>);
    case 'motor': {
      const is3F = p.phases === '3' || p.phases === 3;
      return (<g>
        <line x1={0} y1={0} x2={0} y2={4} stroke={color} strokeWidth={1.5} />
        <circle cx={0} cy={18} r={14} fill="none" stroke={color} strokeWidth={1.5} />
        <text x={0} y={22} fill={color} fontSize={10} fontFamily={FN} textAnchor="middle" fontWeight="bold">M</text>
        {is3F && <text x={0} y={29} fill={muted} fontSize={6} fontFamily={FN} textAnchor="middle">3~</text>}
        {!is3F && <text x={0} y={29} fill={muted} fontSize={6} fontFamily={FN} textAnchor="middle">1~</text>}
        <line x1={0} y1={32} x2={0} y2={36} stroke={color} strokeWidth={1.5} />
        {p.label && <text x={18} y={14} fill={muted} fontSize={7} fontFamily={FN}>{p.label}</text>}
        {p.potencia && <text x={18} y={24} fill={color} fontSize={7} fontFamily={FN} fontWeight="600">{p.potencia}kW</text>}
      </g>);
    }
    case 'seccionador':
      return (<g>
        <line x1={0} y1={0} x2={0} y2={8} stroke={color} strokeWidth={1.5} />
        <circle cx={0} cy={8} r={2} fill={color} />
        {/* Open blade - straight diagonal */}
        <line x1={0} y1={8} x2={10} y2={26} stroke={color} strokeWidth={2} />
        <circle cx={0} cy={30} r={2} fill={color} />
        <line x1={0} y1={30} x2={0} y2={40} stroke={color} strokeWidth={1.5} />
        {p.label && <text x={-14} y={20} fill={muted} fontSize={7} fontFamily={FN} textAnchor="end">{p.label}</text>}
        {p.calibre && <text x={14} y={20} fill={color} fontSize={8} fontFamily={FN} fontWeight="600">{p.calibre}A</text>}
      </g>);
    case 'magneto_diferencial':
      return (<g>
        {/* Magnetothermic part (top) */}
        <line x1={0} y1={0} x2={0} y2={6} stroke={color} strokeWidth={1.5} />
        <circle cx={0} cy={6} r={2} fill={color} />
        <line x1={0} y1={6} x2={8} y2={22} stroke={color} strokeWidth={2} />
        <path d="M -4 26 Q 0 20 4 26" fill="none" stroke={color} strokeWidth={1.5} />
        <line x1={-3} y1={28} x2={3} y2={34} stroke={color} strokeWidth={1.5} />
        <line x1={3} y1={28} x2={-3} y2={34} stroke={color} strokeWidth={1.5} />
        {/* Differential part (bottom) */}
        <circle cx={0} cy={48} r={11} fill="none" stroke={color} strokeWidth={1.2} />
        <text x={0} y={51} fill={color} fontSize={8} fontFamily={FN} textAnchor="middle" fontWeight="bold">T</text>
        <line x1={0} y1={59} x2={0} y2={70} stroke={color} strokeWidth={1.5} />
        {p.label && <text x={-16} y={16} fill={muted} fontSize={7} fontFamily={FN} textAnchor="end">{p.label}</text>}
        {p.calibre && <text x={16} y={16} fill={color} fontSize={8} fontFamily={FN} fontWeight="600">{p.calibre}A{p.curva?` ${p.curva}`:''}</text>}
        {p.sensitivity && <text x={16} y={52} fill={muted} fontSize={7} fontFamily={FN}>{p.sensitivity}mA</text>}
      </g>);
    default:
      return <rect x={-10} y={0} width={20} height={20} fill="none" stroke={color} strokeWidth={1} strokeDasharray="3 2" />;
  }
}

// ── Wire renderer ──
function RenderWire({ wire, nodes, isSelected }: { wire: UnifilarWire; nodes: UnifilarNode[]; isSelected: boolean }) {
  const from = nodes.find(n => n.id === wire.from);
  const to = nodes.find(n => n.id === wire.to);
  if (!from || !to) return null;
  const fd = SYMBOL_TYPES[from.type] || { h: 20 };
  const td = SYMBOL_TYPES[to.type] || { h: 20 };
  const x1 = from.x, y1 = from.y + (wire.fromPort === 'top' ? 0 : fd.h);
  const x2 = to.x, y2 = to.y + (wire.toPort === 'bottom' ? td.h : 0);
  const color = isSelected ? C.selected : C.lineLight;
  const midY = (y1 + y2) / 2;
  const path = Math.abs(x1 - x2) < 1
    ? `M ${x1} ${y1} L ${x2} ${y2}`
    : `M ${x1} ${y1} L ${x1} ${midY} L ${x2} ${midY} L ${x2} ${y2}`;
  const wp = wire.props || {};
  return (<g>
    <path d={path} fill="none" stroke={color} strokeWidth={isSelected ? 2 : 1.5} />
    {wp.section && <text x={(x1+x2)/2+8} y={(y1+y2)/2-4} fill={C.accent} fontSize={7} fontFamily={FN} textAnchor="start">
      {wp.conductores?`${wp.conductores}×`:''}{wp.section}mm² {wp.material||''}
    </text>}
    {wp.length && <text x={(x1+x2)/2+8} y={(y1+y2)/2+7} fill={C.textDim} fontSize={6.5} fontFamily={FN} textAnchor="start">
      {wp.insulation||''} · {wp.length}m
    </text>}
  </g>);
}

// ═══════════════════════════════════════════════════════════════
// DXF EXPORTER (AutoCAD DXF R12 ASCII)
// ═══════════════════════════════════════════════════════════════

function dxfLine(x1:number,y1:number,x2:number,y2:number,layer='0',color?:number){
  let s=`  0\nLINE\n  8\n${layer}\n`;
  if(color!=null)s+=`  62\n${color}\n`;
  s+=`  10\n${x1.toFixed(3)}\n  20\n${(-y1).toFixed(3)}\n  30\n0.0\n`;
  s+=`  11\n${x2.toFixed(3)}\n  21\n${(-y2).toFixed(3)}\n  31\n0.0\n`;
  return s;
}
function dxfCircle(cx:number,cy:number,r:number,layer='0',color?:number){
  let s=`  0\nCIRCLE\n  8\n${layer}\n`;
  if(color!=null)s+=`  62\n${color}\n`;
  s+=`  10\n${cx.toFixed(3)}\n  20\n${(-cy).toFixed(3)}\n  30\n0.0\n  40\n${r.toFixed(3)}\n`;
  return s;
}
function dxfText(x:number,y:number,h:number,text:string,layer='0',color?:number,halign=0){
  if(!text)return '';
  let s=`  0\nTEXT\n  8\n${layer}\n`;
  if(color!=null)s+=`  62\n${color}\n`;
  s+=`  10\n${x.toFixed(3)}\n  20\n${(-y).toFixed(3)}\n  30\n0.0\n  40\n${h.toFixed(3)}\n  1\n${text}\n`;
  if(halign!==0){s+=`  72\n${halign}\n  11\n${x.toFixed(3)}\n  21\n${(-y).toFixed(3)}\n  31\n0.0\n`;}
  return s;
}
function dxfRect(x:number,y:number,w:number,h:number,layer='0',color?:number){
  return dxfLine(x,y,x+w,y,layer,color)+dxfLine(x+w,y,x+w,y+h,layer,color)+dxfLine(x+w,y+h,x,y+h,layer,color)+dxfLine(x,y+h,x,y,layer,color);
}
function dxfPolyArc(cx:number,cy:number,r:number,s0:number,s1:number,n:number,layer:string,color?:number){
  let s='';for(let i=0;i<n;i++){
    const a1=(s0+(s1-s0)*(i/n))*Math.PI/180,a2=(s0+(s1-s0)*((i+1)/n))*Math.PI/180;
    s+=dxfLine(cx+r*Math.cos(a1),cy+r*Math.sin(a1),cx+r*Math.cos(a2),cy+r*Math.sin(a2),layer,color);
  }return s;
}

function exportToDXF(state: UnifilarState): string {
  const layerForType=(t:string)=>{switch(t){case'acometida':case'cgp':case'contador':return'ALIMENTACION';case'magnetotermico':case'diferencial':case'fusible':case'seccionador':case'magneto_diferencial':return'PROTECCION';case'busbar':return'DISTRIBUCION';case'punto_luz':case'toma_corriente':case'motor':return'RECEPTORES';case'contactor':case'guardamotor':case'reloj_horario':return'MANIOBRA';case'tierra':return'TIERRA';case'texto':return'TEXTO';default:return'CIRCUITOS';}};
  const layers:{[k:string]:number}={ALIMENTACION:4,PROTECCION:2,DISTRIBUCION:3,CIRCUITOS:7,RECEPTORES:6,MANIOBRA:5,TIERRA:3,TEXTO:8,CAJETIN:9};
  let dxf=`  0\nSECTION\n  2\nHEADER\n  9\n$ACADVER\n  1\nAC1009\n  9\n$INSUNITS\n  70\n4\n  0\nENDSEC\n`;
  dxf+=`  0\nSECTION\n  2\nTABLES\n  0\nTABLE\n  2\nLTYPE\n  70\n1\n  0\nLTYPE\n  2\nCONTINUOUS\n  70\n0\n  3\nSolid\n  72\n65\n  73\n0\n  40\n0.0\n  0\nENDTAB\n`;
  dxf+=`  0\nTABLE\n  2\nLAYER\n  70\n${Object.keys(layers).length+1}\n  0\nLAYER\n  2\n0\n  70\n0\n  62\n7\n  6\nCONTINUOUS\n`;
  for(const[n,c]of Object.entries(layers))dxf+=`  0\nLAYER\n  2\n${n}\n  70\n0\n  62\n${c}\n  6\nCONTINUOUS\n`;
  dxf+=`  0\nENDTAB\n  0\nTABLE\n  2\nSTYLE\n  70\n1\n  0\nSTYLE\n  2\nSTANDARD\n  70\n0\n  40\n0.0\n  41\n1.0\n  50\n0.0\n  71\n0\n  42\n3.5\n  3\ntxt\n  4\n\n  0\nENDTAB\n  0\nENDSEC\n`;
  dxf+=`  0\nSECTION\n  2\nENTITIES\n`;
  dxf+=dxfText(10,-30,5,'ESQUEMA UNIFILAR','CAJETIN',4);
  dxf+=dxfText(10,-20,3,`OASIS Platform - ${state.meta?.name||''}`.trim(),'CAJETIN');
  for(const node of state.nodes){const{x,y,type:t,props:p={}}=node;const L=layerForType(t);const T='TEXTO';
    switch(t){
      case'acometida':dxf+=dxfLine(x,y,x,y+34,L)+dxfLine(x-10,y,x+10,y,L);if(p.tipoAcometida)dxf+=dxfText(x+14,y+10,3.5,p.tipoAcometida,T);if(p.seccion)dxf+=dxfText(x+14,y+18,3.5,`${p.seccion}mm2 ${p.material||''}`,T,4);break;
      case'cgp':dxf+=dxfLine(x,y,x,y+8,L)+dxfRect(x-15,y+8,30,24,L)+dxfText(x,y+24,4,'CGP',L,undefined,1)+dxfLine(x,y+32,x,y+44,L);break;
      case'contador':dxf+=dxfLine(x,y,x,y+6,L)+dxfCircle(x,y+20,14,L)+dxfText(x,y+23,4,'kWh',L,undefined,1)+dxfLine(x,y+34,x,y+40,L);break;
      case'magnetotermico':dxf+=dxfLine(x,y,x,y+8,L)+dxfCircle(x,y+8,1.5,L)+dxfLine(x,y+8,x+8,y+28,L)+dxfPolyArc(x,y+29,5,210,330,6,L)+dxfLine(x-3,y+35,x+3,y+41,L)+dxfLine(x+3,y+35,x-3,y+41,L)+dxfCircle(x,y+44,1.5,L)+dxfLine(x,y+44,x,y+56,L);if(p.label)dxf+=dxfText(x-16,y+22,3.5,p.label,T);if(p.calibre)dxf+=dxfText(x+14,y+28,4,`${p.calibre}A${p.curva?' '+p.curva:''}`,T,2);break;
      case'diferencial':dxf+=dxfLine(x,y,x,y+4,L)+dxfCircle(x,y+18,13,L)+dxfText(x,y+21,4.5,'T',L,undefined,1)+dxfLine(x,y+31,x,y+56,L);if(p.label)dxf+=dxfText(x-20,y+14,3.5,p.label,T);if(p.calibre)dxf+=dxfText(x+18,y+14,4,`${p.calibre}A`,T,2);if(p.sensitivity)dxf+=dxfText(x+18,y+24,3.5,`${p.sensitivity}mA/${p.type||'AC'}`,T);break;
      case'fusible':dxf+=dxfLine(x,y,x,y+6,L)+dxfRect(x-5,y+6,10,20,L)+dxfLine(x,y+26,x,y+36,L);if(p.calibre)dxf+=dxfText(x+10,y+20,4,`${p.calibre}A`,T);break;
      case'busbar':{const bw=p.width||200;dxf+=dxfLine(x-bw/2,y,x+bw/2,y,'DISTRIBUCION',2)+dxfLine(x-bw/2,y+1.5,x+bw/2,y+1.5,'DISTRIBUCION',2);if(p.label)dxf+=dxfText(x-bw/2-10,y+3,3.5,p.label,T,2);break;}
      case'punto_luz':dxf+=dxfLine(x,y,x,y+6,'RECEPTORES')+dxfCircle(x,y+12,6,'RECEPTORES')+dxfLine(x-4,y+8,x+4,y+16,'RECEPTORES')+dxfLine(x+4,y+8,x-4,y+16,'RECEPTORES');if(p.label)dxf+=dxfText(x,y+24,3,p.label,T,undefined,1);break;
      case'toma_corriente':dxf+=dxfLine(x,y,x,y+4,'RECEPTORES')+dxfPolyArc(x,y+4,8,0,180,10,'RECEPTORES')+dxfLine(x-3,y+2,x-3,y+8,'RECEPTORES')+dxfLine(x+3,y+2,x+3,y+8,'RECEPTORES');if(p.label)dxf+=dxfText(x,y+20,3,p.label,T,undefined,1);break;
      case'tierra':dxf+=dxfLine(x,y,x,y+6,'TIERRA',3)+dxfLine(x-10,y+6,x+10,y+6,'TIERRA',3)+dxfLine(x-6,y+10,x+6,y+10,'TIERRA',3)+dxfLine(x-3,y+14,x+3,y+14,'TIERRA',3)+dxfText(x+14,y+10,3.5,'PE','TIERRA',3);break;
      case'texto':dxf+=dxfText(x,y+10,(p.fontSize||10)*0.5,p.text||'',T);break;
      case'contactor':dxf+=dxfLine(x,y,x,y+8,L)+dxfCircle(x,y+8,1.5,L)+dxfLine(x,y+8,x+8,y+28,L)+dxfCircle(x,y+32,1.5,L)+dxfRect(x-6,y+34,12,8,L)+dxfLine(x,y+42,x,y+48,L);if(p.label)dxf+=dxfText(x-16,y+20,3.5,p.label,T);if(p.calibre)dxf+=dxfText(x+14,y+20,4,`${p.calibre}A`,T,5);break;
      case'guardamotor':dxf+=dxfLine(x,y,x,y+8,L)+dxfCircle(x,y+8,1.5,L)+dxfLine(x,y+8,x+8,y+28,L)+dxfLine(x-3,y+32,x+3,y+38,L)+dxfLine(x+3,y+32,x-3,y+38,L)+dxfCircle(x,y+48,1.5,L)+dxfLine(x,y+48,x,y+56,L);if(p.label)dxf+=dxfText(x-16,y+22,3.5,p.label,T);if(p.calibre)dxf+=dxfText(x+14,y+28,4,`${p.calibre}A`,T,5);break;
      case'reloj_horario':dxf+=dxfLine(x,y,x,y+6,L)+dxfCircle(x,y+20,14,L)+dxfLine(x,y+20,x,y+11,L)+dxfLine(x,y+20,x+7,y+20,L)+dxfLine(x,y+34,x,y+40,L);if(p.label)dxf+=dxfText(x+18,y+18,3.5,p.label,T);break;
      case'motor':dxf+=dxfLine(x,y,x,y+4,'RECEPTORES')+dxfCircle(x,y+18,14,'RECEPTORES')+dxfText(x,y+22,5,'M','RECEPTORES',undefined,1)+dxfLine(x,y+32,x,y+36,'RECEPTORES');if(p.label)dxf+=dxfText(x+18,y+14,3.5,p.label,T);if(p.potencia)dxf+=dxfText(x+18,y+24,3.5,`${p.potencia}kW`,T,2);break;
      case'seccionador':dxf+=dxfLine(x,y,x,y+8,L)+dxfCircle(x,y+8,1.5,L)+dxfLine(x,y+8,x+10,y+26,L)+dxfCircle(x,y+30,1.5,L)+dxfLine(x,y+30,x,y+40,L);if(p.label)dxf+=dxfText(x-16,y+20,3.5,p.label,T);if(p.calibre)dxf+=dxfText(x+14,y+20,4,`${p.calibre}A`,T,2);break;
      case'magneto_diferencial':dxf+=dxfLine(x,y,x,y+6,L)+dxfCircle(x,y+6,1.5,L)+dxfLine(x,y+6,x+8,y+22,L)+dxfPolyArc(x,y+23,5,210,330,6,L)+dxfLine(x-3,y+28,x+3,y+34,L)+dxfLine(x+3,y+28,x-3,y+34,L)+dxfCircle(x,y+48,11,L)+dxfText(x,y+51,4.5,'T',L,undefined,1)+dxfLine(x,y+59,x,y+70,L);if(p.label)dxf+=dxfText(x-18,y+16,3.5,p.label,T);if(p.calibre)dxf+=dxfText(x+16,y+16,4,`${p.calibre}A${p.curva?' '+p.curva:''}`,T,2);if(p.sensitivity)dxf+=dxfText(x+16,y+52,3.5,`${p.sensitivity}mA`,T);break;
    }
  }
  for(const w of state.wires){
    const from=state.nodes.find(n=>n.id===w.from),to=state.nodes.find(n=>n.id===w.to);
    if(!from||!to)continue;
    const fd=SYMBOL_TYPES[from.type]||{h:20},td=SYMBOL_TYPES[to.type]||{h:20};
    const x1=from.x,y1=from.y+(w.fromPort==='top'?0:fd.h),x2=to.x,y2=to.y+(w.toPort==='bottom'?td.h:0);
    if(Math.abs(x1-x2)<1)dxf+=dxfLine(x1,y1,x2,y2,'CIRCUITOS');
    else{const my=(y1+y2)/2;dxf+=dxfLine(x1,y1,x1,my,'CIRCUITOS')+dxfLine(x1,my,x2,my,'CIRCUITOS')+dxfLine(x2,my,x2,y2,'CIRCUITOS');}
    const wp=w.props||{},mx=(x1+x2)/2+8,my2=(y1+y2)/2;
    if(wp.section)dxf+=dxfText(mx,my2-4,3,`${wp.conductores?wp.conductores+'x':''}${wp.section}mm2 ${wp.material||''}`.trim(),'TEXTO',4);
    if(wp.length)dxf+=dxfText(mx,my2+4,2.5,`${wp.insulation||''} ${wp.length}m`.trim(),'TEXTO');
  }
  dxf+=`  0\nENDSEC\n  0\nEOF\n`;
  return dxf;
}

function downloadDXF(state: UnifilarState) {
  const blob = new Blob([exportToDXF(state)], { type: 'application/dxf' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
  a.download = `unifilar_${state.meta?.name || 'oasis'}.dxf`;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
}
function downloadSVG() {
  const el = document.querySelector('#unifilar-canvas svg');
  if (!el) return;
  const clone = el.cloneNode(true) as SVGElement;
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  const blob = new Blob([new XMLSerializer().serializeToString(clone)], { type: 'image/svg+xml' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
  a.download = 'unifilar_oasis.svg'; document.body.appendChild(a); a.click(); document.body.removeChild(a);
}

type PdfFormat = 'A4' | 'A3';

async function downloadPDF(state: UnifilarState, format: PdfFormat = 'A4', installationData?: any) {
  // Dynamic import of jsPDF and svg2pdf.js
  const [jsPDFModule, svg2pdfModule] = await Promise.all([
    import('jspdf'),
    import('svg2pdf.js'),
  ]);
  const { jsPDF } = jsPDFModule;
  // svg2pdf.js auto-registers on jsPDF prototype via import side-effect
  void svg2pdfModule;

  // Page dimensions (landscape)
  const pageW = format === 'A3' ? 420 : 297;
  const pageH = format === 'A3' ? 297 : 210;
  const margin = 10;
  const cajetinH = 30; // cajetín height

  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: format.toLowerCase() as any });

  // Border frame
  doc.setDrawColor(0);
  doc.setLineWidth(0.5);
  doc.rect(margin, margin, pageW - 2 * margin, pageH - 2 * margin);

  // Get and prepare SVG
  const svgEl = document.querySelector('#unifilar-canvas svg');
  if (!svgEl) { alert('No se encontró el canvas SVG'); return; }
  const clone = svgEl.cloneNode(true) as SVGElement;
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  // Remove grid patterns and their rects for clean PDF
  clone.querySelectorAll('pattern').forEach(p => p.remove());
  clone.querySelectorAll('rect[fill*="url(#"]').forEach(r => r.remove());
  // Set white background for PDF
  const bgRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  bgRect.setAttribute('width', '100%'); bgRect.setAttribute('height', '100%'); bgRect.setAttribute('fill', 'white');
  clone.insertBefore(bgRect, clone.firstChild);
  // Replace dark colors with black for print
  clone.querySelectorAll('[fill]').forEach(el => { const f = el.getAttribute('fill'); if (f && f !== 'none' && f !== 'white' && f !== 'url(#sG)' && f !== 'url(#bG)') el.setAttribute('fill', '#222'); });
  clone.querySelectorAll('[stroke]').forEach(el => { const s = el.getAttribute('stroke'); if (s && s !== 'none') el.setAttribute('stroke', '#222'); });

  // Schema area (above cajetín)
  const schemaW = pageW - 2 * margin;
  const schemaH = pageH - 2 * margin - cajetinH - 2;
  try {
    await (doc as any).svg(clone, { x: margin, y: margin, width: schemaW, height: schemaH });
  } catch {
    // Fallback: just draw a placeholder
    doc.setFontSize(10);
    doc.text('Error renderizando SVG. Exporta como SVG o DXF.', margin + 10, margin + 20);
  }

  // ── Cajetín profesional ──
  const cY = pageH - margin - cajetinH;
  const cX = margin;
  const cW = pageW - 2 * margin;

  doc.setLineWidth(0.4);
  doc.rect(cX, cY, cW, cajetinH);

  // Vertical dividers: [logo/empresa | datos instalación | datos técnicos | fecha/versión]
  const col1 = cX + cW * 0.2;
  const col2 = cX + cW * 0.55;
  const col3 = cX + cW * 0.8;
  doc.line(col1, cY, col1, cY + cajetinH);
  doc.line(col2, cY, col2, cY + cajetinH);
  doc.line(col3, cY, col3, cY + cajetinH);

  // Horizontal mid-line
  doc.line(cX, cY + cajetinH / 2, cX + cW, cY + cajetinH / 2);

  const d = installationData || {};
  const nombre = state.meta?.name || 'Esquema Unifilar';

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('ESQUEMA UNIFILAR', cX + 4, cY + 6);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.text('OASIS Platform', cX + 4, cY + 12);
  doc.text(nombre, cX + 4, cY + 18);
  doc.text(`Formato: ${format} apaisado`, cX + 4, cY + 28);

  // Col 2: Installation data
  doc.setFontSize(6.5);
  doc.text(`Titular: ${d.titular || d.holderName || '—'}`, col1 + 4, cY + 6);
  doc.text(`Dirección: ${d.direccion || d.address || '—'}`, col1 + 4, cY + 12);
  doc.text(`CUPS: ${d.cups || '—'}`, col1 + 4, cY + 18);
  doc.text(`Ref. catastral: ${d.refCatastral || d.cadastralRef || '—'}`, col1 + 4, cY + 24);
  doc.text(`Municipio: ${d.municipio || d.municipality || '—'}`, col1 + 4, cY + 28);

  // Col 3: Technical data
  doc.text(`IGA: ${d.igaNominal || d.iga || '—'} A`, col2 + 4, cY + 6);
  doc.text(`DI: ${d.seccionDi || d.diSection || '—'} mm²`, col2 + 4, cY + 12);
  doc.text(`P. diseño: ${d.potMaxAdmisible ? d.potMaxAdmisible + ' kW' : '—'}`, col2 + 4, cY + 18);
  doc.text(`Electrificación: ${d.gradoElectrificacion || '—'}`, col2 + 4, cY + 24);

  // Col 4: Date/version
  const now = new Date();
  const dateStr = `${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getFullYear()}`;
  doc.text(`Fecha: ${dateStr}`, col3 + 4, cY + 6);
  doc.text(`Versión: ${state.meta?.version || 1}`, col3 + 4, cY + 12);
  doc.text(`Plano: 01 de 01`, col3 + 4, cY + 18);
  doc.setFontSize(5.5);
  doc.text('Generado por OASIS Platform', col3 + 4, cY + 28);

  doc.save(`unifilar_${nombre.replace(/\s+/g, '_')}_${format}.pdf`);
}
function downloadJSON(state: UnifilarState) {
  const blob = new Blob([JSON.stringify({ nodes: state.nodes, wires: state.wires, meta: state.meta }, null, 2)], { type: 'application/json' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
  a.download = `unifilar_${state.meta?.name || 'template'}.json`;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
}

// ═══════════════════════════════════════════════════════════════
// REDUCER
// ═══════════════════════════════════════════════════════════════

function reducer(state: UnifilarState, action: UnifilarAction): UnifilarState {
  switch (action.type) {
    case 'MOVE_NODE': return { ...state, isDirty: true, nodes: state.nodes.map(n => n.id === action.id ? { ...n, x: snap(action.x), y: snap(action.y) } : n) };
    case 'SELECT': return { ...state, selection: { type: action.selType, id: action.id } };
    case 'DESELECT': return { ...state, selection: { type: null, id: null } };
    case 'UPDATE_PROPS': {
      if (state.selection.type === 'node') return { ...state, isDirty: true, nodes: state.nodes.map(n => n.id === state.selection.id ? { ...n, props: { ...n.props, ...action.props } } : n) };
      if (state.selection.type === 'wire') return { ...state, isDirty: true, wires: state.wires.map(w => w.id === state.selection.id ? { ...w, props: { ...w.props, ...action.props } } : w) };
      return state;
    }
    case 'ADD_NODE': return { ...state, isDirty: true, nodes: [...state.nodes, action.node], selection: { type: 'node', id: action.node.id } };
    case 'DELETE_SELECTED': {
      if (state.selection.type === 'node') { const nid = state.selection.id; return { ...state, isDirty: true, nodes: state.nodes.filter(n => n.id !== nid), wires: state.wires.filter(w => w.from !== nid && w.to !== nid), selection: { type: null, id: null } }; }
      if (state.selection.type === 'wire') return { ...state, isDirty: true, wires: state.wires.filter(w => w.id !== state.selection.id), selection: { type: null, id: null } };
      return state;
    }
    case 'ADD_WIRE': return { ...state, isDirty: true, wires: [...state.wires, action.wire] };
    case 'DUPLICATE_NODE': { const o = state.nodes.find(n => n.id === state.selection.id); if (!o) return state; const d = { ...o, id: uid(), x: o.x + 30, y: o.y + 30, props: { ...o.props } }; return { ...state, isDirty: true, nodes: [...state.nodes, d], selection: { type: 'node', id: d.id } }; }
    case 'LOAD_TEMPLATE': { const t = action.template; return { ...state, nodes: t.nodes, wires: t.wires, meta: t.meta, selection: { type: null, id: null }, isDirty: false }; }
    default: return state;
  }
}

// ═══════════════════════════════════════════════════════════════
// PROPERTIES PANEL
// ═══════════════════════════════════════════════════════════════

function PropertiesPanel({ state, dispatch }: { state: UnifilarState; dispatch: React.Dispatch<UnifilarAction> }) {
  const { selection, nodes, wires } = state;
  if (!selection.id) return <div style={{ padding: 12, textAlign: 'center', fontSize: 10, color: C.textDim }}>Selecciona un elemento<br/>para editar propiedades</div>;
  const isNode = selection.type === 'node';
  const item = isNode ? nodes.find(n => n.id === selection.id) : wires.find(w => w.id === selection.id);
  if (!item) return null;
  const props = item.props || {};
  const update = (p: Record<string,any>) => dispatch({ type: 'UPDATE_PROPS', props: p });

  const fields: Array<{key:string;label:string;type:'text'|'number'|'select';options?:string[];step?:number}> = isNode
    ? getNodeFields((item as UnifilarNode).type) : getWireFields();

  return (
    <div style={{ padding: 12, borderBottom: `1px solid ${C.grid}` }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: C.accent, letterSpacing: 1, marginBottom: 10, fontFamily: FN }}>
        {isNode ? (SYMBOL_TYPES[(item as UnifilarNode).type]?.label || '').toUpperCase() : 'CABLE / CONEXIÓN'}
      </div>
      {fields.map(f => (
        <div key={f.key} style={{ marginBottom: 6 }}>
          <label style={{ display: 'block', fontSize: 9, fontFamily: FN, color: C.textDim, marginBottom: 2 }}>{f.label}</label>
          {f.type === 'select' ? (
            <select value={props[f.key]||''} onChange={e => update({ [f.key]: e.target.value })} style={inputSt}>{f.options!.map(o => <option key={o} value={o}>{o}</option>)}</select>
          ) : f.type === 'number' ? (
            <input type="number" value={props[f.key]??''} onChange={e => update({ [f.key]: e.target.value===''?null:Number(e.target.value) })} style={inputSt} step={f.step||1} />
          ) : (
            <input type="text" value={props[f.key]??''} onChange={e => update({ [f.key]: e.target.value })} style={inputSt} />
          )}
        </div>
      ))}
      <div style={{ display: 'flex', gap: 6, marginTop: 12 }}>
        {isNode && <button onClick={() => dispatch({ type: 'DUPLICATE_NODE' })} style={btnSm}>Duplicar</button>}
        <button onClick={() => dispatch({ type: 'DELETE_SELECTED' })} style={{ ...btnSm, background: '#2a1015', color: C.red, borderColor: '#3d1520' }}>Eliminar</button>
      </div>
    </div>
  );
}

function getNodeFields(type: SymbolType) {
  const base = [{ key: 'label', label: 'Etiqueta', type: 'text' as const }];
  switch (type) {
    case 'magnetotermico': return [...base, { key: 'calibre', label: 'Calibre (A)', type: 'number' as const }, { key: 'curva', label: 'Curva', type: 'select' as const, options: ['B','C','D'] }, { key: 'poles', label: 'Polos', type: 'select' as const, options: ['2','3','4'] }];
    case 'diferencial': return [...base, { key: 'calibre', label: 'Calibre (A)', type: 'number' as const }, { key: 'sensitivity', label: 'Sensibilidad (mA)', type: 'select' as const, options: ['30','100','300'] }, { key: 'type', label: 'Tipo', type: 'select' as const, options: ['AC','A','F','B'] }];
    case 'fusible': return [...base, { key: 'calibre', label: 'Calibre (A)', type: 'number' as const }];
    case 'acometida': return [{ key: 'tipoAcometida', label: 'Tipo', type: 'select' as const, options: ['AÉREA','SUBTERRÁNEA'] }, { key: 'seccion', label: 'Sección (mm²)', type: 'number' as const, step: 0.5 }, { key: 'material', label: 'Material', type: 'select' as const, options: ['CU','AL'] }];
    case 'busbar': return [{ key: 'label', label: 'Etiqueta', type: 'text' as const }, { key: 'width', label: 'Ancho (px)', type: 'number' as const, step: 10 }];
    case 'texto': return [{ key: 'text', label: 'Texto', type: 'text' as const }, { key: 'fontSize', label: 'Tamaño', type: 'number' as const, step: 1 }];
    case 'contactor': return [...base, { key: 'calibre', label: 'Calibre (A)', type: 'number' as const }, { key: 'phases', label: 'Fases', type: 'select' as const, options: ['1','3'] }];
    case 'guardamotor': return [...base, { key: 'calibre', label: 'Calibre (A)', type: 'number' as const }, { key: 'range', label: 'Rango (ej: 4-6.3A)', type: 'text' as const }, { key: 'phases', label: 'Fases', type: 'select' as const, options: ['1','3'] }];
    case 'reloj_horario': return [...base, { key: 'programa', label: 'Programa', type: 'text' as const }];
    case 'motor': return [...base, { key: 'potencia', label: 'Potencia (kW)', type: 'number' as const, step: 0.1 }, { key: 'phases', label: 'Fases', type: 'select' as const, options: ['1','3'] }];
    case 'seccionador': return [...base, { key: 'calibre', label: 'Calibre (A)', type: 'number' as const }];
    case 'magneto_diferencial': return [...base, { key: 'calibre', label: 'Calibre (A)', type: 'number' as const }, { key: 'curva', label: 'Curva', type: 'select' as const, options: ['B','C','D'] }, { key: 'sensitivity', label: 'Sensibilidad (mA)', type: 'select' as const, options: ['30','100','300'] }];
    default: return base;
  }
}
function getWireFields() {
  return [
    { key: 'section', label: 'Sección (mm²)', type: 'number' as const, step: 0.5 },
    { key: 'material', label: 'Material', type: 'select' as const, options: ['','CU','AL'] },
    { key: 'conductores', label: 'Conductores', type: 'number' as const },
    { key: 'length', label: 'Longitud (m)', type: 'number' as const },
    { key: 'insulation', label: 'Aislamiento', type: 'select' as const, options: ['','PVC','XLPE','EPR'] },
  ];
}

// ═══════════════════════════════════════════════════════════════
// MAIN EDITOR COMPONENT
// ═══════════════════════════════════════════════════════════════

interface UnifilarEditorProps {
  installationId: string; onClose?: () => void;
  initialTemplate?: UnifilarTemplate;
  installationData?: any;
}

export function UnifilarEditor({ installationId, initialTemplate, onClose, installationData }: UnifilarEditorProps) {
  const [loading, setLoading] = useState(!initialTemplate);
  const [loadError, setLoadError] = useState<string | null>(null);

  const initState = (tmpl: UnifilarTemplate): UnifilarState => ({
    nodes: tmpl.nodes, wires: tmpl.wires, meta: tmpl.meta,
    selection: { type: null, id: null }, isDirty: false,
  });

  // -- Undo/Redo history --
  const historyRef = useRef<Array<{nodes: UnifilarNode[], wires: UnifilarWire[]}>>([]);
  const historyPosRef = useRef(-1);
  const isUndoRedoRef = useRef(false);
  const prevInstallationIdRef = useRef(installationId);

  // Reset undo/redo history when installation changes
  if (prevInstallationIdRef.current !== installationId) {
    prevInstallationIdRef.current = installationId;
    historyRef.current = [];
    historyPosRef.current = -1;
  }
  const emptyTemplate: UnifilarTemplate = { nodes: [], wires: [], meta: { name: '', version: 1 } };
  const [state, rawDispatch] = useReducer(reducer, initialTemplate || emptyTemplate, initState);
  const pushHistory = useCallback((s: UnifilarState) => {
    if (isUndoRedoRef.current) return;
    const snap = { nodes: JSON.parse(JSON.stringify(s.nodes)), wires: JSON.parse(JSON.stringify(s.wires)) };
    historyRef.current = [...historyRef.current.slice(0, historyPosRef.current + 1), snap].slice(-50);
    historyPosRef.current = historyRef.current.length - 1;
  }, []);
  const dispatch = useCallback((action: UnifilarAction) => {
    const noHistory = ['SELECT', 'DESELECT'].includes(action.type);
    if (!noHistory && !isUndoRedoRef.current) pushHistory(state);
    rawDispatch(action);
  }, [state, pushHistory]);
  const canUndo = historyPosRef.current >= 0;
  const canRedo = historyPosRef.current < historyRef.current.length - 1;
  const undo = useCallback(() => {
    if (historyPosRef.current < 0) return;
    isUndoRedoRef.current = true;
    const snap = historyRef.current[historyPosRef.current];
    if (!snap) { isUndoRedoRef.current = false; return; }
    if (historyPosRef.current === historyRef.current.length - 1) {
      const cur = { nodes: JSON.parse(JSON.stringify(state.nodes)), wires: JSON.parse(JSON.stringify(state.wires)) };
      historyRef.current.push(cur);
    }
    rawDispatch({ type: 'LOAD_TEMPLATE', template: { nodes: snap.nodes, wires: snap.wires, meta: state.meta } });
    historyPosRef.current--;
    setTimeout(() => { isUndoRedoRef.current = false; }, 0);
  }, [state]);
  const redo = useCallback(() => {
    const nextPos = historyPosRef.current + 2;
    if (nextPos >= historyRef.current.length) return;
    isUndoRedoRef.current = true;
    const snap = historyRef.current[nextPos];
    if (!snap) { isUndoRedoRef.current = false; return; }
    rawDispatch({ type: 'LOAD_TEMPLATE', template: { nodes: snap.nodes, wires: snap.wires, meta: state.meta } });
    historyPosRef.current++;
    setTimeout(() => { isUndoRedoRef.current = false; }, 0);
  }, [state]);

  // Load from API — ALWAYS generate from current circuits/differentials
  const [hasSavedLayout, setHasSavedLayout] = useState(false);
  useEffect(() => {
    if (initialTemplate) return;
    (async () => {
      try {
        setLoading(true);
        // Check if saved layout exists (for "Cargar última versión" button)
        unifilarApi.getLayout(installationId).then(saved => {
          if (saved?.layoutJson) setHasSavedLayout(true);
        }).catch(() => {});
        // Always generate from current installation data
        const [instRes, panelRes, circuitsRes, calcRes] = await Promise.all([
          installationsApi.get(installationId).then(d => ({ data: d })),
          panelsApi.get(installationId).then(d => ({ data: d })).catch(() => ({ data: null })),
          circuitsApi.list(installationId).then(d => ({ data: d })),
          calculationsApi.getLatest(installationId),
        ]);
        // Merge calculation results into circuit data (engine stores results in snapshot, not on circuit records)
        let circuits = circuitsRes.data;
        if (calcRes?.resultSnapshot) {
          const snap = calcRes.resultSnapshot as any;
          const calcCircuits: any[] = snap.circuits || [];
          const calcMap = new Map<string, any>();
          for (const cr of calcCircuits) calcMap.set(cr.id, cr);
          circuits = circuits.map((c: any) => {
            const cr = calcMap.get(c.id);
            if (!cr) return c;
            return {
              ...c,
              calculatedSection: c.calculatedSection ?? cr.sectionMm2,
              voltageDrop: c.voltageDrop ?? cr.voltageDropPct,
              assignedBreaker: c.assignedBreaker ?? `${cr.breakerRatingA}A curva ${cr.breakerCurve}`,
            };
          });
        }
        const tmpl = generateFromAPI(instRes.data, panelRes.data, circuits);
        dispatch({ type: 'LOAD_TEMPLATE', template: tmpl });
      } catch (err: any) {
        console.error('Unifilar API error:', err);
        setLoadError(err.message || 'No se pudieron cargar los datos de la instalación');
      } finally {
        setLoading(false);
      }
    })();
  }, [installationId, initialTemplate]);

  // Auto-save on close
  const handleClose = useCallback(async () => {
    if (state.isDirty) {
      try {
        const tmpl = { nodes: state.nodes, wires: state.wires, meta: state.meta };
        await unifilarApi.saveLayout(installationId, tmpl);
      } catch (err) {
        console.warn('Error auto-guardando unifilar:', err);
      }
    }
    onClose?.();
  }, [state, installationId, onClose]);

  // Manual save
  const handleManualSave = useCallback(async () => {
    try {
      const tmpl = { nodes: state.nodes, wires: state.wires, meta: state.meta };
      await unifilarApi.saveLayout(installationId, tmpl);
      rawDispatch({ type: 'LOAD_TEMPLATE', template: { ...tmpl, meta: { ...tmpl.meta, modified: new Date().toISOString() } } });
    } catch (err) {
      console.error('Error guardando layout:', err);
      alert('Error al guardar el layout');
    }
  }, [state, installationId]);

  // Load last manually-edited version from DB
  const handleLoadSaved = useCallback(async () => {
    if (!confirm('¿Cargar la última versión editada manualmente? Se perderán los cambios actuales.')) return;
    try {
      setLoading(true);
      const savedLayout = await unifilarApi.getLayout(installationId);
      if (savedLayout?.layoutJson) {
        dispatch({ type: 'LOAD_TEMPLATE', template: savedLayout.layoutJson });
      } else {
        alert('No hay versión guardada disponible.');
      }
    } catch {
      alert('Error al cargar la versión guardada.');
    } finally {
      setLoading(false);
    }
  }, [installationId]);

  // Canvas state
  const svgRef = useRef<SVGSVGElement>(null);
  const [viewBox, setViewBox] = useState({ x: 0, y: 0, w: 1200, h: 800 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState<any>(null);
  const [dragging, setDragging] = useState<any>(null);
  const [connecting, setConnecting] = useState<{ fromId: string } | null>(null);

  const svgPoint = useCallback((cx: number, cy: number) => {
    const svg = svgRef.current; if (!svg) return { x: 0, y: 0 };
    const pt = svg.createSVGPoint(); pt.x = cx; pt.y = cy;
    const ctm = svg.getScreenCTM()?.inverse();
    if (!ctm) return { x: 0, y: 0 };
    const p = pt.matrixTransform(ctm); return { x: p.x, y: p.y };
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const sc = e.deltaY > 0 ? 1.08 : 0.92;
    const p = svgPoint(e.clientX, e.clientY);
    setViewBox(vb => {
      const nw = Math.max(200, Math.min(4000, vb.w * sc));
      const nh = Math.max(150, Math.min(3000, vb.h * sc));
      return { x: p.x - (p.x - vb.x) * sc, y: p.y - (p.y - vb.y) * sc, w: nw, h: nh };
    });
  }, [svgPoint]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 1 || (e.button === 0 && e.altKey)) {
      setIsPanning(true); setPanStart({ x: e.clientX, y: e.clientY, vb: { ...viewBox } }); e.preventDefault();
    }
  }, [viewBox]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isPanning && panStart) {
      const dx = (e.clientX - panStart.x) * (viewBox.w / (svgRef.current?.clientWidth || 1));
      const dy = (e.clientY - panStart.y) * (viewBox.h / (svgRef.current?.clientHeight || 1));
      setViewBox({ ...panStart.vb, x: panStart.vb.x - dx, y: panStart.vb.y - dy });
    }
    if (dragging) {
      const p = svgPoint(e.clientX, e.clientY);
      didDrag.current = true; dispatch({ type: 'MOVE_NODE', id: dragging.id, x: p.x + dragging.ox, y: p.y + dragging.oy });
    }
  }, [isPanning, panStart, viewBox, dragging, svgPoint]);

  const handleMouseUp = useCallback(() => { setIsPanning(false); setPanStart(null); setDragging(null); }, []);

  const handleNodeMouseDown = useCallback((e: React.MouseEvent, node: UnifilarNode) => {
    e.stopPropagation();
    if (e.shiftKey) { setConnecting({ fromId: node.id }); return; }
    dispatch({ type: 'SELECT', selType: 'node', id: node.id });
    const p = svgPoint(e.clientX, e.clientY);
    setDragging({ id: node.id, ox: node.x - p.x, oy: node.y - p.y });
  }, [svgPoint]);

  const handleNodeMouseUp = useCallback((e: React.MouseEvent, node: UnifilarNode) => {
    if (connecting && connecting.fromId !== node.id) {
      dispatch({ type: 'ADD_WIRE', wire: { id: uid(), from: connecting.fromId, to: node.id, fromPort: 'bottom', toPort: 'top', props: {} } });
      setConnecting(null);
    }
  }, [connecting]);

  const didDrag = useRef(false);  const handleBgClick = useCallback(() => { if (didDrag.current) { didDrag.current = false; return; } dispatch({ type: 'DESELECT' }); setConnecting(null); }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const type = e.dataTransfer.getData('symbolType') as SymbolType;
    if (!type) return;
    const p = svgPoint(e.clientX, e.clientY);
    dispatch({ type: 'ADD_NODE', node: { id: uid(), type, x: snap(p.x), y: snap(p.y), props: type === 'busbar' ? { width: 200, label: '' } : {} } });
  }, [svgPoint]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === 'INPUT' || (e.target as HTMLElement)?.tagName === 'SELECT') return;
      if (e.key === 'Delete' || e.key === 'Backspace') dispatch({ type: 'DELETE_SELECTED' });
      if (e.key === 'z' && (e.ctrlKey || e.metaKey) && !e.shiftKey) { e.preventDefault(); undo(); }
      if ((e.key === 'z' && (e.ctrlKey || e.metaKey) && e.shiftKey) || (e.key === 'y' && (e.ctrlKey || e.metaKey))) { e.preventDefault(); redo(); }
      if (e.key === 'd' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); dispatch({ type: 'DUPLICATE_NODE' }); }
      if (e.key === 'Escape') { dispatch({ type: 'DESELECT' }); setConnecting(null); }
    };
    window.addEventListener('keydown', h); return () => window.removeEventListener('keydown', h);
  }, []);

  const handleImportJSON = useCallback(() => {
    const input = document.createElement('input'); input.type = 'file'; input.accept = '.json';
    input.onchange = (e: any) => { const f = e.target.files[0]; if (!f) return; const r = new FileReader();
      r.onload = (ev: any) => { try { const t = JSON.parse(ev.target.result); if (t.nodes && t.wires) dispatch({ type: 'LOAD_TEMPLATE', template: t }); } catch {} };
      r.readAsText(f); }; input.click();
  }, []);

  // PDF export state
  const [pdfFormat, setPdfFormat] = useState<PdfFormat>('A4');
  const [exportingPdf, setExportingPdf] = useState(false);

  const handleExportPDF = useCallback(async () => {
    setExportingPdf(true);
    try { await downloadPDF(state, pdfFormat, installationData); }
    catch (err) { console.error('PDF export error:', err); alert('Error exportando PDF. Verifica que jspdf y svg2pdf.js estén instalados: yarn add jspdf svg2pdf.js'); }
    finally { setExportingPdf(false); }
  }, [state, pdfFormat, installationData]);

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: C.textMuted, fontFamily: FN_UI, fontSize: 13 }}>Generando esquema unifilar...</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: C.bg, fontFamily: FN_UI, color: C.text }}>
      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px', background: C.surface, borderBottom: `1px solid ${C.grid}` }}>
        <span style={{ fontSize: 11, fontFamily: FN, color: C.accent, fontWeight: 700, letterSpacing: 2, marginRight: 8 }}>◈ UNIFILAR</span>
        <span style={{ fontSize: 9, color: C.textDim, fontFamily: FN, background: C.accentDim, padding: '2px 6px', borderRadius: 3 }}>EDITABLE</span>
        {loadError && <span style={{ fontSize: 9, color: C.orange, fontFamily: FN }}>⚠ {loadError}</span>}
        <div style={{ flex: 1 }} />
        <button onClick={undo} disabled={!canUndo} style={{ ...toolBt, opacity: canUndo ? 1 : 0.3 }}>Deshacer</button>
        <button onClick={redo} disabled={!canRedo} style={{ ...toolBt, opacity: canRedo ? 1 : 0.3 }}>Rehacer</button>
        <div style={{ width: 1, height: 16, background: '#2a2f3d', margin: '0 4px' }}></div>
        <button onClick={handleImportJSON} style={toolBt}>📂 Importar</button>
        <button onClick={() => downloadJSON(state)} style={toolBt}>💾 JSON</button>
        <button onClick={() => downloadSVG()} style={toolBt}>🖼 SVG</button>
        <button onClick={() => downloadDXF(state)} style={{ ...toolBt, color: C.accent, borderColor: `${C.accent}40` }}>📐 DXF</button>
        <div style={{ width: 1, height: 16, background: '#2a2f3d', margin: '0 4px' }}></div>
        <select value={pdfFormat} onChange={e => setPdfFormat(e.target.value as PdfFormat)} style={{ ...toolBt, padding: '4px 6px', width: 56 }}><option value="A4">A4</option><option value="A3">A3</option></select>
        <button onClick={handleExportPDF} disabled={exportingPdf} style={{ ...toolBt, color: C.green, borderColor: `${C.green}40` }}>{exportingPdf ? '⏳...' : '📄 PDF'}</button>
        <div style={{ flex: 1 }} />
        {hasSavedLayout && <button onClick={handleLoadSaved} style={{ ...toolBt, color: C.orange, borderColor: `${C.orange}40` }}>📋 Cargar última versión editada</button>}
        <button onClick={handleManualSave} disabled={!state.isDirty} style={{ ...toolBt, color: state.isDirty ? C.green : C.textDim, borderColor: state.isDirty ? `${C.green}40` : C.grid }}>💾 Guardar</button>
        {onClose && <button onClick={handleClose} style={{ ...toolBt, color: '#ef4444', borderColor: '#ef444440', marginLeft: 8 }}>Cerrar</button>}
      </div>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Left sidebar */}
        <div style={{ width: 220, minWidth: 220, display: 'flex', flexDirection: 'column', background: C.panel, borderRight: `1px solid ${C.grid}`, overflow: 'auto' }}>
          {/* Symbol palette */}
          <div style={{ padding: 12, borderBottom: `1px solid ${C.grid}` }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: C.accent, letterSpacing: 1, fontFamily: FN, marginBottom: 8 }}>SÍMBOLOS</div>
            {Object.entries(CATEGORIES).map(([cat, info]) => (
              <div key={cat} style={{ marginBottom: 8 }}>
                <div style={{ fontSize: 9, color: C.textDim, marginBottom: 4, fontFamily: FN }}>{info.icon} {info.label}</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {Object.entries(SYMBOL_TYPES).filter(([, d]) => d.category === cat).map(([type, d]) => (
                    <div key={type} draggable
                      onDragStart={e => e.dataTransfer.setData('symbolType', type)}
                      onClick={() => dispatch({ type: 'ADD_NODE', node: { id: uid(), type: type as SymbolType, x: snap(400 + Math.random() * 200), y: snap(300 + Math.random() * 100), props: type === 'busbar' ? { width: 200, label: '' } : {} } })}
                      style={{ padding: '3px 8px', fontSize: 9, fontFamily: FN, color: C.textMuted, background: C.surfaceHover, border: `1px solid ${C.grid}`, borderRadius: 4, cursor: 'grab', userSelect: 'none', whiteSpace: 'nowrap' }}
                    >{d.label}</div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div style={{ flex: 1, overflow: 'auto' }}><PropertiesPanel state={state} dispatch={dispatch} /></div>
          <div style={{ padding: '8px 12px', borderTop: `1px solid ${C.grid}`, fontSize: 9, fontFamily: FN, color: C.textDim }}>
            {state.nodes.length} nodos · {state.wires.length} conexiones
          </div>
        </div>

        {/* Canvas */}
        <div id="unifilar-canvas" style={{ flex: 1, overflow: 'hidden', position: 'relative', background: C.bg, cursor: isPanning ? 'grabbing' : connecting ? 'crosshair' : 'default' }}
          onDragOver={e => e.preventDefault()} onDrop={handleDrop}
        >
          {connecting && <div style={{ position: 'absolute', top: 8, left: '50%', transform: 'translateX(-50%)', background: C.accentDim, color: C.accent, padding: '4px 12px', borderRadius: 6, fontSize: 10, fontFamily: FN, zIndex: 10, border: `1px solid ${C.accent}40` }}>🔗 Clic en otro nodo para conectar · ESC cancelar</div>}
          <svg ref={svgRef} viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.w} ${viewBox.h}`} style={{ width: '100%', height: '100%' }}
            onWheel={handleWheel} onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onClick={handleBgClick}
          >
            <defs>
              <pattern id="sG" width={GRID_SIZE} height={GRID_SIZE} patternUnits="userSpaceOnUse"><circle cx={GRID_SIZE/2} cy={GRID_SIZE/2} r={0.3} fill={C.grid}/></pattern>
              <pattern id="bG" width={GRID_SIZE*10} height={GRID_SIZE*10} patternUnits="userSpaceOnUse">
                <rect width={GRID_SIZE*10} height={GRID_SIZE*10} fill="url(#sG)"/>
                <line x1={0} y1={0} x2={GRID_SIZE*10} y2={0} stroke={C.gridMajor} strokeWidth={0.4}/>
                <line x1={0} y1={0} x2={0} y2={GRID_SIZE*10} stroke={C.gridMajor} strokeWidth={0.4}/>
              </pattern>
            </defs>
            <rect x={viewBox.x-1000} y={viewBox.y-1000} width={viewBox.w+2000} height={viewBox.h+2000} fill="url(#bG)"/>
            {state.wires.map(w => <g key={w.id} onClick={e=>{e.stopPropagation();dispatch({type:'SELECT',selType:'wire',id:w.id})}} style={{cursor:'pointer'}}><RenderWire wire={w} nodes={state.nodes} isSelected={state.selection.type==='wire'&&state.selection.id===w.id}/></g>)}
            {state.nodes.map(node => {
              const isSel = state.selection.type==='node'&&state.selection.id===node.id;
              const def = SYMBOL_TYPES[node.type]||{w:20,h:20};
              return (<g key={node.id} onMouseDown={e=>handleNodeMouseDown(e,node)} onMouseUp={e=>handleNodeMouseUp(e,node)} onClick={e=>e.stopPropagation()} style={{cursor:dragging?.id===node.id?'grabbing':'grab'}}>
                {isSel && <rect x={node.x-def.w/2-6} y={node.y-6} width={def.w+12} height={def.h+12} fill={C.selectedBg} stroke={C.selected} strokeWidth={1} strokeDasharray="4 2" rx={4}/>}
                <g transform={`translate(${node.x},${node.y})`}><RenderSymbol node={node} isSelected={isSel}/></g>
                {isSel && node.type!=='texto' && <><circle cx={node.x} cy={node.y} r={3} fill={C.accent} opacity={0.6}/><circle cx={node.x} cy={node.y+def.h} r={3} fill={C.accent} opacity={0.6}/></>}
              </g>);
            })}
          </svg>
          {/* Zoom */}
          <div style={{ position: 'absolute', bottom: 12, right: 12, display: 'flex', gap: 4 }}>
            <button onClick={()=>setViewBox(vb=>({...vb,w:vb.w*0.85,h:vb.h*0.85}))} style={zBtn}>+</button>
            <button onClick={()=>setViewBox(vb=>({...vb,w:vb.w*1.15,h:vb.h*1.15}))} style={zBtn}>−</button>
            <button onClick={()=>setViewBox({x:0,y:0,w:1200,h:800})} style={{...zBtn,fontSize:9,padding:'4px 8px'}}>Reset</button>
          </div>
          <div style={{ position: 'absolute', bottom: 12, left: 12, display: 'flex', gap: 8, fontSize: 9, fontFamily: FN, color: C.textDim }}>
            <span>Alt+Drag: pan</span><span>·</span><span>Scroll: zoom</span><span>·</span><span>Shift+Clic: conectar</span><span>·</span><span>Del: eliminar</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Styles ──
const inputSt: React.CSSProperties = { width: '100%', padding: '4px 6px', fontSize: 11, fontFamily: FN, color: C.text, background: C.bg, border: `1px solid ${C.grid}`, borderRadius: 4, outline: 'none', boxSizing: 'border-box' };
const btnSm: React.CSSProperties = { padding: '5px 8px', fontSize: 9, fontFamily: FN, color: C.textMuted, background: C.surfaceHover, border: `1px solid ${C.grid}`, borderRadius: 4, cursor: 'pointer', flex: 1 };
const toolBt: React.CSSProperties = { padding: '4px 10px', fontSize: 10, fontFamily: FN_UI, color: C.textMuted, background: 'transparent', border: `1px solid ${C.grid}`, borderRadius: 4, cursor: 'pointer', whiteSpace: 'nowrap' };
const zBtn: React.CSSProperties = { width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontFamily: FN, color: C.textMuted, background: C.surface, border: `1px solid ${C.grid}`, borderRadius: 6, cursor: 'pointer' };
