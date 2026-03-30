export type SetupStatus = { setupComplete: boolean }

const baseUrl = (import.meta.env.VITE_SETUP_API_BASE_URL as string | undefined) ?? '/api'

export async function getSetupStatus(): Promise<SetupStatus> {
  const res = await fetch(`${baseUrl}/setup/status`, { method: 'GET' })
  if (!res.ok) throw new Error(`Setup status failed: ${res.status}`)
  return (await res.json()) as SetupStatus
}

export async function initFirstUser(input: { email: string, password: string }): Promise<void> {
  const res = await fetch(`${baseUrl}/setup/init`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(input),
  })

  if (res.status === 409) return
  if (!res.ok) throw new Error(`Setup init failed: ${res.status}`)
}

