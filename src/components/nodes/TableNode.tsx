import type { NodeProps } from 'reactflow'
import { Handle, Position } from 'reactflow'
import { useGraphStore } from '../../store/graphStore'

type Port = { id: string, name?: string }

function TableNode({ id, data }: NodeProps) {
  const updateNodeData = useGraphStore((s) => s.updateNodeData)
  const inputs = (typeof data === 'object' && data && 'inputs' in data && Array.isArray((data as { inputs?: unknown }).inputs))
    ? (data as { inputs: Port[] }).inputs
    : []
  const outputs = (typeof data === 'object' && data && 'outputs' in data && Array.isArray((data as { outputs?: unknown }).outputs))
    ? (data as { outputs: Port[] }).outputs
    : []
  return (
    <div className="node table">
      <div className="node-title"><span className="icon">📊</span> Table <button className="toggle" onClick={() => updateNodeData(id, { showDescription: !data?.showDescription })}>{data?.showDescription ? 'Hide' : 'Show'}</button></div>
      <div className="node-body">
        <div className="label">{data?.label ?? 'Table Node'}</div>
        {data?.description && data?.showDescription !== false && (
          <div className="desc">{String(data.description)}</div>
        )}
      </div>
      {inputs.map((inp, idx) => (
        <Handle key={inp.id ?? idx} id={inp.id} type="target" position={Position.Left} style={{ top: 16 + idx * 20 }} />
      ))}
      {outputs.map((out, idx) => (
        <Handle key={out.id ?? idx} id={out.id} type="source" position={Position.Right} style={{ top: 16 + idx * 20 }} />
      ))}
    </div>
  )
}

export default TableNode
