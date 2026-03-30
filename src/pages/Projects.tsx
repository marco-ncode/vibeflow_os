import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'

type ProjectRow = {
  id: number
  project_name: string | null
  project_scope: string | null
  created_at: string
  updated_at: string | null
}

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
    const { data, error: err } = await supabase
      .from('projects')
      .select('id,project_name,project_scope,created_at,updated_at')
      .order('created_at', { ascending: false })
    if (err) {
      setError(err.message)
      setProjects([])
      setLoading(false)
      return
    }
    setProjects(data ?? [])
    setLoading(false)
  }, [])

  useEffect(() => {
    void loadProjects()
  }, [loadProjects])

  async function onCreate() {
    if (!canCreate) return
    setCreating(true)
    setError(null)
    const payload = {
      project_name: name.trim(),
      project_scope: scope.trim().length ? scope.trim() : null,
    }
    const { data, error: err } = await supabase
      .from('projects')
      .insert(payload)
      .select('id,project_name,project_scope,created_at,updated_at')
      .single()
    if (err) {
      setError(err.message)
      setCreating(false)
      return
    }
    setProjects((prev) => [data, ...prev])
    setName('')
    setScope('')
    setCreating(false)
  }

  async function onDelete(id: number) {
    setError(null)
    const { error: err } = await supabase.from('projects').delete().eq('id', id)
    if (err) {
      setError(err.message)
      return
    }
    setProjects((prev) => prev.filter((p) => p.id !== id))
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
