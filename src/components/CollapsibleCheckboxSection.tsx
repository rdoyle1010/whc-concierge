'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'

interface Category {
  name: string
  items: string[]
}

interface CollapsibleCheckboxSectionProps {
  title: string
  categories?: Category[]
  flatItems?: string[]
  selected: string[]
  onChange: (selected: string[]) => void
}

export default function CollapsibleCheckboxSection({ title, categories, flatItems, selected, onChange }: CollapsibleCheckboxSectionProps) {
  const [open, setOpen] = useState(false)

  const allItems = flatItems || (categories?.flatMap(c => c.items) ?? [])
  const count = selected.filter(s => allItems.includes(s)).length

  const toggle = (item: string) => {
    onChange(selected.includes(item) ? selected.filter(s => s !== item) : [...selected, item])
  }

  const selectAll = () => {
    const newSelected = new Set(selected)
    allItems.forEach(i => newSelected.add(i))
    onChange(Array.from(newSelected))
  }

  const clearAll = () => {
    const itemSet = new Set(allItems)
    onChange(selected.filter(s => !itemSet.has(s)))
  }

  return (
    <div className="border border-neutral-200">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between p-4 text-left hover:bg-neutral-50 transition-colors">
        <div className="flex items-center space-x-3">
          <span className="text-sm font-semibold text-black">{title}</span>
          {count > 0 && <span className="text-xs bg-black text-white px-2 py-0.5">{count} selected</span>}
        </div>
        {open ? <ChevronUp size={16} className="text-neutral-400" /> : <ChevronDown size={16} className="text-neutral-400" />}
      </button>

      {open && (
        <div className="px-4 pb-4 border-t border-neutral-100">
          {/* Select All / Clear All */}
          <div className="flex space-x-4 py-3 mb-2">
            <button onClick={selectAll} className="text-xs text-neutral-500 hover:text-black underline">Select All</button>
            <button onClick={clearAll} className="text-xs text-neutral-500 hover:text-black underline">Clear All</button>
          </div>

          {categories ? (
            <div className="space-y-5">
              {categories.map((cat) => (
                <div key={cat.name}>
                  <p className="text-xs font-medium text-neutral-400 uppercase tracking-wider mb-2">{cat.name}</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1.5">
                    {cat.items.map((item) => (
                      <label key={item} className="flex items-center space-x-2 cursor-pointer group py-0.5">
                        <input type="checkbox" checked={selected.includes(item)} onChange={() => toggle(item)}
                          className="w-3.5 h-3.5 border-neutral-300 text-black focus:ring-black rounded-sm" />
                        <span className="text-sm text-neutral-600 group-hover:text-black transition-colors">{item}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : flatItems ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1.5">
              {flatItems.map((item) => (
                <label key={item} className="flex items-center space-x-2 cursor-pointer group py-0.5">
                  <input type="checkbox" checked={selected.includes(item)} onChange={() => toggle(item)}
                    className="w-3.5 h-3.5 border-neutral-300 text-black focus:ring-black rounded-sm" />
                  <span className="text-sm text-neutral-600 group-hover:text-black transition-colors">{item}</span>
                </label>
              ))}
            </div>
          ) : null}
        </div>
      )}
    </div>
  )
}
