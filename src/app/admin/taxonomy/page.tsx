'use client'

import { useEffect, useState } from 'react'
import DashboardShell from '@/components/DashboardShell'
import { createClient } from '@/lib/supabase/client'
import { Plus, Edit2, Archive, Check, X, Search } from 'lucide-react'

const TABLES = [
  { key: 'skills', label: 'Skills', columns: ['name', 'category'], categories: ['treatment', 'commercial', 'leadership', 'operational', 'technology'] },
  { key: 'systems', label: 'Systems', columns: ['name', 'category'], categories: ['booking', 'pos', 'scheduling', 'crm', 'reporting', 'membership'] },
  { key: 'product_houses', label: 'Product Houses', columns: ['name', 'tier'], categories: ['mass', 'professional', 'luxury', 'ultra_luxury'] },
  { key: 'certifications', label: 'Certifications', columns: ['name', 'category'], categories: ['beauty', 'massage', 'fitness', 'health_safety', 'management', 'other'] },
  { key: 'hotel_brands', label: 'Hotel Brands', columns: ['name', 'tier'], categories: ['luxury', 'ultra_luxury', 'lifestyle', 'boutique', 'independent'] },
]

export default function TaxonomyManagement() {
  const supabase = createClient()
  const [activeTable, setActiveTable] = useState('skills')
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [catFilter, setCatFilter] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [formName, setFormName] = useState('')
  const [formCategory, setFormCategory] = useState('')
  const [saving, setSaving] = useState(false)

  const table = TABLES.find(t => t.key === activeTable)!
  const catField = table.columns[1] // 'category' or 'tier'

  async function loadItems() {
    setLoading(true)
    const { data } = await supabase.from(activeTable).select('*').order('sort_order').order('name')
    setItems(data || [])
    setLoading(false)
  }

  useEffect(() => { loadItems(); setSearch(''); setCatFilter(''); setShowForm(false); setEditing(null) }, [activeTable])

  const filtered = items.filter(i => {
    if (search && !i.name.toLowerCase().includes(search.toLowerCase())) return false
    if (catFilter && i[catField] !== catFilter) return false
    return true
  })

  const handleSave = async () => {
    if (!formName.trim()) return
    setSaving(true)
    if (editing) {
      await supabase.from(activeTable).update({ name: formName, [catField]: formCategory || null }).eq('id', editing.id)
    } else {
      await supabase.from(activeTable).insert({ name: formName, [catField]: formCategory || null, is_active: true, sort_order: items.length + 1 })
    }
    setSaving(false)
    setShowForm(false)
    setEditing(null)
    setFormName('')
    setFormCategory('')
    loadItems()
  }

  const toggleActive = async (id: string, current: boolean) => {
    await supabase.from(activeTable).update({ is_active: !current }).eq('id', id)
    setItems(items.map(i => i.id === id ? { ...i, is_active: !current } : i))
  }

  const startEdit = (item: any) => {
    setEditing(item)
    setFormName(item.name)
    setFormCategory(item[catField] || '')
    setShowForm(true)
  }

  return (
    <DashboardShell role="admin" userName="Admin">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-[24px] font-medium text-ink">Taxonomy Management</h1>
        <button type="button" onClick={() => { setEditing(null); setFormName(''); setFormCategory(''); setShowForm(true) }} className="btn-primary flex items-center gap-2"><Plus size={14} />Add Item</button>
      </div>

      {/* Table tabs */}
      <div className="flex gap-1 mb-6 overflow-x-auto">
        {TABLES.map(t => (
          <button key={t.key} type="button" onClick={() => setActiveTable(t.key)}
            className={`px-4 py-2 rounded-lg text-[13px] font-medium whitespace-nowrap transition-colors ${activeTable === t.key ? 'bg-ink text-white' : 'text-muted hover:text-ink'}`}>{t.label} ({items.length > 0 && activeTable === t.key ? filtered.length : '—'})</button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-5">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input type="text" placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} className="input-field pl-9 !py-2 text-[13px]" />
        </div>
        <select value={catFilter} onChange={e => setCatFilter(e.target.value)} className="input-field !py-2 text-[13px] w-48">
          <option value="">All {catField === 'tier' ? 'tiers' : 'categories'}</option>
          {table.categories.map(c => <option key={c} value={c} className="capitalize">{c.replace('_', ' ')}</option>)}
        </select>
      </div>

      {/* Items list */}
      {loading ? (
        <div className="space-y-2">{[1,2,3,4,5].map(i => <div key={i} className="skeleton h-12 rounded-lg" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="dashboard-card text-center py-12"><p className="text-[14px] text-muted">No items found.</p></div>
      ) : (
        <div className="space-y-1">
          {filtered.map(item => (
            <div key={item.id} className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${item.is_active ? 'border-border bg-white' : 'border-border bg-surface opacity-60'}`}>
              <div className="flex items-center gap-3">
                <span className="text-[14px] font-medium text-ink">{item.name}</span>
                {item[catField] && <span className="text-[10px] font-medium bg-surface text-muted px-2 py-0.5 rounded-full capitalize">{(item[catField] || '').replace('_', ' ')}</span>}
                {!item.is_active && <span className="text-[10px] font-medium bg-red-50 text-red-600 px-2 py-0.5 rounded-full">Archived</span>}
              </div>
              <div className="flex items-center gap-1">
                <button type="button" onClick={() => startEdit(item)} className="p-1.5 rounded-lg hover:bg-surface text-muted hover:text-ink"><Edit2 size={14} /></button>
                <button type="button" onClick={() => toggleActive(item.id, item.is_active)} className="p-1.5 rounded-lg hover:bg-surface text-muted hover:text-ink" title={item.is_active ? 'Archive' : 'Restore'}><Archive size={14} /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <div className="bg-white border border-border rounded-xl max-w-md w-full p-6 animate-fade-in-up" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-[18px] font-medium text-ink">{editing ? 'Edit' : 'Add'} {table.label.slice(0, -1)}</h3>
              <button type="button" onClick={() => setShowForm(false)} className="text-muted hover:text-ink"><X size={18} /></button>
            </div>
            <div className="space-y-4">
              <div><label className="eyebrow block mb-1.5">Name *</label><input type="text" value={formName} onChange={e => setFormName(e.target.value)} className="input-field" placeholder={`e.g. ${activeTable === 'skills' ? 'Swedish Massage' : activeTable === 'systems' ? 'Book4Time' : 'ESPA'}`} /></div>
              <div><label className="eyebrow block mb-1.5 capitalize">{catField === 'tier' ? 'Tier' : 'Category'}</label>
                <select value={formCategory} onChange={e => setFormCategory(e.target.value)} className="input-field">
                  <option value="">Select</option>
                  {table.categories.map(c => <option key={c} value={c} className="capitalize">{c.replace('_', ' ')}</option>)}
                </select>
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowForm(false)} className="btn-secondary flex-1">Cancel</button>
                <button type="button" onClick={handleSave} disabled={saving || !formName.trim()} className="btn-primary flex-1 disabled:opacity-40">{saving ? 'Saving...' : editing ? 'Update' : 'Add'}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardShell>
  )
}
