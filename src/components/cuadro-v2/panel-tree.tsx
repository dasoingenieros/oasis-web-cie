'use client';

import { TreeNode } from './tree-node';
import type { TreeNodeData } from './tree-node';
import type { PanelNodeType, TreeValidationItem } from '@/lib/types';

interface PanelTreeProps {
  nodes: TreeNodeData[];
  onAdd: (parentId: string, parentType: PanelNodeType) => void;
  onDelete: (id: string, name: string, descendantCount: number) => void;
  onSelect?: (nodeId: string) => void;
  selectedNodeId?: string | null;
  deletingId: string | null;
  nodeValidations?: Map<string, TreeValidationItem[]>;
}

export function PanelTree({ nodes, onAdd, onDelete, onSelect, selectedNodeId, deletingId, nodeValidations }: PanelTreeProps) {
  return (
    <div className="py-1">
      {nodes.map((node) => (
        <TreeNode
          key={node.id}
          node={node}
          depth={0}
          onAdd={onAdd}
          onDelete={onDelete}
          onSelect={onSelect}
          selectedNodeId={selectedNodeId}
          deletingId={deletingId}
          nodeValidations={nodeValidations}
        />
      ))}
    </div>
  );
}
