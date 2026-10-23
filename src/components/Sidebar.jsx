import {
  Bot,
  Home,
  MessageSquare,
  Building2,
  FileText,
  FilePen,
  Calendar,
  BookOpen,
  Calculator,
  Plus,
  Loader,
} from 'lucide-react'

const navItems = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'assistant', label: 'AI Assistant', icon: MessageSquare },
  { id: 'companies', label: 'My Companies', icon: Building2 },
  { id: 'documents', label: 'Documents', icon: FileText },
  { id: 'docgen', label: 'Legal Drafts', icon: FilePen },
]

const bottomNavItems = [
  { id: 'calendar', label: 'Compliance Calendar', icon: Calendar },
  { id: 'policies', label: 'Policies & Legal', icon: BookOpen },
  { id: 'cost', label: 'Cost Estimator', icon: Calculator },
]

export default function Sidebar({
  activeNav,
  onNavigate,
  onNewCompany,
  creatingCompany,
  companies,
  activeCompanyId,
  registrationsOpen,
  onToggleRegistrations,
  registrations,
  onSelectRegistration,
  onViewAllRegistrations,
}) {
  const activeCompany = companies?.find((c) => c.id === activeCompanyId)

  return (
    <aside className="w-64 shrink-0 bg-white border-r border-gray-200 flex flex-col h-screen">
      <div className="flex items-center gap-2 px-5 pt-5 pb-4">
        <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white">
          <Bot size={20} />
        </div>
        <div>
          <div className="font-semibold text-gray-900 text-[15px] leading-tight">Legal Information AI</div>
          <div className="text-[11px] text-gray-400 leading-tight">
            Your AI Co-pilot for
            <br />
            Business Registration &amp; Compliance
          </div>
        </div>
      </div>

      <div className="px-4 pb-3">
        <button
          onClick={onNewCompany}
          disabled={creatingCompany}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 transition-colors text-white text-sm font-medium py-2.5"
        >
          {creatingCompany ? (
            <><Loader size={14} className="animate-spin" /> Creating…</>
          ) : (
            <><Plus size={15} /> Start New Company</>
          )}
        </button>
      </div>

      {activeCompany?.name && (
        <div className="px-4 pb-2">
          <div className="bg-indigo-50 rounded-xl px-3 py-2">
            <div className="text-[10px] text-indigo-400 font-medium uppercase tracking-wide">Active</div>
            <div className="text-[12.5px] font-semibold text-indigo-800 truncate mt-0.5">{activeCompany.name}</div>
            <div className="text-[11px] text-indigo-400">{activeCompany.type || '—'}</div>
          </div>
        </div>
      )}

      <nav className="flex-1 overflow-y-auto px-3 space-y-0.5">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
              activeNav === item.id
                ? 'bg-indigo-50 text-indigo-700 font-medium'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <item.icon size={17} />
            <span className="flex-1 text-left">{item.label}</span>
            {item.id === 'companies' && companies?.length > 0 && (
              <span className="text-[10px] bg-indigo-100 text-indigo-600 font-semibold rounded-full w-5 h-5 flex items-center justify-center">
                {companies.length}
              </span>
            )}
          </button>
        ))}

        <div className="h-px bg-gray-100 my-2" />

        {bottomNavItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
              activeNav === item.id
                ? 'bg-indigo-50 text-indigo-700 font-medium'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <item.icon size={17} />
            <span className="flex-1 text-left">{item.label}</span>
          </button>
        ))}
      </nav>
    </aside>
  )
}
