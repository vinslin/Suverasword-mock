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
  1: 'Tell the assistant your company name, legal structure, and business activity.',
  2: 'Add at least 2 directors with their DIN, PAN and shareholding details.',
  3: 'Provide registered office address and proof.',
  4: 'Upload identity, address & office proof documents.',
  5: 'Review the SPICe+ form and sign digitally with DSC.',
  6: 'Submit the SPICe+ application to the MCA.',
  7: "Complete PAN, TAN & GST that weren't auto-linked.",
  8: 'Set up your compliance calendar and first board meeting.',
}

export const quickChips = [
  'What is DIN?',
  'What is DSC?',
  'How many directors needed?',
  'Documents required?',
  'Fees for Pvt Ltd?',
]
