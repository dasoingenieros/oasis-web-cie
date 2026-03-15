'use client';

import { useState, useMemo } from 'react';
import { Loader2, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { NODE_TYPE_CONFIG, NODE_ICON_MAP } from './node-type-config';
import type { TreeNodeData } from './tree-node';

interface MoveNodeDialogProps {
  open: boolean;
  node: TreeNodeData;
  allNodes: TreeNodeData[];
  onConfirm: (nodeId: string, newParentId: string | null, newPosition: number) => Promise<void>;
  onClose: () => void;
}

/** Collect all descendant IDs of a node (recursive) */
function getDescendantIds(node: TreeNodeData): Set<string> {
  const ids = new Set<string>();
  for (const child of node.children) {
    ids.add(child.id);
    for (const id of getDescendantIds(child)) {
      ids.add(id);
    }
  }
  return ids;
}

/** Flatten tree into a list of {node, depth} for rendering */
function flattenTree(nodes: TreeNodeData[], depth: number): { node: TreeNodeData; depth: number }[] {
  const result: { node: TreeNodeData; depth: number }[] = [];
  for (const n of nodes) {
    result.push({ node: n, depth });
    result.push(...flattenTree(n.children, depth + 1));
  }
  return result;
}

export function MoveNodeDialog({ open, node, allNodes, onConfirm, onClose }: MoveNodeDialogProps) {
  const [selectedParentId, setSelectedParentId] = useState<string | null>(null); // null = root
  const [isRootSelected, setIsRootSelected] = useState(false);
  const [position, setPosition] = useState(1);
  const [moving, setMoving] = useState(false);

  // IDs that cannot be selected as parent (self + descendants)
  const disabledIds = useMemo(() => {
    const ids = getDescendantIds(node);
    ids.add(node.id);
    return ids;
  }, [node]);

  // Flat list for rendering
  const flatList = useMemo(() => flattenTree(allNodes, 0), [allNodes]);

  // Calculate sibling count for position selector
  const siblingCount = useMemo(() => {
    if (isRootSelected) {
      // Root level nodes (excluding the moving node itself)
      return allNodes.filter((n) => n.id !== node.id).length;
    }
    if (selectedParentId) {
      const parent = flatList.find((f) => f.node.id === selectedParentId);
      if (parent) {
        return parent.node.children.filter((c) => c.id !== node.id).length;
      }
    }
    return 0;
  }, [isRootSelected, selectedParentId, allNodes, flatList, node.id]);

  const maxPosition = siblingCount + 1;

  const handleSelect = (id: string | null) => {
    if (id === null) {
      setIsRootSelected(true);
      setSelectedParentId(null);
    } else {
      setIsRootSelected(false);
      setSelectedParentId(id);
    }
    setPosition(1);
  };

  const hasSelection = isRootSelected || selectedParentId !== null;

  const handleConfirm = async () => {
    if (!hasSelection) return;
    setMoving(true);
    try {
      const newParentId = isRootSelected ? null : selectedParentId;
      await onConfirm(node.id, newParentId, position - 1); // API uses 0-based position
      onClose();
    } catch {
      alert('Error al mover el nodo');
    } finally {
      setMoving(false);
    }
  };

  const nodeName = node.name || NODE_TYPE_CONFIG[node.nodeType].label;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base">
            Mover: &ldquo;{nodeName}&rdquo;
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <p className="text-sm text-surface-600">Selecciona el nuevo padre:</p>

          <div className="max-h-60 overflow-y-auto rounded-lg border border-surface-200 p-2 space-y-0.5">
            {/* Root option */}
            <button
              onClick={() => handleSelect(null)}
              className={`w-full flex items-center gap-2 rounded px-3 py-2 text-sm text-left transition-colors ${
                isRootSelected
                  ? 'bg-blue-50 border border-blue-300'
                  : 'hover:bg-surface-50 border border-transparent'
              }`}
            >
              <MapPin className="h-4 w-4 text-surface-500" />
              <span className="font-medium">Raíz (primer nivel)</span>
            </button>

            {/* Tree nodes */}
            {flatList.map(({ node: n, depth }) => {
              const isDisabled = disabledIds.has(n.id);
              const isSelected = !isRootSelected && selectedParentId === n.id;
              const cfg = NODE_TYPE_CONFIG[n.nodeType];

              // Only allow selecting nodes that can have children
              const canBeParent = cfg.canHaveChildren && !isDisabled;

              const IconComponent = NODE_ICON_MAP[cfg.icon];
              return (
                <button
                  key={n.id}
                  onClick={() => canBeParent && handleSelect(n.id)}
                  disabled={!canBeParent}
                  className={`w-full flex items-center gap-2 rounded px-3 py-1.5 text-sm text-left transition-colors ${
                    isSelected
                      ? 'bg-blue-50 border border-blue-300'
                      : isDisabled
                        ? 'opacity-40 cursor-not-allowed border border-transparent'
                        : !cfg.canHaveChildren
                          ? 'opacity-40 cursor-not-allowed border border-transparent'
                          : 'hover:bg-surface-50 border border-transparent'
                  }`}
                  style={{ paddingLeft: `${depth * 20 + 12}px` }}
                >
                  {IconComponent && <IconComponent className="h-4 w-4 shrink-0" />}
                  <span className={isDisabled ? 'line-through' : ''}>
                    {n.name || cfg.label}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Position selector */}
          {hasSelection && maxPosition > 0 && (
            <div className="space-y-1">
              <Label className="text-xs text-surface-500">
                Posición (de {maxPosition})
              </Label>
              <Select
                value={String(position)}
                onValueChange={(v) => setPosition(Number(v))}
              >
                <SelectTrigger className="h-8 text-sm w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: maxPosition }, (_, i) => i + 1).map((p) => (
                    <SelectItem key={p} value={String(p)}>
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={onClose} disabled={moving}>
            Cancelar
          </Button>
          <Button size="sm" onClick={handleConfirm} disabled={!hasSelection || moving} className="gap-1.5">
            {moving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {moving ? 'Moviendo...' : 'Mover'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
