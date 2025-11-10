import type { NodeProps } from 'reactflow'
import { Handle, Position } from 'reactflow'

function DecisionNode({ data }: NodeProps) {
  return (
    <div className="node decision">
      <div className="node-title">Decision</div>
      <div className="node-body">
        <div className="label">{data?.label ?? 'Decision Node'}</div>
        {data?.description && (
          <div className="desc">{String(data.description)}</div>
        )}
      </div>
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
    </div>
  )
}

export default DecisionNode