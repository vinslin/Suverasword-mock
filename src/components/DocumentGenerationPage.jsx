import { useState } from 'react'
import { FileText, FileCheck, ClipboardList, Download, Copy, Loader2, AlertTriangle, CheckCircle2, ChevronRight } from 'lucide-react'
import { generateDocument } from '../lib/api'

const DOC_TYPES = [
  {
    id: 'moa',
    icon: FileText,
    title: 'Memorandum of Association',
    short: 'MOA',
    description: 'The founding document of the company — defines its name, registered office, objects, liability, and share capital.',
    uses: ['Company name & type', 'Registered address', 'Business activity', 'Authorized capital', 'Director list'],
    requiredFields: ['name', 'type', 'businessActivity'],
  },
  {
    id: 'aoa',
    icon: FileCheck,
    title: 'Articles of Association',
    short: 'AOA',
    description: 'Internal rules governing the company — covers management, meetings, share transfers, voting, and winding up.',
    uses: ['Company name & type', 'Director names & roles', 'Shareholding structure'],
    requiredFields: ['name', 'type'],
  },
  {
    id: 'spice_summary',
    icon: ClipboardList,
    title: 'SPICe+ Summary',
    short: 'SPICe+',
    description: 'A plain-English review of your SPICe+ application — for directors to verify all details before applying digital signatures.',
    uses: ['All company fields', 'All directors', 'Capital structure', 'Next steps checklist'],
    requiredFields: ['name'],
  },
]

function getMissingFields(docType, company) {
  if (!company) return ['Company data not loaded']
  const missing = []
  docType.requiredFields.forEach(f => {
    if (!company[f]) missing.push(f.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ').toLowerCase().trim())
  })
  return missing
}

function DocCard({ doc, company, isActive, onGenerate, isLoading }) {
  const missing = getMissingFields(doc, company)
  const canGenerate = missing.length === 0
  const Icon = doc.icon

  return (
    <div
      onClick={() => canGenerate && !isLoading && onGenerate(doc.id)}
      className={`rounded-xl border p-5 cursor-pointer transition-all ${
        isActive
          ? 'border-blue-500 bg-blue-50 shadow-sm'
          : canGenerate
          ? 'border-gray-200 bg-white hover:border-blue-300 hover:shadow-sm'
          : 'border-gray-200 bg-gray-50 opacity-70 cursor-not-allowed'
      }`}
    >
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-lg ${isActive ? 'bg-blue-100' : 'bg-gray-100'}`}>
          <Icon size={20} className={isActive ? 'text-blue-600' : 'text-gray-500'} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-semibold text-gray-900 text-sm">{doc.title}</h3>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
              isActive ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-500'
            }`}>{doc.short}</span>
          </div>
          <p className="text-xs text-gray-500 mt-1 leading-relaxed">{doc.description}</p>

          <div className="mt-3 flex flex-wrap gap-1">
            {doc.uses.map(u => (
              <span key={u} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                {u}
              </span>
            ))}
          </div>

          {missing.length > 0 && (
            <div className="mt-3 flex items-start gap-1.5 text-xs text-amber-700 bg-amber-50 rounded-lg px-3 py-2">
              <AlertTriangle size={12} className="mt-0.5 shrink-0" />
              <span>Missing: {missing.join(', ')}</span>
            </div>
          )}

          <button
            disabled={!canGenerate || isLoading}
            onClick={e => { e.stopPropagation(); if (canGenerate && !isLoading) onGenerate(doc.id) }}
            className={`mt-3 w-full flex items-center justify-center gap-2 text-sm font-medium py-2 px-4 rounded-lg transition-colors ${
              !canGenerate
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : isLoading
                ? 'bg-blue-100 text-blue-400 cursor-not-allowed'
                : isActive
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-900 text-white hover:bg-gray-800'
            }`}
          >
            {isLoading ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Generating…
              </>
            ) : (
              <>
                Generate Draft
                <ChevronRight size={14} />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

function PreviewPanel({ doc, content, onCopy, onDownload, copied }) {
  if (!doc || !content) return null

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-6 py-4 border-b bg-white">
        <div>
          <h2 className="font-semibold text-gray-900">{doc.title} — Draft</h2>
          <p className="text-xs text-gray-400 mt-0.5">AI-generated · Review with a legal professional before filing</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onCopy}
            className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            {copied ? <CheckCircle2 size={14} className="text-green-500" /> : <Copy size={14} />}
            {copied ? 'Copied' : 'Copy'}
          </button>
          <button
            onClick={onDownload}
            className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg bg-gray-900 text-white hover:bg-gray-800 transition-colors"
          >
            <Download size={14} />
            Download .txt
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
        <pre className="whitespace-pre-wrap font-mono text-xs text-gray-800 leading-relaxed bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          {content}
        </pre>
      </div>
    </div>
  )
}

export default function DocumentGenerationPage({ company, companyId }) {
  const [activeDocId, setActiveDocId] = useState(null)
  const [loadingDocId, setLoadingDocId] = useState(null)
  const [drafts, setDrafts] = useState({})
  const [error, setError] = useState(null)
  const [copied, setCopied] = useState(false)

  const activeDoc = DOC_TYPES.find(d => d.id === activeDocId)
  const activeContent = drafts[activeDocId] || null

  async function handleGenerate(docId) {
    setLoadingDocId(docId)
    setActiveDocId(docId)
    setError(null)
    try {
      const result = await generateDocument(companyId, docId)
      setDrafts(prev => ({ ...prev, [docId]: result.content }))
    } catch (err) {
      setError(`Generation failed: ${err.message || 'Please try again.'}`)
      setActiveDocId(null)
    } finally {
      setLoadingDocId(null)
    }
  }

  function handleCopy() {
    if (!activeContent) return
    navigator.clipboard.writeText(activeContent).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  function handleDownload() {
    if (!activeContent || !activeDoc) return
    const companySlug = (company?.name || 'company').toLowerCase().replace(/\s+/g, '_')
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '')
    const filename = `${companySlug}_${activeDoc.id}_draft_${today}.txt`
    const blob = new Blob([activeContent], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  const hasPreview = activeDocId && activeContent

  return (
    <div className="flex h-full bg-gray-50">
      {/* Left — doc type cards */}
      <div className="w-80 shrink-0 border-r bg-white flex flex-col">
        <div className="px-5 py-4 border-b">
          <h1 className="font-semibold text-gray-900">Legal Drafts</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            {company?.name ? `Drafting for ${company.name}` : 'Select a company first'}
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {DOC_TYPES.map(doc => (
            <DocCard
              key={doc.id}
              doc={doc}
              company={company}
              isActive={activeDocId === doc.id}
              isLoading={loadingDocId === doc.id}
              onGenerate={handleGenerate}
            />
          ))}
        </div>

        <div className="px-5 py-3 border-t bg-gray-50">
          <p className="text-xs text-gray-400 leading-relaxed">
            Drafts are AI-generated using your company data. Always review with a qualified legal professional before filing.
          </p>
        </div>
      </div>

      {/* Right — preview */}
      <div className="flex-1 flex flex-col min-w-0">
        {error && (
          <div className="mx-6 mt-4 flex items-center gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
            <AlertTriangle size={16} />
            {error}
          </div>
        )}

        {loadingDocId && !activeContent && (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 text-gray-400">
            <Loader2 size={32} className="animate-spin text-blue-400" />
            <p className="text-sm font-medium text-gray-500">Generating {DOC_TYPES.find(d => d.id === loadingDocId)?.title}…</p>
            <p className="text-xs text-gray-400">This usually takes 10–20 seconds</p>
          </div>
        )}

        {hasPreview && (
          <PreviewPanel
            doc={activeDoc}
            content={activeContent}
            onCopy={handleCopy}
            onDownload={handleDownload}
            copied={copied}
          />
        )}

        {!loadingDocId && !hasPreview && (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 text-gray-400">
            <FileText size={40} className="text-gray-200" />
            <p className="text-sm font-medium">Select a document type and click Generate Draft</p>
            <p className="text-xs text-gray-400">MOA, AOA, and SPICe+ summary will appear here</p>
          </div>
        )}
      </div>
    </div>
  )
}
