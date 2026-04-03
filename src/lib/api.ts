const baseUrl = (import.meta.env.VITE_SETUP_API_BASE_URL as string | undefined) ?? '/api'

export type ApiError = { error: string }

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers ?? {})
  if (init.body && !headers.has('content-type')) headers.set('content-type', 'application/json')

  const res = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers,
    credentials: 'include',
  })

  const text = await res.text().catch(() => '')
  const json = text ? JSON.parse(text) : null
  if (!res.ok) {
    const msg = typeof json?.error === 'string' ? json.error : `http_${res.status}`
    throw new Error(msg)
  }
  return json as T
}

export type MeResponse = { user: { id: string, email: string, is_admin: boolean, created_at: string, updated_at: string | null } | null }

export async function authMe(): Promise<MeResponse> {
  return apiFetch<MeResponse>('/auth/me', { method: 'GET' })
}

export async function authLogin(input: { email: string, password: string }): Promise<void> {
  await apiFetch<{ ok: true }>('/auth/login', { method: 'POST', body: JSON.stringify(input) })
}

export async function authSignup(input: { email: string, password: string }): Promise<void> {
  await apiFetch<{ user: { id: string, email: string, is_admin: boolean } }>('/auth/signup', { method: 'POST', body: JSON.stringify(input) })
}

export async function authLogout(): Promise<void> {
  await apiFetch<{ ok: true }>('/auth/logout', { method: 'POST' })
}

export async function authChangePassword(input: { currentPassword: string, newPassword: string }): Promise<void> {
  await apiFetch<{ ok: true }>('/auth/change-password', { method: 'POST', body: JSON.stringify(input) })
}

export type ProjectRow = {
  id: number
  project_name: string | null
  project_scope: string | null
  created_at: string
  updated_at: string | null
}

export type FlowRow = {
  id: number
  flow_name: string | null
  created_at: string
  updated_at: string | null
}

export async function listProjects(): Promise<ProjectRow[]> {
  const res = await apiFetch<{ projects: ProjectRow[] }>('/projects', { method: 'GET' })
  return res.projects ?? []
}

export async function createProject(input: { project_name: string, project_scope: string | null }): Promise<ProjectRow> {
  const res = await apiFetch<{ project: ProjectRow }>('/projects', { method: 'POST', body: JSON.stringify(input) })
  return res.project
}

export async function deleteProject(id: number): Promise<void> {
  await apiFetch<{ ok: true }>(`/projects/${id}`, { method: 'DELETE' })
}

export async function listFlows(projectId: number): Promise<FlowRow[]> {
  const res = await apiFetch<{ flows: FlowRow[] }>(`/projects/${projectId}/flows`, { method: 'GET' })
  return res.flows ?? []
}

export async function createFlow(projectId: number, input: { flow_name: string | null }): Promise<FlowRow> {
  const res = await apiFetch<{ flow: FlowRow }>(`/projects/${projectId}/flows`, { method: 'POST', body: JSON.stringify(input) })
  return res.flow
}
