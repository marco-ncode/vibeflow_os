import { create } from 'zustand'
import type { Node, Edge } from 'reactflow'

type NodeKind = 'prompt' | 'transform' | 'io' | 'decision' | 'api' | 'storage' | 'table'

type GraphState = {
  nodes: Node[]
  edges: Edge[]
  selectedNodeId: string | null
  setNodes: (nodes: Node[]) => void
  setEdges: (edges: Edge[]) => void
  setSelectedNodeId: (id: string | null) => void
  addNodeOfType: (kind: NodeKind, initialData?: Record<string, unknown>) => void
  updateNodeData: (id: string, data: Record<string, unknown>) => void
  addInput: (id: string, name?: string) => void
  removeInput: (id: string, inputId: string) => void
  updateInputName: (id: string, inputId: string, name: string) => void
  addOutput: (id: string, name?: string) => void
  removeOutput: (id: string, outputId: string) => void
  updateOutputName: (id: string, outputId: string, name: string) => void
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
      : kind === 'table' ? 'Table'
      : (initialData?.['direction'] === 'output' ? 'Output' : 'Input')
    const newNode: Node = {
      id,
      position,
      data: {
        label: `${baseLabel} ${id}`,
        showDescription: true,
        inputs: [{ id: 'in-1', name: 'Input' }],
        outputs: [{ id: 'out-1', name: 'Output' }],
        ...initialData,
      },
      type: kind,
    }
    set({ nodes: [...get().nodes, newNode], selectedNodeId: id })
  },
  updateNodeData: (id, data) => {
    const nodes = get().nodes.map((n) => n.id === id ? { ...n, data: { ...n.data, ...data } } : n)
    set({ nodes })
  },
  addInput: (id, name = 'Input') => {
    const nodes = get().nodes.map((n) => {
      if (n.id !== id) return n
      const nextIdx = (n.data?.inputs?.length ?? 0) + 1
      const inputs = [...(n.data?.inputs ?? []), { id: `in-${nextIdx}`, name }]
      return { ...n, data: { ...n.data, inputs } }
    })
    set({ nodes })
  },
  removeInput: (id, inputId) => {
    const nodes = get().nodes.map((n) => {
      if (n.id !== id) return n
      const inputs = (n.data?.inputs ?? []).filter((i: any) => i.id !== inputId)
      return { ...n, data: { ...n.data, inputs } }
    })
    // opzionale: potremmo anche rimuovere edges collegati a questo handle
    set({ nodes })
  },
  updateInputName: (id, inputId, name) => {
    const nodes = get().nodes.map((n) => {
      if (n.id !== id) return n
      const inputs = (n.data?.inputs ?? []).map((i: any) => i.id === inputId ? { ...i, name } : i)
      return { ...n, data: { ...n.data, inputs } }
    })
    set({ nodes })
  },
  addOutput: (id, name = 'Output') => {
    const nodes = get().nodes.map((n) => {
      if (n.id !== id) return n
      const nextIdx = (n.data?.outputs?.length ?? 0) + 1
      const outputs = [...(n.data?.outputs ?? []), { id: `out-${nextIdx}`, name }]
      return { ...n, data: { ...n.data, outputs } }
    })
    set({ nodes })
  },
  removeOutput: (id, outputId) => {
    const nodes = get().nodes.map((n) => {
      if (n.id !== id) return n
      const outputs = (n.data?.outputs ?? []).filter((o: any) => o.id !== outputId)
      return { ...n, data: { ...n.data, outputs } }
    })
    set({ nodes })
  },
  updateOutputName: (id, outputId, name) => {
    const nodes = get().nodes.map((n) => {
      if (n.id !== id) return n
      const outputs = (n.data?.outputs ?? []).map((o: any) => o.id === outputId ? { ...o, name } : o)
      return { ...n, data: { ...n.data, outputs } }
    })
    set({ nodes })
  },
  reset: () => set({ nodes: initialNodes, edges: initialEdges, selectedNodeId: null }),
  exportJson: () => {
    const { nodes, edges } = get()

    const toMaybeNumber = (v: string | number): string | number => {
      if (typeof v === 'number') return v
      const n = Number(v)
      return Number.isFinite(n) ? n : v
    }

    const nodeItems = nodes
      .filter((n) => n.type !== 'group')
      .map((n) => ({
        id: toMaybeNumber(n.id),
        name: String(n.data?.label ?? n.id),
        description: String(n.data?.description ?? ''),
        inputs: (n.data?.inputs ?? []).map((i: any) => ({ id: i.id, name: String(i.name ?? '') })),
        outputs: (n.data?.outputs ?? []).map((o: any) => ({ id: o.id, name: String(o.name ?? '') })),
        images: [],
        imageDescription: '',
      }))

    const connections = edges.map((e) => {
      const src = nodes.find((n) => n.id === e.source)
      const dst = nodes.find((n) => n.id === e.target)
      const out = (src?.data?.outputs ?? []).find((o: any) => o.id === e.sourceHandle)
      const inp = (dst?.data?.inputs ?? []).find((i: any) => i.id === e.targetHandle)
      return {
        from: {
          nodeId: toMaybeNumber(e.source as any),
          outputId: e.sourceHandle ?? '',
          outputName: String(out?.name ?? ''),
        },
        to: {
          nodeId: toMaybeNumber(e.target as any),
          inputId: e.targetHandle ?? '',
          inputName: String(inp?.name ?? ''),
        },
      }
    })

    const groups = nodes
      .filter((n) => n.type === 'group')
      .map((g) => ({
        id: toMaybeNumber(g.id),
        name: String(g.data?.label ?? 'Group'),
        description: String(g.data?.description ?? ''),
        nodeIds: nodes
          .filter((n) => n.parentNode === g.id)
          .map((n) => toMaybeNumber(n.id)),
      }))

    const result = {
      metadata: {
        generatedAt: new Date().toISOString(),
        nodeCount: nodeItems.length,
        connectionCount: connections.length,
        groupCount: groups.length,
      },
      nodes: nodeItems,
      connections,
      groups,
    }

    return JSON.stringify(result, null, 2)
  },
}))