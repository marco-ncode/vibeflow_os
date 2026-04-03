import { useCallback, useEffect, useMemo, useState } from 'react'
import { createFlow, createProject, deleteProject, listFlows, listProjects, type FlowRow, type ProjectRow } from '../lib/api'

function Projects() {
  const [projects, setProjects] = useState<ProjectRow[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null)

  const [flows, setFlows] = useState<FlowRow[]>([])
  const [flowsLoading, setFlowsLoading] = useState(false)

  const [name, setName] = useState('')
  const [scope, setScope] = useState('')
  const [creating, setCreating] = useState(false)

  const [newFlowName, setNewFlowName] = useState('')
  const [creatingFlow, setCreatingFlow] = useState(false)

  const canCreate = useMemo(() => name.trim().length > 0 && !creating, [name, creating])
  const canCreateFlow = useMemo(() => !creatingFlow && selectedProjectId != null, [creatingFlow, selectedProjectId])

  const selectedProject = useMemo(() => {
    if (selectedProjectId == null) return null
    return projects.find((p) => p.id === selectedProjectId) ?? null
  }, [projects, selectedProjectId])

  const loadProjects = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await listProjects()
      setProjects(data ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unexpected error')
      setProjects([])
    } finally {
      setLoading(false)
    }
  }, [])

  const loadFlows = useCallback(async (projectId: number) => {
    setFlowsLoading(true)
    setError(null)
    try {
      const data = await listFlows(projectId)
      setFlows(data ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unexpected error')
      setFlows([])
    } finally {
      setFlowsLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadProjects()
  }, [loadProjects])

  useEffect(() => {
    if (!projects.length) {
      setSelectedProjectId(null)
      setFlows([])
      return
    }
    setSelectedProjectId((prev) => {
      if (prev != null && projects.some((p) => p.id === prev)) return prev
      return projects[0].id
    })
  }, [projects])

  useEffect(() => {
    if (selectedProjectId == null) return
    void loadFlows(selectedProjectId)
  }, [selectedProjectId, loadFlows])

  async function onCreate() {
    if (!canCreate) return
    setCreating(true)
    setError(null)
    try {
      const data = await createProject({
        project_name: name.trim(),
        project_scope: scope.trim().length ? scope.trim() : null,
      })
      setProjects((prev) => [data, ...prev])
      setName('')
      setScope('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unexpected error')
      setCreating(false)
      return
    } finally {
      setCreating(false)
    }
  }

  async function onDelete(id: number) {
    setError(null)
    try {
      await deleteProject(id)
      setProjects((prev) => prev.filter((p) => p.id !== id))
      if (selectedProjectId === id) {
        setSelectedProjectId(null)
        setFlows([])
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unexpected error')
      return
    }
  }

  async function onCreateFlow() {
    if (!canCreateFlow || selectedProjectId == null) return
    setCreatingFlow(true)
    setError(null)
    try {
      const data = await createFlow(selectedProjectId, { flow_name: newFlowName.trim().length ? newFlowName.trim() : null })
      setFlows((prev) => [data, ...prev])
      setNewFlowName('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unexpected error')
      setCreatingFlow(false)
      return
    } finally {
      setCreatingFlow(false)
    }
  }

  return (
    <div className="projects-shell">
      <div className="projects-grid">
        <aside className="projects-sidebar">
          <div className="projects-sidebar-head">
            <div className="projects-sidebar-title">Projects</div>
            <button className="btn" onClick={() => void loadProjects()} disabled={loading}>
              Refresh
            </button>
          </div>

          {error && <div className="projects-error">{error}</div>}

          {loading ? (
            <div className="projects-muted">Loading…</div>
          ) : (
            <div className="projects-list">
              {projects.length === 0 ? (
                <div className="projects-muted">No projects yet</div>
              ) : (
                projects.map((p) => (
                  <div key={p.id} className="project-row">
                    <button
                      type="button"
                      className={`project-select ${selectedProjectId === p.id ? 'active' : ''}`}
                      onClick={() => setSelectedProjectId(p.id)}
                    >
                      <div className="project-name">{p.project_name ?? 'Untitled'}</div>
                      {p.project_scope && <div className="project-scope">{p.project_scope}</div>}
                    </button>
                    <button className="btn danger project-delete" type="button" onClick={() => void onDelete(p.id)}>
                      Delete
                    </button>
                  </div>
                ))
              )}
            </div>
          )}

          <div className="projects-divider" />

          <div className="projects-sidebar-title">New project</div>
          <div className="field">
            <label>Project name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Demo" />
          </div>
          <div className="field">
            <label>Scope</label>
            <textarea value={scope} onChange={(e) => setScope(e.target.value)} placeholder="Description / scope" rows={5} />
          </div>
          <button className="btn primary" onClick={() => void onCreate()} disabled={!canCreate}>
            Create
          </button>
        </aside>

        <main className="projects-main">
          <section className="card">
            <div className="projects-main-head">
              <div style={{ display: 'grid', gap: 2 }}>
                <div style={{ fontWeight: 800 }}>{selectedProject?.project_name ?? 'Select a project'}</div>
                {selectedProject?.project_scope && <div className="projects-muted">{selectedProject.project_scope}</div>}
              </div>
              {selectedProjectId != null && (
                <button className="btn" onClick={() => void loadFlows(selectedProjectId)} disabled={flowsLoading}>
                  Refresh
                </button>
              )}
            </div>

            {selectedProjectId == null ? (
              <div className="projects-muted" style={{ marginTop: 10 }}>Pick a project from the left sidebar.</div>
            ) : (
              <div style={{ marginTop: 12, display: 'grid', gap: 14 }}>
                <div>
                  <div style={{ fontWeight: 700, marginBottom: 8 }}>Workflows</div>
                  {flowsLoading ? (
                    <div className="projects-muted">Loading…</div>
                  ) : (
                    <div className="flows-list">
                      {flows.length === 0 ? (
                        <div className="projects-muted">No workflows yet</div>
                      ) : (
                        flows.map((f) => (
                          <div key={f.id} className="flow-item">
                            <div style={{ display: 'grid', gap: 2 }}>
                              <div style={{ fontWeight: 700 }}>{f.flow_name ?? 'Untitled workflow'}</div>
                              <div className="projects-muted" style={{ fontSize: 12 }}>#{f.id}</div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>

                <div className="card">
                  <div style={{ fontWeight: 700, marginBottom: 8 }}>New workflow</div>
                  <div className="field">
                    <label>Workflow name</label>
                    <input value={newFlowName} onChange={(e) => setNewFlowName(e.target.value)} placeholder="e.g. Onboarding" />
                  </div>
                  <button className="btn primary" onClick={() => void onCreateFlow()} disabled={!canCreateFlow}>
                    Create
                  </button>
                </div>
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  )
}

export default Projects
