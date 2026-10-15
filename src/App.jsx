import { useEffect, useState } from 'react'
import {
  Home,
  Building2,
  ListChecks,
  FileText,
  Calendar,
  BookOpen,
  Calculator,
  HelpCircle,
  ShieldCheck,
  CheckCircle2,
  Clock3,
  Circle,
  ArrowRight,
} from 'lucide-react'
import Sidebar from './components/Sidebar'
import TopBar from './components/TopBar'
import ChatAssistant from './components/ChatAssistant'
import CompanyOverview from './components/CompanyOverview'
import RegistrationsTracker from './components/RegistrationsTracker'
import QuickLinksPanel from './components/QuickLinksPanel'
import RegistrationJourney from './components/RegistrationJourney'
import Modal from './components/Modal'
import PlaceholderPage from './components/PlaceholderPage'
import DirectorsPanel from './components/DirectorsPanel'
import DocumentsPanel from './components/DocumentsPanel'
import CompletenessCard from './components/CompletenessCard'
import { getCompany, getRegistrations, advanceRegistration, updateCompany } from './lib/api'

const statusMeta = {
  Completed: { icon: CheckCircle2, className: 'text-emerald-500' },
  'In Progress': { icon: Clock3, className: 'text-blue-500' },
  Pending: { icon: Clock3, className: 'text-amber-500' },
  'Not Started': { icon: Circle, className: 'text-gray-300' },
}

const user = {
  name: 'Sudharshan',
  role: 'Admin',
  email: 'vignesh.sivanesan@softsuave.com',
  initials: 'S',
}

const placeholderMeta = {
  home: {
    icon: Home,
    title: 'Home',
    description: "Your dashboard overview will show up here — recent activity, deadlines, and quick actions across all your companies.",
  },
  companies: {
    icon: Building2,
    title: 'My Companies',
    description: 'A list of every company you\'ve registered or are in the process of registering will appear here.',
  },
  tasks: {
    icon: ListChecks,
    title: 'Tasks & To-Dos',
    description: 'Action items generated from your registration journey and compliance calendar will be tracked here.',
  },
  documents: {
    icon: FileText,
    title: 'Documents',
    description: 'Upload, store, and manage every document your company needs for incorporation and compliance.',
  },
  calendar: {
    icon: Calendar,
    title: 'Compliance Calendar',
    description: 'Upcoming filing deadlines, board meetings, and statutory due dates will be shown here.',
  },
  policies: {
    icon: BookOpen,
    title: 'Policies & Legal',
    description: 'Reference templates and guidance for company policies, contracts, and legal obligations.',
  },
  cost: {
    icon: Calculator,
    title: 'Cost Estimator',
    description: 'Estimate government fees, professional charges, and ongoing compliance costs for your business.',
  },
  help: {
    icon: HelpCircle,
    title: 'Help & Support',
    description: "Reach out to our support team or browse frequently asked questions about company registration.",
  },
  newCompany: {
    icon: Building2,
    title: 'Start New Company',
    description: 'Kick off a new registration journey for another business entity — this flow mirrors the AI Assistant setup.',
  },
}

export default function App() {
  const [activeNav, setActiveNav] = useState('assistant')
  const [registrationsOpen, setRegistrationsOpen] = useState(true)
  const [registrations, setRegistrations] = useState([])
  const [company, setCompany] = useState(null)
  const [companyChecked, setCompanyChecked] = useState(false)
  const [loadError, setLoadError] = useState(null)
  const [lastUpdated, setLastUpdated] = useState('15 May 2024 · 10:04 AM')
  const [refreshing, setRefreshing] = useState(false)
  const [modal, setModal] = useState(null)
  const [docRefreshKey, setDocRefreshKey] = useState(0)

  useEffect(() => {
    async function load() {
      try {
        const registrationsData = await getRegistrations()
        setRegistrations(registrationsData)
      } catch (err) {
        setLoadError(err.message || 'Failed to load company data')
        return
      }

      try {
        const companyData = await getCompany()
        setCompany(companyData)
      } catch (err) {
        if (err.status !== 404) {
          setLoadError(err.message || 'Failed to load company data')
          return
        }
        // 404 just means no company has been created yet — not an error.
      }

      setCompanyChecked(true)
    }
    load()
  }, [])

  async function handleAdvanceRegistration(id) {
    const updated = await advanceRegistration(id)
    setRegistrations((prev) => prev.map((r) => (r.id === id ? updated : r)))
  }

  function handleRefresh() {
    setRefreshing(true)
    setTimeout(() => {
      setRefreshing(false)
      setLastUpdated(
        new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) +
          ' · ' +
          new Date().toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' }),
      )
    }, 900)
  }

  function handleDownloadGuide() {
    if (!company) return
    const lines = [
      `${company.name} — Registration Guide`,
      `Generated: ${new Date().toLocaleString('en-IN')}`,
      '',
      `Company Type: ${company.type}`,
      `Registered Office: ${company.registeredOffice}`,
      `Business Activity: ${company.businessActivity} (NIC ${company.nicCode})`,
      `Authorized Capital: ₹${company.authorizedCapital.toLocaleString('en-IN')}`,
      `Paid-up Capital: ₹${company.paidUpCapital.toLocaleString('en-IN')}`,
      '',
      'Registrations Status:',
      ...registrations.map((r) => `  - ${r.name}: ${r.status}${r.detail ? ` (${r.detail})` : ''}`),
      '',
      `Current Journey Step: ${company.journeyStep} of 8`,
    ]
    const blob = new Blob([lines.join('\n')], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${company.name.replace(/\s+/g, '_')}_Guide.txt`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  function handleCompanyUpdated(nextCompany) {
    setCompany(nextCompany)
  }

  function handleRegistrationsUpdated(nextRegistrations) {
    setRegistrations(nextRegistrations)
  }

  const selectedRegistration = typeof modal === 'object' && modal?.type === 'registration'
    ? registrations.find((r) => r.id === modal.id)
    : null

  if (loadError) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#f3f4f8] text-center px-6">
        <div>
          <div className="font-semibold text-gray-900 mb-1">Couldn't reach the backend</div>
          <div className="text-[13.5px] text-gray-500">{loadError}</div>
        </div>
      </div>
    )
  }

  if (!companyChecked) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#f3f4f8]">
        <div className="text-[13.5px] text-gray-500">Loading company data…</div>
      </div>
    )
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#f3f4f8]">
      <Sidebar
        activeNav={activeNav}
        onNavigate={setActiveNav}
        registrationsOpen={registrationsOpen}
        onToggleRegistrations={() => setRegistrationsOpen((v) => !v)}
        registrations={registrations}
        onSelectRegistration={(id) => {
          setActiveNav('assistant')
          setModal({ type: 'registration', id })
        }}
        onViewAllRegistrations={() => {
          setActiveNav('assistant')
          setModal({ type: 'allRegistrations' })
        }}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <TopBar
          title="AI Assistant"
          subtitle="Online"
          onDownloadGuide={handleDownloadGuide}
          user={user}
        />

        {activeNav === 'assistant' ? (
          <>
            <div className="flex-1 flex min-h-0">
              <div className="flex-1 flex flex-col min-w-0 border-r border-gray-200">
                <ChatAssistant
                  onCompanyUpdated={handleCompanyUpdated}
                  onRegistrationsUpdated={handleRegistrationsUpdated}
                  onDocumentUploaded={() => setDocRefreshKey((k) => k + 1)}
                />
              </div>

              <div className="w-[360px] shrink-0 overflow-y-auto px-5 py-5 space-y-4">
                {company ? (
                  <>
                    <CompanyOverview company={company} onViewDetails={() => setModal({ type: 'companyDetails' })} />
                    <CompletenessCard refreshKey={docRefreshKey} />
                    <DirectorsPanel journeyStep={company.journeyStep} />
                    <DocumentsPanel refreshKey={docRefreshKey} />
                    <RegistrationsTracker
                      registrations={registrations}
                      onAdvance={handleAdvanceRegistration}
                      onViewAll={() => setModal({ type: 'allRegistrations' })}
                    />
                  </>
                ) : (
                  <div className="bg-white rounded-2xl border border-gray-200 p-5 text-center">
                    <Building2 size={22} className="mx-auto text-indigo-400 mb-2" />
                    <div className="font-semibold text-gray-900 text-[14px] mb-1">No company yet</div>
                    <p className="text-[12.5px] text-gray-500 leading-relaxed">
                      Tell the assistant about your business — its name, type, and what it
                      does — to get started.
                    </p>
                  </div>
                )}
                <QuickLinksPanel lastUpdated={lastUpdated} onRefresh={handleRefresh} refreshing={refreshing} />
              </div>
            </div>

            {company && <RegistrationJourney currentStep={company.journeyStep} />}
          </>
        ) : (
          <PlaceholderPage {...(placeholderMeta[activeNav] ?? placeholderMeta.home)} />
        )}
      </div>

      {modal?.type === 'companyDetails' && (
        <Modal title="Company Details" onClose={() => setModal(null)}>
          <CompanyDetailsForm
            company={company}
            onSave={async (next) => {
              const updated = await updateCompany(next)
              setCompany(updated)
              setModal(null)
            }}
          />
        </Modal>
      )}

      {modal?.type === 'allRegistrations' && (
        <Modal title="All Registrations" onClose={() => setModal(null)} width="max-w-2xl">
          <div className="divide-y divide-gray-100 -mt-1">
            {registrations.map((r) => {
              const meta = statusMeta[r.status] ?? statusMeta['Not Started']
              const Icon = meta.icon
              return (
                <div key={r.id} className="flex items-center gap-3 py-3">
                  <Icon size={18} className={`${meta.className} shrink-0`} />
                  <div className="flex-1 min-w-0">
                    <div className="text-[13.5px] font-medium text-gray-900">{r.name}</div>
                    <div className="text-[12px] text-gray-400">{r.detail}</div>
                  </div>
                  <span className="text-[12px] font-medium text-gray-600">{r.status}</span>
                  {r.status !== 'Completed' && (
                    <button
                      onClick={() => handleAdvanceRegistration(r.id)}
                      className="text-[12px] font-medium text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                    >
                      {r.status === 'In Progress' ? 'Continue' : 'Start'} <ArrowRight size={12} />
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        </Modal>
      )}

      {selectedRegistration && (
        <Modal title={selectedRegistration.name} onClose={() => setModal(null)}>
          <div className="space-y-3 text-[13.5px]">
            <div className="flex items-center gap-2">
              <ShieldCheck size={16} className="text-indigo-500" />
              <span className="font-medium text-gray-900">{selectedRegistration.status}</span>
            </div>
            <p className="text-gray-500">{selectedRegistration.detail}</p>
            {selectedRegistration.status !== 'Completed' && (
              <button
                onClick={() => {
                  handleAdvanceRegistration(selectedRegistration.id)
                }}
                className="rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-[13px] font-medium px-4 py-2"
              >
                {selectedRegistration.status === 'In Progress' ? 'Mark as Completed' : 'Start Registration'}
              </button>
            )}
          </div>
        </Modal>
      )}
    </div>
  )
}

const INDIAN_STATES = [
  'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa','Gujarat',
  'Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh',
  'Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Punjab','Rajasthan',
  'Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh','Uttarakhand','West Bengal',
  'Andaman and Nicobar Islands','Chandigarh','Dadra and Nagar Haveli and Daman and Diu',
  'Delhi','Jammu and Kashmir','Ladakh','Lakshadweep','Puducherry',
]

function TextField({ label, value, onChange, placeholder }) {
  return (
    <label className="block">
      <span className="text-[12px] text-gray-500 mb-1 block">{label}</span>
      <input
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-[13.5px] outline-none focus:border-indigo-400"
      />
    </label>
  )
}

function CompanyDetailsForm({ company, onSave }) {
  const [form, setForm] = useState(company)
  function set(key, val) { setForm((f) => ({ ...f, [key]: val })) }

  function handleSubmit(e) {
    e.preventDefault()
    const parts = [form.street, form.city, form.state, form.pincode].filter(Boolean)
    const registeredOffice = parts.length ? parts.join(', ') : form.registeredOffice
    onSave({ ...form, registeredOffice })
  }

  return (
    <form className="space-y-3.5" onSubmit={handleSubmit}>
      <TextField label="Company Name" value={form.name} onChange={(v) => set('name', v)} />
      <TextField label="Company Type" value={form.type} onChange={(v) => set('type', v)} />
      <TextField label="Business Activity" value={form.businessActivity} onChange={(v) => set('businessActivity', v)} />
      <TextField label="Incorporation State" value={form.incorporationState} onChange={(v) => set('incorporationState', v)} />

      <div className="border border-gray-200 rounded-xl p-3.5 space-y-3">
        <div className="text-[12px] font-medium text-gray-600">Registered Office Address</div>
        <TextField
          label="Street / Building / Flat"
          value={form.street}
          onChange={(v) => set('street', v)}
          placeholder="e.g. No. 12, 3rd Floor, MG Road"
        />
        <div className="grid grid-cols-2 gap-3">
          <TextField label="City" value={form.city} onChange={(v) => set('city', v)} placeholder="e.g. Bengaluru" />
          <label className="block">
            <span className="text-[12px] text-gray-500 mb-1 block">State</span>
            <select
              value={form.state ?? ''}
              onChange={(e) => set('state', e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-[13.5px] outline-none focus:border-indigo-400 bg-white"
            >
              <option value="">— select —</option>
              {INDIAN_STATES.map((s) => <option key={s}>{s}</option>)}
            </select>
          </label>
        </div>
        <TextField
          label="Pincode"
          value={form.pincode}
          onChange={(v) => set('pincode', v)}
          placeholder="6-digit pincode"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className="text-[12px] text-gray-500 mb-1 block">Authorized Capital (₹)</span>
          <input
            type="number"
            value={form.authorizedCapital}
            onChange={(e) => set('authorizedCapital', Number(e.target.value))}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-[13.5px] outline-none focus:border-indigo-400"
          />
        </label>
        <label className="block">
          <span className="text-[12px] text-gray-500 mb-1 block">Paid-up Capital (₹)</span>
          <input
            type="number"
            value={form.paidUpCapital}
            onChange={(e) => set('paidUpCapital', Number(e.target.value))}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-[13.5px] outline-none focus:border-indigo-400"
          />
        </label>
      </div>
      <button
        type="submit"
        className="w-full rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-[13.5px] font-medium py-2.5 mt-1"
      >
        Save Changes
      </button>
    </form>
  )
}
