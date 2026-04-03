'use client'

import { useEffect, useState } from 'react'
import DashboardShell from '@/components/DashboardShell'
import { createClient } from '@/lib/supabase/client'
import { Plus, Edit2, Trash2, Play, Pause } from 'lucide-react'

export default function AdminCampaignsPage() {
  const supabase = createClient()
  const [campaigns, setCampaigns] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [saving, setSaving] = useState(false)

  const empty = { name: '', description: '', type: '', status: 'draft', start_date: '', end_date: '', target_audience: '', content: '' }
  const [form, setForm] = useState(empty)

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from('campaigns').select('*').order('created_at', { ascending: false })
      setCampaigns(data || [])
      setLoading(false)
    }
    load()
  }, [])

  const handleSave = async () => {
    setSaving(true)
    const payload = {
      name: form.name, description: form.description || null, type: form.type || null,
      status: form.status, start_date: form.start_date || null, end_date: form.end_date || null,
      target_audience: form.target_audience || null, content: form.content || null,
    }
    if (editing) {
      await supabase.from('campaigns').update(payload).eq('id', editing.id)
    } else {
      await supabase.from('campaigns').insert(payload)
    }
    const { data } = await supabase.from('campaigns').select('*').order('created_at', { ascending: false })
    setCampaigns(data || [])
    setShowForm(false); setEditing(null); setForm(empty); setSaving(false)
  }

  const handleEdit = (c: any) => {
    setForm({
      name: c.name, description: c.description || '', type: c.type || '',
      status: c.status, start_date: c.start_date || '', end_date: c.end_date || '',
      target_audience: c.target_audience || '', content: c.content || '',
    })
    setEditing(c); setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this campaign?')) return
    await supabase.from('campaigns').delete().eq('id', id)
    setCampaigns(campaigns.filter(c => c.id !== id))
  }

  const toggleStatus = async (c: any) => {
    const newStatus = c.status === 'active' ? 'paused' : 'active'
    await supabase.from('campaigns').update({ status: newStatus }).eq('id', c.id)
    setCampaigns(campaigns.map(x => x.id === c.id ? { ...x, status: newStatus } : x))
  }

  const statusColors: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-600', active: 'bg-green-50 text-green-700',
    paused: 'bg-amber-50 text-amber-700', completed: 'bg-blue-50 text-blue-700',
  }

  return (
    <DashboardShell role="admin" userName="Admin">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-serif font-bold text-ink">Campaign Management</h1>
        <button onClick={() => { setForm(empty); setEditing(null); setShowForm(true) }}
          className="btn-primary flex items-center space-x-2"><Plus size={16} /><span>New Campaign</span></button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-8" onClick={(e) => e.stopPropagation()}>
            <h2 className="font-serif text-xl font-bold mb-6">{editing ? 'Edit Campaign' : 'New Campaign'}</h2>
            <div className="space-y-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Campaign Name *</label>
                <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input-field" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Type</label>
                  <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="input-field">
                    <option value="">Select</option><option>Email</option><option>Social Media</option><option>Push Notification</option><option>In-App</option>
                  </select></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Target Audience</label>
                  <select value={form.target_audience} onChange={(e) => setForm({ ...form, target_audience: e.target.value })} className="input-field">
                    <option value="">All</option><option>Candidates</option><option>Employers</option><option>New Users</option>
                  </select></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Start Date</label>
                  <input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} className="input-field" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1.5">End Date</label>
                  <input type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} className="input-field" /></div>
              </div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
                <textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="input-field" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Content</label>
                <textarea rows={6} value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} className="input-field" /></div>
              <div className="flex gap-4 pt-2">
                <button onClick={() => setShowForm(false)} className="btn-secondary flex-1">Cancel</button>
                <button onClick={handleSave} disabled={saving} className="btn-primary flex-1 disabled:opacity-50">{saving ? 'Saving...' : editing ? 'Update' : 'Create'}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-2 border-gold border-t-transparent rounded-full" /></div>
      ) : campaigns.length === 0 ? (
        <div className="dashboard-card text-center py-16 text-gray-400">No campaigns yet.</div>
      ) : (
        <div className="space-y-4">
          {campaigns.map((c) => (
            <div key={c.id} className="dashboard-card flex items-center justify-between">
              <div>
                <div className="flex items-center space-x-3">
                  <h3 className="font-serif text-lg font-semibold text-ink">{c.name}</h3>
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusColors[c.status] || ''}`}>{c.status}</span>
                  {c.type && <span className="text-xs bg-gray-50 text-gray-500 px-2 py-1 rounded">{c.type}</span>}
                </div>
                <p className="text-sm text-gray-500 mt-1">{c.description}</p>
                {c.start_date && <p className="text-xs text-gray-400 mt-1">{c.start_date}{c.end_date ? ` — ${c.end_date}` : ''}</p>}
              </div>
              <div className="flex items-center space-x-2">
                <button onClick={() => toggleStatus(c)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-400">
                  {c.status === 'active' ? <Pause size={18} /> : <Play size={18} />}
                </button>
                <button onClick={() => handleEdit(c)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-400"><Edit2 size={18} /></button>
                <button onClick={() => handleDelete(c.id)} className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500"><Trash2 size={18} /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardShell>
  )
}
