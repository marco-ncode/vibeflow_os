import type { NodeProps } from 'reactflow'
import { Handle, Position } from 'reactflow'

function IONode({ data }: NodeProps) {
  const direction = data?.direction ?? 'input'
  return (
    <div className={`node io ${direction}`}>
      <div className="node-title">{direction === 'input' ? 'Input' : 'Output'}</div>
      <div className="node-body">
        <div className="label">{data?.label ?? 'IO Node'}</div>
        {data?.description && (
          <div className="desc">{String(data.description)}</div>
        )}
      </div>
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
    </div>
  )
}

export default IONode