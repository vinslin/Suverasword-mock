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
} from 'lucide-react'
import { quickChips } from '../data/mockData'
import { getChatHistory, postChatMessage } from '../lib/api'

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

export default function ChatAssistant({ onCompanyUpdated, onRegistrationsUpdated }) {
  const [messages, setMessages] = useState([])
  const [nameDecision, setNameDecision] = useState(null)
  const [input, setInput] = useState('')
  const [typing, setTyping] = useState(false)
  const scrollRef = useRef(null)
  const fileInputRef = useRef(null)

  useEffect(() => {
    getChatHistory()
      .then((res) => setMessages(res.messages))
      .catch(() => {})
  }, [])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, typing])

  function pushMessage(msg) {
    setMessages((prev) => [...prev, { id: `m-${Date.now()}-${Math.random()}`, time: nowTime(), ...msg }])
  }

  async function sendToBackend(text) {
    setTyping(true)
    try {
      const res = await postChatMessage(text)
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

  function handleSend(text) {
    const value = (text ?? input).trim()
    if (!value) return
    pushMessage({ sender: 'user', type: 'text', text: value })
    setInput('')
    sendToBackend(value)
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
    pushMessage({ sender: 'user', type: 'text', text: `Attached file: ${file.name}` })
    setTyping(true)
    setTimeout(() => {
      setTyping(false)
      pushMessage({
        sender: 'bot',
        type: 'text',
        text: `Thanks, I've received "${file.name}". I'll review it and let you know if anything else is needed.`,
      })
    }, 700)
    e.target.value = ''
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
                  <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-sm px-4 py-2.5 text-[13.5px] text-gray-700 max-w-[520px] whitespace-pre-line">
                    {m.text}
                  </div>
                )}
                {m.type === 'websearch' && <WebSearchCard message={m} />}
                {m.type === 'nameResults' && (
                  <NameResultsCard message={m} onReserve={handleReserve} onSuggestSimilar={handleSuggestSimilar} />
                )}
                {m.type === 'confirm' && (
                  <div>
                    <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-sm px-4 py-2.5 text-[13.5px] text-gray-700 max-w-[520px] mb-2.5">
                      {m.text}
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

        <div className="flex items-center gap-2 border border-gray-200 rounded-xl px-3 py-2 focus-within:border-indigo-400">
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
            placeholder="Ask anything about registration, compliance, fees, documents..."
            className="flex-1 text-[13.5px] outline-none placeholder:text-gray-400"
          />
          <button
            onClick={() => handleSend()}
            className="w-9 h-9 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center shrink-0"
          >
            <Send size={15} />
          </button>
        </div>
      </div>
    </div>
  )
}
