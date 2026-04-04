import { useGraphStore } from '../store/graphStore'

function NodePalette() {
  const addNodeOfType = useGraphStore((s) => s.addNodeOfType)

  return (
    <div className="sidebar">
      <h4>Items</h4>
      <button className="btn" onClick={() => addNodeOfType('prompt')}>Add Prompt</button>
      <button className="btn" onClick={() => addNodeOfType('transform')}>Add Transform</button>
      <button className="btn" onClick={() => addNodeOfType('io', { direction: 'input' })}>Add Input</button>
      <button className="btn" onClick={() => addNodeOfType('io', { direction: 'output' })}>Add Output</button>
      <button className="btn" onClick={() => addNodeOfType('decision')}>Add Decision</button>
      <button className="btn" onClick={() => addNodeOfType('api')}>Add API</button>
      <button className="btn" onClick={() => addNodeOfType('storage')}>Add Storage</button>
      <button className="btn" onClick={() => addNodeOfType('table')}>Add Table</button>
    </div>
  )
}

export default NodePalette
