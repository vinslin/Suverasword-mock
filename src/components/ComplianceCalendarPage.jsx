import { useState } from 'react'
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react'

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December']

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

// month is 1-indexed
const DEADLINES = [
  { name: 'POSH Annual Report', month: 1, day: 31, desc: 'ICC must submit annual report to employer and District Officer', urgency: 'medium' },
  { name: 'TDS Return (26Q) — Q3', month: 1, day: 31, desc: 'TDS quarterly return for Oct–Dec quarter', urgency: 'high' },
  { name: 'Advance Tax — Instalment 4', month: 3, day: 15, desc: '100% of annual tax liability (cumulative)', urgency: 'low' },
  { name: 'TDS Return (26Q) — Q4', month: 5, day: 31, desc: 'TDS quarterly return for Jan–Mar quarter', urgency: 'high' },
  { name: 'Advance Tax — Instalment 1', month: 6, day: 15, desc: '15% of annual tax liability', urgency: 'low' },
  { name: 'TDS Return (26Q) — Q1', month: 7, day: 31, desc: 'TDS quarterly return for Apr–Jun quarter', urgency: 'high' },
  { name: 'Advance Tax — Instalment 2', month: 9, day: 15, desc: '45% of annual tax liability (cumulative)', urgency: 'low' },
  { name: 'Annual General Meeting (AGM)', month: 9, day: 30, desc: 'Within 6 months of financial year end (FY ends Mar 31)', urgency: 'medium' },
  { name: 'Director KYC (DIR-3 KYC)', month: 9, day: 30, desc: 'All directors must file — ₹5,000 penalty for delay', urgency: 'medium' },
  { name: 'Financial Statements (AOC-4)', month: 10, day: 29, desc: '30 days after AGM — mandatory for all companies', urgency: 'high' },
  { name: 'TDS Return (26Q) — Q2', month: 10, day: 31, desc: 'TDS quarterly return for Jul–Sep quarter', urgency: 'high' },
  { name: 'Income Tax Return (ITR-6)', month: 10, day: 31, desc: 'For companies requiring audit under IT Act', urgency: 'high' },
  { name: 'Annual Return Filing (MGT-7)', month: 11, day: 29, desc: '60 days after AGM — penalty ₹100/day for delay', urgency: 'high' },
  { name: 'Advance Tax — Instalment 3', month: 12, day: 15, desc: '75% of annual tax liability (cumulative)', urgency: 'low' },
  { name: 'GST Annual Return (GSTR-9)', month: 12, day: 31, desc: 'If annual turnover > ₹2Cr', urgency: 'medium' },
]

const URGENCY = {
  high:   { dot: 'bg-red-500',    badge: 'bg-red-50 text-red-600',    label: 'Critical' },
  medium: { dot: 'bg-amber-500',  badge: 'bg-amber-50 text-amber-600', label: 'Important' },
  low:    { dot: 'bg-green-500',  badge: 'bg-green-50 text-green-600', label: 'Routine' },
}

function getDaysInMonth(year, month) {
  return new Date(year, month, 0).getDate()
}

function getFirstDayOfWeek(year, month) {
  return new Date(year, month - 1, 1).getDay()
}

function daysUntil(month, day) {
  const today = new Date()
  const year = today.getMonth() + 1 > month
    ? today.getFullYear() + 1
    : today.getFullYear()
  const target = new Date(year, month - 1, day)
  const diff = Math.ceil((target - today) / (1000 * 60 * 60 * 24))
  return diff
}

export default function ComplianceCalendarPage() {
  const today = new Date()
  const [viewYear, setViewYear] = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth() + 1)
  const [selected, setSelected] = useState(null)

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

  const daysInMonth = getDaysInMonth(viewYear, viewMonth)
  const firstDow = getFirstDayOfWeek(viewYear, viewMonth)

  const deadlinesThisMonth = DEADLINES.filter(d => d.month === viewMonth)

  const byDay = {}
  deadlinesThisMonth.forEach(d => {
    if (!byDay[d.day]) byDay[d.day] = []
    byDay[d.day].push(d)
  })

  const selectedDeadlines = selected ? (byDay[selected] ?? []) : []

  const totalCells = Math.ceil((firstDow + daysInMonth) / 7) * 7
  const cells = Array.from({ length: totalCells }, (_, i) => {
    const day = i - firstDow + 1
    return day >= 1 && day <= daysInMonth ? day : null
  })

  const isToday = (day) =>
    day === today.getDate() &&
    viewMonth === today.getMonth() + 1 &&
    viewYear === today.getFullYear()

  return (
    <div className="flex-1 overflow-y-auto bg-[#f3f4f8]">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-[18px] font-semibold text-gray-900">Compliance Calendar</h1>
          <p className="text-[13px] text-gray-400 mt-0.5">Statutory filing deadlines plotted on a calendar — know what's due and when</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-6 flex gap-5">

        {/* ── Calendar ── */}
        <div className="flex-1 min-w-0">
          {/* Legend */}
          <div className="flex gap-3 mb-4">
            {['high', 'medium', 'low'].map(u => (
              <div key={u} className={`flex items-center gap-1.5 text-[12px] font-medium px-3 py-1.5 rounded-full ${URGENCY[u].badge}`}>
                <span className={`w-2 h-2 rounded-full ${URGENCY[u].dot}`} />
                {URGENCY[u].label}
              </div>
            ))}
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
                const isSelected = day && selected === day
                const isTodayCell = day && isToday(day)
                return (
                  <div
                    key={i}
                    onClick={() => day && setSelected(isSelected ? null : day)}
                    className={`min-h-[80px] p-2 flex flex-col gap-1 transition-colors ${
                      !day ? 'bg-gray-50/50' :
                      isSelected ? 'bg-indigo-50 cursor-pointer' :
                      'hover:bg-gray-50 cursor-pointer'
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
                          {events.slice(0, 2).map((e, j) => (
                            <div key={j} className={`text-[10px] font-medium px-1.5 py-0.5 rounded-md truncate ${URGENCY[e.urgency].badge}`}>
                              {e.name.length > 18 ? e.name.slice(0, 17) + '…' : e.name}
                            </div>
                          ))}
                          {events.length > 2 && (
                            <div className="text-[10px] text-gray-400 font-medium px-1.5">+{events.length - 2} more</div>
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
                  <div key={i} className="flex items-start gap-3 px-5 py-3.5">
                    <span className={`w-2.5 h-2.5 rounded-full shrink-0 mt-1.5 ${URGENCY[d.urgency].dot}`} />
                    <div className="flex-1">
                      <div className="text-[13.5px] font-medium text-gray-900">{d.name}</div>
                      <div className="text-[12px] text-gray-400 mt-0.5">{d.desc}</div>
                    </div>
                    <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full shrink-0 ${URGENCY[d.urgency].badge}`}>
                      {URGENCY[d.urgency].label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Sidebar: upcoming ── */}
        <div className="w-[280px] shrink-0 space-y-4">
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <div className="px-4 py-3.5 border-b border-gray-100">
              <div className="text-[13.5px] font-semibold text-gray-900">
                {MONTH_NAMES[viewMonth - 1]} Deadlines
              </div>
              <div className="text-[12px] text-gray-400 mt-0.5">
                {deadlinesThisMonth.length} filing{deadlinesThisMonth.length !== 1 ? 's' : ''} this month
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
                      className="w-full flex items-start gap-3 px-4 py-3 hover:bg-gray-50 text-left transition-colors"
                    >
                      <div className={`text-[11px] font-bold px-1.5 py-0.5 rounded min-w-[28px] text-center ${URGENCY[d.urgency].badge}`}>
                        {d.day}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[12.5px] font-medium text-gray-800 leading-snug">{d.name}</div>
                        <div className={`text-[10.5px] font-semibold mt-0.5 ${URGENCY[d.urgency].badge.split(' ')[1]}`}>
                          {URGENCY[d.urgency].label}
                        </div>
                      </div>
                    </button>
                  ))}
              </div>
            )}
          </div>

          {/* Upcoming across all months */}
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <div className="px-4 py-3.5 border-b border-gray-100">
              <div className="text-[13.5px] font-semibold text-gray-900">Next Upcoming</div>
            </div>
            <div className="divide-y divide-gray-50">
              {DEADLINES
                .map(d => ({ ...d, daysLeft: daysUntil(d.month, d.day) }))
                .filter(d => d.daysLeft >= 0)
                .sort((a, b) => a.daysLeft - b.daysLeft)
                .slice(0, 5)
                .map((d, i) => (
                  <div key={i} className="flex items-center gap-3 px-4 py-3">
                    <span className={`w-2 h-2 rounded-full shrink-0 ${URGENCY[d.urgency].dot}`} />
                    <div className="flex-1 min-w-0">
                      <div className="text-[12px] font-medium text-gray-800 truncate">{d.name}</div>
                      <div className="text-[11px] text-gray-400">{MONTH_NAMES[d.month - 1]} {d.day}</div>
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
        </div>
      </div>
    </div>
  )
}
