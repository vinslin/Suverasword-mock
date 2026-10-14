import { useState, useEffect, useRef } from 'react'
import { FileText, Upload, Download, Trash2, AlertTriangle, Loader } from 'lucide-react'
import { getDocuments, uploadDocument, downloadDocumentUrl, deleteDocument } from '../lib/api'

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

function UploadDrawer({ onUploaded, onClose }) {
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
    <div className="border border-indigo-100 bg-indigo-50/40 rounded-xl p-4 space-y-3">
      <div className="text-[12.5px] font-semibold text-gray-700">Upload Document</div>

      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        onClick={() => fileRef.current?.click()}
        className="border-2 border-dashed border-indigo-200 rounded-lg py-5 flex flex-col items-center gap-1.5 cursor-pointer hover:bg-indigo-50 transition-colors"
      >
        <Upload size={18} className="text-indigo-400" />
        {file ? (
          <span className="text-[12px] text-gray-700 font-medium">{file.name}</span>
        ) : (
          <>
            <span className="text-[12px] text-gray-500">Drop a file or click to browse</span>
            <span className="text-[11px] text-gray-400">PDF, JPG, PNG accepted</span>
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

      <div className="grid grid-cols-2 gap-2">
        <label className="block">
          <span className="text-[11px] text-gray-500 mb-1 block">Document Type</span>
          <select
            value={docType}
            onChange={(e) => setDocType(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-[12.5px] outline-none focus:border-indigo-400 bg-white"
          >
            <option value="">— select —</option>
            {DOC_TYPE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-[11px] text-gray-500 mb-1 block">Linked To</span>
          <select
            value={linkedTo}
            onChange={(e) => setLinkedTo(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-[12.5px] outline-none focus:border-indigo-400 bg-white"
          >
            {LINKED_TO_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </label>
      </div>

      {error && <div className="text-[11.5px] text-red-500">{error}</div>}

      <div className="flex gap-2">
        <button
          onClick={handleSubmit}
          disabled={!file || uploading}
          className="flex-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-[12.5px] font-medium py-1.5 flex items-center justify-center gap-1.5"
        >
          {uploading ? <><Loader size={13} className="animate-spin" /> Uploading…</> : 'Upload'}
        </button>
        <button
          onClick={onClose}
          className="rounded-lg border border-gray-200 text-gray-600 text-[12.5px] px-3 py-1.5 hover:bg-gray-50"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}

const REQUIRED_DOC_TYPES = ['pan_card', 'aadhaar', 'address_proof']

export default function DocumentsPanel({ refreshKey }) {
  const [documents, setDocuments] = useState([])
  const [showUpload, setShowUpload] = useState(false)
  const [deleting, setDeleting] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    getDocuments()
      .then(setDocuments)
      .catch(() => {})
  }, [refreshKey])

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

  const uploadedTypes = new Set(documents.map((d) => d.docType).filter(Boolean))
  const missingRequired = REQUIRED_DOC_TYPES.filter((t) => !uploadedTypes.has(t))

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <FileText size={15} className="text-indigo-500" />
          <span className="text-[13px] font-semibold text-gray-900">Documents</span>
          {documents.length > 0 && (
            <span className="text-[11px] bg-indigo-50 text-indigo-600 font-medium px-1.5 py-0.5 rounded-full">
              {documents.length}
            </span>
          )}
        </div>
        <button
          onClick={() => { setError(null); setShowUpload((v) => !v) }}
          className="flex items-center gap-1 text-[12px] font-medium text-indigo-600 hover:text-indigo-700"
        >
          <Upload size={13} /> Upload
        </button>
      </div>

      {showUpload && (
        <div className="mb-3">
          <UploadDrawer onUploaded={handleUploaded} onClose={() => setShowUpload(false)} />
        </div>
      )}

      {missingRequired.length > 0 && documents.length > 0 && (
        <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-3 text-[12px] text-amber-700">
          <AlertTriangle size={13} className="shrink-0 mt-0.5" />
          <span>Missing: {missingRequired.map((t) => DOC_TYPE_LABEL[t]).join(', ')}</span>
        </div>
      )}

      {error && <div className="text-[12px] text-red-500 mb-2">{error}</div>}

      {documents.length === 0 ? (
        <p className="text-[12.5px] text-gray-400 text-center py-3">
          No documents uploaded yet. Use "Upload" to add files.
        </p>
      ) : (
        <div className="space-y-2">
          {documents.map((doc) => (
            <div key={doc.id} className="flex items-center gap-2.5 border border-gray-100 rounded-xl px-3 py-2.5">
              <span className="text-lg shrink-0 leading-none">{fileIcon(doc.originalName)}</span>
              <div className="min-w-0 flex-1">
                <div className="text-[12.5px] font-medium text-gray-800 truncate">{doc.originalName}</div>
                <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                  {doc.docType && (
                    <span className={`text-[10.5px] font-medium px-1.5 py-0.5 rounded-full ${docTypeColor(doc.docType)}`}>
                      {DOC_TYPE_LABEL[doc.docType] ?? doc.docType}
                    </span>
                  )}
                  {doc.linkedTo && (
                    <span className="text-[10.5px] text-gray-400">{doc.linkedTo}</span>
                  )}
                </div>
              </div>
              <div className="flex gap-1 shrink-0">
                <a
                  href={downloadDocumentUrl(doc.id)}
                  target="_blank"
                  rel="noreferrer"
                  className="text-gray-400 hover:text-indigo-600 p-1"
                  title="Download"
                >
                  <Download size={13} />
                </a>
                <button
                  onClick={() => handleDelete(doc.id)}
                  disabled={deleting === doc.id}
                  className="text-gray-400 hover:text-red-500 p-1 disabled:opacity-40"
                  title="Delete"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
