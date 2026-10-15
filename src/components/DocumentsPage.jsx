import { useState, useEffect, useRef } from 'react'
import {
  FileText, Upload, Download, Trash2, AlertTriangle,
  Loader, ChevronDown, Building2, Search, X,
} from 'lucide-react'
import { getDocuments, getCompany, uploadDocument, downloadDocumentUrl, deleteDocument } from '../lib/api'

const DOC_TYPE_OPTIONS = [
  { value: 'pan_card', label: 'PAN Card' },
  { value: 'aadhaar', label: 'Aadhaar' },
  { value: 'address_proof', label: 'Address Proof' },
  { value: 'photograph', label: 'Photograph' },
  { value: 'noc', label: 'NOC / Rent Agreement' },
  { value: 'moa', label: 'MOA' },
  { value: 'aoa', label: 'AOA' },
  { value: 'other', label: 'Other' },
]

const DOC_TYPE_LABEL = Object.fromEntries(DOC_TYPE_OPTIONS.map((o) => [o.value, o.label]))

const LINKED_TO_OPTIONS = [
  { value: 'company', label: 'Company' },
  { value: 'director', label: 'Director' },
]

const REQUIRED_DOC_TYPES = ['pan_card', 'aadhaar', 'address_proof']

function docTypeColor(type) {
  const map = {
    pan_card: 'bg-blue-50 text-blue-600',
    aadhaar: 'bg-indigo-50 text-indigo-600',
    address_proof: 'bg-amber-50 text-amber-600',
    photograph: 'bg-purple-50 text-purple-600',
    noc: 'bg-teal-50 text-teal-600',
    moa: 'bg-emerald-50 text-emerald-600',
    aoa: 'bg-emerald-50 text-emerald-600',
  }
  return map[type] ?? 'bg-gray-100 text-gray-500'
}

function fileIcon(name) {
  const ext = name?.split('.').pop()?.toLowerCase()
  if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) return '🖼️'
  if (ext === 'pdf') return '📄'
  return '📎'
}

function UploadModal({ onUploaded, onClose }) {
  const [file, setFile] = useState(null)
  const [docType, setDocType] = useState('')
  const [linkedTo, setLinkedTo] = useState('company')
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState(null)
  const fileRef = useRef(null)

  function handleDrop(e) {
    e.preventDefault()
    const dropped = e.dataTransfer.files[0]
    if (dropped) setFile(dropped)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!file) return
    setUploading(true)
    setError(null)
    try {
      const doc = await uploadDocument(file, { docType: docType || undefined, linkedTo: linkedTo || undefined })
      onUploaded(doc)
    } catch (err) {
      setError(err.message || 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <div className="font-semibold text-gray-900 text-[15px]">Upload Document</div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
        </div>

        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => fileRef.current?.click()}
          className="border-2 border-dashed border-indigo-200 rounded-xl py-8 flex flex-col items-center gap-2 cursor-pointer hover:bg-indigo-50/50 transition-colors"
        >
          <Upload size={22} className="text-indigo-400" />
          {file ? (
            <span className="text-[13px] text-gray-700 font-medium">{file.name}</span>
          ) : (
            <>
              <span className="text-[13px] text-gray-500">Drop a file or click to browse</span>
              <span className="text-[12px] text-gray-400">PDF, JPG, PNG accepted</span>
            </>
          )}
          <input
            ref={fileRef}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,.gif,.webp"
            className="hidden"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="text-[12px] text-gray-500 mb-1 block">Document Type</span>
            <select
              value={docType}
              onChange={(e) => setDocType(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-[13px] outline-none focus:border-indigo-400 bg-white"
            >
              <option value="">— select —</option>
              {DOC_TYPE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-[12px] text-gray-500 mb-1 block">Linked To</span>
            <select
              value={linkedTo}
              onChange={(e) => setLinkedTo(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-[13px] outline-none focus:border-indigo-400 bg-white"
            >
              {LINKED_TO_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </label>
        </div>

        {error && <div className="text-[12.5px] text-red-500">{error}</div>}

        <div className="flex gap-2 pt-1">
          <button
            onClick={handleSubmit}
            disabled={!file || uploading}
            className="flex-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-[13px] font-medium py-2.5 flex items-center justify-center gap-2"
          >
            {uploading ? <><Loader size={14} className="animate-spin" /> Uploading…</> : <><Upload size={14} /> Upload</>}
          </button>
          <button
            onClick={onClose}
            className="rounded-lg border border-gray-200 text-gray-600 text-[13px] px-4 py-2.5 hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

export default function DocumentsPage() {
  const [companies, setCompanies] = useState([])
  const [selectedCompany, setSelectedCompany] = useState(null)
  const [documents, setDocuments] = useState([])
  const [loading, setLoading] = useState(true)
  const [docsLoading, setDocsLoading] = useState(false)
  const [showUpload, setShowUpload] = useState(false)
  const [deleting, setDeleting] = useState(null)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('')

  // Load company list on mount
  useEffect(() => {
    async function loadCompanies() {
      setLoading(true)
      try {
        const company = await getCompany()
        if (company) {
          setCompanies([company])
          setSelectedCompany(company)
        }
      } catch {
        // no company yet
      } finally {
        setLoading(false)
      }
    }
    loadCompanies()
  }, [])

  // Load documents whenever selected company changes
  useEffect(() => {
    if (!selectedCompany) return
    setDocsLoading(true)
    setError(null)
    getDocuments()
      .then(setDocuments)
      .catch((err) => setError(err.message || 'Failed to load documents'))
      .finally(() => setDocsLoading(false))
  }, [selectedCompany])

  function handleUploaded(doc) {
    setDocuments((prev) => [doc, ...prev])
    setShowUpload(false)
  }

  async function handleDelete(id) {
    if (!window.confirm('Remove this document?')) return
    setDeleting(id)
    setError(null)
    try {
      await deleteDocument(id)
      setDocuments((prev) => prev.filter((d) => d.id !== id))
    } catch (err) {
      setError(err.message || 'Failed to delete document')
    } finally {
      setDeleting(null)
    }
  }

  const filtered = documents.filter((doc) => {
    const matchSearch = !search || doc.originalName?.toLowerCase().includes(search.toLowerCase())
    const matchType = !filterType || doc.docType === filterType
    return matchSearch && matchType
  })

  const uploadedTypes = new Set(documents.map((d) => d.docType).filter(Boolean))
  const missingRequired = REQUIRED_DOC_TYPES.filter((t) => !uploadedTypes.has(t))

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#f3f4f8]">
        <Loader size={20} className="animate-spin text-indigo-400" />
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto bg-[#f3f4f8] p-6">
      <div className="max-w-4xl mx-auto space-y-5">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[18px] font-semibold text-gray-900">Documents</h1>
            <p className="text-[13px] text-gray-400 mt-0.5">Upload and manage your company documents</p>
          </div>
          {selectedCompany && (
            <button
              onClick={() => setShowUpload(true)}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-[13px] font-medium px-4 py-2.5 rounded-xl transition-colors"
            >
              <Upload size={15} /> Upload Document
            </button>
          )}
        </div>

        {/* Company Selector */}
        <div className="bg-white rounded-2xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <Building2 size={18} className="text-indigo-500 shrink-0" />
            <div className="flex-1">
              <div className="text-[11.5px] text-gray-400 mb-1 font-medium uppercase tracking-wide">Company</div>
              {companies.length === 0 ? (
                <div className="text-[13.5px] text-gray-400">No company found — start one via the AI Assistant</div>
              ) : (
                <div className="relative">
                  <select
                    value={selectedCompany?.id ?? ''}
                    onChange={(e) => {
                      const c = companies.find((c) => String(c.id) === e.target.value)
                      setSelectedCompany(c ?? null)
                      setSearch('')
                      setFilterType('')
                    }}
                    className="w-full appearance-none border border-gray-200 rounded-xl px-4 py-2.5 pr-10 text-[13.5px] font-medium text-gray-900 outline-none focus:border-indigo-400 bg-white cursor-pointer"
                  >
                    {companies.map((c) => (
                      <option key={c.id} value={c.id}>{c.name} — {c.type}</option>
                    ))}
                  </select>
                  <ChevronDown size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
              )}
            </div>
            {selectedCompany && (
              <div className="shrink-0 text-right">
                <div className="text-[11.5px] text-gray-400">Total documents</div>
                <div className="text-[20px] font-bold text-indigo-600">{documents.length}</div>
              </div>
            )}
          </div>
        </div>

        {selectedCompany && (
          <>
            {/* Missing docs warning */}
            {missingRequired.length > 0 && documents.length > 0 && (
              <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-[13px] text-amber-700">
                <AlertTriangle size={15} className="shrink-0 mt-0.5" />
                <span>Missing required documents: <strong>{missingRequired.map((t) => DOC_TYPE_LABEL[t]).join(', ')}</strong></span>
              </div>
            )}

            {/* Search & Filter bar */}
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search documents…"
                  className="w-full border border-gray-200 bg-white rounded-xl pl-9 pr-4 py-2.5 text-[13px] outline-none focus:border-indigo-400"
                />
              </div>
              <div className="relative">
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="appearance-none border border-gray-200 bg-white rounded-xl px-4 pr-8 py-2.5 text-[13px] outline-none focus:border-indigo-400 cursor-pointer"
                >
                  <option value="">All types</option>
                  {DOC_TYPE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
                <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="text-[13px] text-red-500 bg-red-50 border border-red-200 rounded-xl px-4 py-3">{error}</div>
            )}

            {/* Documents list */}
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              {/* Table header */}
              <div className="grid grid-cols-[2fr_1fr_1fr_auto] gap-4 px-5 py-3 border-b border-gray-100 text-[11.5px] font-semibold text-gray-400 uppercase tracking-wide">
                <span>Document</span>
                <span>Type</span>
                <span>Linked To</span>
                <span>Actions</span>
              </div>

              {docsLoading ? (
                <div className="flex items-center justify-center py-16 text-gray-400">
                  <Loader size={18} className="animate-spin mr-2" /> Loading documents…
                </div>
              ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <FileText size={32} className="text-gray-200 mb-3" />
                  <div className="text-[14px] font-medium text-gray-500">
                    {documents.length === 0 ? 'No documents uploaded yet' : 'No documents match your search'}
                  </div>
                  {documents.length === 0 && (
                    <button
                      onClick={() => setShowUpload(true)}
                      className="mt-4 flex items-center gap-2 text-[13px] font-medium text-indigo-600 hover:text-indigo-700"
                    >
                      <Upload size={14} /> Upload your first document
                    </button>
                  )}
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {filtered.map((doc) => (
                    <div
                      key={doc.id}
                      className="grid grid-cols-[2fr_1fr_1fr_auto] gap-4 items-center px-5 py-3.5 hover:bg-gray-50/50 transition-colors"
                    >
                      {/* Name */}
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-xl shrink-0 leading-none">{fileIcon(doc.originalName)}</span>
                        <div className="min-w-0">
                          <div className="text-[13.5px] font-medium text-gray-900 truncate">{doc.originalName}</div>
                          {doc.uploadedAt && (
                            <div className="text-[11px] text-gray-400 mt-0.5">
                              {new Date(doc.uploadedAt).toLocaleDateString('en-IN', {
                                day: '2-digit', month: 'short', year: 'numeric',
                              })}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Type badge */}
                      <div>
                        {doc.docType ? (
                          <span className={`text-[11px] font-medium px-2 py-1 rounded-full ${docTypeColor(doc.docType)}`}>
                            {DOC_TYPE_LABEL[doc.docType] ?? doc.docType}
                          </span>
                        ) : (
                          <span className="text-[12px] text-gray-300">—</span>
                        )}
                      </div>

                      {/* Linked to */}
                      <div className="text-[12.5px] text-gray-500 capitalize">
                        {doc.linkedTo ?? '—'}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 shrink-0">
                        <a
                          href={downloadDocumentUrl(doc.id)}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1.5 text-[12px] font-medium text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-colors"
                          title="Download"
                        >
                          <Download size={13} /> Download
                        </a>
                        <button
                          onClick={() => handleDelete(doc.id)}
                          disabled={deleting === doc.id}
                          className="text-gray-400 hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50 disabled:opacity-40 transition-colors"
                          title="Delete"
                        >
                          {deleting === doc.id ? <Loader size={13} className="animate-spin" /> : <Trash2 size={13} />}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer count */}
            {filtered.length > 0 && (
              <div className="text-[12px] text-gray-400 text-center">
                Showing {filtered.length} of {documents.length} document{documents.length !== 1 ? 's' : ''}
              </div>
            )}
          </>
        )}
      </div>

      {showUpload && (
        <UploadModal onUploaded={handleUploaded} onClose={() => setShowUpload(false)} />
      )}
    </div>
  )
}
