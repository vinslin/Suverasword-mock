import { useEffect, useState } from 'react'
import { CheckCircle2, Circle } from 'lucide-react'
import { getCompleteness } from '../lib/api'

const CHECK_LABELS = {
  company_name:      'Company name',
  company_type:      'Company type',
  business_activity: 'Business activity',
  registered_office: 'Registered office address',
  directors_added:   'Min. 2 directors added',
  pan_uploaded:      'PAN Card uploaded',
  aadhaar_uploaded:  'Aadhaar uploaded',
  address_proof:     'Address proof uploaded',
  noc_uploaded:      'NOC / rent agreement uploaded',
}

const ALL_KEYS = Object.keys(CHECK_LABELS)

function ScoreRing({ score }) {
  const r = 26
  const circ = 2 * Math.PI * r
  const filled = circ - (circ * score) / 100

  const color =
    score === 100 ? '#157F4C' :
    score >= 60   ? '#2E5170' :
                    '#B7791F'

  return (
    <svg width={68} height={68} className="shrink-0">
      <circle cx={34} cy={34} r={r} fill="none" stroke="#ECF0F4" strokeWidth={7} />
      <circle
        cx={34} cy={34} r={r}
        fill="none"
        stroke={color}
        strokeWidth={7}
        strokeDasharray={circ}
        strokeDashoffset={filled}
        strokeLinecap="round"
        transform="rotate(-90 34 34)"
        style={{ transition: 'stroke-dashoffset 0.5s ease' }}
      />
      <text
        x={34} y={34}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={13}
        fontWeight={700}
        fill={color}
      >
        {score}%
      </text>
    </svg>
  )
}

export default function CompletenessCard({ refreshKey }) {
  const [data, setData] = useState(null)

  useEffect(() => {
    getCompleteness()
      .then(setData)
      .catch(() => {})
  }, [refreshKey])

  if (!data) return null

  const { score, completed, total, missing = [] } = data
  const missingSet = new Set(missing)

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-4">
      <div className="flex items-center gap-4 mb-4">
        <ScoreRing score={score} />
        <div>
          <div className="text-[13px] font-semibold text-gray-900">Onboarding Progress</div>
          <div className="text-[12px] text-gray-500 mt-0.5">
            {completed} of {total} checks complete
          </div>
          {score === 100 ? (
            <div className="text-[12px] text-emerald-600 font-medium mt-1">All set!</div>
          ) : (
            <div className="text-[12px] text-amber-600 font-medium mt-1">
              {total - completed} item{total - completed !== 1 ? 's' : ''} remaining
            </div>
          )}
        </div>
      </div>

      <div className="space-y-1.5">
        {ALL_KEYS.map((key) => {
          const done = !missingSet.has(key)
          return (
            <div key={key} className="flex items-center gap-2">
              {done ? (
                <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
              ) : (
                <Circle size={14} className="text-amber-400 shrink-0" />
              )}
              <span className={`text-[12.5px] ${done ? 'text-gray-500 line-through decoration-gray-300' : 'text-gray-800'}`}>
                {CHECK_LABELS[key] ?? key}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
