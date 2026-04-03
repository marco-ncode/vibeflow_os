import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createFlow, createProject, deleteFlow, deleteProject, duplicateFlow, listFlows, listProjects, updateFlow, updateProject, type FlowRow, type ProjectRow } from '../lib/api'

function Projects() {
  const navigate = useNavigate()
  const [projects, setProjects] = useState<ProjectRow[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null)

  const [flows, setFlows] = useState<FlowRow[]>([])
  const [flowsLoading, setFlowsLoading] = useState(false)

  const [projectModalOpen, setProjectModalOpen] = useState(false)
  const [projectModalMode, setProjectModalMode] = useState<'create' | 'edit'>('create')
  const [projectDraftId, setProjectDraftId] = useState<number | null>(null)
  const [projectDraftName, setProjectDraftName] = useState('')
  const [projectDraftScope, setProjectDraftScope] = useState('')
  const [savingProject, setSavingProject] = useState(false)

  const [workflowModalOpen, setWorkflowModalOpen] = useState(false)
  const [workflowModalMode, setWorkflowModalMode] = useState<'create' | 'rename'>('create')
  const [workflowDraftId, setWorkflowDraftId] = useState<number | null>(null)
  const [workflowDraftName, setWorkflowDraftName] = useState('')
  const [savingWorkflow, setSavingWorkflow] = useState(false)
  const [openWorkflowMenuId, setOpenWorkflowMenuId] = useState<number | null>(null)

  const canSaveProject = useMemo(() => projectDraftName.trim().length > 0 && !savingProject, [projectDraftName, savingProject])
  const canSaveWorkflow = useMemo(() => workflowDraftName.trim().length > 0 && !savingWorkflow && selectedProjectId != null, [workflowDraftName, savingWorkflow, selectedProjectId])

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

  const openCreateProjectModal = useCallback(() => {
    setProjectModalMode('create')
    setProjectDraftId(null)
    setProjectDraftName('')
    setProjectDraftScope('')
    setProjectModalOpen(true)
  }, [])

  const openEditProjectModal = useCallback((p: ProjectRow) => {
    setProjectModalMode('edit')
    setProjectDraftId(p.id)
    setProjectDraftName(p.project_name ?? '')
    setProjectDraftScope(p.project_scope ?? '')
    setProjectModalOpen(true)
  }, [])

  const closeProjectModal = useCallback(() => {
    if (savingProject) return
    setProjectModalOpen(false)
  }, [savingProject])

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

  async function onSaveProject() {
    if (!canSaveProject) return
    setSavingProject(true)
    setError(null)
    const nextName = projectDraftName.trim()
    const nextScope = projectDraftScope.trim().length ? projectDraftScope.trim() : null
    try {
      if (projectModalMode === 'create') {
        const data = await createProject({ project_name: nextName, project_scope: nextScope })
        setProjects((prev) => [data, ...prev])
        setSelectedProjectId(data.id)
        setProjectModalOpen(false)
      } else {
        if (projectDraftId == null) return
        const data = await updateProject(projectDraftId, { project_name: nextName, project_scope: nextScope })
        setProjects((prev) => prev.map((p) => (p.id === data.id ? data : p)))
        setProjectModalOpen(false)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unexpected error')
      setSavingProject(false)
      return
    } finally {
      setSavingProject(false)
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

  const openCreateWorkflowModal = useCallback(() => {
    if (selectedProjectId == null) return
    setWorkflowModalMode('create')
    setWorkflowDraftId(null)
    setWorkflowDraftName('')
    setWorkflowModalOpen(true)
  }, [selectedProjectId])

  const openRenameWorkflowModal = useCallback((f: FlowRow) => {
    setWorkflowModalMode('rename')
    setWorkflowDraftId(f.id)
    setWorkflowDraftName(f.flow_name ?? '')
    setWorkflowModalOpen(true)
  }, [])

  const closeWorkflowModal = useCallback(() => {
    if (savingWorkflow) return
    setWorkflowModalOpen(false)
  }, [savingWorkflow])

  const openWorkflow = useCallback((id: number) => {
    navigate(`/editor?flowId=${encodeURIComponent(String(id))}`)
  }, [navigate])

  async function onSaveWorkflow() {
    if (!canSaveWorkflow || selectedProjectId == null) return
    setSavingWorkflow(true)
    setError(null)
    const nextName = workflowDraftName.trim()
    try {
      if (workflowModalMode === 'create') {
        const data = await createFlow(selectedProjectId, { flow_name: nextName })
        setFlows((prev) => [data, ...prev])
        setWorkflowModalOpen(false)
        openWorkflow(data.id)
      } else {
        if (workflowDraftId == null) return
        const data = await updateFlow(workflowDraftId, { flow_name: nextName })
        setFlows((prev) => prev.map((f) => (f.id === data.id ? { ...f, flow_name: data.flow_name } : f)))
        setWorkflowModalOpen(false)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unexpected error')
      setSavingWorkflow(false)
      return
    } finally {
      setSavingWorkflow(false)
    }
  }

  async function onDuplicateWorkflow(f: FlowRow) {
    setError(null)
    try {
      const data = await duplicateFlow(f.id)
      setFlows((prev) => [data, ...prev])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unexpected error')
      return
    }
  }

  async function onDeleteWorkflow(id: number) {
    const ok = window.confirm('Delete this workflow?')
    if (!ok) return
    setError(null)
    try {
      await deleteFlow(id)
      setFlows((prev) => prev.filter((f) => f.id !== id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unexpected error')
      return
    }
  }

  const PencilIcon = (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  )

  const TrashIcon = (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M3 6h18" />
      <path d="M8 6V4h8v2" />
      <path d="M19 6l-1 14H6L5 6" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
    </svg>
  )

  const PlusIcon = (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </svg>
  )

  const GridIcon = (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M4 4h7v7H4z" />
      <path d="M13 4h7v7h-7z" />
      <path d="M4 13h7v7H4z" />
      <path d="M13 13h7v7h-7z" />
    </svg>
  )

  return (
    <div className="projects-shell">
      <div className="projects-grid">
        <aside className="projects-sidebar">
          <div className="projects-sidebar-head">
            <div className="projects-brand">
              <span className="projects-brand-title">Your Projects</span>
            </div>
            <button className="icon-btn" type="button" onClick={() => void loadProjects()} aria-label="Refresh projects" disabled={loading}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M21 12a9 9 0 1 1-3-6.7" />
                <path d="M21 3v7h-7" />
              </svg>
            </button>
          </div>

          {error && <div className="projects-error">{error}</div>}

          {loading ? (
            <div className="projects-muted">Loading…</div>
          ) : (
            <div className="projects-nav">
              <button type="button" className="projects-nav-item create" onClick={openCreateProjectModal}>
                <span className="projects-nav-icon">{PlusIcon}</span>
                <span className="projects-nav-label">Create New</span>
              </button>

              <div className="projects-nav-divider" />

              {projects.length === 0 ? (
                <div className="projects-muted" style={{ padding: '6px 10px' }}>No projects yet</div>
              ) : (
                projects.map((p) => (
                  <div key={p.id} className={`projects-project-row ${selectedProjectId === p.id ? 'active' : ''}`}>
                    <button
                      type="button"
                      className="projects-project-select"
                      onClick={() => setSelectedProjectId(p.id)}
                    >
                      <span className="projects-nav-icon">{GridIcon}</span>
                      <span className="projects-nav-label">{p.project_name ?? 'Untitled'}</span>
                    </button>
                    <div className="projects-project-actions">
                      <button
                        type="button"
                        className="icon-btn subtle"
                        onClick={() => openEditProjectModal(p)}
                        aria-label={`Edit ${p.project_name ?? 'project'}`}
                      >
                        {PencilIcon}
                      </button>
                      <button
                        type="button"
                        className="icon-btn subtle danger"
                        onClick={() => void onDelete(p.id)}
                        aria-label={`Delete ${p.project_name ?? 'project'}`}
                      >
                        {TrashIcon}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
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
              <div style={{ marginTop: 12, display: 'grid', gap: 10 }}>
                <div className="workflows-head">
                  <div style={{ fontWeight: 700 }}>Workflows</div>
                  <button type="button" className="btn" onClick={openCreateWorkflowModal} disabled={selectedProjectId == null}>
                    Create
                  </button>
                </div>
                {flowsLoading ? (
                  <div className="projects-muted">Loading…</div>
                ) : (
                  <div className="flows-list">
                    {flows.length === 0 ? (
                      <div className="workflows-empty">
                        <div className="workflows-empty-title">This project is empty</div>
                        <div className="workflows-empty-subtitle">Workflows in this project will appear here.</div>
                        <button type="button" className="btn workflows-empty-btn" onClick={openCreateWorkflowModal}>
                          Create
                        </button>
                      </div>
                    ) : (
                      flows.map((f) => {
                        const name = (f.flow_name ?? 'Untitled').trim() || 'Untitled'
                        const initials = name.replace(/[^a-zA-Z0-9]+/g, ' ').trim().split(' ').filter(Boolean).slice(0, 2).map((w) => w[0] ?? '').join('').toUpperCase() || 'WF'
                        const menuOpen = openWorkflowMenuId === f.id
                        return (
                          <div
                            key={f.id}
                            className="workflow-card"
                            role="button"
                            tabIndex={0}
                            onClick={() => openWorkflow(f.id)}
                            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') openWorkflow(f.id) }}
                          >
                            <div className="workflow-avatar" aria-hidden>{initials}</div>
                            <div className="workflow-meta">
                              <div className="workflow-title">{name}</div>
                              <div className="workflow-subtitle">Open workflow</div>
                            </div>
                            <button
                              type="button"
                              className="icon-btn subtle workflow-more"
                              onClick={(e) => { e.stopPropagation(); setOpenWorkflowMenuId(menuOpen ? null : f.id) }}
                              aria-label="Open workflow menu"
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                                <circle cx="12" cy="12" r="1" />
                                <circle cx="19" cy="12" r="1" />
                                <circle cx="5" cy="12" r="1" />
                              </svg>
                            </button>
                            {menuOpen && (
                              <div className="wf-menu" onMouseDown={(e) => e.stopPropagation()}>
                                <button type="button" className="wf-menu-item" onClick={(e) => { e.stopPropagation(); setOpenWorkflowMenuId(null); openRenameWorkflowModal(f) }}>Rename</button>
                                <button type="button" className="wf-menu-item" onClick={(e) => { e.stopPropagation(); setOpenWorkflowMenuId(null); void onDuplicateWorkflow(f) }}>Duplicate</button>
                                <button type="button" className="wf-menu-item danger" onClick={(e) => { e.stopPropagation(); setOpenWorkflowMenuId(null); void onDeleteWorkflow(f.id) }}>Delete</button>
                              </div>
                            )}
                          </div>
                        )
                      })
                    )}
                  </div>
                )}
              </div>
            )}
          </section>
        </main>
      </div>

      {openWorkflowMenuId != null && <div className="wf-menu-overlay" onMouseDown={() => setOpenWorkflowMenuId(null)} />}

      {projectModalOpen && (
        <div className="modal-overlay" role="dialog" aria-modal="true" onMouseDown={(e) => { if (e.target === e.currentTarget) closeProjectModal() }}>
          <div className="modal-card" onMouseDown={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <div className="modal-title">{projectModalMode === 'create' ? 'Create project' : 'Edit project'}</div>
              <button type="button" className="icon-btn" onClick={closeProjectModal} aria-label="Close">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M18 6 6 18" />
                  <path d="M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="modal-body">
              <div className="field">
                <label>Name</label>
                <input value={projectDraftName} onChange={(e) => setProjectDraftName(e.target.value)} placeholder="e.g. My Project" />
              </div>
              <div className="field" style={{ marginBottom: 0 }}>
                <label>Description</label>
                <textarea value={projectDraftScope} onChange={(e) => setProjectDraftScope(e.target.value)} placeholder="Describe here the scope of your project" rows={5} />
              </div>
            </div>

            <div className="modal-actions">
              <button type="button" className="btn" onClick={closeProjectModal} disabled={savingProject}>Cancel</button>
              <button type="button" className="btn primary" onClick={() => void onSaveProject()} disabled={!canSaveProject}>
                {projectModalMode === 'create' ? 'Create' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {workflowModalOpen && (
        <div className="modal-overlay" role="dialog" aria-modal="true" onMouseDown={(e) => { if (e.target === e.currentTarget) closeWorkflowModal() }}>
          <div className="modal-card" onMouseDown={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <div className="modal-title">{workflowModalMode === 'create' ? 'Create workflow' : 'Rename workflow'}</div>
              <button type="button" className="icon-btn" onClick={closeWorkflowModal} aria-label="Close">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M18 6 6 18" />
                  <path d="M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="modal-body">
              <div className="field" style={{ marginBottom: 0 }}>
                <label>Name</label>
                <input value={workflowDraftName} onChange={(e) => setWorkflowDraftName(e.target.value)} placeholder="e.g. Onboarding" />
              </div>
            </div>

            <div className="modal-actions">
              <button type="button" className="btn" onClick={closeWorkflowModal} disabled={savingWorkflow}>Cancel</button>
              <button type="button" className="btn primary" onClick={() => void onSaveWorkflow()} disabled={!canSaveWorkflow}>
                {workflowModalMode === 'create' ? 'Create' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Projects
