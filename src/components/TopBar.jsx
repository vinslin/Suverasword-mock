import { useState, useRef, useEffect } from 'react'
import { Globe, Download, Bell, ChevronDown, AlertCircle, Info, CheckCircle2, AlertTriangle } from 'lucide-react'

const TYPE_META = {
  critical: { icon: AlertCircle,   dot: 'bg-red-500',    icon_cls: 'text-red-500'    },
  warning:  { icon: AlertTriangle, dot: 'bg-amber-500',  icon_cls: 'text-amber-500'  },
  info:     { icon: Info,          dot: 'bg-blue-500',   icon_cls: 'text-blue-500'   },
  success:  { icon: CheckCircle2,  dot: 'bg-emerald-500',icon_cls: 'text-emerald-500'},
}

export default function TopBar({ title, subtitle, onDownloadGuide, user, notifications = [] }) {
  const [notifOpen, setNotifOpen] = useState(false)
  const [userOpen, setUserOpen] = useState(false)
  const notifRef = useRef(null)
  const userRef = useRef(null)

  useEffect(() => {
    function onClick(e) {
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false)
      if (userRef.current && !userRef.current.contains(e.target)) setUserOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  return (
    <header className="h-[73px] shrink-0 border-b border-gray-200 bg-white flex items-center justify-between px-6">
      <div>
        <div className="font-semibold text-gray-900 text-base">{title}</div>
        <div className="flex items-center gap-1.5 text-[12px] text-gray-400">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
          {subtitle}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden md:flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-[13px] text-gray-600">
          <Globe size={15} className="text-emerald-500" />
          Data Source: Live Web Search
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
        </div>

        <button
          onClick={onDownloadGuide}
          className="flex items-center gap-2 rounded-lg bg-gray-900 hover:bg-gray-800 transition-colors text-white text-[13px] font-medium px-3.5 py-2"
        >
          <Download size={15} /> Download Guide
        </button>

        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setNotifOpen((v) => !v)}
            className="relative w-9 h-9 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50"
          >
            <Bell size={17} />
            {notifications.length > 0 && (
              <span className={`absolute -top-1.5 -right-1.5 text-white text-[10px] font-semibold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 ${
                notifications.some(n => n.type === 'critical') ? 'bg-red-500' :
                notifications.some(n => n.type === 'warning')  ? 'bg-amber-500' : 'bg-blue-500'
              }`}>
                {notifications.length}
              </span>
            )}
          </button>
          {notifOpen && (
            <div className="absolute right-0 mt-2 w-96 bg-white rounded-xl shadow-lg border border-gray-100 z-20 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                <span className="text-[13.5px] font-semibold text-gray-900">Notifications</span>
                {notifications.length > 0 && (
                  <span className="text-[11px] text-gray-400">{notifications.length} alert{notifications.length > 1 ? 's' : ''}</span>
                )}
              </div>
              <div className="max-h-[420px] overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="px-4 py-8 text-center text-[13px] text-gray-400">
                    All clear — no alerts right now.
                  </div>
                ) : (
                  notifications.map((n) => {
                    const meta = TYPE_META[n.type] ?? TYPE_META.info
                    const Icon = meta.icon
                    return (
                      <div key={n.id} className="flex gap-3 px-4 py-3 hover:bg-gray-50 border-b border-gray-50 last:border-0">
                        <Icon size={16} className={`shrink-0 mt-0.5 ${meta.icon_cls}`} />
                        <div className="min-w-0">
                          <div className="text-[13px] font-medium text-gray-800 leading-snug">{n.title}</div>
                          <div className="text-[12px] text-gray-500 mt-0.5 leading-relaxed">{n.body}</div>
                          <div className="text-[11px] text-gray-400 mt-1">{n.time}</div>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          )}
        </div>

        <div className="relative" ref={userRef}>
          <button onClick={() => setUserOpen((v) => !v)} className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-sm font-semibold">
              {user.initials}
            </div>
            <div className="text-left hidden sm:block">
              <div className="text-[13px] font-medium text-gray-900 leading-tight">{user.name}</div>
              <div className="text-[11px] text-gray-400 leading-tight">{user.role}</div>
            </div>
            <ChevronDown size={15} className="text-gray-400" />
          </button>
          {userOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1.5 z-20 text-[13px]">
              <div className="px-3.5 py-2 text-gray-500 truncate">{user.email}</div>
              <button className="w-full text-left px-3.5 py-2 hover:bg-gray-50 text-gray-700">Profile Settings</button>
              <button className="w-full text-left px-3.5 py-2 hover:bg-gray-50 text-gray-700">Sign Out</button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
