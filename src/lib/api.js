const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'

export class ApiError extends Error {
  constructor(message, status) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

async function request(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  if (!res.ok) {
    let detail = res.statusText
    try {
      const body = await res.json()
      detail = body.detail || detail
    } catch {
      // response wasn't JSON — keep statusText
    }
    throw new ApiError(detail, res.status)
  }
  if (res.status === 204) return null
  return res.json()
}

export function getCompany() {
  return request('/company')
}

export function updateCompany(payload) {
  return request('/company', { method: 'PUT', body: JSON.stringify(payload) })
}

export function getRegistrations() {
  return request('/registrations')
}

export function advanceRegistration(id) {
  return request(`/registrations/${encodeURIComponent(id)}/advance`, { method: 'POST' })
}

export function getChatHistory(limit = 50) {
  return request(`/chat/history?limit=${limit}`)
}

export function postChatMessage(text) {
  return request('/chat', { method: 'POST', body: JSON.stringify({ text }) })
}

export function getDirectors() {
  return request('/directors')
}

export function addDirector(payload) {
  return request('/directors', { method: 'POST', body: JSON.stringify(payload) })
}

export function updateDirector(id, payload) {
  return request(`/directors/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify(payload) })
}

export function deleteDirector(id) {
  return request(`/directors/${encodeURIComponent(id)}`, { method: 'DELETE' })
}
