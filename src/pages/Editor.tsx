import React, { useCallback, useState } from 'react'
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
  const addInput = useGraphStore((s) => s.addInput)
  const removeInput = useGraphStore((s) => s.removeInput)
  const updateInputName = useGraphStore((s) => s.updateInputName)
  const addOutput = useGraphStore((s) => s.addOutput)
  const removeOutput = useGraphStore((s) => s.removeOutput)
  const updateOutputName = useGraphStore((s) => s.updateOutputName)

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

  const [showMenu, setShowMenu] = useState(false)

  const downloadFile = (filename: string, content: string, type = 'text/plain') => {
    const blob = new Blob([content], { type })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  const copyToClipboard = async (content: string) => {
    try { await navigator.clipboard.writeText(content) } catch { /* ignore */ }
  }

  const buildAiPrompt = () => {
    const lines: string[] = []
    lines.push('# VibeFlow AI Prompt')
    nodes.forEach((n) => {
      lines.push(`- Node: ${n.data?.label ?? n.id} [type=${n.type}]`)
      if (n.type === 'prompt' && n.data?.prompt) lines.push(`  Prompt: ${String(n.data.prompt)}`)
      if (n.type === 'transform' && n.data?.operation) lines.push(`  Operation: ${String(n.data.operation)}`)
      if (n.type === 'decision' && n.data?.condition) lines.push(`  Condition: ${String(n.data.condition)}`)
      if (n.type === 'api' && n.data?.endpoint) lines.push(`  Endpoint: ${String(n.data.endpoint)}`)
      if (n.type === 'storage' && n.data?.resource) lines.push(`  Resource: ${String(n.data.resource)}`)
      const ins = (n.data?.inputs ?? []).map((i: any) => i.name).join(', ')
      const outs = (n.data?.outputs ?? []).map((o: any) => o.name).join(', ')
      if (ins) lines.push(`  Inputs: ${ins}`)
      if (outs) lines.push(`  Outputs: ${outs}`)
      if (n.data?.description) lines.push(`  Description: ${String(n.data.description)}`)
    })
    lines.push('')
    lines.push('# Connections')
    edges.forEach((e) => {
      lines.push(`- ${e.source}:${e.sourceHandle ?? ''} -> ${e.target}:${e.targetHandle ?? ''}`)
    })
    return lines.join('\n')
  }

  const handleExportJSON = () => downloadFile('vibeflow.json', exportJson(), 'application/json')
  const handleCopyJSON = () => copyToClipboard(exportJson())
  const handleExportPrompt = () => downloadFile('vibeflow-prompt.txt', buildAiPrompt())
  const handleCopyPrompt = () => copyToClipboard(buildAiPrompt())
  const handleExportCombined = () => {
    const combined = `=== AI PROMPT ===\n${buildAiPrompt()}\n\n=== JSON ===\n${exportJson()}`
    downloadFile('vibeflow-combined.txt', combined)
  }
  const handleCopyCombined = () => {
    const combined = `=== AI PROMPT ===\n${buildAiPrompt()}\n\n=== JSON ===\n${exportJson()}`
    copyToClipboard(combined)
  }
  const handleExportPackage = () => {
    const pkg = `# VibeFlow Package\n\n${buildAiPrompt()}\n\n${exportJson()}`
    downloadFile('vibeflow-package.txt', pkg)
  }

  const handleImportProject = (file?: File) => {
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const obj = JSON.parse(String(reader.result))
        if (Array.isArray(obj.nodes) && Array.isArray(obj.edges)) {
          setNodes(obj.nodes)
          setEdges(obj.edges)
        }
      } catch {/* ignore */}
    }
    reader.readAsText(file)
  }

  return (
    <div className="editor">
      <div className="toolbar">
        <button className="btn" onClick={reset}>Reset</button>
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
          <button
            className="vibe-fab"
            aria-label="Vibe Option"
            title="Vibe Option"
            onClick={() => setShowMenu((v) => !v)}
          >☰</button>
          {showMenu && (
            <div className="menu-panel">
              <div className="menu-header">
                <label className="menu-title">Vibe Option</label>
                <button
                  className="menu-close"
                  aria-label="Chiudi"
                  title="Chiudi"
                  onClick={() => setShowMenu(false)}
                >✕</button>
              </div>
              <input type="file" onChange={(e) => handleImportProject(e.target.files?.[0])} style={{ display: 'none' }} id="import-ide" />
              <label htmlFor="import-ide" className="btn big">Import IDE project</label>

              <button className="btn big" onClick={handleExportPrompt}>Export AI Prompt</button>
              <button className="btn big" onClick={handleExportJSON}>Export JSON</button>
              <button className="btn big" onClick={handleExportCombined}>Export Combined</button>

              <button className="btn big" onClick={handleCopyPrompt}>Copy Prompt</button>
              <button className="btn big" onClick={handleCopyJSON}>Copy JSON</button>
              <button className="btn big" onClick={handleCopyCombined}>Copy Combined</button>

              <button className="btn big primary" onClick={handleExportPackage}>Export Package</button>
            </div>
          )}
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
              <div className="field">
                <label>
                  <input
                    type="checkbox"
                    checked={Boolean(selectedNode.data?.showDescription ?? true)}
                    onChange={(e) => updateNodeData(selectedNode.id, { showDescription: e.target.checked })}
                  />
                  &nbsp;Mostra descrizione sul nodo
                </label>
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
              {/* Connessioni di Input */}
              <div className="field">
                <label>Input Connections</label>
                <div className="conn-list">
                  {(selectedNode.data?.inputs ?? []).map((inp: any, idx: number) => (
                    <div className="conn-item" key={inp.id ?? idx}>
                      <input
                        placeholder="Input name"
                        value={String(inp?.name ?? '')}
                        onChange={(e) => updateInputName(selectedNode.id, inp.id, e.target.value)}
                      />
                      <button className="btn danger" onClick={() => removeInput(selectedNode.id, inp.id)}>Remove</button>
                    </div>
                  ))}
                  <button className="btn" onClick={() => addInput(selectedNode.id)}>Add Input</button>
                </div>
              </div>
              {/* Connessioni di Output */}
              <div className="field">
                <label>Output Connections</label>
                <div className="conn-list">
                  {(selectedNode.data?.outputs ?? []).map((out: any, idx: number) => (
                    <div className="conn-item" key={out.id ?? idx}>
                      <input
                        placeholder="Output name"
                        value={String(out?.name ?? '')}
                        onChange={(e) => updateOutputName(selectedNode.id, out.id, e.target.value)}
                      />
                      <button className="btn danger" onClick={() => removeOutput(selectedNode.id, out.id)}>Remove</button>
                    </div>
                  ))}
                  <button className="btn" onClick={() => addOutput(selectedNode.id)}>Add Output</button>
                </div>
              </div>
              {/* Upload immagini opzionale */}
              <div className="field">
                <label>Upload Images</label>
                <input
                  type="file"
                  multiple
                  onChange={async (e) => {
                    const files = Array.from(e.target.files ?? [])
                    const toBase64 = (f: File) => new Promise<string>((resolve) => {
                      const reader = new FileReader()
                      reader.onload = () => resolve(String(reader.result))
                      reader.readAsDataURL(f)
                    })
                    const images = await Promise.all(files.map(toBase64))
                    updateNodeData(selectedNode.id, { images })
                  }}
                />
              </div>
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