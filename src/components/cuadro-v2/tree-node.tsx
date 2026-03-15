'use client';

import { useState } from 'react';
import { ChevronRight, ChevronDown, Plus, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { NODE_TYPE_CONFIG } from './node-type-config';
import type { PanelNodeType } from '@/lib/types';

export interface TreeNodeData {
  id: string;
  parentId: string | null;
  position: number;
  nodeType: PanelNodeType;
  name: string | null;
  calibreA: number | null;
  polos: number | null;
  curva: string | null;
  poderCorteKa: number | null;
  sensitivityMa: number | null;
  diffType: string | null;
  loadType: string | null;
  power: number | null;
  voltage: number | null;
  phases: number | null;
  cosPhi: number | null;
  length: number | null;
  section: number | null;
  cableType: string | null;
  material: string | null;
  installMethod: string | null;
  quantity: number | null;
  subcuadroName: string | null;
  contactorType: string | null;
  calcResults: Record<string, unknown> | null;
  children: TreeNodeData[];
}

function countDescendants(node: TreeNodeData): number {
  let count = 0;
  for (const child of node.children) {
    count += 1 + countDescendants(child);
  }
  return count;
}

function getSpecs(node: TreeNodeData): string {
  const { nodeType } = node;
  switch (nodeType) {
    case 'IGA':
    case 'AUTOMATICO':
    case 'GUARDAMOTOR': {
      const parts: string[] = [];
      if (node.calibreA) parts.push(`${node.calibreA}A`);
      if (node.curva) parts.push(node.curva);
      if (node.polos) parts.push(`${node.polos}P`);
      return parts.join(' ');
    }
    case 'DIFERENCIAL': {
      const parts: string[] = [];
      if (node.calibreA) parts.push(`${node.calibreA}A`);
      if (node.sensitivityMa) parts.push(`${node.sensitivityMa}mA`);
      if (node.diffType) parts.push(node.diffType);
      if (node.polos) parts.push(`${node.polos}P`);
      return parts.join(' ');
    }
    case 'CIRCUITO': {
      const parts: string[] = [];
      if (node.power) parts.push(`${node.power}W`);
      if (node.section) parts.push(`${node.section}mm²`);
      if (node.cableType) parts.push(node.cableType);
      if (node.material) parts.push(node.material);
      return parts.join(' ');
    }
    case 'SUBCUADRO':
      return node.subcuadroName || '';
    case 'CONTACTOR':
      return node.contactorType || '';
    default:
      return '';
  }
}

function getDisplayName(node: TreeNodeData): string {
  if (node.name) return node.name;
  const config = NODE_TYPE_CONFIG[node.nodeType];
  return config.label;
}

function getCalcSummary(node: TreeNodeData): { text: string; ok: boolean } | null {
  const cr = node.calcResults;
  if (!cr) return null;

  if (node.nodeType === 'CIRCUITO') {
    const section = cr.sectionMm2 as number | undefined;
    const iadm = cr.admissibleCurrentA as number | undefined;
    const cdt = cr.voltageDropPct as number | undefined;
    const cdtOk = cr.cdtCompliant as boolean | undefined;
    const valid = cr.isCompliant as boolean | undefined;
    if (section == null && iadm == null && cdt == null) return null;

    const parts: string[] = [];
    if (section != null) parts.push(`${section}mm²`);
    if (iadm != null) parts.push(`Iadm=${iadm}A`);
    if (cdt != null) parts.push(`CdT=${cdt.toFixed(1)}%`);
    const ok = (valid ?? true) && (cdtOk ?? true);
    return { text: parts.join(' '), ok };
  }

  if (node.nodeType === 'IGA') {
    const di = cr.di as Record<string, unknown> | undefined;
    const totalW = cr.totalInstalledW as number | undefined;
    if (!di && totalW == null) return null;

    const parts: string[] = [];
    if (totalW != null) parts.push(`P=${totalW}W`);
    if (di) {
      const cdtPct = di.voltageDropPct as number | undefined;
      if (cdtPct != null) parts.push(`CdT DI=${(cdtPct as number).toFixed(2)}%`);
    }
    const ok = di ? (di.cdtCompliant as boolean ?? true) : true;
    return { text: parts.join(' '), ok };
  }

  return null;
}

interface TreeNodeProps {
  node: TreeNodeData;
  depth: number;
  onAdd: (parentId: string, parentType: PanelNodeType) => void;
  onDelete: (id: string, name: string, descendantCount: number) => void;
  onSelect?: (nodeId: string) => void;
  selectedNodeId?: string | null;
  deletingId: string | null;
}

export function TreeNode({ node, depth, onAdd, onDelete, onSelect, selectedNodeId, deletingId }: TreeNodeProps) {
  const [expanded, setExpanded] = useState(true);
  const config = NODE_TYPE_CONFIG[node.nodeType];
  const hasChildren = node.children.length > 0;
  const canAddChildren = config.canHaveChildren && config.allowedChildTypes.length > 0;
  const specs = getSpecs(node);
  const displayName = getDisplayName(node);
  const isDeleting = deletingId === node.id;
  const isSelected = selectedNodeId === node.id;

  return (
    <div>
      <div
        className={`group flex items-center gap-2 rounded px-2 py-1.5 transition-colors cursor-pointer ${
          isSelected
            ? 'bg-blue-50 border-l-2 border-blue-500'
            : 'hover:bg-gray-50 border-l-2 border-transparent'
        }`}
        style={{ paddingLeft: `${depth * 24 + 8}px` }}
        onClick={() => onSelect?.(node.id)}
      >
        {/* Collapse toggle */}
        {hasChildren ? (
          <button
            onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
            className="flex h-5 w-5 shrink-0 items-center justify-center rounded text-surface-400 hover:text-surface-600 hover:bg-surface-100"
          >
            {expanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
          </button>
        ) : (
          <span className="w-5 shrink-0" />
        )}

        {/* Type badge */}
        <span className={`inline-flex items-center gap-1 rounded border px-2 py-0.5 text-xs font-medium shrink-0 ${config.color}`}>
          <span>{config.icon}</span>
          {config.shortLabel}
        </span>

        {/* Name */}
        <span className="text-sm font-medium text-surface-800 truncate">
          {displayName}
        </span>

        {/* Specs */}
        {specs && (
          <span className="text-xs text-surface-400 truncate">
            {specs}
          </span>
        )}

        {/* Calc results summary */}
        {(() => {
          const calc = getCalcSummary(node);
          if (!calc) return null;
          return (
            <span className={`text-xs truncate ${calc.ok ? 'text-emerald-600' : 'text-amber-600'}`}>
              {calc.ok ? '\u2713' : '\u26A0'} {calc.text}
            </span>
          );
        })()}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Action buttons (visible on hover) */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          {canAddChildren && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 text-surface-400 hover:text-blue-600"
              onClick={(e) => { e.stopPropagation(); onAdd(node.id, node.nodeType); }}
            >
              <Plus className="h-3.5 w-3.5" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 text-surface-400 hover:text-red-600"
            onClick={(e) => { e.stopPropagation(); onDelete(node.id, displayName, countDescendants(node)); }}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Trash2 className="h-3.5 w-3.5" />
            )}
          </Button>
        </div>
      </div>

      {/* Children */}
      {expanded && hasChildren && (
        <div>
          {node.children.map((child) => (
            <TreeNode
              key={child.id}
              node={child}
              depth={depth + 1}
              onAdd={onAdd}
              onDelete={onDelete}
              onSelect={onSelect}
              selectedNodeId={selectedNodeId}
              deletingId={deletingId}
            />
          ))}
        </div>
      )}
    </div>
  );
}
