import { create } from 'zustand'
import type { Node, Edge } from 'reactflow'

type NodeKind = 'prompt' | 'transform' | 'io' | 'decision' | 'api' | 'storage'

type GraphState = {
  nodes: Node[]
  edges: Edge[]
  selectedNodeId: string | null
  setNodes: (nodes: Node[]) => void
  setEdges: (edges: Edge[]) => void
  setSelectedNodeId: (id: string | null) => void
  addNodeOfType: (kind: NodeKind, initialData?: Record<string, unknown>) => void
  updateNodeData: (id: string, data: Record<string, unknown>) => void
  reset: () => void
  exportJson: () => string
}

const initialNodes: Node[] = []
const initialEdges: Edge[] = []

export const useGraphStore = create<GraphState>((set, get) => ({
  nodes: initialNodes,
  edges: initialEdges,
  selectedNodeId: null,
  setNodes: (nodes) => set({ nodes }),
  setEdges: (edges) => set({ edges }),
  setSelectedNodeId: (id) => set({ selectedNodeId: id }),
  addNodeOfType: (kind, initialData = {}) => {
    const id = String(Date.now())
    const position = { x: 120 + Math.random() * 300, y: 120 + Math.random() * 200 }
    const baseLabel =
      kind === 'prompt' ? 'Prompt'
      : kind === 'transform' ? 'Transform'
      : kind === 'decision' ? 'Decision'
      : kind === 'api' ? 'API'
      : kind === 'storage' ? 'Storage'
      : (initialData?.['direction'] === 'output' ? 'Output' : 'Input')
    const newNode: Node = {
      id,
      position,
      data: { label: `${baseLabel} ${id}`, ...initialData },
      type: kind,
    }
    set({ nodes: [...get().nodes, newNode], selectedNodeId: id })
  },
  updateNodeData: (id, data) => {
    const nodes = get().nodes.map((n) => n.id === id ? { ...n, data: { ...n.data, ...data } } : n)
    set({ nodes })
  },
  reset: () => set({ nodes: initialNodes, edges: initialEdges, selectedNodeId: null }),
  exportJson: () => {
    const { nodes, edges } = get()
    return JSON.stringify({ nodes, edges }, null, 2)
  },
}))