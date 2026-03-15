'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Loader2, Plus, AlertTriangle, Download, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { panelNodesApi } from '@/lib/api-client';
import type { PanelNode, PanelNodeType, CreatePanelNodeDto } from '@/lib/types';
import { PanelTree } from './panel-tree';
import { AddNodeDialog } from './add-node-dialog';
import { NodeEditPanel } from './node-edit-panel';
import { MoveNodeDialog } from './move-node-dialog';
import { NODE_TYPE_CONFIG } from './node-type-config';
import type { TreeNodeData } from './tree-node';

interface CuadroV2TabProps {
  installationId: string;
}

function buildTree(nodes: PanelNode[]): TreeNodeData[] {
  const map = new Map<string, TreeNodeData>();

  // Create TreeNodeData for each node
  for (const node of nodes) {
    map.set(node.id, {
      id: node.id,
      parentId: node.parentId,
      position: node.position,
      nodeType: node.nodeType,
      name: node.name,
      calibreA: node.calibreA,
      polos: node.polos,
      curva: node.curva,
      poderCorteKa: node.poderCorteKa,
      sensitivityMa: node.sensitivityMa,
      diffType: node.diffType,
      loadType: node.loadType,
      power: node.power,
      voltage: node.voltage,
      phases: node.phases,
      cosPhi: node.cosPhi,
      length: node.length,
      section: node.section,
      cableType: node.cableType,
      material: node.material,
      installMethod: node.installMethod,
      quantity: node.quantity,
      subcuadroName: node.subcuadroName,
      contactorType: node.contactorType,
      children: [],
    });
  }

  const roots: TreeNodeData[] = [];

  for (const node of nodes) {
    const treeNode = map.get(node.id)!;
    if (node.parentId && map.has(node.parentId)) {
      map.get(node.parentId)!.children.push(treeNode);
    } else {
      roots.push(treeNode);
    }
  }

  // Sort children by position
  const sortChildren = (items: TreeNodeData[]) => {
    items.sort((a, b) => a.position - b.position);
    for (const item of items) {
      sortChildren(item.children);
    }
  };
  sortChildren(roots);

  return roots;
}

/** Find a node by ID in the tree (recursive) */
function findNodeInTree(nodes: TreeNodeData[], id: string): TreeNodeData | null {
  for (const node of nodes) {
    if (node.id === id) return node;
    const found = findNodeInTree(node.children, id);
    if (found) return found;
  }
  return null;
}

export function CuadroV2Tab({ installationId }: CuadroV2TabProps) {
  const [nodes, setNodes] = useState<PanelNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogParentId, setDialogParentId] = useState<string | null>(null);
  const [dialogParentType, setDialogParentType] = useState<PanelNodeType | null>(null);
  const [dialogParentName, setDialogParentName] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // Delete state
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string; descendants: number } | null>(null);

  // Selection & edit state
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  // Move dialog state
  const [moveNodeId, setMoveNodeId] = useState<string | null>(null);

  // Migration state
  const [migrating, setMigrating] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleMigrateV1 = async () => {
    setMigrating(true);
    try {
      const result = await panelNodesApi.migrateV1(installationId);
      await fetchNodes();
      showToast(`Importados ${result.length} nodos desde Cuadro v1`);
    } catch {
      alert('Error al importar desde Cuadro v1. Verifica que exista un cuadro eléctrico v1.');
    } finally {
      setMigrating(false);
    }
  };

  const fetchNodes = useCallback(async () => {
    try {
      setError(null);
      const data = await panelNodesApi.list(installationId);
      setNodes(data);
    } catch {
      setError('Error al cargar los nodos del cuadro');
    } finally {
      setLoading(false);
    }
  }, [installationId]);

  useEffect(() => {
    fetchNodes();
  }, [fetchNodes]);

  const treeNodes = useMemo(() => buildTree(nodes), [nodes]);

  // Find the selected node in the tree
  const selectedNode = useMemo(
    () => (selectedNodeId ? findNodeInTree(treeNodes, selectedNodeId) : null),
    [treeNodes, selectedNodeId],
  );

  // Find move target node in tree
  const moveNode = useMemo(
    () => (moveNodeId ? findNodeInTree(treeNodes, moveNodeId) : null),
    [treeNodes, moveNodeId],
  );

  // Root types already present (to prevent duplicate IGA)
  const existingRootTypes = nodes
    .filter((n) => !n.parentId)
    .map((n) => n.nodeType);

  const handleAddRoot = () => {
    setDialogParentId(null);
    setDialogParentType(null);
    setDialogParentName(null);
    setDialogOpen(true);
  };

  const handleAddChild = (parentId: string, parentType: PanelNodeType) => {
    const parent = nodes.find((n) => n.id === parentId);
    setDialogParentId(parentId);
    setDialogParentType(parentType);
    setDialogParentName(parent?.name || NODE_TYPE_CONFIG[parentType].label);
    setDialogOpen(true);
  };

  const handleCreateNode = async (dto: CreatePanelNodeDto) => {
    setIsCreating(true);
    try {
      await panelNodesApi.create(installationId, dto);
      setDialogOpen(false);
      await fetchNodes();
    } catch {
      alert('Error al crear el nodo');
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteRequest = (id: string, name: string, descendantCount: number) => {
    setDeleteConfirm({ id, name, descendants: descendantCount });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm) return;
    setDeletingId(deleteConfirm.id);
    try {
      await panelNodesApi.delete(installationId, deleteConfirm.id);
      setDeleteConfirm(null);
      // Clear selection if deleted node was selected
      if (selectedNodeId === deleteConfirm.id) {
        setSelectedNodeId(null);
      }
      await fetchNodes();
    } catch {
      alert('Error al eliminar el nodo');
    } finally {
      setDeletingId(null);
    }
  };

  const handleSelectNode = (nodeId: string) => {
    setSelectedNodeId(nodeId === selectedNodeId ? null : nodeId);
  };

  const handleSaveNode = async (nodeId: string, data: Record<string, unknown>) => {
    await panelNodesApi.update(installationId, nodeId, data as Partial<CreatePanelNodeDto>);
    await fetchNodes();
  };

  const handleMoveRequest = (nodeId: string) => {
    setMoveNodeId(nodeId);
  };

  const handleMoveConfirm = async (nodeId: string, newParentId: string | null, newPosition: number) => {
    await panelNodesApi.move(installationId, nodeId, { newParentId, newPosition });
    await fetchNodes();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-brand-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <AlertTriangle className="h-8 w-8 text-red-400 mb-2" />
        <p className="text-sm text-red-600">{error}</p>
        <Button variant="outline" size="sm" className="mt-3" onClick={fetchNodes}>
          Reintentar
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-surface-200 bg-white">
        {nodes.length === 0 ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center py-16">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-surface-100 mb-4">
              <span className="text-2xl">⚡</span>
            </div>
            <h3 className="text-sm font-semibold text-surface-700 mb-1">
              Cuadro eléctrico vacío
            </h3>
            <p className="text-xs text-surface-500 mb-4 max-w-xs text-center">
              Comienza añadiendo el Interruptor General Automático (IGA) o un Subcuadro como nodo raíz.
            </p>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleAddRoot} className="gap-1.5">
                <Plus className="h-3.5 w-3.5" />
                Crear IGA
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleMigrateV1}
                disabled={migrating}
                className="gap-1.5"
              >
                {migrating ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Download className="h-3.5 w-3.5" />
                )}
                {migrating ? 'Importando...' : 'Importar desde Cuadro v1'}
              </Button>
            </div>
          </div>
        ) : (
          /* Tree view + edit panel */
          <div className="flex flex-col lg:flex-row">
            {/* Tree */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between border-b border-surface-100 px-4 py-2">
                <span className="text-xs text-surface-500">
                  {nodes.length} elemento{nodes.length !== 1 ? 's' : ''}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAddRoot}
                  className="h-7 text-xs px-3 gap-1"
                >
                  <Plus className="h-3 w-3" />
                  Añadir raíz
                </Button>
              </div>
              <PanelTree
                nodes={treeNodes}
                onAdd={handleAddChild}
                onDelete={handleDeleteRequest}
                onSelect={handleSelectNode}
                selectedNodeId={selectedNodeId}
                deletingId={deletingId}
              />
            </div>

            {/* Edit panel */}
            {selectedNode && (
              <NodeEditPanel
                node={selectedNode}
                onSave={handleSaveNode}
                onMoveRequest={handleMoveRequest}
                onClose={() => setSelectedNodeId(null)}
              />
            )}
          </div>
        )}
      </div>

      {/* Add node dialog */}
      <AddNodeDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        parentId={dialogParentId}
        parentType={dialogParentType}
        parentName={dialogParentName}
        existingRootTypes={existingRootTypes}
        onConfirm={handleCreateNode}
        isCreating={isCreating}
      />

      {/* Move node dialog */}
      {moveNode && (
        <MoveNodeDialog
          open={!!moveNodeId}
          node={moveNode}
          allNodes={treeNodes}
          onConfirm={handleMoveConfirm}
          onClose={() => setMoveNodeId(null)}
        />
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-center gap-2 rounded-lg border border-emerald-300 bg-emerald-50 px-4 py-3 shadow-lg">
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            <span className="text-sm font-medium text-emerald-800">{toast}</span>
          </div>
        </div>
      )}

      {/* Delete confirmation modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg shadow-xl max-w-sm w-full mx-4 p-5">
            <h3 className="text-sm font-semibold text-surface-900 mb-2">Confirmar eliminación</h3>
            <p className="text-sm text-surface-600 mb-4">
              ¿Eliminar <strong>{deleteConfirm.name}</strong>
              {deleteConfirm.descendants > 0
                ? ` y sus ${deleteConfirm.descendants} descendiente${deleteConfirm.descendants !== 1 ? 's' : ''}?`
                : '?'}
            </p>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDeleteConfirm(null)}
                disabled={!!deletingId}
              >
                Cancelar
              </Button>
              <Button
                size="sm"
                className="bg-red-600 hover:bg-red-700 text-white"
                onClick={handleDeleteConfirm}
                disabled={!!deletingId}
              >
                {deletingId ? 'Eliminando...' : 'Eliminar'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
