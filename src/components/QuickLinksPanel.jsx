import { useState } from 'react'
import { ExternalLink, RefreshCw, Landmark, FileCheck2 } from 'lucide-react'
import { quickLinks, requiredDocuments } from '../data/mockData'

export default function QuickLinksPanel({ lastUpdated, onRefresh, refreshing }) {
  const [tab, setTab] = useState('links')

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-gray-200 p-5">
        <div className="flex items-center gap-5 border-b border-gray-100 mb-3">
          <button
            onClick={() => setTab('links')}
            className={`pb-2.5 text-[13px] font-medium border-b-2 -mb-px ${
              tab === 'links' ? 'text-indigo-600 border-indigo-600' : 'text-gray-400 border-transparent'
            }`}
          >
            Quick Links
          </button>
          <button
            onClick={() => setTab('docs')}
            className={`pb-2.5 text-[13px] font-medium border-b-2 -mb-px ${
              tab === 'docs' ? 'text-indigo-600 border-indigo-600' : 'text-gray-400 border-transparent'
            }`}
          >
            Required Documents
          </button>
        </div>

        {tab === 'links' ? (
          <div className="space-y-3">
            {quickLinks.map((link) => (
              <a
                key={link.url}
                href={link.url}
                target="_blank"
                rel="noreferrer"
                className="flex items-start gap-2.5 group"
              >
                <span className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 mt-0.5">
                  <Landmark size={14} />
                </span>
                <div className="min-w-0">
                  <div className="text-[13px] font-medium text-gray-800 flex items-center gap-1">
                    {link.name}
                    <ExternalLink size={12} className="text-gray-400 group-hover:text-indigo-500" />
                  </div>
                  <div className="text-[12px] text-indigo-500 truncate">{link.url}</div>
                </div>
              </a>
            ))}
          </div>
        ) : (
          <ul className="space-y-2.5">
            {requiredDocuments.map((doc) => (
              <li key={doc} className="flex items-start gap-2.5 text-[13px] text-gray-700">
                <FileCheck2 size={15} className="text-indigo-500 shrink-0 mt-0.5" />
                {doc}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="bg-indigo-600 rounded-2xl p-5 text-white">
        <div className="font-semibold text-[14px] mb-1.5">Live Updates</div>
        <div className="text-[12.5px] text-indigo-100 mb-3">
          Information is auto-updated from official websites using web search.
        </div>
        <div className="text-[11px] text-indigo-200 mb-3">Last updated: {lastUpdated}</div>
        <button
          onClick={onRefresh}
          disabled={refreshing}
          className="w-full flex items-center justify-center gap-2 rounded-lg bg-white text-indigo-700 text-[13px] font-medium py-2 disabled:opacity-70"
        >
          <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
          {refreshing ? 'Refreshing...' : 'Refresh Now'}
        </button>
      </div>
    </div>
  )
}
