import { useState } from 'react'
import { Calculator, ChevronDown, Download, Info, IndianRupee, Building2, MapPin, TrendingUp, Sparkles, Loader, ExternalLink, AlertCircle } from 'lucide-react'
import { postChatMessage } from '../lib/api'

// ─── Fee tables ────────────────────────────────────────────────────────────────

const COMPANY_TYPES = [
  { value: 'pvt', label: 'Private Limited Company' },
  { value: 'llp', label: 'Limited Liability Partnership (LLP)' },
  { value: 'opc', label: 'One Person Company (OPC)' },
  { value: 'public', label: 'Public Limited Company' },
  { value: 'section8', label: 'Section 8 (Non-Profit)' },
]

const INDIAN_STATES = [
  'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa','Gujarat',
  'Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh',
  'Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Punjab','Rajasthan',
  'Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh','Uttarakhand','West Bengal',
  'Delhi','Chandigarh','Puducherry',
]

// Stamp duty tier by state group (approx)
const STATE_STAMP_GROUP = {
  'Rajasthan': 'high', 'Punjab': 'high', 'Uttar Pradesh': 'high', 'Madhya Pradesh': 'high',
  'Maharashtra': 'medium', 'Gujarat': 'medium', 'Tamil Nadu': 'medium', 'West Bengal': 'medium',
  'Karnataka': 'low', 'Delhi': 'low', 'Telangana': 'low', 'Kerala': 'low',
}
function stampGroup(state) { return STATE_STAMP_GROUP[state] ?? 'medium' }

// ROC filing fee based on authorized capital (₹)
function rocFee(capital, type) {
  if (type === 'llp') {
    if (capital <= 100000) return 500
    if (capital <= 500000) return 2000
    if (capital <= 1000000) return 4000
    return 5000
  }
  if (type === 'section8') return 2000
  if (capital <= 100000) return 5000
  if (capital <= 500000) return 9000
  if (capital <= 1000000) return 13000
  if (capital <= 2500000) return 15000
  if (capital <= 10000000) return 25000
  return 40000
}

// Stamp duty on MoA + AoA based on capital & state group
function stampDuty(capital, state, type) {
  if (type === 'llp') return 0
  const g = stampGroup(state)
  const base = capital <= 100000 ? (g === 'high' ? 2500 : g === 'medium' ? 2000 : 1500)
             : capital <= 500000 ? (g === 'high' ? 5000 : g === 'medium' ? 4000 : 3000)
             : capital <= 1000000 ? (g === 'high' ? 8000 : g === 'medium' ? 6000 : 5000)
             : capital <= 5000000 ? (g === 'high' ? 15000 : g === 'medium' ? 12000 : 10000)
             : (g === 'high' ? 25000 : g === 'medium' ? 20000 : 16000)
  return base
}

// Professional fee estimate ranges
function professionalFee(type, capital) {
  const base = {
    pvt: [15000, 25000],
    llp: [10000, 18000],
    opc: [10000, 18000],
    public: [30000, 60000],
    section8: [20000, 35000],
  }[type] ?? [15000, 25000]
  if (capital > 5000000) return [base[0] + 10000, base[1] + 20000]
  return base
}

// Post-incorporation registrations
function postIncRegs(type) {
  const regs = [
    { name: 'GST Registration', govt: 0, professional: 2000, note: 'Mandatory if turnover > ₹40L' },
    { name: 'PAN Application', govt: 0, professional: 500, note: 'Included in SPICe+' },
    { name: 'TAN Application', govt: 65, professional: 500, note: 'For TDS deductions' },
    { name: 'Professional Tax Registration', govt: 2500, professional: 1000, note: 'State-specific' },
    { name: 'EPFO Registration', govt: 0, professional: 1500, note: 'Mandatory if ≥ 20 employees' },
    { name: 'ESIC Registration', govt: 0, professional: 1500, note: 'Mandatory if ≥ 10 employees' },
    { name: 'Shop & Establishment', govt: 2000, professional: 1000, note: 'State-specific' },
    { name: 'Import Export Code (IEC)', govt: 500, professional: 1500, note: 'If doing import/export' },
  ]
  if (type === 'section8') {
    regs.push({ name: '80G / 12A Registration', govt: 0, professional: 8000, note: 'Tax exemption for donors' })
  }
  return regs
}

// Annual compliance costs
function annualCompliance(type, capital) {
  return [
    { name: 'Annual Return (MGT-7)', govt: capital <= 100000 ? 1200 : capital <= 500000 ? 1600 : 2000, professional: 5000 },
    { name: 'Financial Statements (AOC-4)', govt: capital <= 100000 ? 1200 : capital <= 500000 ? 1600 : 2000, professional: 0 },
    { name: 'Income Tax Return Filing', govt: 0, professional: 8000 },
    { name: 'GST Return Filing (Monthly)', govt: 0, professional: 2000, note: 'Per month' },
    { name: 'Statutory Audit', govt: 0, professional: type === 'public' ? 30000 : 15000 },
    { name: 'Director KYC (DIR-3)', govt: 500, professional: 1000, note: 'Per director annually' },
  ]
}

function fmt(n) {
  return '₹' + n.toLocaleString('en-IN')
}

function fmtRange(min, max) {
  return `${fmt(min)} – ${fmt(max)}`
}

// ─── Sub-components ─────────────────────────────────────────────────────────

function SectionCard({ title, icon: Icon, color, children }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
      <div className={`flex items-center gap-2.5 px-5 py-3.5 border-b border-gray-100 ${color}`}>
        <Icon size={16} />
        <span className="text-[13px] font-semibold">{title}</span>
      </div>
      {children}
    </div>
  )
}

function FeeRow({ name, govt, professional, note, highlight }) {
  return (
    <div className={`grid grid-cols-[2fr_1fr_1fr] gap-4 items-start px-5 py-3 text-[13px] ${highlight ? 'bg-indigo-50/40' : 'hover:bg-gray-50/60'} transition-colors`}>
      <div>
        <div className="font-medium text-gray-800">{name}</div>
        {note && <div className="text-[11px] text-gray-400 mt-0.5">{note}</div>}
      </div>
      <div className="text-gray-600">{govt != null ? fmt(govt) : '—'}</div>
      <div className="text-gray-600">{professional != null ? fmt(professional) : '—'}</div>
    </div>
  )
}

function TableHeader() {
  return (
    <div className="grid grid-cols-[2fr_1fr_1fr] gap-4 px-5 py-2.5 border-b border-gray-100 text-[11px] font-semibold text-gray-400 uppercase tracking-wide">
      <span>Item</span>
      <span>Govt Fee</span>
      <span>Professional Fee</span>
    </div>
  )
}

// ─── Main page ───────────────────────────────────────────────────────────────

export default function CostEstimatorPage() {
  const [type, setType] = useState('pvt')
  const [state, setState] = useState('Karnataka')
  const [capital, setCapital] = useState(100000)
  const [capitalInput, setCapitalInput] = useState('1,00,000')
  const [includePostInc, setIncludePostInc] = useState(true)
  const [includeAnnual, setIncludeAnnual] = useState(false)
  const [aiResult, setAiResult] = useState(null)
  const [aiSources, setAiSources] = useState([])
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState(null)

  async function handleAiEstimate() {
    const typLabel = COMPANY_TYPES.find((c) => c.value === type)?.label ?? type
    const prompt = `Search the web and provide the current official government fee breakdown for registering a ${typLabel} in ${state}, India with an authorized capital of ₹${capital.toLocaleString('en-IN')}. Include: (1) MCA/ROC filing fee, (2) stamp duty on MoA and AoA specific to ${state}, (3) DIN fees, (4) PAN/TAN fees, (5) professional CA/CS charges estimate, (6) any state-specific fees. Give exact rupee amounts where available.`
    setAiLoading(true)
    setAiError(null)
    setAiResult(null)
    setAiSources([])
    try {
      const res = await postChatMessage(prompt)
      // response is { messages: [...], company, registrations }
      // pick the last bot message that has text
      const botMsgs = (res.messages ?? []).filter((m) => m.sender === 'bot' && m.text)
      const last = botMsgs[botMsgs.length - 1]
      setAiResult(last?.text ?? 'No response received.')
      setAiSources(last?.sources ?? [])
    } catch (err) {
      setAiError(err.message || 'AI estimate failed')
    } finally {
      setAiLoading(false)
    }
  }

  function handleCapitalChange(raw) {
    const digits = raw.replace(/[^0-9]/g, '')
    const num = parseInt(digits || '0', 10)
    setCapital(num)
    setCapitalInput(num.toLocaleString('en-IN'))
  }

  const roc = rocFee(capital, type)
  const stamp = stampDuty(capital, state, type)
  const [profMin, profMax] = professionalFee(type, capital)
  const postRegs = postIncRegs(type)
  const annual = annualCompliance(type, capital)

  const govtTotal = roc + stamp + (includePostInc ? postRegs.reduce((s, r) => s + r.govt, 0) : 0)
                  + (includeAnnual ? annual.reduce((s, r) => s + r.govt, 0) : 0)
  const profTotal = (includePostInc ? postRegs.reduce((s, r) => s + r.professional, 0) : 0)
                  + (includeAnnual ? annual.reduce((s, r) => s + r.professional, 0) : 0)
  const grandMin = govtTotal + profMin + profTotal
  const grandMax = govtTotal + profMax + profTotal

  function handleDownload() {
    const typLabel = COMPANY_TYPES.find((c) => c.value === type)?.label ?? type
    const lines = [
      'COST ESTIMATE — COMPANY REGISTRATION',
      '─'.repeat(48),
      `Company Type : ${typLabel}`,
      `State        : ${state}`,
      `Auth Capital : ${fmt(capital)}`,
      '',
      'GOVERNMENT REGISTRATION FEES',
      `  ROC / MCA Filing Fee   : ${fmt(roc)}`,
      `  Stamp Duty (MoA + AoA) : ${fmt(stamp)}`,
      '',
      'PROFESSIONAL FEES (Incorporation)',
      `  CA / CS Charges        : ${fmtRange(profMin, profMax)}`,
      '',
      ...(includePostInc ? [
        'POST-INCORPORATION REGISTRATIONS',
        ...postRegs.map((r) => `  ${r.name.padEnd(32)}: Govt ${fmt(r.govt)} + Prof ${fmt(r.professional)}`),
        '',
      ] : []),
      ...(includeAnnual ? [
        'ANNUAL COMPLIANCE (1st Year)',
        ...annual.map((r) => `  ${r.name.padEnd(32)}: Govt ${fmt(r.govt)} + Prof ${fmt(r.professional)}`),
        '',
      ] : []),
      '─'.repeat(48),
      `ESTIMATED TOTAL : ${fmtRange(grandMin, grandMax)}`,
      '',
      'Note: Stamp duty varies by state. Professional fees are estimates.',
      `Generated: ${new Date().toLocaleString('en-IN')}`,
    ]
    const blob = new Blob([lines.join('\n')], { type: 'text/plain' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `Cost_Estimate_${typLabel.replace(/\s+/g, '_')}.txt`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  return (
    <div className="flex-1 overflow-y-auto bg-[#f3f4f8] p-6">
      <div className="max-w-5xl mx-auto space-y-5">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[18px] font-semibold text-gray-900">Cost Estimator</h1>
            <p className="text-[13px] text-gray-400 mt-0.5">Estimate government fees and professional charges for your registration</p>
          </div>
          <button
            onClick={handleDownload}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-[13px] font-medium px-4 py-2.5 rounded-xl transition-colors"
          >
            <Download size={15} /> Download Estimate
          </button>
        </div>

        <div className="grid grid-cols-[340px_1fr] gap-5 items-start">

          {/* ── Left: Input form ── */}
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4">
              <div className="text-[13px] font-semibold text-gray-700 flex items-center gap-2">
                <Calculator size={15} className="text-indigo-500" /> Configuration
              </div>

              {/* Company Type */}
              <label className="block">
                <div className="flex items-center gap-1.5 text-[12px] text-gray-500 mb-1.5 font-medium">
                  <Building2 size={12} /> Company Type
                </div>
                <div className="relative">
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full appearance-none border border-gray-200 rounded-xl px-3.5 py-2.5 pr-9 text-[13px] text-gray-800 outline-none focus:border-indigo-400 bg-white cursor-pointer"
                  >
                    {COMPANY_TYPES.map((c) => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
              </label>

              {/* State */}
              <label className="block">
                <div className="flex items-center gap-1.5 text-[12px] text-gray-500 mb-1.5 font-medium">
                  <MapPin size={12} /> State of Incorporation
                </div>
                <div className="relative">
                  <select
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="w-full appearance-none border border-gray-200 rounded-xl px-3.5 py-2.5 pr-9 text-[13px] text-gray-800 outline-none focus:border-indigo-400 bg-white cursor-pointer"
                  >
                    {INDIAN_STATES.map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
              </label>

              {/* Authorized Capital */}
              <label className="block">
                <div className="flex items-center gap-1.5 text-[12px] text-gray-500 mb-1.5 font-medium">
                  <IndianRupee size={12} /> Authorized Capital
                </div>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-[13px] font-medium">₹</span>
                  <input
                    value={capitalInput}
                    onChange={(e) => handleCapitalChange(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl pl-7 pr-3.5 py-2.5 text-[13px] text-gray-800 outline-none focus:border-indigo-400"
                  />
                </div>
                <div className="flex gap-2 mt-2 flex-wrap">
                  {[100000, 500000, 1000000, 5000000].map((v) => (
                    <button
                      key={v}
                      onClick={() => { setCapital(v); setCapitalInput(v.toLocaleString('en-IN')) }}
                      className={`text-[11px] px-2.5 py-1 rounded-lg border transition-colors ${capital === v ? 'bg-indigo-600 text-white border-indigo-600' : 'border-gray-200 text-gray-500 hover:border-indigo-300'}`}
                    >
                      {v >= 100000 ? `₹${v / 100000}L` : `₹${v}`}
                    </button>
                  ))}
                </div>
              </label>

              {/* Toggles */}
              <div className="border-t border-gray-100 pt-4 space-y-3">
                <div className="text-[12px] font-medium text-gray-500">Include in estimate</div>
                <Toggle label="Post-incorporation registrations" checked={includePostInc} onChange={setIncludePostInc} />
                <Toggle label="Annual compliance costs (Year 1)" checked={includeAnnual} onChange={setIncludeAnnual} />
              </div>
            </div>

            {/* Info note */}
            <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-[12px] text-amber-700">
              <Info size={14} className="shrink-0 mt-0.5" />
              <span>Fees are indicative. Stamp duty varies by state. Professional charges depend on the service provider.</span>
            </div>
          </div>

          {/* ── Right: Cost breakdown ── */}
          <div className="space-y-4">

            {/* Summary banner */}
            <div className="bg-gradient-to-r from-indigo-600 to-indigo-500 rounded-2xl px-6 py-5 text-white">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[12px] font-medium opacity-80">Total Estimated Cost</span>
                    <span className="text-[10px] font-semibold bg-white/20 px-2 py-0.5 rounded-full tracking-wide">APPROXIMATE</span>
                  </div>
                  <div className="text-[26px] font-bold leading-tight">{fmtRange(grandMin, grandMax)}</div>
                  <div className="text-[11.5px] opacity-70 mt-1">
                    Govt fees: {fmt(govtTotal)} &nbsp;·&nbsp; Professional: {fmtRange(profMin + profTotal, profMax + profTotal)}
                  </div>
                </div>
                <TrendingUp size={36} className="opacity-20 shrink-0 mt-1" />
              </div>

              {/* AI Estimator button */}
              <div className="mt-4 pt-4 border-t border-white/20">
                <div className="flex items-center justify-between">
                  <div className="text-[11.5px] opacity-70">Want live prices from the web?</div>
                  <button
                    onClick={handleAiEstimate}
                    disabled={aiLoading}
                    className="flex items-center gap-2 bg-white text-indigo-700 font-semibold text-[12.5px] px-4 py-2 rounded-xl hover:bg-indigo-50 disabled:opacity-60 transition-colors"
                  >
                    {aiLoading
                      ? <><Loader size={13} className="animate-spin" /> Searching…</>
                      : <><Sparkles size={13} /> AI Estimator</>
                    }
                  </button>
                </div>
              </div>
            </div>

            {/* AI Result panel */}
            {(aiLoading || aiResult || aiError) && (
              <div className="bg-white rounded-2xl border border-indigo-200 overflow-hidden">
                <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-indigo-100 bg-indigo-50">
                  <Sparkles size={15} className="text-indigo-600" />
                  <span className="text-[13px] font-semibold text-indigo-800">AI Estimate — Live Web Search</span>
                  {aiResult && (
                    <span className="ml-auto text-[10.5px] text-indigo-400 font-medium bg-indigo-100 px-2 py-0.5 rounded-full">Live data</span>
                  )}
                </div>

                {aiLoading && (
                  <div className="flex flex-col items-center justify-center py-12 gap-3 text-gray-400">
                    <Loader size={22} className="animate-spin text-indigo-400" />
                    <div className="text-[13px]">Searching MCA portal and official sources…</div>
                  </div>
                )}

                {aiError && (
                  <div className="flex items-start gap-3 px-5 py-4 text-[13px] text-red-600">
                    <AlertCircle size={16} className="shrink-0 mt-0.5" />
                    <span>{aiError}</span>
                  </div>
                )}

                {aiResult && (
                  <div className="px-5 py-4 space-y-4">
                    <div className="text-[13.5px] text-gray-700 leading-relaxed">
                      <MarkdownText text={aiResult} />
                    </div>

                    {aiSources.length > 0 && (
                      <div className="border-t border-gray-100 pt-3">
                        <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-2">Sources</div>
                        <div className="space-y-1.5">
                          {aiSources.map((src, i) => (
                            <a
                              key={i}
                              href={src.url}
                              target="_blank"
                              rel="noreferrer"
                              className="flex items-center gap-2 text-[12px] text-indigo-600 hover:text-indigo-800 hover:underline"
                            >
                              <ExternalLink size={11} /> {src.title || src.url}
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-[12px] text-amber-700">
                      <Info size={13} className="shrink-0 mt-0.5" />
                      <span>Compare with the Approximate estimate above. Final fees depend on capital slab, state-specific stamp duty, and chosen CA/CS.</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Govt registration fees */}
            <SectionCard title="Government Registration Fees" icon={Building2} color="text-blue-700 bg-blue-50">
              <TableHeader />
              <FeeRow name="ROC / MCA Filing Fee" govt={roc} professional={0}
                note={type === 'llp' ? 'LLP Form-2 filing' : 'Based on authorized capital'} highlight />
              {type !== 'llp' && (
                <FeeRow name="Stamp Duty on MoA & AoA" govt={stamp} professional={0}
                  note={`${stampGroup(state) === 'high' ? 'Higher' : stampGroup(state) === 'low' ? 'Lower' : 'Medium'} stamp duty state`} />
              )}
              <FeeRow name="DIN for Directors" govt={0} professional={0} note="Included in SPICe+ at no extra charge" />
              <FeeRow name="Name Reservation (RUN)" govt={1000} professional={0} note="Optional — reserve before SPICe+" />
              <FeeRow name="PAN & TAN" govt={0} professional={0} note="Auto-applied via SPICe+" />
              <div className="flex justify-between items-center px-5 py-3 bg-blue-50 border-t border-blue-100 text-[12.5px] font-semibold text-blue-800">
                <span>Subtotal — Govt Registration</span>
                <span>{fmt(roc + stamp + 1000)}</span>
              </div>
            </SectionCard>

            {/* Professional fees */}
            <SectionCard title="Professional Fees — Incorporation" icon={Calculator} color="text-indigo-700 bg-indigo-50">
              <TableHeader />
              <FeeRow name="CA / CS Charges" govt={0} professional={profMin}
                note={`Range: ${fmtRange(profMin, profMax)} depending on service provider`} highlight />
              <FeeRow name="Documentation & Drafting" govt={0} professional={2000} note="MoA, AoA, declarations" />
              <div className="flex justify-between items-center px-5 py-3 bg-indigo-50 border-t border-indigo-100 text-[12.5px] font-semibold text-indigo-800">
                <span>Subtotal — Professional</span>
                <span>{fmtRange(profMin + 2000, profMax + 2000)}</span>
              </div>
            </SectionCard>

            {/* Post-incorporation */}
            {includePostInc && (
              <SectionCard title="Post-Incorporation Registrations" icon={TrendingUp} color="text-emerald-700 bg-emerald-50">
                <TableHeader />
                {postRegs.map((r) => (
                  <FeeRow key={r.name} name={r.name} govt={r.govt} professional={r.professional} note={r.note} />
                ))}
                <div className="flex justify-between items-center px-5 py-3 bg-emerald-50 border-t border-emerald-100 text-[12.5px] font-semibold text-emerald-800">
                  <span>Subtotal — Post-Incorporation</span>
                  <span>{fmt(postRegs.reduce((s, r) => s + r.govt + r.professional, 0))}</span>
                </div>
              </SectionCard>
            )}

            {/* Annual compliance */}
            {includeAnnual && (
              <SectionCard title="Annual Compliance Costs (Year 1)" icon={IndianRupee} color="text-purple-700 bg-purple-50">
                <TableHeader />
                {annual.map((r) => (
                  <FeeRow key={r.name} name={r.name} govt={r.govt} professional={r.professional} note={r.note} />
                ))}
                <div className="flex justify-between items-center px-5 py-3 bg-purple-50 border-t border-purple-100 text-[12.5px] font-semibold text-purple-800">
                  <span>Subtotal — Annual Compliance</span>
                  <span>{fmt(annual.reduce((s, r) => s + r.govt + r.professional, 0))}</span>
                </div>
              </SectionCard>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function MarkdownText({ text }) {
  const lines = text.split('\n')
  return (
    <div className="space-y-1.5">
      {lines.map((line, i) => {
        if (!line.trim()) return <div key={i} className="h-1" />

        // Heading: ### or ##
        if (/^###\s/.test(line)) {
          return <div key={i} className="font-semibold text-gray-900 text-[14px] mt-2">{renderInline(line.replace(/^###\s/, ''))}</div>
        }
        if (/^##\s/.test(line)) {
          return <div key={i} className="font-bold text-gray-900 text-[15px] mt-3">{renderInline(line.replace(/^##\s/, ''))}</div>
        }

        // Bullet: - or *
        if (/^[\-\*]\s/.test(line.trim())) {
          return (
            <div key={i} className="flex gap-2 pl-2">
              <span className="text-indigo-400 shrink-0 mt-0.5">•</span>
              <span>{renderInline(line.trim().replace(/^[\-\*]\s/, ''))}</span>
            </div>
          )
        }

        // Numbered list
        if (/^\d+\.\s/.test(line.trim())) {
          const [num, ...rest] = line.trim().split(/\.\s/)
          return (
            <div key={i} className="flex gap-2 pl-2">
              <span className="text-indigo-500 font-semibold shrink-0 min-w-[18px]">{num}.</span>
              <span>{renderInline(rest.join('. '))}</span>
            </div>
          )
        }

        return <p key={i}>{renderInline(line)}</p>
      })}
    </div>
  )
}

function renderInline(text) {
  // Bold: **text**
  const parts = text.split(/(\*\*[^*]+\*\*)/)
  return parts.map((part, i) =>
    /^\*\*[^*]+\*\*$/.test(part)
      ? <strong key={i} className="font-semibold text-gray-900">{part.slice(2, -2)}</strong>
      : part
  )
}

function Toggle({ label, checked, onChange }) {
  return (
    <label className="flex items-center gap-3 cursor-pointer select-none">
      <div
        onClick={() => onChange(!checked)}
        className={`relative w-9 h-5 rounded-full transition-colors ${checked ? 'bg-indigo-600' : 'bg-gray-200'}`}
      >
        <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-4' : 'translate-x-0'}`} />
      </div>
      <span className="text-[13px] text-gray-700">{label}</span>
    </label>
  )
}
