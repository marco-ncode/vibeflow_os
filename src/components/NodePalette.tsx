import { useGraphStore } from '../store/graphStore'

function NodePalette() {
  const addNodeOfType = useGraphStore((s) => s.addNodeOfType)

  return (
    <div className="sidebar">
      <h4>Palette</h4>
      <button className="btn" onClick={() => addNodeOfType('prompt')}>Aggiungi Prompt</button>
      <button className="btn" onClick={() => addNodeOfType('transform')}>Aggiungi Transform</button>
      <button className="btn" onClick={() => addNodeOfType('io', { direction: 'input' })}>Aggiungi Input</button>
      <button className="btn" onClick={() => addNodeOfType('io', { direction: 'output' })}>Aggiungi Output</button>
      <button className="btn" onClick={() => addNodeOfType('decision')}>Aggiungi Decision</button>
      <button className="btn" onClick={() => addNodeOfType('api')}>Aggiungi API</button>
      <button className="btn" onClick={() => addNodeOfType('storage')}>Aggiungi Storage</button>
    </div>
  )
}

export default NodePalette