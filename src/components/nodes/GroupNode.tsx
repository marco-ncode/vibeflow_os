import type { NodeProps } from 'reactflow'

function GroupNode({ data }: NodeProps) {
  const label = String(data?.label ?? 'Group')
  return (
    <div className="group-node" style={{ width: '100%', height: '100%' }}>
      <div className="group-title">{label}</div>
      {/* Contenitore: i figli (nodi) risiedono all'interno tramite parentNode */}
    </div>
  )
}

export default GroupNode