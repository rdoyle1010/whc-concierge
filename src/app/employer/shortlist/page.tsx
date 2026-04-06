'use client'

import { useEffect, useState } from 'react'
import DashboardShell from '@/components/DashboardShell'
import { createClient } from '@/lib/supabase/client'
import { Star, Trash2, MessageSquare, MapPin, Edit3, Check, X } from 'lucide-react'
import Link from 'next/link'

export default function EmployerShortlistPage() {
  const supabase = createClient()
  const [shortlisted, setShortlisted] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<any>(null)
  const [editingNote, setEditingNote] = useState<string | null>(null)
  const [noteText, setNoteText] = useState('')

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: prof } = await supabase.from('employer_profiles').select('*').eq('user_id', user.id).single()
      setProfile(prof)

      const res = await fetch('/api/shortlist')
      if (res.ok) {
        const data = await res.json()
        setShortlisted(data.shortlisted || [])
      }
      setLoading(false)
    }
    load()
  }, [])

  const removeFromShortlist = async (id: string) => {
    await fetch('/api/shortlist', {
      method: 'DELETE', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    setShortlisted(shortlisted.filter(s => s.id !== id))
  }

  const saveNote = async (id: string) => {
    await fetch('/api/shortlist', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, notes: noteText }),
    })
    setShortlisted(shortlisted.map(s => s.id === id ? { ...s, notes: noteText } : s))
    setEditingNote(null)
  }

  // Group by job
  const grouped = new Map<string, any[]>()
  for (const s of shortlisted) {
    const key = s.job_listings?.job_title || 'General'
    if (!grouped.has(key)) grouped.set(key, [])
    grouped.get(key)!.push(s)
  }

  return (
    <DashboardShell role="employer" userName={profile?.company_name}>
      <h1 className="text-[24px] font-medium text-ink mb-6">Shortlist</h1>

      {loading ? (
        <div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-2 border-ink border-t-transparent rounded-full" /></div>
      ) : shortlisted.length === 0 ? (
        <div className="dashboard-card text-center py-16">
          <Star size={40} className="mx-auto mb-3 text-muted/40" />
          <p className="text-[15px] font-medium text-ink mb-1">No shortlisted candidates</p>
          <p className="text-[13px] text-muted mb-6">Browse candidates and shortlist those you&apos;re interested in.</p>
          <Link href="/employer/candidates" className="btn-primary">Browse Candidates</Link>
        </div>
      ) : (
        <div className="space-y-8">
          {Array.from(grouped.entries()).map(([roleName, items]) => (
            <div key={roleName}>
              <div className="flex items-center gap-2 mb-3">
                <h2 className="text-[15px] font-medium text-ink">{roleName}</h2>
                <span className="text-[11px] text-muted bg-surface px-2 py-0.5 rounded-full">{items.length}</span>
              </div>
              <div className="space-y-2">
                {items.map((s) => {
                  const c = s.candidate_profiles
                  if (!c) return null
                  return (
                    <div key={s.id} className="bg-white border border-border rounded-xl p-4 hover:shadow-sm transition-all">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-surface flex items-center justify-center overflow-hidden shrink-0">
                            {c.profile_image_url ? <img src={c.profile_image_url} alt="" className="w-full h-full object-cover" />
                            : <span className="text-[14px] font-semibold text-muted">{c.full_name?.[0]}</span>}
                          </div>
                          <div>
                            <p className="text-[14px] font-medium text-ink">{c.full_name}</p>
                            <div className="flex items-center gap-2 text-[12px] text-muted">
                              {c.role_level && <span>{c.role_level}</span>}
                              {c.location && <span className="flex items-center gap-0.5"><MapPin size={10} />{c.location}</span>}
                              {c.experience_years && <span>{c.experience_years}y exp</span>}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Link href="/employer/messages" className="p-1.5 rounded-lg hover:bg-surface text-muted hover:text-ink transition-colors" title="Message">
                            <MessageSquare size={14} />
                          </Link>
                          <button type="button" onClick={() => { setEditingNote(s.id); setNoteText(s.notes || '') }}
                            className="p-1.5 rounded-lg hover:bg-surface text-muted hover:text-ink transition-colors" title="Add note">
                            <Edit3 size={14} />
                          </button>
                          <button type="button" onClick={() => removeFromShortlist(s.id)}
                            className="p-1.5 rounded-lg hover:bg-red-50 text-muted hover:text-red-500 transition-colors" title="Remove">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>

                      {/* Skills */}
                      {c.services_offered?.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2 ml-[52px]">
                          {c.services_offered.slice(0, 4).map((sk: string) => (
                            <span key={sk} className="text-[10px] bg-[#FDF6EC] text-accent border border-accent/20 px-2 py-0.5 rounded-full">{sk}</span>
                          ))}
                        </div>
                      )}

                      {/* Notes */}
                      {editingNote === s.id ? (
                        <div className="mt-3 ml-[52px] flex items-center gap-2">
                          <input type="text" value={noteText} onChange={e => setNoteText(e.target.value)}
                            className="input-field text-[12px] flex-1" placeholder="Add a note about this candidate..." autoFocus />
                          <button type="button" onClick={() => saveNote(s.id)} className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg"><Check size={14} /></button>
                          <button type="button" onClick={() => setEditingNote(null)} className="p-1.5 text-muted hover:bg-surface rounded-lg"><X size={14} /></button>
                        </div>
                      ) : s.notes ? (
                        <p className="mt-2 ml-[52px] text-[12px] text-muted italic">&ldquo;{s.notes}&rdquo;</p>
                      ) : null}

                      <p className="mt-2 ml-[52px] text-[10px] text-muted">Shortlisted {new Date(s.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</p>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardShell>
  )
}
