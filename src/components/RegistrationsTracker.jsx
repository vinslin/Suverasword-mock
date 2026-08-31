import { CheckCircle2, Clock3, Circle, ArrowRight } from 'lucide-react'

const statusMeta = {
  Completed: { icon: CheckCircle2, iconClass: 'text-emerald-500', badgeClass: 'bg-emerald-50 text-emerald-600' },
  'In Progress': { icon: Clock3, iconClass: 'text-blue-500', badgeClass: 'bg-blue-50 text-blue-600' },
  Pending: { icon: Clock3, iconClass: 'text-amber-500', badgeClass: 'bg-amber-50 text-amber-600' },
  'Not Started': { icon: Circle, iconClass: 'text-gray-300', badgeClass: 'bg-gray-100 text-gray-500' },
}

export default function RegistrationsTracker({ registrations, onAdvance, onViewAll }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="font-semibold text-gray-900">Registrations Tracker</div>
        <button onClick={onViewAll} className="text-[13px] font-medium text-indigo-600 hover:text-indigo-700">
          View All
        </button>
      </div>

      <div className="divide-y divide-gray-100">
        {registrations.map((reg) => {
          const meta = statusMeta[reg.status] ?? statusMeta['Not Started']
          const Icon = meta.icon
          const isDone = reg.status === 'Completed'
          return (
            <div key={reg.id} className="flex items-center gap-3 py-3">
              <Icon size={18} className={`${meta.iconClass} shrink-0`} />
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-medium text-gray-900">{reg.name}</div>
                <div className="text-[12px] text-gray-400 truncate">{reg.detail}</div>
              </div>
              <div className="text-right shrink-0">
                <span className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full ${meta.badgeClass}`}>
                  {reg.status}
                </span>
                <div className="mt-1">
                  {isDone ? (
                    <span className="text-[11px] text-gray-400">{reg.date}</span>
                  ) : (
                    <button
                      onClick={() => onAdvance(reg.id)}
                      className="text-[11px] font-medium text-indigo-600 hover:text-indigo-700 inline-flex items-center gap-0.5"
                    >
                      {reg.status === 'In Progress' ? 'Continue' : 'Start'} <ArrowRight size={11} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <button
        onClick={onViewAll}
        className="w-full flex items-center justify-center gap-1.5 text-[13px] font-medium text-indigo-600 hover:text-indigo-700 pt-3"
      >
        View All Registrations <ArrowRight size={14} />
      </button>
    </div>
  )
}
