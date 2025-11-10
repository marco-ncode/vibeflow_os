import type { NodeProps } from 'reactflow'
import { Handle, Position } from 'reactflow'

function ApiNode({ data }: NodeProps) {
  return (
    <div className="node api">
      <div className="node-title">API Call</div>
      <div className="node-body">
        <div className="label">{data?.label ?? 'API Node'}</div>
        {data?.description && (
          <div className="desc">{String(data.description)}</div>
        )}
      </div>
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
    </div>
  )
}

export default ApiNode