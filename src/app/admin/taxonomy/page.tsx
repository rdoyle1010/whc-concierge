'use client'

import { useMemo, useState } from 'react'
import DashboardShell from '@/components/DashboardShell'
import { Search } from 'lucide-react'
import {
  SERVICES_CATEGORIES, PRODUCT_HOUSES_FULL, QUALS_CATEGORIES, SYSTEMS_FULL,
  BUSINESS_SKILLS_FULL, HOTEL_BRANDS_FULL,
} from '@/lib/taxonomy'
import { FACILITY_OPTIONS, STAFF_BENEFIT_OPTIONS, ROLE_LEVELS } from '@/lib/constants'

// The live taxonomy viewer. These are the actual lists talent and employers
// pick from and the matching engine joins on - the single source of truth,
// kept in code so both sides and matching can never drift apart.

type Group = { name: string; items: string[] }

const TABS: { key: string; label: string; groups: Group[] }[] = [
  { key: 'treatments', label: 'Treatments & services', groups: SERVICES_CATEGORIES.map(group => ({ name: group.name, items: [...group.items] })) },
  { key: 'brands', label: 'Product houses', groups: [{ name: 'Product houses', items: [...PRODUCT_HOUSES_FULL] }] },
  { key: 'qualifications', label: 'Qualifications', groups: QUALS_CATEGORIES.map(group => ({ name: group.name, items: [...group.items] })) },
  { key: 'business', label: 'Business skills', groups: [{ name: 'Business & leadership', items: [...BUSINESS_SKILLS_FULL] }] },
  { key: 'systems', label: 'Systems', groups: [{ name: 'Booking & operations systems', items: [...SYSTEMS_FULL] }] },
  { key: 'hotel-brands', label: 'Hotel groups', groups: [{ name: 'Hotel & spa groups', items: [...HOTEL_BRANDS_FULL] }] },
  { key: 'roles', label: 'Role levels', groups: [{ name: 'Role levels', items: [...ROLE_LEVELS] }] },
  { key: 'facilities', label: 'Facilities', groups: [{ name: 'Property facilities', items: [...FACILITY_OPTIONS] }] },
  { key: 'benefits', label: 'Staff benefits', groups: [{ name: 'Staff benefits', items: [...STAFF_BENEFIT_OPTIONS] }] },
]

export default function TaxonomyPage() {
  const [activeTab, setActiveTab] = useState('treatments')
  const [search, setSearch] = useState('')

  const tab = TABS.find(t => t.key === activeTab)!
  const query = search.trim().toLowerCase()

  const filteredGroups = useMemo(() => {
    if (!query) return tab.groups
    return tab.groups
      .map(group => ({ ...group, items: group.items.filter(item => item.toLowerCase().includes(query)) }))
      .filter(group => group.items.length > 0)
  }, [tab, query])

  const globalMatches = useMemo(() => {
    if (!query) return []
    const results: { tab: string; item: string }[] = []
    for (const t of TABS) {
      if (t.key === activeTab) continue
      for (const group of t.groups) for (const item of group.items) {
        if (item.toLowerCase().includes(query) && results.length < 12) results.push({ tab: t.label, item })
      }
    }
    return results
  }, [query, activeTab])

  const tabCount = (t: typeof TABS[number]) => t.groups.reduce((total, group) => total + group.items.length, 0)

  return (
    <DashboardShell role="admin">
      <div className="max-w-4xl">
        <p className="dashboard-eyebrow">Controls</p>
        <h1 className="dashboard-title">Platform taxonomy</h1>
        <p className="dashboard-intro mb-5 max-w-2xl">
          These are the live lists talent and employers pick from, and the vocabulary the matching engine joins on.
          They are held in the platform code as a single source of truth, so both sides always use identical terms.
          To add or change an item, ask for a platform update - a change has to reach profiles, job posting and
          matching together, which is exactly why the lists cannot be edited casually here.
        </p>

        <div className="flex flex-wrap gap-1.5 mb-4">
          {TABS.map(t => (
            <button key={t.key} type="button" onClick={() => setActiveTab(t.key)}
              className={`px-3.5 py-2 rounded-lg text-[12px] font-semibold transition-colors ${activeTab === t.key ? 'bg-[#0b2f4d] text-white' : 'bg-white border border-border text-secondary hover:text-ink'}`}>
              {t.label} <span className={activeTab === t.key ? 'opacity-70' : 'text-muted'}>({tabCount(t)})</span>
            </button>
          ))}
        </div>

        <div className="relative mb-5 max-w-md">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search every list..." className="input-field w-full pl-9 text-[13px]" />
        </div>

        {filteredGroups.length === 0 && <p className="text-[13px] text-secondary mb-4">Nothing in {tab.label} matches &quot;{search}&quot;.</p>}

        <div className="space-y-5">
          {filteredGroups.map(group => (
            <div key={group.name} className="dashboard-card">
              <div className="flex items-baseline justify-between mb-3">
                <h2 className="font-serif text-[16px] font-semibold text-ink">{group.name}</h2>
                <span className="text-[11.5px] text-muted">{group.items.length} items</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {group.items.map(item => (
                  <span key={item} className="rounded-full border border-border bg-surface px-3 py-1.5 text-[12px] text-secondary">{item}</span>
                ))}
              </div>
            </div>
          ))}
        </div>

        {globalMatches.length > 0 && (
          <div className="mt-6 dashboard-card">
            <h2 className="font-serif text-[15px] font-semibold text-ink mb-2">Also found in other lists</h2>
            <div className="flex flex-wrap gap-2">
              {globalMatches.map(({ tab: tabLabel, item }) => (
                <span key={`${tabLabel}-${item}`} className="rounded-full border border-border bg-surface px-3 py-1.5 text-[12px] text-secondary">{item} <span className="text-muted">· {tabLabel}</span></span>
              ))}
            </div>
          </div>
        )}
      </div>
    </DashboardShell>
  )
}
