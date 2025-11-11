import { useCallback, useState } from 'react'
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
import GroupNode from '../components/nodes/GroupNode'
import TableNode from '../components/nodes/TableNode'
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

  const nodeTypes = { prompt: PromptNode, transform: TransformNode, io: IONode, decision: DecisionNode, api: ApiNode, storage: StorageNode, table: TableNode, group: GroupNode }

  const [selectedIds, setSelectedIds] = useState<string[]>([])

  const onSelectionChange = useCallback(({ nodes: selNodes }: { nodes: Node[]; edges: Edge[] }) => {
    setSelectedNodeId(selNodes[0]?.id ?? null)
    setSelectedIds(selNodes.map((n) => n.id))
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
    return `# 🧠 Visual Logic Graph → Code Generator

You are an expert **code generation model** specialized in **translating visual logic graphs into working programs**.

You will receive a JSON file (\`vibeflow.json\`) describing a **visual logic graph**, which defines a complete program through interconnected nodes.

---

## 1️⃣ Understanding the Input Structure

The JSON defines:

### 🧩 Nodes
Discrete functional units, each containing:

- \`id\`: unique identifier  
- \`name\`: descriptive label  
- \`description\`: detailed purpose or intended behavior  
- \`inputs\`: expected data or parameters (typed, named)  
- \`outputs\`: emitted data or results (typed, named)  
- *(optional)* \`imageDescription\`: textual explanation of an associated image  
- *(optional)* \`img\`: path(s) to one or more images (e.g. \`img/{node_id}/...\`) providing **visual references, layouts, or mockups**

### 🔗 Connections
Define data flow by linking **outputs** of one node to **inputs** of another.

---

## 2️⃣ Your Core Objectives

When provided with the JSON:

1. **Parse and understand** all nodes and their relationships.  
2. **Infer the complete logical flow** of the program by analyzing connections.  
3. **Derive the correct data propagation** respecting input/output dependencies.  
4. **Incorporate visual context** from any \`imageDescription\` or image files.  
5. **Generate a coherent, functional program** implementing the described logic.

---

## 3️⃣ Output Requirements

Produce a **single, runnable code file** that:

- Implements the **entire data flow** defined in the graph.  
- Selects the **appropriate environment and language** (e.g. web app, Python script, Node.js) based on node descriptions or explicit hints.  
- Includes:

  - Logical decomposition into **functions or components** reflecting the node structure  
  - Correct **data flow** and event propagation  
  - Implementation of: 
    - **Input nodes** → user or system data sources  
    - **Processing nodes** → transformations, logic, or computation  
    - **Output nodes** → UI, console, API calls, or results delivery  
  - Integration of **visual designs** or **layouts** when image context is provided  
  - **Clear, instructive comments** explaining: 
    - Each node’s purpose  
    - How data flows between nodes  
    - How visuals influence the layout or logic  

---

## 4️⃣ Reasoning Protocol

Before generating code:

1. **Parse** the JSON structure.  
2. Produce an **internal understanding summary** with: 
   - Node list and inferred roles  
   - Connection mapping (source → target)  
   - Execution or dependency order  
3. If any ambiguity exists (e.g., unclear purpose, missing types, unspecified language), **ask clarifying questions** first.  
4. Once clarified, **generate the final, fully functional implementation**.

---

## 5️⃣ Quality Expectations

Your generated code must be:

- 🧠 **Logically sound** — all data dependencies respected.  
- 🧩 **Readable & maintainable** — modular, clean structure.  
- 🎨 **Visually consistent** — follows any provided design cues.  
- ⚙️ **Executable** — runs without errors in the inferred environment.

---

## 6️⃣ Input File

The visual logic graph is provided in: vibeflow.json

You must: 
1. Load and analyze the JSON.  
2. Construct and output the **complete working program** that it defines.

---

### ✅ Instruction Summary

> **Read the graph → Interpret nodes + connections + visuals → Generate a working program → Comment key logic + visuals**

---

## ✨ Notes

- Always **prioritize comprehension before code generation**.  
- Focus on **data flow integrity** and **semantic correctness** of node relationships.  
- Be explicit and consistent in variable naming and function roles.  
- Treat any \`imageDescription\` as **a binding design specification**, not decorative.  
- Output **runnable, production-quality code** suitable for direct execution or integration.`
  }

  const handleExportJSON = () => downloadFile('vibeflow.json', exportJson(), 'application/json')
  const handleCopyJSON = () => copyToClipboard(exportJson())
  const handleExportPrompt = () => downloadFile('vibeflow-prompt.txt', buildAiPrompt())
  const handleCopyPrompt = () => copyToClipboard(buildAiPrompt())
  const buildCombinedTemplate = () => {
    const json = exportJson()
    return `# 🧠 Visual Logic Graph → Code Generator

You are an expert **code generation model** specialized in **translating visual logic graphs into working programs**.

You will be provided with a **JSON object** that describes a **visual logic graph** — a structured representation of a complete program built from interconnected nodes.

---

## 1️⃣ Understanding the Input Structure

The JSON defines:

### 🧩 Nodes
Discrete functional units, each containing:

- \`id\`: unique identifier  
- \`name\`: descriptive label  
- \`description\`: detailed purpose or intended behavior  
- \`inputs\`: expected data or parameters (typed, named)  
- \`outputs\`: emitted data or results (typed, named)  
- *(optional)* \`imageDescription\`: textual explanation of an associated image  
- *(optional)* \`img\`: path(s) to one or more images (e.g. \`img/{node_id}/...\`) providing **visual references, layouts, or mockups**

### 🔗 Connections
Define data flow by linking **outputs** of one node to **inputs** of another.

---

## 2️⃣ Your Core Objectives

When provided with the JSON:

1. **Parse and understand** all nodes and their relationships.  
2. **Infer the complete logical flow** of the program by analyzing connections.  
3. **Derive the correct data propagation** respecting input/output dependencies.  
4. **Incorporate visual context** from any \`imageDescription\` or image files.  
5. **Generate a coherent, functional program** implementing the described logic.

---

## 3️⃣ Output Requirements

Produce a **single, runnable code file** that:

- Implements the **entire data flow** defined in the graph.  
- Selects the **appropriate environment and language** (e.g. web app, Python script, Node.js) based on node descriptions or explicit hints.  
- Includes:

  - Logical decomposition into **functions or components** reflecting the node structure  
  - Correct **data flow** and event propagation  
  - Implementation of: 
    - **Input nodes** → user or system data sources  
    - **Processing nodes** → transformations, logic, or computation  
    - **Output nodes** → UI, console, API calls, or results delivery  
  - Integration of **visual designs** or **layouts** when image context is provided  
  - **Clear, instructive comments** explaining: 
    - Each node’s purpose  
    - How data flows between nodes  
    - How visuals influence the layout or logic  

---

## 4️⃣ Reasoning Protocol

Before generating code:

1. **Parse** the JSON structure.  
2. Produce an **internal understanding summary** with: 
   - Node list and inferred roles  
   - Connection mapping (source → target)  
   - Execution or dependency order  
3. If any ambiguity exists (e.g., unclear purpose, missing types, unspecified language), **ask clarifying questions** first.  
4. Once clarified, **generate the final, fully functional implementation**.

---

## 5️⃣ Quality Expectations

Your generated code must be:

- 🧠 **Logically sound** — all data dependencies respected.  
- 🧩 **Readable & maintainable** — modular, clean structure.  
- 🎨 **Visually consistent** — follows any provided design cues.  
- ⚙️ **Executable** — runs without errors in the inferred environment.

---

## 6️⃣ Visual Logic Graph (Input JSON)

Here is the JSON representation of the visual logic graph:

\`\`\`json
${json}
\`\`\`

### ✅ Instruction Summary

> **Read the graph → Interpret nodes + connections + visuals → Generate a working program → Comment key logic + visuals**

---

## ✨ Notes

- Always **prioritize comprehension before code generation**. 
- Focus on **data flow integrity** and **semantic correctness** of node relationships. 
- Be explicit and consistent in variable naming and function roles. 
- Treat any \`imageDescription\` as **a binding design specification**, not decorative. 
- Output **runnable, production-quality code** suitable for direct execution or integration.`
  }

  const handleExportCombined = () => {
    const combined = buildCombinedTemplate()
    downloadFile('vibeflow-combined.txt', combined)
  }
  const handleCopyCombined = () => {
    const combined = buildCombinedTemplate()
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

  // --- Grouping helpers ---
  const createGroupFromSelection = () => {
    if (selectedIds.length < 2) return
    const selected = nodes.filter((n) => selectedIds.includes(n.id) && n.type !== 'group')
    if (selected.length < 2) return
    const getW = (n: Node) => {
      const w = (n as any).width
      return typeof w === 'number' && w > 0 ? w : 160
    }
    const getH = (n: Node) => {
      const h = (n as any).height
      return typeof h === 'number' && h > 0 ? h : 90
    }
    const minX = Math.min(...selected.map((n) => n.position.x))
    const minY = Math.min(...selected.map((n) => n.position.y))
    const maxX = Math.max(...selected.map((n) => n.position.x + getW(n)))
    const maxY = Math.max(...selected.map((n) => n.position.y + getH(n)))
    // Applico il margine su entrambi gli assi:
    // - X: +10% per area di manovra
    // - Y: +25% (15% titolo + 10% manovra)
    const rawWidth = maxX - minX
    const rawHeight = maxY - minY
    const marginFactorX = 0.10
    const marginFactorY = 0.25
    const extraX = rawWidth * marginFactorX / 2
    const extraY = rawHeight * marginFactorY / 2
    const groupPosition = { x: minX - extraX, y: minY - extraY }
    const groupWidth = Math.max(160, Math.round(rawWidth * (1 + marginFactorX)))
    const groupHeight = Math.max(120, Math.round(rawHeight * (1 + marginFactorY)))
    const groupId = `group-${Date.now()}`

    const groupNode: Node = {
      id: groupId,
      type: 'group',
      position: groupPosition,
      selectable: true,
      draggable: true,
      data: { label: `Group ${new Date().toLocaleTimeString()}`, width: groupWidth, height: groupHeight },
      selected: true,
      // Imposto dimensioni direttamente sul wrapper del nodo per un extent corretto
      style: { width: groupWidth, height: groupHeight },
    }

    // Move selected nodes inside the group (typed as Node[] and extent literal)
    const updatedChildren: Node[] = selected.map((n): Node => ({
      ...n,
      position: { x: n.position.x - groupPosition.x, y: n.position.y - groupPosition.y },
      parentNode: groupId,
      extent: 'parent' as const,
      selected: false,
    }))

    // Keep non-selected nodes as they are
    const others = nodes.filter((n) => !selectedIds.includes(n.id))

    setNodes([groupNode, ...others, ...updatedChildren])
    setSelectedNodeId(groupId)
    setSelectedIds([groupId])
  }

  const deleteGroupOnly = (group: Node) => {
    if (group.type !== 'group') return
    const children = nodes.filter((n) => n.parentNode === group.id)
    const shiftedChildren = children.map((n) => ({
      ...n,
      parentNode: undefined,
      extent: undefined,
      position: { x: n.position.x + group.position.x, y: n.position.y + group.position.y },
    }))
    const remaining = nodes.filter((n) => n.id !== group.id && n.parentNode !== group.id)
    setNodes([...remaining, ...shiftedChildren])
    setSelectedNodeId(null)
  }

  const deleteGroupAndContent = (group: Node) => {
    if (group.type !== 'group') return
    const childIds = new Set(nodes.filter((n) => n.parentNode === group.id).map((n) => n.id))
    const remainingNodes = nodes.filter((n) => n.id !== group.id && !childIds.has(n.id))
    const remainingEdges = edges.filter((e) => !childIds.has(e.source) && !childIds.has(e.target))
    setNodes(remainingNodes)
    setEdges(remainingEdges)
    setSelectedNodeId(null)
  }

  return (
    <div className="editor">
      <div className="toolbar">
        <button className="btn" onClick={reset}>Reset</button>
        <div className="toolbar-note">Per selezionare più nodi tieni premuto <strong>SHIFT</strong></div>
        <button className="btn" disabled={selectedIds.length < 2} onClick={createGroupFromSelection}>Crea Gruppo dai selezionati</button>
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
            selectionOnDrag
            multiSelectionKeyCode="Shift"
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
              {selectedNode.type === 'group' && (
                <div className="field">
                  <label>Azioni Gruppo</label>
                  <div className="conn-list">
                    <button className="btn" onClick={() => deleteGroupOnly(selectedNode)}>Delete Group</button>
                    <button className="btn danger" onClick={() => deleteGroupAndContent(selectedNode)}>Delete Group and Content</button>
                  </div>
                </div>
              )}
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