import { useCallback, useEffect, useMemo, useState } from 'react'
import { createProject, deleteProject, listProjects, type ProjectRow } from '../lib/api'

function Projects() {
  const [projects, setProjects] = useState<ProjectRow[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [name, setName] = useState('')
  const [scope, setScope] = useState('')
  const [creating, setCreating] = useState(false)

  const canCreate = useMemo(() => name.trim().length > 0 && !creating, [name, creating])

  const loadProjects = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await listProjects()
      setProjects(data ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore imprevisto')
      setProjects([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadProjects()
  }, [loadProjects])

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
      setError(err instanceof Error ? err.message : 'Errore imprevisto')
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
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore imprevisto')
      return
    }
  }

  return (
    <div className="container">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <section className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <h2 style={{ margin: 0 }}>Progetti</h2>
            <button className="btn" onClick={() => void loadProjects()} disabled={loading}>
              Aggiorna
            </button>
          </div>

          {error && (
            <div style={{ marginTop: 12, color: '#fecaca' }}>
              {error}
            </div>
          )}

          {loading ? (
            <div style={{ marginTop: 12, color: 'var(--muted)' }}>Caricamento…</div>
          ) : (
            <div style={{ marginTop: 12, display: 'grid', gap: 10 }}>
              {projects.length === 0 ? (
                <div style={{ color: 'var(--muted)' }}>Nessun progetto</div>
              ) : (
                projects.map((p) => (
                  <div key={p.id} style={{ border: '1px solid var(--border)', borderRadius: 12, padding: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                      <div style={{ display: 'grid', gap: 4 }}>
                        <div style={{ fontWeight: 700 }}>{p.project_name ?? 'Senza nome'}</div>
                        {p.project_scope && <div style={{ color: 'var(--muted)', fontSize: 12, whiteSpace: 'pre-wrap' }}>{p.project_scope}</div>}
                      </div>
                      <button className="btn danger" onClick={() => void onDelete(p.id)}>
                        Elimina
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </section>

        <section className="card">
          <h2 style={{ marginTop: 0 }}>Nuovo progetto</h2>
          <div className="field">
            <label>Nome progetto</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Es. Demo" />
          </div>
          <div className="field">
            <label>Scope</label>
            <textarea value={scope} onChange={(e) => setScope(e.target.value)} placeholder="Descrizione / scope" rows={6} />
          </div>
          <button className="btn primary" onClick={() => void onCreate()} disabled={!canCreate}>
            Crea
          </button>
        </section>
      </div>
    </div>
  )
}

export default Projects
