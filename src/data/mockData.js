export const initialCompany = {
  name: 'TechNova Solutions Private Limited',
  statusTag: 'Name Reserved',
  type: 'Private Limited Company',
  registeredOffice: 'Bangalore, Karnataka',
  businessActivity: 'Software development & related services',
  nicCode: '62012',
  authorizedCapital: 1000000,
  paidUpCapital: 100000,
  incorporationState: 'Karnataka',
}

export const initialRegistrations = [
  {
    id: 'mca',
    name: 'MCA Incorporation',
    detail: 'CIN: U72900KA2024PTCXXXXX',
    status: 'Completed',
    date: '12 May 2024',
  },
  {
    id: 'pan',
    name: 'PAN',
    detail: 'PAN No. Generated',
    status: 'Completed',
    date: '13 May 2024',
  },
  {
    id: 'tan',
    name: 'TAN',
    detail: 'TAN No. Generated',
    status: 'Completed',
    date: '13 May 2024',
  },
  {
    id: 'gst',
    name: 'GST Registration',
    detail: 'ARN: AA1234567890123',
    status: 'In Progress',
    date: 'In Progress',
  },
  {
    id: 'ptax',
    name: 'Professional Tax',
    detail: 'Register your business',
    status: 'Not Started',
    date: null,
  },
  {
    id: 'epfo',
    name: 'EPFO Registration',
    detail: 'For employee benefits',
    status: 'Not Started',
    date: null,
  },
  {
    id: 'esic',
    name: 'ESIC Registration',
    detail: 'For employee benefits',
    status: 'Not Started',
    date: null,
  },
  {
    id: 'shop',
    name: 'Shop & Establishment',
    detail: 'State registration',
    status: 'Pending',
    date: null,
  },
  {
    id: 'bank',
    name: 'Bank Account',
    detail: 'Open current account',
    status: 'Pending',
    date: null,
  },
]

export const quickLinks = [
  { name: 'MCA Portal (SPICe+)', url: 'https://www.mca.gov.in' },
  { name: 'GST Registration Portal', url: 'https://reg.gst.gov.in' },
  { name: 'PAN Application', url: 'https://www.onlineservices.nsdl.com/paam' },
  { name: 'TAN Application', url: 'https://www.onlineservices.nsdl.com/tan' },
  { name: 'Karnataka Professional Tax', url: 'https://kptax.karnataka.gov.in' },
]

export const requiredDocuments = [
  'PAN & Aadhaar of all directors',
  'Passport-size photograph of directors',
  'Address proof of directors (bank statement / utility bill, < 2 months old)',
  'Registered office proof (utility bill, < 2 months old)',
  'NOC from the property owner / rent agreement',
  'Draft MOA (Memorandum of Association)',
  'Draft AOA (Articles of Association)',
]

export const notifications = [
  {
    id: 1,
    title: 'GST ARN generated',
    body: 'Application reference AA1234567890123 has been generated.',
    time: '9:45 AM',
  },
  {
    id: 2,
    title: 'Director KYC pending',
    body: 'DIR-3 KYC is pending for 1 director. Complete before 30 Sep.',
    time: 'Yesterday',
  },
  {
    id: 3,
    title: 'Compliance due in 5 days',
    body: 'First board meeting must be held within 30 days of incorporation.',
    time: '2 days ago',
  },
]

export const journeySteps = [
  { id: 1, label: 'Choose Structure & Name' },
  { id: 2, label: 'Directors Information' },
  { id: 3, label: 'Registered Office Details' },
  { id: 4, label: 'Documents Upload' },
  { id: 5, label: 'Review & Sign' },
  { id: 6, label: 'MCA Application' },
  { id: 7, label: 'Post Incorporation Registrations' },
  { id: 8, label: 'Compliance & Next Steps' },
]

export const journeyNextAction = {
  3: 'Provide registered office address and proof.',
  4: 'Upload identity, address & office proof documents.',
  5: 'Review the SPICe+ form and sign digitally with DSC.',
  6: 'Submit the SPICe+ application to the MCA.',
  7: "Complete PAN, TAN & GST that weren't auto-linked.",
  8: 'Set up your compliance calendar and first board meeting.',
}

export const webSearchSources = [
  { name: 'MCA.gov.in', tag: 'Companies Act, 2013' },
  { name: 'GST.gov.in', tag: 'GST Act, 2017' },
  { name: 'NSDL / Protean', tag: 'PAN/TAN' },
  { name: 'Karnataka.gov.in', tag: 'State Registrations' },
]

export const quickChips = [
  'What is DIN?',
  'What is DSC?',
  'How many directors needed?',
  'Documents required?',
  'Fees for Pvt Ltd?',
]

export const cannedAnswers = {
  'what is din?':
    "DIN (Director Identification Number) is a unique 8-digit number allotted by the MCA to anyone intending to become a director of a company. It's mandatory for every director and is applied for through the SPICe+ form during incorporation.",
  'what is dsc?':
    'A Digital Signature Certificate (DSC) is the electronic equivalent of a signature, used to authenticate documents filed with the MCA. Every proposed director needs a Class 3 DSC to digitally sign the incorporation forms.',
  'how many directors needed?':
    'A Private Limited Company needs a minimum of 2 directors (max 15). At least one director must be a resident of India — someone who stayed in India for 120+ days in the previous financial year.',
  'documents required?':
    "You'll need: PAN & Aadhaar of all directors, a passport-size photo, address proof (bank statement/utility bill under 2 months old), registered office proof, an NOC or rent agreement from the property owner, and draft MOA & AOA. I've added the full checklist to the Documents tab.",
  'fees for pvt ltd?':
    'Rough cost for a Pvt Ltd in Karnataka: MCA SPICe+ government fee ~₹0–₹1,500 (authorized capital dependent), stamp duty ~₹1,000–₹5,000, DSC ~₹1,500 for 2 directors, PAN/TAN ~₹150, plus professional fees which typically range ₹5,000–₹15,000. Actual fees depend on authorized capital and state.',
}

export const chatSeed = [
  {
    id: 'm1',
    sender: 'user',
    time: '10:02 AM',
    type: 'text',
    text: 'I want to start a Private Limited Company in Bangalore for a software development business.',
  },
  {
    id: 'm2',
    sender: 'bot',
    time: '10:02 AM',
    type: 'text',
    text: "Great! I'll help you register your company and complete all necessary registrations. I'm using live web search to get the latest requirements, fees, and official links.",
  },
  {
    id: 'm3',
    sender: 'bot',
    time: '10:02 AM',
    type: 'websearch',
    label: 'Web Search Update (May 15, 2024 · 10:02 AM)',
    text: "I've fetched the latest information from official government websites.",
  },
  {
    id: 'm4',
    sender: 'bot',
    time: '10:03 AM',
    type: 'text',
    text: "Let's begin with the proposed company name. You can suggest upto 2 names, I'll check availability on the MCA portal.",
  },
  {
    id: 'm5',
    sender: 'user',
    time: '10:03 AM',
    type: 'text',
    text: '1. TechNova Solutions Private Limited\n2. Innovatech Labs Private Limited',
  },
  {
    id: 'm6',
    sender: 'bot',
    time: '10:04 AM',
    type: 'text',
    text: 'Perfect! Checking name availability on MCA portal...',
  },
  {
    id: 'm7',
    sender: 'bot',
    time: '10:04 AM',
    type: 'nameResults',
    label: 'Name Availability Results (Checked: May 15, 2024 · 10:04 AM)',
    results: [
      { name: 'TechNova Solutions Private Limited', available: true },
      { name: 'Innovatech Labs Private Limited', available: false },
    ],
  },
  {
    id: 'm8',
    sender: 'bot',
    time: '10:05 AM',
    type: 'confirm',
    text: 'TechNova Solutions Private Limited is available. Would you like to proceed with this name?',
  },
]
