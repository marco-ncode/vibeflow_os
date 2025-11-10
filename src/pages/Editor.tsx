import React, { useCallback } from 'react'
import ReactFlow, { Background, Controls, addEdge, MiniMap, applyNodeChanges, applyEdgeChanges } from 'reactflow'
import type { Connection, Edge, Node, OnConnect, NodeChange, EdgeChange } from 'reactflow'
import 'reactflow/dist/style.css'
import { useGraphStore } from '../store/graphStore'
import PromptNode from '../components/nodes/PromptNode'
import TransformNode from '../components/nodes/TransformNode'
import IONode from '../components/nodes/IONode'
import DecisionNode from '../components/nodes/DecisionNode'
import ApiNode from '../components/nodes/ApiNode'
import StorageNode from '../components/nodes/StorageNode'
import NodePalette from '../components/NodePalette'

function Editor() {
  const nodes = useGraphStore((s) => s.nodes)
  const edges = useGraphStore((s) => s.edges)
  const setNodes = useGraphStore((s) => s.setNodes)
  const setEdges = useGraphStore((s) => s.setEdges)
  const reset = useGraphStore((s) => s.reset)
  const exportJson = useGraphStore((s) => s.exportJson)
  const selectedNodeId = useGraphStore((s) => s.selectedNodeId)
  const setSelectedNodeId = useGraphStore((s) => s.setSelectedNodeId)
  const updateNodeData = useGraphStore((s) => s.updateNodeData)

  const onNodesChange = useCallback((changes: NodeChange[]) => {
    setNodes(applyNodeChanges(changes, nodes))
  }, [nodes, setNodes])

  const onEdgesChange = useCallback((changes: EdgeChange[]) => {
    setEdges(applyEdgeChanges(changes, edges))
  }, [edges, setEdges])

  const onConnect: OnConnect = useCallback((connection: Connection) => {
    setEdges(addEdge(connection as Edge, edges))
  }, [edges, setEdges])

  const nodeTypes = { prompt: PromptNode, transform: TransformNode, io: IONode, decision: DecisionNode, api: ApiNode, storage: StorageNode }

  const onSelectionChange = useCallback(({ nodes: selNodes }: { nodes: Node[]; edges: Edge[] }) => {
    setSelectedNodeId(selNodes[0]?.id ?? null)
  }, [setSelectedNodeId])

  const selectedNode = nodes.find((n) => n.id === selectedNodeId)

  const handleExport = async () => {
    const json = exportJson()
    try {
      await navigator.clipboard.writeText(json)
      alert('JSON copiato negli appunti!')
    } catch {
      // fallback: download
      const blob = new Blob([json], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'vibeflow-export.json'
      a.click()
      URL.revokeObjectURL(url)
    }
  }

  return (
    <div className="editor">
      <div className="toolbar">
        <button className="btn" onClick={reset}>Reset</button>
        <button className="btn primary" onClick={handleExport}>Export JSON</button>
      </div>
      <div className="workspace">
        <NodePalette />
        <div className="canvas">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onSelectionChange={onSelectionChange}
            fitView
          >
            <MiniMap />
            <Controls />
            <Background />
          </ReactFlow>
        </div>
        <div className="properties">
          <h4>Proprietà</h4>
          {selectedNode ? (
            <>
              <div className="field">
                <label>Label</label>
                <input
                  value={String(selectedNode.data?.label ?? '')}
                  onChange={(e) => updateNodeData(selectedNode.id, { label: e.target.value })}
                />
              </div>
              <div className="field">
                <label>Descrizione</label>
                <textarea
                  rows={4}
                  value={String(selectedNode.data?.description ?? '')}
                  onChange={(e) => updateNodeData(selectedNode.id, { description: e.target.value })}
                />
              </div>
              {selectedNode.type === 'prompt' && (
                <div className="field">
                  <label>Prompt</label>
                  <textarea
                    rows={6}
                    value={String(selectedNode.data?.prompt ?? '')}
                    onChange={(e) => updateNodeData(selectedNode.id, { prompt: e.target.value })}
                  />
                </div>
              )}
              {selectedNode.type === 'transform' && (
                <div className="field">
                  <label>Operazione</label>
                  <input
                    value={String(selectedNode.data?.operation ?? '')}
                    onChange={(e) => updateNodeData(selectedNode.id, { operation: e.target.value })}
                  />
                </div>
              )}
              {selectedNode.type === 'io' && (
                <div className="field">
                  <label>Direzione</label>
                  <select
                    value={String(selectedNode.data?.direction ?? 'input')}
                    onChange={(e) => updateNodeData(selectedNode.id, { direction: e.target.value })}
                  >
                    <option value="input">Input</option>
                    <option value="output">Output</option>
                  </select>
                </div>
              )}
              {selectedNode.type === 'api' && (
                <div className="field">
                  <label>Endpoint</label>
                  <input
                    value={String(selectedNode.data?.endpoint ?? '')}
                    onChange={(e) => updateNodeData(selectedNode.id, { endpoint: e.target.value })}
                  />
                </div>
              )}
              {selectedNode.type === 'storage' && (
                <div className="field">
                  <label>Risorsa</label>
                  <input
                    value={String(selectedNode.data?.resource ?? '')}
                    onChange={(e) => updateNodeData(selectedNode.id, { resource: e.target.value })}
                  />
                </div>
              )}
              {selectedNode.type === 'decision' && (
                <div className="field">
                  <label>Condizione</label>
                  <input
                    value={String(selectedNode.data?.condition ?? '')}
                    onChange={(e) => updateNodeData(selectedNode.id, { condition: e.target.value })}
                  />
                </div>
              )}
            </>
          ) : (
            <p>Nessun nodo selezionato</p>
          )}
        </div>
      </div>
    </div>
  )
}

export default Editor