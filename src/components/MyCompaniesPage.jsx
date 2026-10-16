import { Building2, Plus, ArrowRight, CheckCircle2, Sparkles, Clock } from 'lucide-react'

const STEP_LABELS = [
  '',
  'Choose Structure & Name',
  'Directors Information',
  'Registered Office',
  'Documents Upload',
  'Review & Sign',
  'MCA Application',
  'Post Incorporation',
  'Compliance & Next Steps',
]

const STEP_NEXT = {
  1: 'Tell the AI your company name, type & activity',
  2: 'Add directors with DIN & PAN',
  3: 'Provide registered office address',
  4: 'Upload identity & address proof documents',
  5: 'Review SPICe+ form and sign with DSC',
  6: 'Submit SPICe+ application to MCA',
  7: 'Complete PAN, TAN & GST registrations',
  8: 'Set up compliance calendar',
}

const STATUS_STYLE = {
  'Name Reserved':  { bg: 'bg-blue-50',    text: 'text-blue-700',    border: 'border-blue-100' },
  'In Progress':    { bg: 'bg-amber-50',   text: 'text-amber-700',   border: 'border-amber-100' },
  'Filed':          { bg: 'bg-violet-50',  text: 'text-violet-700',  border: 'border-violet-100' },
  'Incorporated':   { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-100' },
  'Active':         { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-100' },
}
const DEFAULT_STATUS_STYLE = { bg: 'bg-gray-50', text: 'text-gray-600', border: 'border-gray-100' }

function ProgressRing({ pct, step }) {
  const r = 22
  const circ = 2 * Math.PI * r
  const filled = (pct / 100) * circ
  const color = pct === 100 ? '#10b981' : pct >= 50 ? '#6366f1' : '#f59e0b'
  return (
    <div className="relative flex items-center justify-center w-14 h-14 shrink-0">
      <svg width="56" height="56" viewBox="0 0 56 56">
        <circle cx="28" cy="28" r={r} fill="none" stroke="#e5e7eb" strokeWidth="4" />
        <circle
          cx="28" cy="28" r={r} fill="none"
          stroke={color} strokeWidth="4" strokeLinecap="round"
          strokeDasharray={`${filled} ${circ}`}
          strokeDashoffset={circ * 0.25}
          transform="rotate(-90 28 28)"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[13px] font-bold text-gray-800 leading-none">{step}</span>
        <span className="text-[9px] text-gray-400 leading-none">of 8</span>
      </div>
    </div>
  )
}

function CompanyCard({ company, onSelect, isActive }) {
  const isBlank = !company.name
  const displayName = company.name || 'New Company'
  const step = company.journeyStep ?? 1
  const pct = Math.round((step / 8) * 100)
  const stepsLeft = 8 - step
  const statusStyle = STATUS_STYLE[company.statusTag] ?? DEFAULT_STATUS_STYLE
  const stepLabel = STEP_LABELS[step] ?? `Step ${step}`
  const nextHint = STEP_NEXT[step]

  return (
    <div
      className={`bg-white rounded-2xl border-2 flex flex-col gap-0 hover:shadow-md transition-all overflow-hidden ${
        isActive ? 'border-indigo-400 shadow-md shadow-indigo-100' : 'border-gray-200'
      }`}
    >
      {/* Active ribbon */}
      {isActive && (
        <div className="bg-indigo-600 px-4 py-1.5 flex items-center gap-1.5">
          <Sparkles size={11} className="text-indigo-200" />
          <span className="text-[11px] font-semibold text-white tracking-wide uppercase">Currently Active</span>
        </div>
      )}

      <div className="p-5 flex flex-col gap-4 flex-1">
        {/* Header */}
        <div className="flex items-start gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isBlank ? 'bg-gray-100' : 'bg-indigo-50'}`}>
            <Building2 size={20} className={isBlank ? 'text-gray-400' : 'text-indigo-500'} />
          </div>
          <div className="min-w-0 flex-1">
            <div className={`text-[14px] font-semibold truncate ${isBlank ? 'text-gray-400 italic' : 'text-gray-900'}`}>
              {displayName}
            </div>
            <div className="text-[12px] text-gray-400 mt-0.5 truncate">
              {company.type || 'Type not set'}
            </div>
          </div>
          {company.statusTag && !isBlank && (
            <span className={`shrink-0 text-[11px] font-semibold px-2.5 py-1 rounded-full border ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}>
              {company.statusTag}
            </span>
          )}
        </div>

        {/* Progress */}
        <div className="flex items-center gap-4 bg-gray-50 rounded-xl px-4 py-3">
          <ProgressRing pct={pct} step={step} />
          <div className="flex-1 min-w-0">
            <div className="text-[12.5px] font-semibold text-gray-800 leading-tight">{stepLabel}</div>
            {nextHint && (
              <div className="text-[11.5px] text-gray-400 mt-0.5 leading-tight line-clamp-2">{nextHint}</div>
            )}
            <div className="flex items-center gap-1.5 mt-2">
              <div className="flex-1 h-1 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${pct}%`,
                    background: pct === 100 ? '#10b981' : '#6366f1',
                  }}
                />
              </div>
              <span className="text-[10.5px] text-gray-400 shrink-0">{pct}%</span>
            </div>
          </div>
        </div>

        {/* Footer meta */}
        <div className="flex items-center justify-between text-[11.5px] text-gray-400">
          {pct === 100 ? (
            <div className="flex items-center gap-1 text-emerald-600">
              <CheckCircle2 size={13} />
              <span className="font-medium">All steps complete</span>
            </div>
          ) : (
            <div className="flex items-center gap-1">
              <Clock size={12} />
              <span>{stepsLeft} step{stepsLeft !== 1 ? 's' : ''} remaining</span>
            </div>
          )}
          <span className="text-gray-300">ID #{company.id}</span>
        </div>

        {/* CTA */}
        <button
          onClick={() => onSelect(company.id)}
          className={`w-full flex items-center justify-center gap-2 rounded-xl text-[13px] font-medium py-2.5 transition-colors ${
            isBlank
              ? 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              : 'bg-indigo-600 hover:bg-indigo-700 text-white'
          }`}
        >
          {isBlank ? 'Start Setup' : isActive ? 'Continue Here' : 'Switch & Continue'}
          <ArrowRight size={14} />
        </button>
      </div>
    </div>
  )
}

export default function MyCompaniesPage({ companies, onSelect, onNewCompany, creating, activeCompanyId }) {
  const done = companies.filter((c) => (c.journeyStep ?? 1) === 8).length
  const inProgress = companies.filter((c) => c.name && (c.journeyStep ?? 1) < 8).length
  const setup = companies.filter((c) => !c.name).length

  return (
    <div className="flex-1 overflow-y-auto bg-[#f3f4f8] px-8 py-8">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-[20px] font-bold text-gray-900">My Companies</h1>
            <p className="text-[13px] text-gray-500 mt-1">
              {companies.length === 0
                ? 'No companies yet — start your first registration below.'
                : `${companies.length} compan${companies.length !== 1 ? 'ies' : 'y'} · ${inProgress} in progress${done > 0 ? ` · ${done} complete` : ''}${setup > 0 ? ` · ${setup} setting up` : ''}`}
            </p>
          </div>
          <button
            onClick={onNewCompany}
            disabled={creating}
            className="flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-[13px] font-medium px-4 py-2.5 transition-colors shrink-0"
          >
            <Plus size={15} />
            {creating ? 'Creating…' : 'Start New Company'}
          </button>
        </div>

        {/* Summary chips */}
        {companies.length > 0 && (
          <div className="flex gap-3 mb-6 flex-wrap">
            {[
              { label: 'Total', value: companies.length, color: 'bg-white border-gray-200 text-gray-700' },
              { label: 'In Progress', value: inProgress, color: 'bg-amber-50 border-amber-200 text-amber-700' },
              { label: 'Complete', value: done, color: 'bg-emerald-50 border-emerald-200 text-emerald-700' },
              { label: 'Setting Up', value: setup, color: 'bg-gray-50 border-gray-200 text-gray-500' },
            ].map((chip) => (
              <div key={chip.label} className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border text-[12.5px] font-medium ${chip.color}`}>
                <span className="font-bold text-[14px]">{chip.value}</span>
                <span>{chip.label}</span>
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {companies.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-14 text-center">
            <Building2 size={44} className="mx-auto text-indigo-200 mb-4" />
            <div className="text-[16px] font-semibold text-gray-900 mb-2">No companies registered yet</div>
            <p className="text-[13px] text-gray-500 max-w-sm mx-auto mb-6 leading-relaxed">
              Start a new company and our AI assistant will guide you through the entire incorporation process.
            </p>
            <button
              onClick={onNewCompany}
              disabled={creating}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-[13px] font-medium px-5 py-2.5"
            >
              <Plus size={15} />
              {creating ? 'Creating…' : 'Start New Company'}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {companies.map((c) => (
              <CompanyCard
                key={c.id}
                company={c}
                onSelect={onSelect}
                isActive={c.id === activeCompanyId}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
