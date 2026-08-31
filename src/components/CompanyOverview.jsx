import { Eye } from 'lucide-react'

function formatINR(value) {
  return `₹${value.toLocaleString('en-IN')}`
}

export default function CompanyOverview({ company, onViewDetails }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="font-semibold text-gray-900">Company Overview</div>
        <button
          onClick={onViewDetails}
          className="text-[13px] font-medium text-indigo-600 hover:text-indigo-700"
        >
          View / Edit
        </button>
      </div>

      <div className="space-y-3.5 text-[13px]">
        <div>
          <div className="text-gray-400 mb-1">Company Name</div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-gray-900">{company.name}</span>
            {company.statusTag && (
              <span className="bg-emerald-50 text-emerald-600 text-[11px] font-medium px-2 py-0.5 rounded-full">
                {company.statusTag}
              </span>
            )}
          </div>
        </div>

        <div>
          <div className="text-gray-400 mb-1">Company Type</div>
          <div className="font-medium text-gray-900">{company.type}</div>
        </div>

        <div>
          <div className="text-gray-400 mb-1">Registered Office</div>
          <div className="font-medium text-gray-900">{company.registeredOffice}</div>
        </div>

        <div>
          <div className="text-gray-400 mb-1">Business Activity (NIC Code: {company.nicCode})</div>
          <div className="font-medium text-gray-900">{company.businessActivity}</div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="text-gray-400 mb-1">Authorized Capital</div>
            <div className="font-medium text-gray-900">{formatINR(company.authorizedCapital)}</div>
          </div>
          <div>
            <div className="text-gray-400 mb-1">Paid-up Capital</div>
            <div className="font-medium text-gray-900">{formatINR(company.paidUpCapital)}</div>
          </div>
        </div>

        <div>
          <div className="text-gray-400 mb-1">Incorporation State</div>
          <div className="font-medium text-gray-900">{company.incorporationState}</div>
        </div>

        <button
          onClick={onViewDetails}
          className="w-full flex items-center justify-center gap-2 rounded-lg border border-gray-200 text-gray-700 text-[13px] font-medium py-2.5 mt-1 hover:bg-gray-50"
        >
          <Eye size={15} /> View Company Details
        </button>
      </div>
    </div>
  )
}
