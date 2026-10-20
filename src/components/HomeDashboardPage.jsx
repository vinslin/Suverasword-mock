import { useMemo } from 'react'
import {
  Building2, MessageSquare, Calendar, FileText, Calculator,
  ArrowRight, CheckCircle2, Clock3, Circle, AlertTriangle,
  TrendingUp, Users, ChevronRight, Zap,
} from 'lucide-react'
import { journeySteps, journeyNextAction } from '../data/mockData'

// ── Compliance deadline helpers (mirrors ComplianceCalendarPage) ──────────

const BASE_DEADLINES = [
  { name: 'TDS Return (26Q) — Q3',       month: 1,  day: 31, urgency: 'high'   },
  { name: 'Advance Tax — Instalment 4',  month: 3,  day: 15, urgency: 'low'    },
  { name: 'TDS Return (26Q) — Q4',       month: 5,  day: 31, urgency: 'high'   },
  { name: 'Advance Tax — Instalment 1',  month: 6,  day: 15, urgency: 'low'    },
  { name: 'Annual General Meeting (AGM)',month: 9,  day: 30, urgency: 'medium' },
  { name: 'Director KYC (DIR-3 KYC)',    month: 9,  day: 30, urgency: 'medium' },
  { name: 'Financial Statements (AOC-4)',month: 10, day: 29, urgency: 'high',  year1Exempt: true },
  { name: 'Income Tax Return (ITR-6)',   month: 10, day: 31, urgency: 'high'   },
  { name: 'Annual Return (MGT-7)',       month: 11, day: 29, urgency: 'high',  year1Exempt: true },
  { name: 'GST Annual Return (GSTR-9)', month: 12, day: 31, urgency: 'medium', year1Exempt: true },
]

function nextOccurrence(month, day) {
  const today = new Date()
  const candidate = new Date(today.getFullYear(), month - 1, day)
  if (candidate < today) candidate.setFullYear(today.getFullYear() + 1)
  return candidate
}

function daysUntil(d) {
  const today = new Date(); today.setHours(0, 0, 0, 0)
  return Math.ceil((d - today) / 86400000)
}

function isFirstFY(incDate) {
  if (!incDate) return false
  const today = new Date()
  const fyStart = today.getMonth() >= 3
    ? new Date(today.getFullYear(), 3, 1)
    : new Date(today.getFullYear() - 1, 3, 1)
  return new Date(incDate) >= fyStart
}

function getUpcomingDeadlines(company, count = 4) {
  const firstFY = company?.incorporationDate ? isFirstFY(company.incorporationDate) : false
  const list = BASE_DEADLINES
    .filter(d => !(d.year1Exempt && firstFY))
    .map(d => ({ ...d, date: nextOccurrence(d.month, d.day) }))
    .sort((a, b) => a.date - b.date)
  return list.slice(0, count)
}

// ── Stat card ─────────────────────────────────────────────────────────────

function StatCard({ icon: Icon, label, value, sub, color }) {
  const colors = {
    indigo: 'bg-indigo-50 text-indigo-600',
    green:  'bg-emerald-50 text-emerald-600',
    amber:  'bg-amber-50 text-amber-600',
    blue:   'bg-blue-50 text-blue-600',
  }
  return (
    <div className="bg-white rounded-2xl border border-gray-200 px-5 py-4 flex items-center gap-4">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${colors[color]}`}>
        <Icon size={18} />
      </div>
      <div className="min-w-0">
        <div className="text-[22px] font-bold text-gray-900 leading-none">{value}</div>
        <div className="text-[12px] text-gray-500 mt-0.5 truncate">{label}</div>
        {sub && <div className="text-[11px] text-gray-400 mt-0.5 truncate">{sub}</div>}
      </div>
    </div>
  )
}

// ── Urgency dot colors ─────────────────────────────────────────────────────

const URGENCY_DOT = { high: 'bg-red-500', medium: 'bg-amber-500', low: 'bg-green-500' }
const URGENCY_TEXT = { high: 'text-red-600', medium: 'text-amber-600', low: 'text-emerald-600' }

function urgencyLabel(days) {
  if (days < 0)  return { text: `${Math.abs(days)}d overdue`, cls: 'text-red-600 font-semibold' }
  if (days === 0) return { text: 'Due today!',  cls: 'text-red-600 font-semibold' }
  if (days <= 7)  return { text: `${days}d left`, cls: 'text-amber-600 font-semibold' }
  if (days <= 30) return { text: `${days}d left`, cls: 'text-amber-500' }
  return { text: `${days}d left`, cls: 'text-gray-400' }
}

const REG_STATUS_META = {
  'Completed':   { Icon: CheckCircle2, cls: 'text-emerald-500' },
  'In Progress': { Icon: Clock3,       cls: 'text-blue-500'    },
  'Pending':     { Icon: Clock3,       cls: 'text-amber-500'   },
  'Not Started': { Icon: Circle,       cls: 'text-gray-300'    },
}

// ── Main component ─────────────────────────────────────────────────────────

export default function HomeDashboardPage({ companies = [], company, registrations = [], onNavigate, onNewCompany }) {
  const totalCompanies   = companies.length
  const completedRegs    = registrations.filter(r => r.status === 'Completed').length
  const step             = company?.journeyStep ?? 0
  const stepLabel        = journeySteps.find(s => s.id === step)?.label ?? '—'
  const nextAction       = journeyNextAction[step] ?? 'All steps complete!'
  const journeyPct       = step > 0 ? Math.round((step / 8) * 100) : 0

  const deadlines = useMemo(() => getUpcomingDeadlines(company), [company])
  const nearestDays = deadlines.length ? daysUntil(deadlines[0].date) : null

  const keyRegs = registrations.slice(0, 5)

  const quickActions = [
    { key: 'assistant',  label: 'AI Assistant',         icon: MessageSquare, color: 'bg-indigo-600 hover:bg-indigo-700 text-white' },
    { key: 'calendar',   label: 'Compliance Calendar',  icon: Calendar,      color: 'bg-blue-50 hover:bg-blue-100 text-blue-700'  },
    { key: 'documents',  label: 'Documents',            icon: FileText,      color: 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700' },
    { key: 'cost',       label: 'Cost Estimator',       icon: Calculator,    color: 'bg-amber-50 hover:bg-amber-100 text-amber-700' },
  ]

  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <div className="flex-1 overflow-y-auto bg-[#f3f4f8] p-6 space-y-5">

      {/* ── Welcome banner ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[20px] font-bold text-gray-900">Good day, Sudharshan 👋</h1>
          <p className="text-[13px] text-gray-500 mt-0.5">{today}</p>
        </div>
        {!company && (
          <button
            onClick={onNewCompany}
            className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-[13px] font-medium px-4 py-2.5 flex items-center gap-2"
          >
            <span>+ Start New Company</span>
          </button>
        )}
      </div>

      {/* ── Stats row ── */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard
          icon={Building2}
          label="Total Companies"
          value={totalCompanies || '0'}
          sub={totalCompanies === 1 ? '1 active' : totalCompanies > 1 ? `${totalCompanies} registered` : 'None yet'}
          color="indigo"
        />
        <StatCard
          icon={TrendingUp}
          label="Journey Progress"
          value={company ? `Step ${step}/8` : '—'}
          sub={company ? stepLabel : 'No active company'}
          color="blue"
        />
        <StatCard
          icon={CheckCircle2}
          label="Registrations Done"
          value={completedRegs || '0'}
          sub={`of ${registrations.length} total`}
          color="green"
        />
        <StatCard
          icon={Calendar}
          label="Next Deadline In"
          value={nearestDays != null ? (nearestDays <= 0 ? 'Due!' : `${nearestDays}d`) : '—'}
          sub={deadlines[0]?.name ?? 'No deadlines'}
          color="amber"
        />
      </div>

      {/* ── Main two-column area ── */}
      <div className="grid grid-cols-3 gap-4">

        {/* ── Left column (2/3) ── */}
        <div className="col-span-2 space-y-4">

          {/* Active company journey card */}
          {company ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-5">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-semibold uppercase tracking-widest text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-full">Active Company</span>
                  </div>
                  <h2 className="text-[17px] font-bold text-gray-900">{company.name}</h2>
                  <p className="text-[12.5px] text-gray-500">{company.type}</p>
                </div>
                <button
                  onClick={() => onNavigate('assistant')}
                  className="text-[12px] text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1"
                >
                  Open Chat <ArrowRight size={13} />
                </button>
              </div>

              {/* Progress bar */}
              <div className="mb-3">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[12px] text-gray-500">Registration Journey</span>
                  <span className="text-[12px] font-semibold text-gray-700">{journeyPct}%</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                    style={{ width: `${journeyPct}%` }}
                  />
                </div>
              </div>

              {/* Steps row */}
              <div className="flex gap-1 mb-4">
                {journeySteps.map(s => (
                  <div
                    key={s.id}
                    className={`flex-1 h-1.5 rounded-full ${s.id <= step ? 'bg-indigo-500' : 'bg-gray-100'}`}
                  />
                ))}
              </div>

              {/* Current step + next action */}
              <div className="bg-indigo-50 rounded-xl px-4 py-3 flex items-start gap-3">
                <Zap size={16} className="text-indigo-500 mt-0.5 shrink-0" />
                <div>
                  <div className="text-[12px] font-semibold text-indigo-700 mb-0.5">
                    Step {step}: {stepLabel}
                  </div>
                  <div className="text-[12px] text-indigo-600">{nextAction}</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-200 p-6 text-center">
              <Building2 size={32} className="mx-auto text-indigo-200 mb-3" />
              <div className="text-[15px] font-semibold text-gray-900 mb-1">No active company</div>
              <p className="text-[12.5px] text-gray-500 mb-4">Start a new company to see your registration journey here.</p>
              <button
                onClick={onNewCompany}
                className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-[13px] font-medium px-5 py-2.5"
              >
                + Start New Company
              </button>
            </div>
          )}

          {/* Upcoming compliance deadlines */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[14px] font-semibold text-gray-900">Upcoming Compliance Deadlines</h3>
              <button
                onClick={() => onNavigate('calendar')}
                className="text-[12px] text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1"
              >
                View all <ChevronRight size={13} />
              </button>
            </div>

            {!company ? (
              <div className="text-center py-6 text-[13px] text-gray-400">
                Set up a company to track compliance deadlines.
              </div>
            ) : (
              <div className="space-y-2">
                {deadlines.map((d, i) => {
                  const days = daysUntil(d.date)
                  const { text, cls } = urgencyLabel(days)
                  const dateStr = d.date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                  return (
                    <div key={i} className="flex items-center gap-3 py-2.5 border-b border-gray-50 last:border-0">
                      <div className={`w-2 h-2 rounded-full shrink-0 ${URGENCY_DOT[d.urgency]}`} />
                      <div className="flex-1 min-w-0">
                        <div className="text-[13px] font-medium text-gray-800 truncate">{d.name}</div>
                        <div className="text-[11.5px] text-gray-400">{dateStr}</div>
                      </div>
                      <span className={`text-[12px] shrink-0 ${cls}`}>{text}</span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* ── Right column (1/3) ── */}
        <div className="space-y-4">

          {/* Quick actions */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <h3 className="text-[14px] font-semibold text-gray-900 mb-3">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-2">
              {quickActions.map(({ key, label, icon: Icon, color }) => (
                <button
                  key={key}
                  onClick={() => onNavigate(key)}
                  className={`rounded-xl px-3 py-3 flex flex-col items-center gap-2 text-[12px] font-medium transition-colors ${color}`}
                >
                  <Icon size={18} />
                  <span className="text-center leading-tight">{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Registrations mini-status */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[14px] font-semibold text-gray-900">Registrations</h3>
              {registrations.length > 0 && (
                <button
                  onClick={() => onNavigate('assistant')}
                  className="text-[12px] text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1"
                >
                  Details <ChevronRight size={13} />
                </button>
              )}
            </div>

            {keyRegs.length === 0 ? (
              <div className="text-center py-4 text-[12.5px] text-gray-400">
                No registrations yet.
              </div>
            ) : (
              <div className="space-y-2">
                {keyRegs.map(r => {
                  const { Icon, cls } = REG_STATUS_META[r.status] ?? REG_STATUS_META['Not Started']
                  return (
                    <div key={r.id} className="flex items-center gap-2.5 py-1.5">
                      <Icon size={15} className={`shrink-0 ${cls}`} />
                      <div className="flex-1 min-w-0">
                        <div className="text-[12.5px] font-medium text-gray-800 truncate">{r.name}</div>
                      </div>
                      <span className={`text-[11px] shrink-0 font-medium ${
                        r.status === 'Completed' ? 'text-emerald-600' :
                        r.status === 'In Progress' ? 'text-blue-600' :
                        'text-gray-400'
                      }`}>{r.status}</span>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Completion mini bar */}
            {registrations.length > 0 && (
              <div className="mt-3 pt-3 border-t border-gray-100">
                <div className="flex justify-between text-[11.5px] text-gray-500 mb-1.5">
                  <span>{completedRegs} of {registrations.length} complete</span>
                  <span>{Math.round((completedRegs / registrations.length) * 100)}%</span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full"
                    style={{ width: `${Math.round((completedRegs / registrations.length) * 100)}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Companies summary */}
          {companies.length > 1 && (
            <div className="bg-white rounded-2xl border border-gray-200 p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-[14px] font-semibold text-gray-900">All Companies</h3>
                <button
                  onClick={() => onNavigate('companies')}
                  className="text-[12px] text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1"
                >
                  View all <ChevronRight size={13} />
                </button>
              </div>
              <div className="space-y-2">
                {companies.slice(0, 4).map(c => (
                  <div key={c.id} className="flex items-center gap-2.5 py-1">
                    <div className={`w-2 h-2 rounded-full shrink-0 ${c.id === companies[0]?.id ? 'bg-indigo-500' : 'bg-gray-300'}`} />
                    <div className="flex-1 min-w-0">
                      <div className="text-[12.5px] font-medium text-gray-800 truncate">{c.name || 'Unnamed'}</div>
                      <div className="text-[11px] text-gray-400">{c.type || 'Private Limited'}</div>
                    </div>
                    <span className="text-[11px] text-gray-400">Step {c.journeyStep ?? 1}/8</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
