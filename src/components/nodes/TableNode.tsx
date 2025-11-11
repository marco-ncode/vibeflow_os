import type { NodeProps } from 'reactflow'
import { Handle, Position } from 'reactflow'
import { useGraphStore } from '../../store/graphStore'

function TableNode({ id, data }: NodeProps) {
  const updateNodeData = useGraphStore((s) => s.updateNodeData)
  return (
    <div className="node table">
      <div className="node-title"><span className="icon">📊</span> Tabella <button className="toggle" onClick={() => updateNodeData(id, { showDescription: !data?.showDescription })}>{data?.showDescription ? 'Nascondi' : 'Mostra'}</button></div>
      <div className="node-body">
        <div className="label">{data?.label ?? 'Table Node'}</div>
        {data?.description && data?.showDescription !== false && (
          <div className="desc">{String(data.description)}</div>
        )}
      </div>
      {(data?.inputs ?? []).map((inp: any, idx: number) => (
        <Handle key={inp.id ?? idx} id={inp.id} type="target" position={Position.Left} style={{ top: 16 + idx * 20 }} />
      ))}
      {(data?.outputs ?? []).map((out: any, idx: number) => (
        <Handle key={out.id ?? idx} id={out.id} type="source" position={Position.Right} style={{ top: 16 + idx * 20 }} />
      ))}
    </div>
  )
}

export default TableNode