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

// ── Companies ──────────────────────────────────────────────────────────────

export function listCompanies() {
  return request('/companies')
}

export function createCompany() {
  return request('/companies', { method: 'POST' })
}

// ── Company detail ─────────────────────────────────────────────────────────

export function getCompany(companyId) {
  return request(`/companies/${companyId}`)
}

export function getCompleteness(companyId) {
  return request(`/companies/${companyId}/completeness`)
}

export function getNotifications(companyId) {
  return request(`/companies/${companyId}/notifications`)
}

export function updateCompany(companyId, payload) {
  return request(`/companies/${companyId}`, { method: 'PUT', body: JSON.stringify(payload) })
}

// ── Registrations ──────────────────────────────────────────────────────────

export function getRegistrations(companyId) {
  return request(`/companies/${companyId}/registrations`)
}

export function advanceRegistration(companyId, id) {
  return request(`/companies/${companyId}/registrations/${encodeURIComponent(id)}/advance`, { method: 'POST' })
}

// ── Chat ───────────────────────────────────────────────────────────────────

export function getChatHistory(companyId, limit = 50) {
  return request(`/companies/${companyId}/chat/history?limit=${limit}`)
}

export function postChatMessage(companyId, text) {
  return request(`/companies/${companyId}/chat`, { method: 'POST', body: JSON.stringify({ text }) })
}

// ── AI (ephemeral, no history) ─────────────────────────────────────────────

export function aiQuery(text) {
  return request('/ai/query', { method: 'POST', body: JSON.stringify({ text }) })
}

// ── Directors ──────────────────────────────────────────────────────────────

export function getDirectors(companyId) {
  return request(`/companies/${companyId}/directors`)
}

export function addDirector(companyId, payload) {
  return request(`/companies/${companyId}/directors`, { method: 'POST', body: JSON.stringify(payload) })
}

export function updateDirector(companyId, id, payload) {
  return request(`/companies/${companyId}/directors/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify(payload) })
}

export function deleteDirector(companyId, id) {
  return request(`/companies/${companyId}/directors/${encodeURIComponent(id)}`, { method: 'DELETE' })
}

// ── Documents ──────────────────────────────────────────────────────────────

export function getDocuments(companyId) {
  return request(`/companies/${companyId}/documents`)
}

export function uploadDocument(companyId, file, { docType, linkedTo, directorId } = {}) {
  const form = new FormData()
  form.append('file', file)
  if (docType) form.append('doc_type', docType)
  if (linkedTo) form.append('linked_to', linkedTo)
  if (directorId != null) form.append('director_id', String(directorId))
  return request(`/companies/${companyId}/documents/upload`, { method: 'POST', headers: {}, body: form })
}

export function downloadDocumentUrl(companyId, id) {
  const base = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'
  return `${base}/companies/${companyId}/documents/${encodeURIComponent(id)}/download`
}

export function deleteDocument(companyId, id) {
  return request(`/companies/${companyId}/documents/${encodeURIComponent(id)}`, { method: 'DELETE' })
}
