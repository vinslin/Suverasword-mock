import { Building2, Plus, ArrowRight, CheckCircle2, Clock3, Circle } from 'lucide-react'

const STEP_LABELS = [
  '', // 0 unused
  'Choose Structure & Name',
  'Directors Information',
  'Registered Office',
  'Documents Upload',
  'Review & Sign',
  'MCA Application',
  'Post Incorporation',
  'Compliance & Next Steps',
]

function StepBadge({ step }) {
  const label = STEP_LABELS[step] ?? `Step ${step}`
  const pct = Math.round((step / 8) * 100)
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-indigo-500 rounded-full transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-[11px] text-gray-400 whitespace-nowrap">Step {step} of 8</span>
    </div>
  )
}

function CompanyCard({ company, onSelect }) {
  const displayName = company.name || 'New Company (setting up…)'
  const displayType = company.type || '—'
  const tag = company.statusTag
  const isBlank = !company.name

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 flex flex-col gap-4 hover:shadow-sm transition-shadow">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
            <Building2 size={20} className="text-indigo-500" />
          </div>
          <div className="min-w-0">
            <div className="text-[14px] font-semibold text-gray-900 truncate">{displayName}</div>
            <div className="text-[12px] text-gray-400 mt-0.5">{displayType}</div>
          </div>
        </div>
        {tag && !isBlank && (
          <span className="shrink-0 text-[11px] font-medium bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full border border-emerald-100">
            {tag}
          </span>
        )}
      </div>

      <StepBadge step={company.journeyStep} />

      <button
        onClick={() => onSelect(company.id)}
        className="w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-[13px] font-medium py-2.5 transition-colors"
      >
        {isBlank ? 'Start Setup' : 'Continue'} <ArrowRight size={14} />
      </button>
    </div>
  )
}

export default function MyCompaniesPage({ companies, onSelect, onNewCompany, creating }) {
  return (
    <div className="flex-1 overflow-y-auto px-8 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-[20px] font-bold text-gray-900">My Companies</h1>
            <p className="text-[13px] text-gray-500 mt-0.5">
              {companies.length === 0
                ? 'No companies yet — start your first registration below.'
                : `${companies.length} registration${companies.length !== 1 ? 's' : ''} in progress`}
            </p>
          </div>
          <button
            onClick={onNewCompany}
            disabled={creating}
            className="flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-[13px] font-medium px-4 py-2.5 transition-colors"
          >
            <Plus size={15} />
            {creating ? 'Creating…' : 'Start New Company'}
          </button>
        </div>

        {companies.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
            <Building2 size={40} className="mx-auto text-indigo-200 mb-4" />
            <div className="text-[15px] font-semibold text-gray-900 mb-2">No companies registered yet</div>
            <p className="text-[13px] text-gray-500 max-w-sm mx-auto mb-6 leading-relaxed">
              Click "Start New Company" to begin the registration process. Our AI will guide you through every step.
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
              <CompanyCard key={c.id} company={c} onSelect={onSelect} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
