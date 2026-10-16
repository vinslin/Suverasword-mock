import { useState, useMemo } from 'react'
import { ChevronLeft, ChevronRight, Calendar, Building2, Info, AlertTriangle, CheckCircle2 } from 'lucide-react'

const MONTH_NAMES = ['January','February','March','April','May','June',
  'July','August','September','October','November','December']
const DAY_NAMES = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']

// ── Deadline definitions ───────────────────────────────────────────────────
// month is 1-indexed, year1Exempt = true means this filing doesn't apply in
// the company's first financial year (common for annual returns, GSTR-9 etc.)

const BASE_DEADLINES = [
  { name: 'POSH Annual Report',          month: 1,  day: 31, urgency: 'medium', desc: 'ICC must submit annual report to employer and District Officer', year1Exempt: false },
  { name: 'TDS Return (26Q) — Q3',       month: 1,  day: 31, urgency: 'high',   desc: 'TDS quarterly return for Oct–Dec quarter', year1Exempt: false },
  { name: 'Advance Tax — Instalment 4',  month: 3,  day: 15, urgency: 'low',    desc: '100% of annual tax liability (cumulative)', year1Exempt: false },
  { name: 'TDS Return (26Q) — Q4',       month: 5,  day: 31, urgency: 'high',   desc: 'TDS quarterly return for Jan–Mar quarter', year1Exempt: false },
  { name: 'Advance Tax — Instalment 1',  month: 6,  day: 15, urgency: 'low',    desc: '15% of annual tax liability', year1Exempt: false },
  { name: 'TDS Return (26Q) — Q1',       month: 7,  day: 31, urgency: 'high',   desc: 'TDS quarterly return for Apr–Jun quarter', year1Exempt: false },
  { name: 'Advance Tax — Instalment 2',  month: 9,  day: 15, urgency: 'low',    desc: '45% of annual tax liability (cumulative)', year1Exempt: false },
  { name: 'Annual General Meeting (AGM)',month: 9,  day: 30, urgency: 'medium', desc: 'Within 6 months of financial year end (FY ends Mar 31)', year1Exempt: false, firstYearNote: 'First AGM: within 9 months of incorporation date' },
  { name: 'Director KYC (DIR-3 KYC)',    month: 9,  day: 30, urgency: 'medium', desc: 'All directors must file — ₹5,000 penalty for delay', year1Exempt: false },
  { name: 'Financial Statements (AOC-4)',month: 10, day: 29, urgency: 'high',   desc: '30 days after AGM — mandatory for all companies', year1Exempt: true },
  { name: 'TDS Return (26Q) — Q2',       month: 10, day: 31, urgency: 'high',   desc: 'TDS quarterly return for Jul–Sep quarter', year1Exempt: false },
  { name: 'Income Tax Return (ITR-6)',   month: 10, day: 31, urgency: 'high',   desc: 'For companies requiring audit under IT Act', year1Exempt: false },
  { name: 'Annual Return (MGT-7)',       month: 11, day: 29, urgency: 'high',   desc: '60 days after AGM — penalty ₹100/day for delay', year1Exempt: true },
  { name: 'Advance Tax — Instalment 3',  month: 12, day: 15, urgency: 'low',    desc: '75% of annual tax liability (cumulative)', year1Exempt: false },
  { name: 'GST Annual Return (GSTR-9)', month: 12, day: 31, urgency: 'medium', desc: 'If annual turnover > ₹2Cr', year1Exempt: true },
]

const URGENCY = {
  high:   { dot: 'bg-red-500',   badge: 'bg-red-50 text-red-600',   label: 'Critical' },
  medium: { dot: 'bg-amber-500', badge: 'bg-amber-50 text-amber-600',label: 'Important' },
  low:    { dot: 'bg-green-500', badge: 'bg-green-50 text-green-600',label: 'Routine' },
}

// ── Helpers ────────────────────────────────────────────────────────────────

function getDaysInMonth(year, month) { return new Date(year, month, 0).getDate() }
function getFirstDayOfWeek(year, month) { return new Date(year, month - 1, 1).getDay() }

function parseDate(str) {
  if (!str) return null
  const d = new Date(str)
  return isNaN(d.getTime()) ? null : d
}

// Returns true if the company is still in its first financial year
// Indian FY = April 1 to March 31
function isFirstFY(incDate) {
  if (!incDate) return false
  const today = new Date()
  // Current FY start
  const fyStart = today.getMonth() >= 3
    ? new Date(today.getFullYear(), 3, 1)      // April 1 this year
    : new Date(today.getFullYear() - 1, 3, 1)  // April 1 last year
  return incDate >= fyStart
}

// First AGM deadline = 9 months after incorporation date
function firstAgmDeadline(incDate) {
  const d = new Date(incDate)
  d.setMonth(d.getMonth() + 9)
  return d
}

function daysUntil(targetDate) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return Math.ceil((targetDate - today) / (1000 * 60 * 60 * 24))
}

function nextOccurrence(month, day) {
  const today = new Date()
  const thisYear = today.getFullYear()
  const candidate = new Date(thisYear, month - 1, day)
  if (candidate < today) candidate.setFullYear(thisYear + 1)
  return candidate
}

// ── Main component ─────────────────────────────────────────────────────────

export default function ComplianceCalendarPage({ company }) {
  const today = new Date()
  const [viewYear, setViewYear] = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth() + 1)
  const [selected, setSelected] = useState(null)

  const incDate = parseDate(company?.incorporationDate)
  const incorporated = !!company?.incorporationDate
  const firstFY = isFirstFY(incDate)
  const notYetIncorporated = !company || company.journeyStep < 6

  // Build the effective deadline list for the current year context
  const deadlines = useMemo(() => {
    return BASE_DEADLINES.map(d => {
      const exempt = firstFY && d.year1Exempt
      // Override AGM for first year
      if (d.name === 'Annual General Meeting (AGM)' && incDate && firstFY) {
        const agm = firstAgmDeadline(incDate)
        return {
          ...d,
          month: agm.getMonth() + 1,
          day: agm.getDate(),
          desc: `First AGM: within 9 months of incorporation (${company.incorporationDate})`,
          firstYear: true,
          exempt: false,
        }
      }
      return { ...d, exempt }
    })
  }, [incDate, firstFY, company])

  function prevMonth() {
    if (viewMonth === 1) { setViewMonth(12); setViewYear(y => y - 1) }
    else setViewMonth(m => m - 1)
    setSelected(null)
  }
  function nextMonth() {
    if (viewMonth === 12) { setViewMonth(1); setViewYear(y => y + 1) }
    else setViewMonth(m => m + 1)
    setSelected(null)
  }

  const deadlinesThisMonth = deadlines.filter(d => d.month === viewMonth)
  const byDay = {}
  deadlinesThisMonth.forEach(d => {
    if (!byDay[d.day]) byDay[d.day] = []
    byDay[d.day].push(d)
  })

  const daysInMonth = getDaysInMonth(viewYear, viewMonth)
  const firstDow = getFirstDayOfWeek(viewYear, viewMonth)
  const totalCells = Math.ceil((firstDow + daysInMonth) / 7) * 7
  const cells = Array.from({ length: totalCells }, (_, i) => {
    const day = i - firstDow + 1
    return day >= 1 && day <= daysInMonth ? day : null
  })

  const isToday = (day) =>
    day === today.getDate() &&
    viewMonth === today.getMonth() + 1 &&
    viewYear === today.getFullYear()

  const selectedDeadlines = selected ? (byDay[selected] ?? []) : []

  // Upcoming: next 5 deadlines across all months
  const upcoming = useMemo(() => {
    return deadlines
      .filter(d => !d.exempt)
      .map(d => ({ ...d, target: nextOccurrence(d.month, d.day) }))
      .map(d => ({ ...d, daysLeft: daysUntil(d.target) }))
      .filter(d => d.daysLeft >= 0)
      .sort((a, b) => a.daysLeft - b.daysLeft)
      .slice(0, 5)
  }, [deadlines])

  return (
    <div className="flex-1 overflow-y-auto bg-[#f3f4f8]">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-start justify-between">
          <div>
            <h1 className="text-[18px] font-semibold text-gray-900">Compliance Calendar</h1>
            <p className="text-[13px] text-gray-400 mt-0.5">
              Statutory filing deadlines — know what's due and when
            </p>
          </div>
          {/* Company context chip */}
          {company?.name && (
            <div className="flex items-center gap-2 bg-indigo-50 border border-indigo-100 rounded-xl px-3.5 py-2">
              <Building2 size={14} className="text-indigo-500 shrink-0" />
              <div>
                <div className="text-[12.5px] font-semibold text-indigo-800 leading-none">{company.name}</div>
                <div className="text-[11px] text-indigo-400 mt-0.5 leading-none">{company.type}</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Banners */}
      <div className="max-w-6xl mx-auto px-6 pt-4 space-y-2">
        {notYetIncorporated && (
          <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-[13px] text-amber-800">
            <AlertTriangle size={15} className="shrink-0 mt-0.5 text-amber-500" />
            <div>
              <span className="font-semibold">Pre-incorporation estimates</span>
              {' '}— your company hasn't been incorporated yet (Step 6: MCA Application).
              Deadlines shown are what will apply once incorporated.
            </div>
          </div>
        )}
        {incorporated && firstFY && (
          <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-[13px] text-blue-800">
            <Info size={15} className="shrink-0 mt-0.5 text-blue-500" />
            <div>
              <span className="font-semibold">First financial year</span>
              {' '}— some annual filings (MGT-7, AOC-4, GSTR-9) are shown as N/A since this is your first FY.
              Your AGM deadline has been adjusted to 9 months from your incorporation date.
            </div>
          </div>
        )}
        {incorporated && !firstFY && (
          <div className="flex items-start gap-3 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 text-[13px] text-emerald-800">
            <CheckCircle2 size={15} className="shrink-0 mt-0.5 text-emerald-500" />
            <div>
              <span className="font-semibold">Incorporated</span>
              {' '}— all standard annual deadlines apply. Incorporated on {company.incorporationDate}.
            </div>
          </div>
        )}
      </div>

      <div className="max-w-6xl mx-auto px-6 py-4 flex gap-5">

        {/* ── Calendar ── */}
        <div className="flex-1 min-w-0">
          {/* Legend */}
          <div className="flex gap-3 mb-4 flex-wrap">
            {['high','medium','low'].map(u => (
              <div key={u} className={`flex items-center gap-1.5 text-[12px] font-medium px-3 py-1.5 rounded-full ${URGENCY[u].badge}`}>
                <span className={`w-2 h-2 rounded-full ${URGENCY[u].dot}`} />
                {URGENCY[u].label}
              </div>
            ))}
            <div className="flex items-center gap-1.5 text-[12px] font-medium px-3 py-1.5 rounded-full bg-gray-100 text-gray-400">
              <span className="w-2 h-2 rounded-full bg-gray-300" />
              N/A (Year 1)
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            {/* Month nav */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                <ChevronLeft size={18} className="text-gray-500" />
              </button>
              <div className="text-[15px] font-semibold text-gray-900">
                {MONTH_NAMES[viewMonth - 1]} {viewYear}
              </div>
              <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                <ChevronRight size={18} className="text-gray-500" />
              </button>
            </div>

            {/* Day headers */}
            <div className="grid grid-cols-7 border-b border-gray-100">
              {DAY_NAMES.map(d => (
                <div key={d} className="py-2.5 text-center text-[11.5px] font-semibold text-gray-400 uppercase tracking-wide">
                  {d}
                </div>
              ))}
            </div>

            {/* Day cells */}
            <div className="grid grid-cols-7 divide-x divide-y divide-gray-100">
              {cells.map((day, i) => {
                const events = day ? (byDay[day] ?? []) : []
                const activeEvents = events.filter(e => !e.exempt)
                const exemptEvents = events.filter(e => e.exempt)
                const isSelected = day && selected === day
                const isTodayCell = day && isToday(day)
                return (
                  <div
                    key={i}
                    onClick={() => day && events.length && setSelected(isSelected ? null : day)}
                    className={`min-h-[76px] p-2 flex flex-col gap-1 transition-colors ${
                      !day ? 'bg-gray-50/50' :
                      isSelected ? 'bg-indigo-50 cursor-pointer' :
                      events.length ? 'hover:bg-gray-50 cursor-pointer' : ''
                    }`}
                  >
                    {day && (
                      <>
                        <span className={`text-[12.5px] font-semibold w-6 h-6 flex items-center justify-center rounded-full ${
                          isTodayCell ? 'bg-indigo-600 text-white' : 'text-gray-700'
                        }`}>
                          {day}
                        </span>
                        <div className="flex flex-col gap-0.5">
                          {activeEvents.slice(0, 2).map((e, j) => (
                            <div key={j} className={`text-[10px] font-medium px-1.5 py-0.5 rounded-md truncate ${URGENCY[e.urgency].badge}`}>
                              {e.name.length > 18 ? e.name.slice(0, 17) + '…' : e.name}
                            </div>
                          ))}
                          {exemptEvents.slice(0, 1).map((e, j) => (
                            <div key={`x${j}`} className="text-[10px] font-medium px-1.5 py-0.5 rounded-md truncate bg-gray-100 text-gray-400 line-through">
                              {e.name.length > 18 ? e.name.slice(0, 17) + '…' : e.name}
                            </div>
                          ))}
                          {events.length > 3 && (
                            <div className="text-[10px] text-gray-400 font-medium px-1.5">+{events.length - 3} more</div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Selected day detail */}
          {selected && selectedDeadlines.length > 0 && (
            <div className="mt-4 bg-white rounded-2xl border border-indigo-100 overflow-hidden">
              <div className="px-5 py-3.5 border-b border-gray-100 flex items-center gap-2.5">
                <Calendar size={15} className="text-indigo-500" />
                <span className="text-[13.5px] font-semibold text-gray-900">
                  {MONTH_NAMES[viewMonth - 1]} {selected}, {viewYear}
                </span>
                <span className="text-[11px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full ml-auto">
                  {selectedDeadlines.length} deadline{selectedDeadlines.length > 1 ? 's' : ''}
                </span>
              </div>
              <div className="divide-y divide-gray-50">
                {selectedDeadlines.map((d, i) => (
                  <div key={i} className={`flex items-start gap-3 px-5 py-3.5 ${d.exempt ? 'opacity-50' : ''}`}>
                    <span className={`w-2.5 h-2.5 rounded-full shrink-0 mt-1.5 ${d.exempt ? 'bg-gray-300' : URGENCY[d.urgency].dot}`} />
                    <div className="flex-1">
                      <div className={`text-[13.5px] font-medium ${d.exempt ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
                        {d.name}
                      </div>
                      <div className="text-[12px] text-gray-400 mt-0.5">{d.desc}</div>
                      {d.firstYear && (
                        <div className="text-[11px] text-blue-500 mt-0.5 font-medium">Adjusted for first financial year</div>
                      )}
                    </div>
                    <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full shrink-0 ${d.exempt ? 'bg-gray-100 text-gray-400' : URGENCY[d.urgency].badge}`}>
                      {d.exempt ? 'N/A Year 1' : URGENCY[d.urgency].label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Sidebar ── */}
        <div className="w-[280px] shrink-0 space-y-4">

          {/* This month */}
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <div className="px-4 py-3.5 border-b border-gray-100">
              <div className="text-[13.5px] font-semibold text-gray-900">
                {MONTH_NAMES[viewMonth - 1]} Deadlines
              </div>
              <div className="text-[12px] text-gray-400 mt-0.5">
                {deadlinesThisMonth.filter(d => !d.exempt).length} active · {deadlinesThisMonth.filter(d => d.exempt).length} N/A
              </div>
            </div>
            {deadlinesThisMonth.length === 0 ? (
              <div className="px-4 py-8 text-center text-[12.5px] text-gray-400">No deadlines this month</div>
            ) : (
              <div className="divide-y divide-gray-50">
                {deadlinesThisMonth
                  .sort((a, b) => a.day - b.day)
                  .map((d, i) => (
                    <button
                      key={i}
                      onClick={() => setSelected(d.day)}
                      className={`w-full flex items-start gap-3 px-4 py-3 hover:bg-gray-50 text-left transition-colors ${d.exempt ? 'opacity-50' : ''}`}
                    >
                      <div className={`text-[11px] font-bold px-1.5 py-0.5 rounded min-w-[28px] text-center ${d.exempt ? 'bg-gray-100 text-gray-400' : URGENCY[d.urgency].badge}`}>
                        {d.day}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className={`text-[12.5px] font-medium leading-snug ${d.exempt ? 'text-gray-400 line-through' : 'text-gray-800'}`}>
                          {d.name}
                        </div>
                        <div className={`text-[10.5px] font-semibold mt-0.5 ${d.exempt ? 'text-gray-300' : URGENCY[d.urgency].badge.split(' ')[1]}`}>
                          {d.exempt ? 'N/A — Year 1' : URGENCY[d.urgency].label}
                        </div>
                      </div>
                    </button>
                  ))}
              </div>
            )}
          </div>

          {/* Next 5 upcoming */}
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <div className="px-4 py-3.5 border-b border-gray-100">
              <div className="text-[13.5px] font-semibold text-gray-900">Next Upcoming</div>
              <div className="text-[12px] text-gray-400 mt-0.5">Across all months</div>
            </div>
            <div className="divide-y divide-gray-50">
              {upcoming.map((d, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-3">
                  <span className={`w-2 h-2 rounded-full shrink-0 ${URGENCY[d.urgency].dot}`} />
                  <div className="flex-1 min-w-0">
                    <div className="text-[12px] font-medium text-gray-800 truncate">{d.name}</div>
                    <div className="text-[11px] text-gray-400">
                      {MONTH_NAMES[d.target.getMonth()]} {d.target.getDate()}
                    </div>
                  </div>
                  <span className={`text-[10.5px] font-semibold shrink-0 ${
                    d.daysLeft <= 14 ? 'text-red-600' :
                    d.daysLeft <= 30 ? 'text-amber-600' : 'text-gray-400'
                  }`}>
                    {d.daysLeft === 0 ? 'Today' : `${d.daysLeft}d`}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Incorporation info box */}
          <div className="bg-white rounded-2xl border border-gray-200 p-4 space-y-3">
            <div className="text-[13px] font-semibold text-gray-900">Company Status</div>
            <div className="space-y-2 text-[12.5px]">
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Incorporation</span>
                <span className={`font-medium ${incorporated ? 'text-emerald-600' : 'text-amber-600'}`}>
                  {incorporated ? company.incorporationDate : 'Pending'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">First FY</span>
                <span className="font-medium text-gray-700">
                  {firstFY ? 'In progress' : incorporated ? 'Completed' : '—'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">AGM Deadline</span>
                <span className="font-medium text-gray-700">
                  {incDate && firstFY
                    ? `${MONTH_NAMES[firstAgmDeadline(incDate).getMonth()]} ${firstAgmDeadline(incDate).getDate()}`
                    : 'Sep 30'}
                </span>
              </div>
            </div>
            {notYetIncorporated && (
              <p className="text-[11.5px] text-amber-600 bg-amber-50 rounded-lg px-3 py-2 leading-relaxed">
                Complete Step 6 (MCA Application) to activate real deadlines.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
