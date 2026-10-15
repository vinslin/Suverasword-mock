import {
  Bot,
  Home,
  MessageSquare,
  Building2,
  FileText,
  Calendar,
  BookOpen,
  Calculator,
  HelpCircle,
  LifeBuoy,
} from 'lucide-react'

const navItems = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'assistant', label: 'AI Assistant', icon: MessageSquare },
  { id: 'companies', label: 'My Companies', icon: Building2 },
  { id: 'documents', label: 'Documents', icon: FileText },
]

const bottomNavItems = [
  { id: 'calendar', label: 'Compliance Calendar', icon: Calendar },
  { id: 'policies', label: 'Policies & Legal', icon: BookOpen },
  { id: 'cost', label: 'Cost Estimator', icon: Calculator },
  { id: 'help', label: 'Help & Support', icon: HelpCircle },
]

export default function Sidebar({
  activeNav,
  onNavigate,
  registrationsOpen,
  onToggleRegistrations,
  registrations,
  onSelectRegistration,
  onViewAllRegistrations,
}) {
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
          onClick={() => onNavigate('newCompany')}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 transition-colors text-white text-sm font-medium py-2.5"
        >
          <span className="text-lg leading-none">+</span> Start New Company
        </button>
      </div>

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
            {item.badge ? (
              <span className="bg-red-500 text-white text-[10px] font-semibold rounded-full w-5 h-5 flex items-center justify-center">
                {item.badge}
              </span>
            ) : null}
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

      <div className="p-4">
        <div className="rounded-xl bg-indigo-50 p-4">
          <div className="text-sm font-semibold text-indigo-900 mb-1">Need Help?</div>
          <div className="text-[12px] text-indigo-900/70 mb-3">Talk to our support team</div>
          <button
            onClick={() => onNavigate('help')}
            className="w-full flex items-center justify-center gap-2 rounded-lg bg-white border border-indigo-200 text-indigo-700 text-[13px] font-medium py-2"
          >
            <LifeBuoy size={15} /> Contact Support
          </button>
        </div>
      </div>
    </aside>
  )
}
