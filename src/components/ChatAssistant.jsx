import { useState, useRef, useEffect } from 'react'
import {
  Bot,
  CheckCircle2,
  ExternalLink,
  Paperclip,
  Send,
  CircleCheck,
  CircleX,
  Landmark,
  X,
  FileUp,
} from 'lucide-react'
import { quickChips } from '../data/mockData'
import { getChatHistory, postChatMessage, uploadDocument } from '../lib/api'

function renderInline(text) {
  const parts = text.split(/(\*\*[^*]+\*\*)/)
  return parts.map((p, i) =>
    /^\*\*[^*]+\*\*$/.test(p)
      ? <strong key={i} className="font-semibold text-gray-900">{p.slice(2, -2)}</strong>
      : p
  )
}

function ChatMarkdown({ text }) {
  const lines = text.split('\n')
  const result = []
  let tableLines = []
  let i = 0

  function flushTable() {
    if (tableLines.length < 2) { tableLines = []; return }
    const parse = (row) => row.split('|').map(c => c.trim()).filter(Boolean)
    const headers = parse(tableLines[0])
    const rows = tableLines.slice(2).map(parse)
    result.push(
      <div key={`t-${result.length}`} className="overflow-x-auto rounded-xl border border-gray-200 my-2 w-full">
        <table className="w-full text-[12.5px]">
          <thead>
            <tr className="bg-indigo-50 border-b border-indigo-100">
              {headers.map((h, j) => (
                <th key={j} className="px-3 py-2 text-left font-semibold text-indigo-800 whitespace-nowrap">{renderInline(h)}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, ri) => {
              const isTotal = row[0]?.toLowerCase().includes('total')
              return (
                <tr key={ri} className={`border-b border-gray-100 last:border-0 ${isTotal ? 'bg-indigo-50 font-semibold' : 'hover:bg-gray-50'}`}>
                  {row.map((cell, ci) => (
                    <td key={ci} className={`px-3 py-2 ${isTotal ? 'text-indigo-800' : 'text-gray-700'} ${ci > 0 ? 'whitespace-nowrap' : ''}`}>
                      {renderInline(cell)}
                    </td>
                  ))}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    )
    tableLines = []
  }

  while (i < lines.length) {
    const line = lines[i]
    if (line.trim().startsWith('|')) {
      tableLines.push(line)
    } else {
      if (tableLines.length) flushTable()
      if (!line.trim()) { result.push(<div key={i} className="h-1" />); i++; continue }
      if (/^###\s/.test(line)) { result.push(<div key={i} className="font-semibold text-gray-900 text-[13px] mt-2">{renderInline(line.replace(/^###\s/, ''))}</div>); i++; continue }
      if (/^##\s/.test(line)) { result.push(<div key={i} className="font-bold text-gray-900 text-[14px] mt-3">{renderInline(line.replace(/^##\s/, ''))}</div>); i++; continue }
      if (/^[\-\*]\s/.test(line.trim())) {
        result.push(<div key={i} className="flex gap-2 pl-1"><span className="text-indigo-400 shrink-0">•</span><span>{renderInline(line.trim().replace(/^[\-\*]\s/, ''))}</span></div>)
        i++; continue
      }
      if (/^\d+\.\s/.test(line.trim())) {
        const m = line.trim().match(/^(\d+)\.\s(.*)/)
        result.push(<div key={i} className="flex gap-2 pl-1"><span className="text-indigo-500 font-semibold shrink-0 min-w-[16px]">{m[1]}.</span><span>{renderInline(m[2])}</span></div>)
        i++; continue
      }
      result.push(<p key={i}>{renderInline(line)}</p>)
    }
    i++
  }
  if (tableLines.length) flushTable()
  return <div className="space-y-1 text-[13px] text-gray-700">{result}</div>
}

function inferDocMeta(text) {
  const t = text.toLowerCase()
  let docType
  if (t.includes('pan')) docType = 'pan_card'
  else if (t.includes('aadhaar') || t.includes('aadhar')) docType = 'aadhaar'
  else if (t.includes('address')) docType = 'address_proof'
  else if (t.includes('photo')) docType = 'photograph'
  else if (t.includes('noc') || t.includes('rent')) docType = 'noc'
  else if (t.includes('moa') || t.includes('memorandum')) docType = 'moa'
  else if (t.includes('aoa') || t.includes('articles')) docType = 'aoa'

  const linkedTo = t.includes('director') ? 'director' : 'company'
  return { docType, linkedTo }
}

function nowTime() {
  return new Date().toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })
}

function BotAvatar() {
  return (
    <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
      <Bot size={16} />
    </div>
  )
}

function WebSearchCard({ message }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 max-w-[520px]">
      <div className="flex items-center gap-2 text-emerald-600 font-medium text-[13px] mb-1.5">
        <CheckCircle2 size={16} />
        {message.label}
      </div>
      <div className="text-[13px] text-gray-600 mb-3">{message.text}</div>
      <div className="flex flex-wrap gap-2">
        {(message.sources ?? []).map((s) => (
          <div
            key={s.name}
            className="flex items-center gap-2 border border-gray-200 rounded-lg px-2.5 py-1.5 text-[12px]"
          >
            <span className="w-6 h-6 rounded-md bg-gray-100 flex items-center justify-center text-gray-500 shrink-0">
              <Landmark size={12} />
            </span>
            <div>
              <div className="font-medium text-gray-800 leading-tight">{s.name}</div>
              <div className="text-gray-400 leading-tight truncate max-w-[220px]">{s.tag}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function NameResultsCard({ message, onReserve, onSuggestSimilar }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 max-w-[560px]">
      <div className="text-indigo-700 font-semibold text-[13px] mb-3">{message.label}</div>
      <table className="w-full text-[13px]">
        <thead>
          <tr className="text-gray-400 text-left">
            <th className="font-medium pb-2 pr-2">Proposed Name</th>
            <th className="font-medium pb-2 pr-2">Availability</th>
            <th className="font-medium pb-2">Action</th>
          </tr>
        </thead>
        <tbody>
          {message.results.map((r, idx) => (
            <tr key={r.name} className="border-t border-gray-100">
              <td className="py-2.5 pr-2 text-gray-800">
                {idx + 1}. {r.name}
              </td>
              <td className="py-2.5 pr-2">
                {r.available ? (
                  <span className="inline-flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full text-[12px] font-medium">
                    <CircleCheck size={12} /> Available
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-red-500 bg-red-50 px-2 py-0.5 rounded-full text-[12px] font-medium">
                    <CircleX size={12} /> Not Available
                  </span>
                )}
              </td>
              <td className="py-2.5">
                {r.available ? (
                  <button
                    onClick={() => onReserve(r.name)}
                    className="text-indigo-600 font-medium hover:text-indigo-700 inline-flex items-center gap-1"
                  >
                    Reserve Name <ExternalLink size={12} />
                  </button>
                ) : (
                  <button
                    onClick={() => onSuggestSimilar(r.name)}
                    className="text-indigo-600 font-medium hover:text-indigo-700"
                  >
                    Suggest Similar Names
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function TypingBubble() {
  return (
    <div className="flex items-start gap-2.5">
      <BotAvatar />
      <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-sm px-4 py-3 flex gap-1">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-gray-300 animate-bounce"
            style={{ animationDelay: `${i * 0.12}s` }}
          />
        ))}
      </div>
    </div>
  )
}

export default function ChatAssistant({ companyId, onCompanyUpdated, onRegistrationsUpdated, onDocumentUploaded }) {
  const [messages, setMessages] = useState([])
  const [nameDecision, setNameDecision] = useState(null)
  const [input, setInput] = useState('')
  const [typing, setTyping] = useState(false)
  const [pendingFile, setPendingFile] = useState(null)
  const scrollRef = useRef(null)
  const fileInputRef = useRef(null)

  useEffect(() => {
    if (!companyId) return
    getChatHistory(companyId)
      .then((res) => setMessages(res.messages))
      .catch(() => {})
  }, [companyId])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, typing])

  function pushMessage(msg) {
    setMessages((prev) => [...prev, { id: `m-${Date.now()}-${Math.random()}`, time: nowTime(), ...msg }])
  }

  async function sendToBackend(text) {
    setTyping(true)
    try {
      const res = await postChatMessage(companyId, text)
      setMessages((prev) => [...prev, ...res.messages])
      onCompanyUpdated?.(res.company)
      onRegistrationsUpdated?.(res.registrations)
    } catch (err) {
      pushMessage({
        sender: 'bot',
        type: 'text',
        text: `Sorry, I couldn't reach the assistant (${err.message || 'network error'}).`,
      })
    } finally {
      setTyping(false)
    }
  }

  async function handleSend(text) {
    const value = (text ?? input).trim()
    if (!value && !pendingFile) return

    const file = pendingFile
    const displayText = value || `Upload: ${file?.name}`
    pushMessage({ sender: 'user', type: 'text', text: displayText })
    setInput('')
    setPendingFile(null)
    if (fileInputRef.current) fileInputRef.current.value = ''

    if (file) {
      const { docType, linkedTo } = inferDocMeta(displayText)
      try {
        const doc = await uploadDocument(companyId, file, { docType, linkedTo })
        onDocumentUploaded?.(doc)
        pushMessage({
          sender: 'bot',
          type: 'text',
          text: `✅ "${file.name}" uploaded successfully${docType ? ` as ${docType.replace('_', ' ')}` : ''} (linked to ${linkedTo}).`,
        })
      } catch (err) {
        pushMessage({
          sender: 'bot',
          type: 'text',
          text: `Sorry, I couldn't upload "${file.name}" — ${err.message || 'upload failed'}.`,
        })
      }
    }

    if (value) {
      sendToBackend(value)
    }
  }

  function handleReserve(name) {
    const text = `Reserve "${name}"`
    pushMessage({ sender: 'user', type: 'text', text })
    sendToBackend(text)
  }

  function handleSuggestSimilar(name) {
    const text = `Suggest names similar to "${name}"`
    pushMessage({ sender: 'user', type: 'text', text })
    sendToBackend(text)
  }

  function handleProceed() {
    if (nameDecision === 'proceed') return
    setNameDecision('proceed')
    const text = 'Yes, proceed with this name.'
    pushMessage({ sender: 'user', type: 'text', text })
    sendToBackend(text)
  }

  function handleSuggestMore() {
    if (nameDecision) return
    setNameDecision('suggest')
    const text = 'Please suggest more names.'
    pushMessage({ sender: 'user', type: 'text', text })
    sendToBackend(text)
  }

  function handleFileChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setPendingFile(file)
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
        {messages.map((m) => {
          if (m.sender === 'user') {
            return (
              <div key={m.id} className="flex justify-end">
                <div className="max-w-[520px]">
                  <div className="bg-indigo-600 text-white rounded-2xl rounded-tr-sm px-4 py-2.5 text-[13.5px] whitespace-pre-line">
                    {m.text}
                  </div>
                  <div className="text-[11px] text-gray-400 text-right mt-1 flex items-center justify-end gap-1">
                    {m.time} <CheckCircle2 size={12} className="text-indigo-400" />
                  </div>
                </div>
              </div>
            )
          }

          return (
            <div key={m.id} className="flex items-start gap-2.5">
              <BotAvatar />
              <div className="min-w-0">
                {m.type === 'text' && (
                  <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-sm px-4 py-2.5 max-w-[560px]">
                    <ChatMarkdown text={m.text} />
                  </div>
                )}
                {m.type === 'websearch' && <WebSearchCard message={m} />}
                {m.type === 'nameResults' && (
                  <NameResultsCard message={m} onReserve={handleReserve} onSuggestSimilar={handleSuggestSimilar} />
                )}
                {m.type === 'confirm' && (
                  <div>
                    <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-sm px-4 py-2.5 max-w-[560px] mb-2.5">
                      <ChatMarkdown text={m.text} />
                    </div>
                    <div className="flex gap-2.5">
                      <button
                        onClick={handleProceed}
                        disabled={!!nameDecision}
                        className={`rounded-lg px-4 py-2 text-[13px] font-medium transition-colors ${
                          nameDecision === 'proceed'
                            ? 'bg-emerald-100 text-emerald-700'
                            : nameDecision
                            ? 'bg-gray-100 text-gray-400'
                            : 'bg-indigo-600 text-white hover:bg-indigo-700'
                        }`}
                      >
                        {nameDecision === 'proceed' ? '✓ Proceeding' : 'Yes, Proceed'}
                      </button>
                      <button
                        onClick={handleSuggestMore}
                        disabled={!!nameDecision}
                        className={`rounded-lg px-4 py-2 text-[13px] font-medium border transition-colors ${
                          nameDecision === 'suggest'
                            ? 'bg-gray-100 text-gray-500 border-gray-200'
                            : nameDecision
                            ? 'bg-white text-gray-300 border-gray-100'
                            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        Suggest More Names
                      </button>
                    </div>
                  </div>
                )}
                <div className="text-[11px] text-gray-400 mt-1">{m.time}</div>
              </div>
            </div>
          )
        })}
        {typing && <TypingBubble />}
      </div>

      <div className="px-6 pb-3">
        <div className="flex items-center gap-2 flex-wrap mb-3">
          {quickChips.map((chip) => (
            <button
              key={chip}
              onClick={() => handleSend(chip)}
              className="text-[12.5px] text-gray-600 border border-gray-200 rounded-full px-3 py-1.5 hover:bg-gray-50 hover:border-gray-300"
            >
              {chip}
            </button>
          ))}
        </div>

        <div className={`border rounded-xl px-3 py-2 focus-within:border-indigo-400 ${pendingFile ? 'border-indigo-300 bg-indigo-50/30' : 'border-gray-200'}`}>
          {pendingFile && (
            <div className="flex items-center gap-2 mb-2 pb-2 border-b border-indigo-100">
              <FileUp size={13} className="text-indigo-500 shrink-0" />
              <span className="text-[12px] text-indigo-700 font-medium truncate flex-1">{pendingFile.name}</span>
              <button
                onClick={() => { setPendingFile(null); if (fileInputRef.current) fileInputRef.current.value = '' }}
                className="text-indigo-400 hover:text-indigo-600 shrink-0"
              >
                <X size={13} />
              </button>
            </div>
          )}
          <div className="flex items-center gap-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="text-gray-400 hover:text-gray-600 shrink-0"
              title="Attach a file"
            >
              <Paperclip size={18} />
            </button>
            <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileChange} />
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSend()
              }}
              placeholder={pendingFile ? 'Describe this document (e.g. company PAN card)…' : 'Ask anything about registration, compliance, fees, documents...'}
              className="flex-1 text-[13.5px] outline-none placeholder:text-gray-400 bg-transparent"
            />
            <button
              onClick={() => handleSend()}
              disabled={!input.trim() && !pendingFile}
              className="w-9 h-9 rounded-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white flex items-center justify-center shrink-0"
            >
              <Send size={15} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
