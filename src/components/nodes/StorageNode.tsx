import type { NodeProps } from 'reactflow'
import { Handle, Position } from 'reactflow'

function StorageNode({ data }: NodeProps) {
  return (
    <div className="node storage">
      <div className="node-title">Storage</div>
      <div className="node-body">
        <div className="label">{data?.label ?? 'Storage Node'}</div>
        {data?.description && (
          <div className="desc">{String(data.description)}</div>
        )}
      </div>
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
    </div>
  )
}

export default StorageNode