'use client'

interface CheckboxGroupProps {
  label: string
  options: readonly string[]
  selected: string[]
  onChange: (selected: string[]) => void
  columns?: number
}

export default function CheckboxGroup({ label, options, selected, onChange, columns = 3 }: CheckboxGroupProps) {
  const toggle = (item: string) => {
    onChange(selected.includes(item) ? selected.filter(s => s !== item) : [...selected, item])
  }

  return (
    <div>
      <label className="block text-xs font-medium text-neutral-500 uppercase tracking-wider mb-3">{label}</label>
      <div className={`grid grid-cols-1 sm:grid-cols-2 ${columns >= 3 ? 'lg:grid-cols-3' : ''} gap-2`}>
        {options.map((opt) => (
          <label key={opt} className="flex items-center space-x-2 cursor-pointer group">
            <input
              type="checkbox"
              checked={selected.includes(opt)}
              onChange={() => toggle(opt)}
              className="w-4 h-4 border-neutral-300 text-black focus:ring-black rounded-sm"
            />
            <span className="text-sm text-neutral-600 group-hover:text-black transition-colors">{opt}</span>
          </label>
        ))}
      </div>
    </div>
  )
}
