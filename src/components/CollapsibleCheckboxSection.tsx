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

// There is no "Select All" here, and there is not meant to be.
//
// Every list this renders is a claim about somebody: the treatments they can
// perform, the houses they have trained with, the systems they have run. A
// profile claiming all eighty-seven treatments and all forty-seven product
// houses is not an impressive profile, it is an unbelievable one, and it
// makes matching worthless for everybody else on the register - a search for
// a Biologique Recherche facialist that returns them is a search that has
// stopped meaning anything.
//
// It took one person about ten seconds to do it to five sections at once,
// because the link sat at the top of each one and looked like a convenience.
// Clearing stays, because undoing it has to be one press.
export default function CollapsibleCheckboxSection({ title, categories, flatItems, selected, onChange }: CollapsibleCheckboxSectionProps) {
  const [open, setOpen] = useState(false)

  const allItems = flatItems || (categories?.flatMap(c => c.items) ?? [])
  const count = selected.filter(s => allItems.includes(s)).length

  const toggle = (item: string) => {
    onChange(selected.includes(item) ? selected.filter(s => s !== item) : [...selected, item])
  }

  const clearAll = () => {
    const itemSet = new Set(allItems)
    onChange(selected.filter(s => !itemSet.has(s)))
  }

  return (
    <div className="border border-neutral-200">
      <button type="button" onClick={() => setOpen(!open)} className="w-full flex items-center justify-between p-4 text-left hover:bg-neutral-50 transition-colors">
        <div className="flex items-center space-x-3">
          <span className="text-sm font-semibold text-black">{title}</span>
          {count > 0 && <span className="text-xs bg-black text-white px-2 py-0.5">{count} selected</span>}
        </div>
        {open ? <ChevronUp size={16} className="text-neutral-400" /> : <ChevronDown size={16} className="text-neutral-400" />}
      </button>

      {open && (
        <div className="px-4 pb-4 border-t border-neutral-100">
          <div className="flex items-center justify-between gap-4 py-3 mb-2">
            <p className="text-xs text-neutral-500">Tick only what you would be happy to be asked about.</p>
            <button type="button" onClick={clearAll} className="shrink-0 text-xs text-neutral-500 hover:text-black underline">Clear All</button>
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
