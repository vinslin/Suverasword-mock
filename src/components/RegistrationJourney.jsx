import { Check, Info } from 'lucide-react'
import { journeySteps, journeyNextAction } from '../data/mockData'

export default function RegistrationJourney({ currentStep }) {
  return (
    <div className="bg-white border-t border-gray-200 px-6 py-4">
      <div className="text-[13px] font-medium text-gray-500 mb-3">Registration Journey</div>
      <div className="flex items-center overflow-x-auto pb-1">
        {journeySteps.map((step, idx) => {
          const isDone = step.id < currentStep
          const isCurrent = step.id === currentStep
          return (
            <div key={step.id} className="flex items-center shrink-0">
              <div className="flex flex-col items-center w-[92px] text-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-semibold shrink-0 ${
                    isDone
                      ? 'bg-emerald-500 text-white'
                      : isCurrent
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 text-gray-400'
                  }`}
                >
                  {isDone ? <Check size={15} /> : step.id}
                </div>
                <div
                  className={`text-[11px] mt-1.5 leading-tight ${
                    isCurrent ? 'text-gray-900 font-medium' : 'text-gray-400'
                  }`}
                >
                  {step.label}
                </div>
              </div>
              {idx < journeySteps.length - 1 && (
                <div className={`h-0.5 w-8 mb-5 ${step.id < currentStep ? 'bg-emerald-500' : 'bg-gray-200'}`} />
              )}
            </div>
          )
        })}
      </div>
      <div className="mt-3 flex items-center gap-2 text-[13px] text-gray-600 bg-indigo-50 rounded-lg px-3.5 py-2.5">
        <Info size={15} className="text-indigo-500 shrink-0" />
        <span>
          You are on step {currentStep} of {journeySteps.length}.{' '}
          <span className="font-medium text-gray-800">
            Next: {journeyNextAction[currentStep] ?? 'All steps complete!'}
          </span>
        </span>
      </div>
    </div>
  )
}
