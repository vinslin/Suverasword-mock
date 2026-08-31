export default function PlaceholderPage({ icon: Icon, title, description }) {
  return (
    <div className="flex-1 flex items-center justify-center p-10">
      <div className="text-center max-w-sm">
        <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-4">
          <Icon size={26} />
        </div>
        <div className="font-semibold text-gray-900 text-lg mb-1.5">{title}</div>
        <p className="text-[13.5px] text-gray-500 leading-relaxed">{description}</p>
      </div>
    </div>
  )
}
