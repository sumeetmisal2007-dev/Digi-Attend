const API_BASE = '/api'

export async function apiFetch(path, options = {}) {
  const token = localStorage.getItem('token')
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    const err = new Error(errorData.error || errorData.message || 'Request failed')
    err.expectedRole = errorData.expectedRole
    err.status = response.status
    throw err
  }

  return response.json()
}
