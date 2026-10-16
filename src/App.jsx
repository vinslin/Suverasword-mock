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
import DocumentsPage from './components/DocumentsPage'
import CostEstimatorPage from './components/CostEstimatorPage'
import PoliciesPage from './components/PoliciesPage'
import ComplianceCalendarPage from './components/ComplianceCalendarPage'
import DirectorsPanel from './components/DirectorsPanel'
import DocumentsPanel from './components/DocumentsPanel'
import CompletenessCard from './components/CompletenessCard'
import MyCompaniesPage from './components/MyCompaniesPage'
import {
  listCompanies,
  createCompany,
  getCompany,
  getRegistrations,
  advanceRegistration,
  updateCompany,
} from './lib/api'

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
}

export default function App() {
  const [activeNav, setActiveNav] = useState('assistant')
  const [registrationsOpen, setRegistrationsOpen] = useState(true)

  // Multi-company state
  const [companies, setCompanies] = useState([])
  const [activeCompanyId, setActiveCompanyId] = useState(null)
  const [creatingCompany, setCreatingCompany] = useState(false)

  // Active company data
  const [registrations, setRegistrations] = useState([])
  const [company, setCompany] = useState(null)
  const [companyChecked, setCompanyChecked] = useState(false)
  const [loadError, setLoadError] = useState(null)

  const [lastUpdated, setLastUpdated] = useState('15 May 2024 · 10:04 AM')
  const [refreshing, setRefreshing] = useState(false)
  const [modal, setModal] = useState(null)
  const [docRefreshKey, setDocRefreshKey] = useState(0)

  // Load companies list on mount
  useEffect(() => {
    async function loadCompanies() {
      try {
        const list = await listCompanies()
        setCompanies(list)
        if (list.length > 0) {
          setActiveCompanyId(list[0].id)
        } else {
          setCompanyChecked(true)
        }
      } catch (err) {
        setLoadError(err.message || 'Failed to reach the backend')
      }
    }
    loadCompanies()
  }, [])

  // Load active company data whenever activeCompanyId changes
  useEffect(() => {
    if (!activeCompanyId) return

    setCompany(null)
    setRegistrations([])
    setCompanyChecked(false)

    async function loadActiveCompany() {
      try {
        const regs = await getRegistrations(activeCompanyId)
        setRegistrations(regs)
      } catch (err) {
        setLoadError(err.message || 'Failed to load registrations')
        setCompanyChecked(true)
        return
      }

      try {
        const companyData = await getCompany(activeCompanyId)
        // Only set company if it has a name (not a blank shell)
        if (companyData.name) {
          setCompany(companyData)
        }
      } catch (err) {
        if (err.status !== 404) {
          setLoadError(err.message || 'Failed to load company data')
        }
      }

      setCompanyChecked(true)
    }

    loadActiveCompany()
  }, [activeCompanyId])

  async function handleNewCompany() {
    setCreatingCompany(true)
    try {
      const newCompany = await createCompany()
      setCompanies((prev) => [...prev, newCompany])
      setActiveCompanyId(newCompany.id)
      setActiveNav('assistant')
    } catch (err) {
      alert('Failed to create company: ' + (err.message || 'Unknown error'))
    } finally {
      setCreatingCompany(false)
    }
  }

  function handleSelectCompany(id) {
    setActiveCompanyId(id)
    setActiveNav('assistant')
    setModal(null)
  }

  async function handleAdvanceRegistration(id) {
    if (!activeCompanyId) return
    const updated = await advanceRegistration(activeCompanyId, id)
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
    setCompanies((prev) =>
      prev.map((c) =>
        c.id === nextCompany.id
          ? { ...c, name: nextCompany.name, type: nextCompany.type, journeyStep: nextCompany.journeyStep }
          : c,
      ),
    )
  }

  function handleRegistrationsUpdated(nextRegistrations) {
    setRegistrations(nextRegistrations)
  }

  const selectedRegistration =
    typeof modal === 'object' && modal?.type === 'registration'
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

  if (!companyChecked && activeCompanyId) {
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
        onNewCompany={handleNewCompany}
        creatingCompany={creatingCompany}
        companies={companies}
        activeCompanyId={activeCompanyId}
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
                {activeCompanyId ? (
                  <ChatAssistant
                    companyId={activeCompanyId}
                    onCompanyUpdated={handleCompanyUpdated}
                    onRegistrationsUpdated={handleRegistrationsUpdated}
                    onDocumentUploaded={() => setDocRefreshKey((k) => k + 1)}
                  />
                ) : (
                  <div className="flex-1 flex items-center justify-center p-8 text-center">
                    <div>
                      <Building2 size={40} className="mx-auto text-indigo-200 mb-4" />
                      <div className="text-[15px] font-semibold text-gray-900 mb-2">No active company</div>
                      <p className="text-[13px] text-gray-500 mb-4">
                        Select a company from "My Companies" or start a new one.
                      </p>
                      <button
                        onClick={handleNewCompany}
                        disabled={creatingCompany}
                        className="rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-[13px] font-medium px-5 py-2.5"
                      >
                        {creatingCompany ? 'Creating…' : '+ Start New Company'}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="w-[360px] shrink-0 overflow-y-auto px-5 py-5 space-y-4">
                {company ? (
                  <>
                    <CompanyOverview company={company} onViewDetails={() => setModal({ type: 'companyDetails' })} />
                    <CompletenessCard companyId={activeCompanyId} refreshKey={docRefreshKey} />
                    <DirectorsPanel companyId={activeCompanyId} journeyStep={company.journeyStep} />
                    <DocumentsPanel companyId={activeCompanyId} refreshKey={docRefreshKey} />
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
                      Tell the assistant about your business — its name, type, and what it does — to get started.
                    </p>
                  </div>
                )}
                <QuickLinksPanel lastUpdated={lastUpdated} onRefresh={handleRefresh} refreshing={refreshing} />
              </div>
            </div>

            {company && <RegistrationJourney currentStep={company.journeyStep} />}
          </>
        ) : activeNav === 'companies' ? (
          <MyCompaniesPage
            companies={companies}
            onSelect={handleSelectCompany}
            onNewCompany={handleNewCompany}
            creating={creatingCompany}
            activeCompanyId={activeCompanyId}
          />
        ) : activeNav === 'documents' ? (
          <DocumentsPage companyId={activeCompanyId} />
        ) : activeNav === 'cost' ? (
          <CostEstimatorPage companyId={activeCompanyId} />
        ) : activeNav === 'calendar' ? (
          <ComplianceCalendarPage />
        ) : activeNav === 'policies' ? (
          <PoliciesPage company={company} companyId={activeCompanyId} />
        ) : (
          <PlaceholderPage {...(placeholderMeta[activeNav] ?? placeholderMeta.home)} />
        )}
      </div>

      {modal?.type === 'companyDetails' && (
        <Modal title="Company Details" onClose={() => setModal(null)}>
          <CompanyDetailsForm
            company={company}
            onSave={async (next) => {
              const updated = await updateCompany(activeCompanyId, next)
              handleCompanyUpdated(updated)
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
                onClick={() => handleAdvanceRegistration(selectedRegistration.id)}
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
