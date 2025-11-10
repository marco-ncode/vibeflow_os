import type { NodeProps } from 'reactflow'
import { Handle, Position } from 'reactflow'

function TransformNode({ data }: NodeProps) {
  return (
    <div className="node transform">
      <div className="node-title">Transform</div>
      <div className="node-body">
        <div className="label">{data?.label ?? 'Transform Node'}</div>
        {data?.description && (
          <div className="desc">{String(data.description)}</div>
        )}
      </div>
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
    </div>
  )
}

export default TransformNode