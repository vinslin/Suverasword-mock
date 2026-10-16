import { useState, useEffect } from 'react'
import {
  BookOpen, FileText, ShieldCheck, AlertTriangle, CheckCircle2,
  Clock, Download, Search, ChevronDown, ChevronRight, Sparkles,
  Loader, ExternalLink, Scale, Building2, Users, Info,
  Calendar, AlertCircle, Send,
} from 'lucide-react'
import { getDocuments, postChatMessage } from '../lib/api'

// ─── Static data ──────────────────────────────────────────────────────────────

const TEMPLATES = [
  // Corporate
  { id: 't1', category: 'Corporate', name: 'Memorandum of Association (MOA)', desc: 'Defines the company\'s objectives and scope of operations.', content: 'MEMORANDUM OF ASSOCIATION\n\nCompany Name: [COMPANY NAME]\nRegistered Office: [ADDRESS]\n\nI. Name Clause\n   The name of the Company is [COMPANY NAME] Private Limited.\n\nII. Registered Office Clause\n   The Registered Office of the Company will be situated in the State of [STATE].\n\nIII. Objects Clause\n   The main objects of the Company are:\n   1. [MAIN BUSINESS ACTIVITY]\n   2. To carry on all ancillary activities.\n\nIV. Liability Clause\n   The liability of the members is limited.\n\nV. Capital Clause\n   Authorized Capital: ₹[AMOUNT]\n   Divided into [NUMBER] equity shares of ₹10 each.\n\nSubscribed and signed this [DATE].' },
  { id: 't2', category: 'Corporate', name: 'Board Resolution Template', desc: 'Standard template for recording board decisions.', content: 'BOARD RESOLUTION\n\nCompany: [COMPANY NAME] Private Limited\nDate: [DATE]\nVenue: [VENUE]\n\nDIRECTORS PRESENT:\n1. [DIRECTOR 1] — Managing Director\n2. [DIRECTOR 2] — Director\n\nRESOLUTION:\n"RESOLVED THAT [STATE THE RESOLUTION HERE]"\n\n"RESOLVED FURTHER THAT [DIRECTOR NAME] be and is hereby authorized to sign and execute all necessary documents in connection with the above."\n\nChairperson: _______________\nDate: [DATE]' },
  { id: 't3', category: 'Corporate', name: 'Shareholders Agreement', desc: 'Governs the relationship between company shareholders.', content: 'SHAREHOLDERS AGREEMENT\n\nThis Agreement is entered into on [DATE] between:\n1. [SHAREHOLDER 1] ("Founder A")\n2. [SHAREHOLDER 2] ("Founder B")\n\n1. SHAREHOLDING\n   Founder A: [X]% equity shares\n   Founder B: [Y]% equity shares\n\n2. BOARD COMPOSITION\n   Each founder shall have the right to appoint one Director.\n\n3. TRANSFER RESTRICTIONS\n   No shareholder shall transfer shares without prior written consent.\n\n4. ANTI-DILUTION\n   Existing shareholders shall have pre-emptive rights on new share issuances.\n\n5. DISPUTE RESOLUTION\n   Disputes shall be resolved by arbitration under the Arbitration Act, 1996.\n\nSigned: _____________ Date: _____________' },
  { id: 't4', category: 'Corporate', name: 'Founders Agreement', desc: 'Outlines roles, equity, vesting, and exit terms for founders.', content: 'FOUNDERS AGREEMENT\n\nParties:\n1. [FOUNDER 1 NAME] — [ROLE]\n2. [FOUNDER 2 NAME] — [ROLE]\n\n1. EQUITY SPLIT\n   Founder 1: [X]%  |  Founder 2: [Y]%\n\n2. VESTING SCHEDULE\n   4-year vesting with a 1-year cliff.\n   25% vests after 12 months, remaining vests monthly.\n\n3. ROLES & RESPONSIBILITIES\n   Founder 1: [RESPONSIBILITIES]\n   Founder 2: [RESPONSIBILITIES]\n\n4. IP ASSIGNMENT\n   All IP created by founders is assigned to the Company.\n\n5. NON-COMPETE\n   During employment and 1 year after, founders shall not compete.\n\n6. EXIT\n   Buyout formula: [FORMULA]\n\nDate: [DATE]' },

  // HR
  { id: 't5', category: 'HR', name: 'Employment Contract', desc: 'Standard offer and employment terms for new hires.', content: 'EMPLOYMENT AGREEMENT\n\nEmployer: [COMPANY NAME] Private Limited\nEmployee: [EMPLOYEE NAME]\nDesignation: [DESIGNATION]\nDepartment: [DEPARTMENT]\nDate of Joining: [DATE]\n\n1. COMPENSATION\n   Gross CTC: ₹[AMOUNT] per annum\n   Components: Basic, HRA, Special Allowance, PF\n\n2. WORKING HOURS\n   5 days a week, 9 AM to 6 PM\n\n3. PROBATION\n   6 months probation period\n\n4. LEAVE ENTITLEMENT\n   Annual Leave: 18 days | Sick Leave: 10 days | Casual Leave: 6 days\n\n5. CONFIDENTIALITY\n   Employee shall not disclose any confidential information.\n\n6. TERMINATION\n   Either party may terminate with 30 days notice.\n\nSigned: _______________ Date: _______________' },
  { id: 't6', category: 'HR', name: 'Non-Disclosure Agreement (NDA)', desc: 'Protects confidential business information shared with employees or partners.', content: 'NON-DISCLOSURE AGREEMENT\n\nThis NDA is entered into between:\nDisclosing Party: [COMPANY NAME]\nReceiving Party: [EMPLOYEE/PARTNER NAME]\n\n1. CONFIDENTIAL INFORMATION\n   Includes business plans, financials, customer data, IP, and trade secrets.\n\n2. OBLIGATIONS\n   The Receiving Party shall:\n   a) Not disclose to third parties\n   b) Use only for authorized purposes\n   c) Protect with the same care as own confidential information\n\n3. EXCLUSIONS\n   Information that is publicly known or independently developed is excluded.\n\n4. TERM\n   This agreement is valid for 3 years from the date of signing.\n\n5. GOVERNING LAW\n   Laws of India. Disputes under jurisdiction of [CITY] courts.\n\nSigned: _____________ Date: _____________' },
  { id: 't7', category: 'HR', name: 'POSH Policy', desc: 'Prevention of Sexual Harassment policy as required under POSH Act 2013.', content: 'PREVENTION OF SEXUAL HARASSMENT (POSH) POLICY\n\nCompany: [COMPANY NAME] Private Limited\nEffective Date: [DATE]\n\n1. COMMITMENT\n   The Company is committed to providing a safe workplace free from sexual harassment.\n\n2. SCOPE\n   Applies to all employees, consultants, vendors, and visitors.\n\n3. DEFINITION\n   Sexual harassment includes unwelcome physical, verbal, or non-verbal conduct of a sexual nature.\n\n4. INTERNAL COMPLAINTS COMMITTEE (ICC)\n   Presiding Officer: [NAME] (Senior Female Employee)\n   Member 1: [NAME]\n   Member 2: [NAME] (External Member — NGO)\n\n5. COMPLAINT PROCESS\n   File complaint in writing within 3 months of incident.\n   ICC shall complete inquiry within 90 days.\n\n6. CONSEQUENCES\n   Proven harassment may result in termination and legal action.\n\nPolicy Owner: HR Department | Review: Annual' },
  { id: 't8', category: 'HR', name: 'Leave Policy', desc: 'Defines leave types, entitlements, and approval process.', content: 'LEAVE POLICY\n\nCompany: [COMPANY NAME]\nEffective: [DATE]\n\nLEAVE TYPES & ENTITLEMENT (Per Calendar Year):\n\n1. Annual/Earned Leave (EL): 18 days\n   - Accrued at 1.5 days/month\n   - Can carry forward up to 30 days\n\n2. Sick Leave (SL): 10 days\n   - Non-encashable, non-carry-forward\n   - Medical certificate required for >2 consecutive days\n\n3. Casual Leave (CL): 6 days\n   - Cannot be clubbed with EL\n\n4. Maternity Leave: 26 weeks (as per Maternity Benefit Act)\n\n5. Paternity Leave: 5 days\n\n6. Public Holidays: As per company calendar\n\nAPPROVAL PROCESS:\n   Apply via HR system | Manager approval required | 2 days advance notice preferred\n\nPolicy Owner: HR | Review: Annual' },

  // Compliance
  { id: 't9', category: 'Compliance', name: 'Privacy Policy', desc: 'Describes how the company collects and uses customer data.', content: 'PRIVACY POLICY\n\n[COMPANY NAME] Private Limited ("we", "us") is committed to protecting your privacy.\n\n1. INFORMATION WE COLLECT\n   - Personal details (name, email, phone)\n   - Usage data and cookies\n   - Payment information (processed securely)\n\n2. HOW WE USE IT\n   - To provide and improve our services\n   - To send transactional communications\n   - To comply with legal obligations\n\n3. DATA SHARING\n   We do not sell your data. We share only with:\n   - Service providers under confidentiality agreements\n   - Government authorities when legally required\n\n4. DATA RETENTION\n   Personal data is retained for [X] years or as required by law.\n\n5. YOUR RIGHTS\n   Access, correct, or delete your data by emailing [EMAIL].\n\n6. CONTACT\n   [EMAIL] | [ADDRESS]\n\nLast updated: [DATE]' },
  { id: 't10', category: 'Compliance', name: 'Terms of Service', desc: 'Governs the use of your product or service by customers.', content: 'TERMS OF SERVICE\n\n[COMPANY NAME] Private Limited\nEffective Date: [DATE]\n\n1. ACCEPTANCE\n   By using our service, you agree to these terms.\n\n2. SERVICES\n   We provide [DESCRIPTION OF SERVICE].\n\n3. USER OBLIGATIONS\n   - Provide accurate information\n   - Not misuse the platform\n   - Comply with applicable laws\n\n4. PAYMENT\n   Fees are as listed on our website. Non-refundable unless stated.\n\n5. INTELLECTUAL PROPERTY\n   All content is owned by [COMPANY NAME]. No unauthorized reproduction.\n\n6. LIMITATION OF LIABILITY\n   We are not liable for indirect or consequential damages.\n\n7. TERMINATION\n   We may terminate access for breach of these terms.\n\n8. GOVERNING LAW\n   Laws of India. Jurisdiction: [CITY] courts.\n\nContact: [EMAIL]' },
  { id: 't11', category: 'Compliance', name: 'Whistleblower Policy', desc: 'Provides a safe channel for reporting unethical conduct.', content: 'WHISTLEBLOWER POLICY (VIGIL MECHANISM)\n\nCompany: [COMPANY NAME] Private Limited\nAs required under Section 177 of Companies Act 2013\n\n1. PURPOSE\n   To provide a mechanism for directors and employees to report genuine concerns.\n\n2. SCOPE\n   Covers fraud, corruption, unethical behavior, legal violations.\n\n3. REPORTING CHANNEL\n   Email: [ETHICS EMAIL]\n   Letter to: Audit Committee Chairman\n\n4. CONFIDENTIALITY\n   Identity of whistleblower is protected.\n\n5. PROTECTION\n   No retaliation against bona fide complainants.\n\n6. INVESTIGATION\n   Audit Committee reviews within 45 days.\n\n7. MISUSE\n   Frivolous complaints may result in disciplinary action.\n\nOversight: Audit Committee | Review: Annual' },

  // IP & Tech
  { id: 't12', category: 'IP & Tech', name: 'IP Assignment Agreement', desc: 'Assigns all intellectual property created by employees to the company.', content: 'INTELLECTUAL PROPERTY ASSIGNMENT AGREEMENT\n\nAssignor: [EMPLOYEE/CONTRACTOR NAME]\nAssignee: [COMPANY NAME] Private Limited\nDate: [DATE]\n\n1. ASSIGNMENT\n   Assignor hereby assigns to the Company all right, title, and interest in:\n   - All inventions, discoveries, and innovations\n   - Software, code, and algorithms\n   - Designs, trademarks, and trade secrets\n   Created during the term of employment/engagement.\n\n2. CONSIDERATION\n   The compensation paid under the employment/service agreement.\n\n3. MORAL RIGHTS\n   Assignor waives all moral rights to the extent permitted by law.\n\n4. COOPERATION\n   Assignor will sign documents necessary to perfect the assignment.\n\n5. PRIOR IP\n   Assignor discloses prior IP: [LIST or "None"]\n\nSigned: _____________ Date: _____________' },
  { id: 't13', category: 'IP & Tech', name: 'Freelancer / Contractor Agreement', desc: 'Governs terms for hiring independent contractors.', content: 'INDEPENDENT CONTRACTOR AGREEMENT\n\nClient: [COMPANY NAME] Private Limited\nContractor: [CONTRACTOR NAME]\nProject: [PROJECT DESCRIPTION]\nPeriod: [START DATE] to [END DATE]\n\n1. SERVICES\n   Contractor shall deliver: [DELIVERABLES]\n\n2. FEES\n   ₹[AMOUNT] payable upon [MILESTONE/DATE]\n   GST extra as applicable.\n\n3. INDEPENDENT CONTRACTOR\n   This is not an employment relationship. No PF/ESI/benefits apply.\n\n4. IP OWNERSHIP\n   All work product is owned by Client upon full payment.\n\n5. CONFIDENTIALITY\n   Contractor shall not disclose client information.\n\n6. TERMINATION\n   Either party may terminate with 14 days notice.\n\nSigned: _____________ Date: _____________' },
]

const CATEGORIES = ['All', 'Corporate', 'HR', 'Compliance', 'IP & Tech']

const CATEGORY_COLOR = {
  Corporate: 'bg-blue-50 text-blue-700',
  HR: 'bg-purple-50 text-purple-700',
  Compliance: 'bg-emerald-50 text-emerald-700',
  'IP & Tech': 'bg-amber-50 text-amber-700',
}

const LEGAL_OBLIGATIONS = {
  pvt: [
    { law: 'Companies Act 2013', items: [
      { text: 'Hold minimum 4 Board Meetings per year (gap ≤ 120 days)', req: 'Required' },
      { text: 'File Annual Return MGT-7 within 60 days of AGM', req: 'Required' },
      { text: 'File Financial Statements AOC-4 within 30 days of AGM', req: 'Required' },
      { text: 'Hold AGM within 6 months of financial year end', req: 'Required' },
      { text: 'Maintain Statutory Registers (Members, Directors, Charges)', req: 'Required' },
      { text: 'Statutory Audit by Chartered Accountant', req: 'Required' },
    ]},
    { law: 'GST Act', items: [
      { text: 'Register for GST if turnover > ₹40L (₹20L for services)', req: 'If Applicable' },
      { text: 'File GSTR-3B monthly, GSTR-1 monthly/quarterly', req: 'If Applicable' },
      { text: 'E-invoicing mandatory if turnover > ₹5Cr', req: 'If Applicable' },
    ]},
    { law: 'Income Tax Act', items: [
      { text: 'File ITR-6 annually by 31st October', req: 'Required' },
      { text: 'Deduct and deposit TDS by 7th of following month', req: 'Required' },
      { text: 'Pay Advance Tax in 4 instalments if tax > ₹10,000', req: 'Required' },
      { text: 'Tax Audit if turnover > ₹1Cr (10Cr for digital transactions)', req: 'If Applicable' },
    ]},
    { law: 'Labour Laws', items: [
      { text: 'PF registration mandatory if ≥ 20 employees', req: 'If Applicable' },
      { text: 'ESIC registration mandatory if ≥ 10 employees', req: 'If Applicable' },
      { text: 'Gratuity payable after 5 years of service', req: 'If Applicable' },
      { text: 'POSH Act compliance mandatory for all companies', req: 'Required' },
    ]},
    { law: 'DPDP Act 2023', items: [
      { text: 'Appoint Data Protection Officer if processing large-scale personal data', req: 'If Applicable' },
      { text: 'Maintain Privacy Policy accessible to users', req: 'Recommended' },
      { text: 'Obtain explicit consent before collecting personal data', req: 'Required' },
    ]},
  ],
  llp: [
    { law: 'LLP Act 2008', items: [
      { text: 'File Annual Return Form 11 within 60 days of financial year end', req: 'Required' },
      { text: 'File Statement of Accounts Form 8 by 30th October', req: 'Required' },
      { text: 'Maintain books of accounts', req: 'Required' },
      { text: 'Audit mandatory if turnover > ₹40L or contribution > ₹25L', req: 'If Applicable' },
    ]},
    { law: 'Income Tax Act', items: [
      { text: 'File ITR-5 annually', req: 'Required' },
      { text: 'Deduct and deposit TDS', req: 'Required' },
    ]},
    { law: 'GST Act', items: [
      { text: 'Register for GST if turnover > ₹40L', req: 'If Applicable' },
    ]},
  ],
  opc: [
    { law: 'Companies Act 2013', items: [
      { text: 'File Annual Return MGT-7A', req: 'Required' },
      { text: 'File AOC-4 for financial statements', req: 'Required' },
      { text: 'Board meetings: at least 1 per half year (gap ≤ 90 days)', req: 'Required' },
      { text: 'Mandatory conversion to Pvt Ltd if turnover > ₹2Cr', req: 'If Applicable' },
    ]},
    { law: 'Income Tax Act', items: [
      { text: 'File ITR-6 annually', req: 'Required' },
      { text: 'TDS deduction and deposit', req: 'Required' },
    ]},
  ],
}

const REQ_BADGE = {
  Required: 'bg-red-50 text-red-600',
  'If Applicable': 'bg-amber-50 text-amber-600',
  Recommended: 'bg-blue-50 text-blue-600',
}

const STATE_LAWS = {
  Karnataka: [
    { name: 'Shops & Establishments Act', details: 'Registration required within 30 days of starting business. Renewal annually.' },
    { name: 'Professional Tax', details: 'Monthly PT: ₹200/month per employee earning > ₹15,000. Annual return by April 30.' },
    { name: 'Karnataka Labour Welfare Fund', details: 'Contribution: Employee ₹20 + Employer ₹40 per half year.' },
    { name: 'Stamp Duty on MoA', details: '₹10,020 for ₹1L authorized capital. Rajya Stamp Act 1957.' },
  ],
  Maharashtra: [
    { name: 'Shops & Establishments Act', details: 'Online registration via Maharashtra Labour portal. Annual renewal required.' },
    { name: 'Professional Tax', details: 'Monthly PT based on salary slab. Max ₹2,500/year per employee.' },
    { name: 'Maharashtra Labour Welfare Fund', details: 'Contribution twice a year — June and December.' },
    { name: 'Stamp Duty on MoA', details: 'Calculated based on authorized capital slab. Filed with Sub-Registrar.' },
  ],
  Delhi: [
    { name: 'Shops & Establishments Act', details: 'Registration with Labour Department of Delhi. No annual renewal required.' },
    { name: 'Professional Tax', details: 'Delhi does not levy Professional Tax.' },
    { name: 'Stamp Duty on MoA', details: 'Relatively lower stamp duty rates. Filed with ROC Delhi.' },
  ],
  'Tamil Nadu': [
    { name: 'Shops & Establishments Act', details: 'Register with Inspector of Labour. Certificate must be displayed at premises.' },
    { name: 'Professional Tax', details: 'Half-yearly PT: Slab-based. Filed with Commercial Taxes Department.' },
    { name: 'Tamil Nadu Labour Welfare Fund', details: 'Annual contribution: Employee ₹10 + Employer ₹20.' },
    { name: 'Stamp Duty on MoA', details: 'Based on capital slab. Filed with Sub-Registrar.' },
  ],
}

const DEADLINES = [
  { name: 'Annual General Meeting (AGM)', due: 'Sep 30 every year', desc: 'Within 6 months of financial year end (FY ends Mar 31)', urgency: 'medium' },
  { name: 'Annual Return Filing (MGT-7)', due: 'Nov 29 every year', desc: '60 days after AGM — penalty ₹100/day for delay', urgency: 'high' },
  { name: 'Financial Statements (AOC-4)', due: 'Oct 29 every year', desc: '30 days after AGM — mandatory for all companies', urgency: 'high' },
  { name: 'Income Tax Return (ITR-6)', due: 'Oct 31 every year', desc: 'For companies requiring audit under IT Act', urgency: 'high' },
  { name: 'Director KYC (DIR-3 KYC)', due: 'Sep 30 every year', desc: 'All directors must file — ₹5,000 penalty for delay', urgency: 'medium' },
  { name: 'GST Annual Return (GSTR-9)', due: 'Dec 31 every year', desc: 'If annual turnover > ₹2Cr', urgency: 'medium' },
  { name: 'Advance Tax — Instalment 1', due: 'Jun 15 every year', desc: '15% of annual tax liability', urgency: 'low' },
  { name: 'Advance Tax — Instalment 2', due: 'Sep 15 every year', desc: '45% of annual tax liability (cumulative)', urgency: 'low' },
  { name: 'Advance Tax — Instalment 3', due: 'Dec 15 every year', desc: '75% of annual tax liability (cumulative)', urgency: 'low' },
  { name: 'Advance Tax — Instalment 4', due: 'Mar 15 every year', desc: '100% of annual tax liability (cumulative)', urgency: 'low' },
  { name: 'POSH Annual Report', due: 'Jan 31 every year', desc: 'ICC must submit annual report to employer and District Officer', urgency: 'medium' },
  { name: 'TDS Quarterly Return (26Q)', due: 'Quarterly (Jul 31, Oct 31, Jan 31, May 31)', desc: 'For non-salary TDS payments', urgency: 'high' },
]

const URGENCY_STYLE = {
  high: { badge: 'bg-red-50 text-red-600', dot: 'bg-red-500' },
  medium: { badge: 'bg-amber-50 text-amber-600', dot: 'bg-amber-500' },
  low: { badge: 'bg-green-50 text-green-600', dot: 'bg-green-500' },
}

const POLICY_DOCS = ['pan_card', 'aadhaar', 'address_proof', 'moa', 'aoa', 'noc']
const POLICY_DOC_NAMES = {
  pan_card: 'PAN Card',
  aadhaar: 'Aadhaar',
  address_proof: 'Address Proof',
  moa: 'MOA',
  aoa: 'AOA',
  noc: 'NOC / Rent Agreement',
}
const POLICY_DOC_SEVERITY = {
  pan_card: 'Critical', aadhaar: 'Critical', address_proof: 'Critical',
  moa: 'Critical', aoa: 'Critical', noc: 'Recommended',
}

const AI_CHIPS = [
  'Do I need a POSH policy?',
  'What board meetings are mandatory?',
  'When does GST audit apply?',
  'Is my non-compete clause enforceable?',
  'What is DIR-3 KYC?',
]

const COMPANY_TYPE_OPTIONS = [
  { value: 'pvt', label: 'Private Limited Company' },
  { value: 'llp', label: 'LLP' },
  { value: 'opc', label: 'One Person Company' },
]

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmt(text) {
  const parts = text.split(/(\*\*[^*]+\*\*)/)
  return parts.map((p, i) =>
    /^\*\*[^*]+\*\*$/.test(p)
      ? <strong key={i} className="font-semibold text-gray-900">{p.slice(2, -2)}</strong>
      : p
  )
}

function MarkdownBlock({ text }) {
  return (
    <div className="space-y-1.5 text-[13.5px] text-gray-700 leading-relaxed">
      {text.split('\n').map((line, i) => {
        if (!line.trim()) return <div key={i} className="h-1" />
        if (/^###\s/.test(line)) return <div key={i} className="font-semibold text-gray-900 text-[14px] mt-2">{fmt(line.replace(/^###\s/, ''))}</div>
        if (/^##\s/.test(line)) return <div key={i} className="font-bold text-gray-900 text-[15px] mt-3">{fmt(line.replace(/^##\s/, ''))}</div>
        if (/^[\-\*]\s/.test(line.trim())) return (
          <div key={i} className="flex gap-2 pl-2">
            <span className="text-indigo-400 shrink-0">•</span>
            <span>{fmt(line.trim().replace(/^[\-\*]\s/, ''))}</span>
          </div>
        )
        if (/^\d+\.\s/.test(line.trim())) {
          const m = line.trim().match(/^(\d+)\.\s(.*)/)
          return (
            <div key={i} className="flex gap-2 pl-2">
              <span className="text-indigo-500 font-semibold shrink-0 min-w-[18px]">{m[1]}.</span>
              <span>{fmt(m[2])}</span>
            </div>
          )
        }
        return <p key={i}>{fmt(line)}</p>
      })}
    </div>
  )
}

const TABS = [
  { id: 'overview', label: 'Overview', icon: ShieldCheck },
  { id: 'templates', label: 'Templates', icon: FileText },
  { id: 'obligations', label: 'Legal Obligations', icon: Scale },
  { id: 'advisor', label: 'AI Advisor', icon: Sparkles },
]

// ─── Main page ───────────────────────────────────────────────────────────────

export default function PoliciesPage({ company }) {
  const [tab, setTab] = useState('overview')
  const [documents, setDocuments] = useState([])
  const [docsLoaded, setDocsLoaded] = useState(false)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All')
  const [obligationType, setObligationType] = useState(
    company?.type === 'llp' ? 'llp' : company?.type === 'opc' ? 'opc' : 'pvt'
  )
  const [expandedLaw, setExpandedLaw] = useState(null)
  const [aiQuery, setAiQuery] = useState('')
  const [aiResult, setAiResult] = useState(null)
  const [aiSources, setAiSources] = useState([])
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState(null)

  useEffect(() => {
    getDocuments()
      .then((docs) => { setDocuments(docs); setDocsLoaded(true) })
      .catch(() => setDocsLoaded(true))
  }, [])

  // ── Policy Health Check data ──
  const uploadedTypes = new Set(documents.map((d) => d.docType).filter(Boolean))
  const healthItems = POLICY_DOCS.map((type) => ({
    type,
    name: POLICY_DOC_NAMES[type],
    severity: POLICY_DOC_SEVERITY[type],
    uploaded: uploadedTypes.has(type),
  }))
  const criticalMissing = healthItems.filter((h) => !h.uploaded && h.severity === 'Critical').length
  const score = Math.round((healthItems.filter((h) => h.uploaded).length / healthItems.length) * 100)

  // ── Template download ──
  function downloadTemplate(t) {
    const blob = new Blob([t.content], { type: 'text/plain' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `${t.name.replace(/[^a-zA-Z0-9]/g, '_')}.txt`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  // ── AI Advisor ──
  async function handleAiQuery(q) {
    const query = q || aiQuery
    if (!query.trim()) return
    setAiLoading(true)
    setAiResult(null)
    setAiSources([])
    setAiError(null)
    try {
      const res = await postChatMessage(`Legal question about Indian company law: ${query}. Search the web and give a clear, accurate answer with specific references to the relevant act or rule.`)
      const botMsgs = (res.messages ?? []).filter((m) => m.sender === 'bot' && m.text)
      const last = botMsgs[botMsgs.length - 1]
      setAiResult(last?.text ?? 'No response received.')
      setAiSources(last?.sources ?? [])
    } catch (err) {
      setAiError(err.message || 'AI advisor failed')
    } finally {
      setAiLoading(false)
    }
  }

  const filteredTemplates = TEMPLATES.filter((t) => {
    const matchCat = category === 'All' || t.category === category
    const matchSearch = !search || t.name.toLowerCase().includes(search.toLowerCase()) || t.desc.toLowerCase().includes(search.toLowerCase())
    return matchCat && matchSearch
  })

  const obligations = LEGAL_OBLIGATIONS[obligationType] ?? LEGAL_OBLIGATIONS.pvt

  return (
    <div className="flex-1 overflow-y-auto bg-[#f3f4f8]">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-[18px] font-semibold text-gray-900">Policies & Legal</h1>
          <p className="text-[13px] text-gray-400 mt-0.5">Templates, legal obligations, and compliance guidance for your company</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200 px-6">
        <div className="max-w-5xl mx-auto flex gap-1">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-3 text-[13px] font-medium border-b-2 transition-colors ${
                tab === t.id
                  ? 'border-indigo-600 text-indigo-700'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <t.icon size={14} />
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-6 space-y-5">

        {/* ── OVERVIEW TAB ── */}
        {tab === 'overview' && (
          <>
            {/* Policy Health Check */}
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              <div className="flex items-center gap-2.5 px-5 py-4 border-b border-gray-100">
                <ShieldCheck size={16} className="text-indigo-500" />
                <span className="text-[14px] font-semibold text-gray-900">Policy Health Check</span>
                {docsLoaded && criticalMissing > 0 && (
                  <span className="ml-auto text-[11px] font-semibold bg-red-50 text-red-600 px-2.5 py-1 rounded-full">
                    {criticalMissing} critical missing
                  </span>
                )}
              </div>

              <div className="p-5 flex gap-6 items-start">
                {/* Score ring */}
                <div className="shrink-0 flex flex-col items-center gap-1">
                  <svg width="88" height="88" viewBox="0 0 88 88">
                    <circle cx="44" cy="44" r="36" fill="none" stroke="#e5e7eb" strokeWidth="8" />
                    <circle
                      cx="44" cy="44" r="36" fill="none"
                      stroke={score >= 80 ? '#10b981' : score >= 50 ? '#f59e0b' : '#ef4444'}
                      strokeWidth="8" strokeLinecap="round"
                      strokeDasharray={`${(score / 100) * 226} 226`}
                      strokeDashoffset="56.5"
                      transform="rotate(-90 44 44)"
                    />
                    <text x="44" y="48" textAnchor="middle" fontSize="18" fontWeight="700" fill="#111827">{score}%</text>
                  </svg>
                  <span className="text-[11.5px] text-gray-400 font-medium">Doc Health</span>
                </div>

                {/* Checklist */}
                <div className="flex-1 grid grid-cols-2 gap-2">
                  {healthItems.map((h) => (
                    <div key={h.type} className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border ${h.uploaded ? 'border-emerald-100 bg-emerald-50/50' : h.severity === 'Critical' ? 'border-red-100 bg-red-50/50' : 'border-amber-100 bg-amber-50/50'}`}>
                      {h.uploaded
                        ? <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                        : <AlertTriangle size={14} className={`shrink-0 ${h.severity === 'Critical' ? 'text-red-500' : 'text-amber-500'}`} />
                      }
                      <span className="text-[12.5px] text-gray-700 flex-1">{h.name}</span>
                      {!h.uploaded && (
                        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${h.severity === 'Critical' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'}`}>
                          {h.severity}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Quick links to other tabs */}
            <div className="grid grid-cols-3 gap-4">
              {[
                { id: 'templates', icon: FileText, label: 'Browse Templates', desc: `${TEMPLATES.length} legal templates ready to download`, color: 'text-blue-600 bg-blue-50' },
                { id: 'obligations', icon: Scale, label: 'Legal Obligations', desc: 'Know what laws apply to your company', color: 'text-emerald-600 bg-emerald-50' },
                { id: 'advisor', icon: Sparkles, label: 'AI Policy Advisor', desc: 'Ask any legal question — AI answers with sources', color: 'text-indigo-600 bg-indigo-50' },
              ].map((card) => (
                <button
                  key={card.id}
                  onClick={() => setTab(card.id)}
                  className="bg-white rounded-2xl border border-gray-200 p-4 text-left hover:border-indigo-200 hover:shadow-sm transition-all"
                >
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${card.color} mb-3`}>
                    <card.icon size={17} />
                  </div>
                  <div className="text-[13.5px] font-semibold text-gray-900 mb-1">{card.label}</div>
                  <div className="text-[12px] text-gray-400">{card.desc}</div>
                </button>
              ))}
            </div>
          </>
        )}

        {/* ── TEMPLATES TAB ── */}
        {tab === 'templates' && (
          <>
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search templates…"
                  className="w-full border border-gray-200 bg-white rounded-xl pl-9 pr-4 py-2.5 text-[13px] outline-none focus:border-indigo-400"
                />
              </div>
              <div className="flex gap-2 flex-wrap">
                {CATEGORIES.map((c) => (
                  <button
                    key={c}
                    onClick={() => setCategory(c)}
                    className={`text-[12.5px] font-medium px-3.5 py-2 rounded-xl border transition-colors ${category === c ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white border-gray-200 text-gray-600 hover:border-indigo-300'}`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            {filteredTemplates.length === 0 ? (
              <div className="text-center py-16 text-gray-400 text-[13.5px]">No templates match your search</div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {filteredTemplates.map((t) => (
                  <div key={t.id} className="bg-white rounded-2xl border border-gray-200 p-5 hover:border-indigo-200 hover:shadow-sm transition-all flex flex-col gap-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="text-[13.5px] font-semibold text-gray-900 mb-1">{t.name}</div>
                        <div className="text-[12px] text-gray-400">{t.desc}</div>
                      </div>
                      <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full shrink-0 ${CATEGORY_COLOR[t.category]}`}>
                        {t.category}
                      </span>
                    </div>
                    <button
                      onClick={() => downloadTemplate(t)}
                      className="flex items-center gap-2 text-[12.5px] font-medium text-indigo-600 hover:text-indigo-700 mt-auto"
                    >
                      <Download size={13} /> Download Template
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ── OBLIGATIONS TAB ── */}
        {tab === 'obligations' && (
          <>
            <div className="flex items-center gap-3">
              <Building2 size={15} className="text-gray-400" />
              <span className="text-[13px] text-gray-500">Showing obligations for:</span>
              <div className="relative">
                <select
                  value={obligationType}
                  onChange={(e) => { setObligationType(e.target.value); setExpandedLaw(null) }}
                  className="appearance-none border border-gray-200 bg-white rounded-xl px-4 pr-8 py-2 text-[13px] font-medium text-gray-800 outline-none focus:border-indigo-400 cursor-pointer"
                >
                  {COMPANY_TYPE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            </div>

            <div className="space-y-3">
              {obligations.map((group) => (
                <div key={group.law} className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                  <button
                    onClick={() => setExpandedLaw(expandedLaw === group.law ? null : group.law)}
                    className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Scale size={15} className="text-indigo-500" />
                      <span className="text-[13.5px] font-semibold text-gray-900">{group.law}</span>
                      <span className="text-[11px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{group.items.length} rules</span>
                    </div>
                    {expandedLaw === group.law ? <ChevronDown size={16} className="text-gray-400" /> : <ChevronRight size={16} className="text-gray-400" />}
                  </button>
                  {expandedLaw === group.law && (
                    <div className="border-t border-gray-100 divide-y divide-gray-50">
                      {group.items.map((item, i) => (
                        <div key={i} className="flex items-start gap-3 px-5 py-3.5">
                          <CheckCircle2 size={14} className="text-emerald-400 shrink-0 mt-0.5" />
                          <span className="flex-1 text-[13px] text-gray-700">{item.text}</span>
                          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${REQ_BADGE[item.req]}`}>{item.req}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="flex items-start gap-2.5 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-[12.5px] text-blue-700">
              <Info size={14} className="shrink-0 mt-0.5" />
              <span>Obligations depend on turnover, employee count, and state. Consult a CA/CS for your specific situation.</span>
            </div>
          </>
        )}

        {/* ── AI ADVISOR TAB ── */}
        {tab === 'advisor' && (
          <>
            <div className="bg-gradient-to-r from-indigo-600 to-indigo-500 rounded-2xl px-6 py-5 text-white">
              <div className="flex items-center gap-2.5 mb-1">
                <Sparkles size={18} />
                <span className="font-semibold text-[15px]">AI Policy Advisor</span>
              </div>
              <p className="text-[13px] opacity-80">Ask any question about Indian company law, compliance requirements, or legal obligations. The AI searches official sources and gives cited answers.</p>
            </div>

            {/* Quick chips */}
            <div className="flex gap-2 flex-wrap">
              {AI_CHIPS.map((chip) => (
                <button
                  key={chip}
                  onClick={() => { setAiQuery(chip); handleAiQuery(chip) }}
                  className="text-[12.5px] font-medium px-3.5 py-2 bg-white border border-gray-200 rounded-xl text-gray-600 hover:border-indigo-300 hover:text-indigo-700 transition-colors"
                >
                  {chip}
                </button>
              ))}
            </div>

            {/* Input */}
            <div className="bg-white rounded-2xl border border-gray-200 p-4">
              <div className="flex gap-3">
                <input
                  value={aiQuery}
                  onChange={(e) => setAiQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAiQuery()}
                  placeholder="Ask anything about policies, legal requirements, compliance…"
                  className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-[13.5px] outline-none focus:border-indigo-400"
                />
                <button
                  onClick={() => handleAiQuery()}
                  disabled={!aiQuery.trim() || aiLoading}
                  className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-[13px] font-medium px-4 py-2.5 rounded-xl transition-colors"
                >
                  {aiLoading ? <Loader size={14} className="animate-spin" /> : <Send size={14} />}
                </button>
              </div>
            </div>

            {/* AI Result */}
            {aiLoading && (
              <div className="bg-white rounded-2xl border border-gray-200 flex flex-col items-center justify-center py-14 gap-3 text-gray-400">
                <Loader size={22} className="animate-spin text-indigo-400" />
                <div className="text-[13px]">Searching official sources…</div>
              </div>
            )}

            {aiError && (
              <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-2xl px-5 py-4 text-[13px] text-red-600">
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                <span>{aiError}</span>
              </div>
            )}

            {aiResult && !aiLoading && (
              <div className="bg-white rounded-2xl border border-indigo-100 overflow-hidden">
                <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-gray-100 bg-indigo-50">
                  <Sparkles size={14} className="text-indigo-600" />
                  <span className="text-[13px] font-semibold text-indigo-800">AI Answer</span>
                  <span className="ml-auto text-[10.5px] text-indigo-400 font-medium bg-indigo-100 px-2 py-0.5 rounded-full">Live web search</span>
                </div>
                <div className="px-5 py-4 space-y-4">
                  <MarkdownBlock text={aiResult} />
                  {aiSources.length > 0 && (
                    <div className="border-t border-gray-100 pt-3">
                      <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-2">Sources</div>
                      <div className="space-y-1.5">
                        {aiSources.map((src, i) => (
                          <a key={i} href={src.url} target="_blank" rel="noreferrer"
                            className="flex items-center gap-2 text-[12px] text-indigo-600 hover:underline">
                            <ExternalLink size={11} /> {src.title || src.url}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
