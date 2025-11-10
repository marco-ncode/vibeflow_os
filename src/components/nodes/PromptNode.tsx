import type { NodeProps } from 'reactflow'
import { Handle, Position } from 'reactflow'

function PromptNode({ data }: NodeProps) {
  return (
    <div className="node prompt">
      <div className="node-title">Prompt</div>
      <div className="node-body">
        <div className="label">{data?.label ?? 'Prompt Node'}</div>
        {data?.description && (
          <div className="desc">{String(data.description)}</div>
        )}
      </div>
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
    </div>
  )
}

export default PromptNode