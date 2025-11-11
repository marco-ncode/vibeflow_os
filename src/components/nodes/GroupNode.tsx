import type { NodeProps } from 'reactflow'

function GroupNode({ data }: NodeProps) {
  const label = String(data?.label ?? 'Group')
  const width = Number((data && (data as any).width) ?? 240)
  const height = Number((data && (data as any).height) ?? 180)
  return (
    <div className="group-node" style={{ width, height }}>
      <div className="group-title">{label}</div>
      {/* Contenitore vuoto: i figli (nodi) risiederanno all'interno tramite parentNode */}
    </div>
  )
}

export default GroupNode