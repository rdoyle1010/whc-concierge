'use client'

import { useEffect, useState, useRef } from 'react'
import DashboardShell from '@/components/DashboardShell'
import { createClient } from '@/lib/supabase/client'
import { Send, MessageSquare, Paperclip, FileText, ShieldCheck, ChevronLeft } from 'lucide-react'

const THREAD_LIMIT = 100
const MESSAGE_FIELDS = 'id,sender_id,recipient_id,content,attachment_url,attachment_name,attachment_type,created_at,read'

export default function TalentMessagesPage() {
  const supabase = createClient()
  const [userId, setUserId] = useState('')
  const [conversations, setConversations] = useState<any[]>([])
  const [activeConvo, setActiveConvo] = useState<string | null>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [newMsg, setNewMsg] = useState('')
  const [loading, setLoading] = useState(true)
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null)
  const [attachmentUploading, setAttachmentUploading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const formatTimestamp = (createdAt: string) => {
    const msgDate = new Date(createdAt)
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const msgDay = new Date(msgDate.getFullYear(), msgDate.getMonth(), msgDate.getDate())
    const daysAgo = Math.floor((today.getTime() - msgDay.getTime()) / 86400000)
    const timeStr = msgDate.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
    if (daysAgo === 0) return timeStr
    if (daysAgo < 7) return msgDate.toLocaleDateString('en-GB', { weekday: 'short' }) + ' ' + timeStr
    return msgDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) + ' ' + timeStr
  }

  const handleAttachmentClick = () => fileInputRef.current?.click()
  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { alert('File size must be less than 5MB'); return }
    setAttachmentFile(file)
  }
  const removeAttachment = () => { setAttachmentFile(null); if (fileInputRef.current) fileInputRef.current.value = '' }

  async function refreshConversations() {
    const res = await fetch('/api/messages/conversations', { cache: 'no-store' })
    if (!res.ok) return
    const body = await res.json().catch(() => ({ conversations: [] }))
    setConversations(body.conversations || [])
  }

  useEffect(() => {
    let active = true
    async function load() {
      const { data: { session } } = await supabase.auth.getSession()
      const sessionUser = session?.user || null
      if (!sessionUser || !active) { setLoading(false); return }
      setUserId(sessionUser.id)

      const res = await fetch('/api/messages/conversations', { cache: 'no-store' })
      const body = res.ok ? await res.json().catch(() => ({ conversations: [] })) : { conversations: [] }
      if (!active) return
      setConversations(body.conversations || [])
      const to = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('to') : null
      if (to && to !== sessionUser.id) setActiveConvo(to)
      setLoading(false)
    }
    load()
    return () => { active = false }
  }, [])

  useEffect(() => {
    if (!activeConvo || !userId) return
    let active = true
    async function loadMessages() {
      const { data } = await supabase
        .from('messages')
        .select(MESSAGE_FIELDS)
        .or(`and(sender_id.eq.${userId},recipient_id.eq.${activeConvo}),and(sender_id.eq.${activeConvo},recipient_id.eq.${userId})`)
        .order('created_at', { ascending: false })
        .limit(THREAD_LIMIT)
      if (!active) return
      setMessages([...(data || [])].reverse())
      await fetch('/api/messages/mark-read', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ partnerId: activeConvo }) }).catch(() => {})
      setConversations(current => current.map(c => c.partnerId === activeConvo ? { ...c, unread: 0 } : c))
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
    }
    loadMessages()
    return () => { active = false }
  }, [activeConvo, userId])

  useEffect(() => {
    if (!userId) return
    const channel = supabase
      .channel(`talent-messages-${userId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `recipient_id=eq.${userId}` }, payload => {
        const msg = payload.new as any
        if (msg.sender_id === activeConvo) {
          setMessages(current => current.some(item => item.id === msg.id) ? current : [...current, msg].slice(-THREAD_LIMIT))
          fetch('/api/messages/mark-read', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ partnerId: msg.sender_id }) }).catch(() => {})
          setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
        }
        refreshConversations().catch(() => {})
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [userId, activeConvo])

  const activePartner = conversations.find(c => c.partnerId === activeConvo)
  const residencyPrivate = Boolean(activePartner?.residencyPrivate)

  const sendMessage = async () => {
    if ((!newMsg.trim() && !attachmentFile) || !activeConvo) return
    if (residencyPrivate && attachmentFile) {
      alert('Attachments are available after the Residency booking is confirmed.')
      return
    }
    try {
      setAttachmentUploading(true)
      let attachmentUrl = null, attachmentName = null, attachmentType = null
      if (attachmentFile) {
        const fileExt = attachmentFile.name.split('.').pop()
        const fileName = `${userId}/messages/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
        const fd = new FormData(); fd.append('file', attachmentFile); fd.append('bucket', 'message-attachments'); fd.append('path', fileName)
        const upRes = await fetch('/api/upload', { method: 'POST', body: fd })
        const upJson = await upRes.json().catch(() => ({}))
        if (!upRes.ok || !upJson.url) throw new Error(upJson.error || 'Attachment upload failed')
        attachmentUrl = upJson.url; attachmentName = attachmentFile.name; attachmentType = attachmentFile.type
      }
      const content = newMsg.trim() || null
      const sendRes = await fetch('/api/messages/send', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ recipientId: activeConvo, content, attachmentUrl, attachmentName, attachmentType }) })
      if (!sendRes.ok) { const d = await sendRes.json().catch(() => ({})); alert(d.error || 'Message failed to send - please try again.'); setAttachmentUploading(false); return }
      const sentBody = await sendRes.json().catch(() => ({}))
      const optimistic = { id: sentBody.message?.id || `local-${Date.now()}`, sender_id: userId, recipient_id: activeConvo, content, attachment_url: attachmentUrl, attachment_name: attachmentName, attachment_type: attachmentType, created_at: new Date().toISOString(), read: false }
      setMessages(prev => [...prev, optimistic].slice(-THREAD_LIMIT))
      setConversations(current => current.map(c => c.partnerId === activeConvo ? { ...c, lastMessage: optimistic } : c))
      setNewMsg(''); removeAttachment(); setAttachmentUploading(false); setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
    } catch (error) { console.error('Error sending message:', error); alert('Failed to send message'); setAttachmentUploading(false) }
  }

  return (
    <DashboardShell role="talent">
      <div className="mb-7">
        <p className="dashboard-eyebrow">Private conversations</p>
        <h1 className="dashboard-title">Messages</h1>
        <p className="dashboard-intro">Continue conversations with matched properties and keep every opportunity organised in one secure place.</p>
      </div>

      <div className="dashboard-card !p-0 overflow-hidden" style={{ height: 'calc(100vh - 245px)', minHeight: 560 }}>
        <div className="flex h-full">
          <aside className={`${activeConvo ? 'hidden md:flex' : 'flex'} w-full md:w-[330px] lg:w-[360px] flex-col border-r border-[#dddddd] bg-[#f1f1f1]`}>
            <div className="border-b border-[#dddddd] px-5 py-5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#1c1c1c]">Conversations</p>
              <p className="mt-1 text-[12px] text-[#6b6b6b]">{conversations.length} active thread{conversations.length === 1 ? '' : 's'}</p>
            </div>
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="space-y-3 p-4">{[1,2,3].map(i => <div key={i} className="h-[76px] animate-pulse rounded-2xl bg-[#f1f1f1]" />)}</div>
              ) : conversations.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center px-8 text-center">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-[#dddddd] bg-white text-[#1c1c1c]"><MessageSquare size={20} /></div>
                  <p className="text-[15px] font-medium text-[#1c1c1c]">No conversations yet</p>
                  <p className="mt-2 text-[12px] leading-5 text-[#6b6b6b]">When interest is mutual, the property conversation will appear here automatically.</p>
                </div>
              ) : conversations.map((convo) => {
                const selected = activeConvo === convo.partnerId
                const initials = String(convo.partnerName || 'U').split(' ').map((part: string) => part[0]).join('').slice(0,2).toUpperCase()
                return (
                  <button type="button" key={convo.partnerId} onClick={() => setActiveConvo(convo.partnerId)} className={`group w-full border-b border-[#dddddd] px-4 py-4 text-left transition ${selected ? 'bg-white' : 'hover:bg-white/70'}`}>
                    <div className="flex items-start gap-3">
                      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border text-[11px] font-semibold ${selected ? 'border-accent bg-surface text-ink' : 'border-border bg-white text-secondary'}`}>{initials}</div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="min-w-0 flex-1 truncate text-[13px] font-semibold text-[#1c1c1c]">{convo.partnerName || 'Unknown User'}</p>
                          {convo.unread > 0 && <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#1c1c1c] px-1.5 text-[10px] font-semibold text-white">{convo.unread > 9 ? '9+' : convo.unread}</span>}
                        </div>
                        {convo.residencyPrivate && <p className="mt-1 text-[9px] font-semibold uppercase tracking-[0.12em] text-[#1c1c1c]">Protected Residency</p>}
                        <p className="mt-1.5 truncate text-[11px] leading-4 text-[#6b6b6b]">{convo.lastMessage?.content || (convo.lastMessage?.attachment_name ? `Attachment: ${convo.lastMessage.attachment_name}` : 'Conversation ready')}</p>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </aside>

          <section className={`${activeConvo ? 'flex' : 'hidden md:flex'} min-w-0 flex-1 flex-col bg-[#f1f1f1]`}>
            {!activeConvo ? (
              <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
                <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-[#dddddd] bg-white text-[#1c1c1c]"><MessageSquare size={22} /></div>
                <p className="text-[20px] font-medium tracking-[-0.02em] text-[#1c1c1c]">Select a conversation</p>
                <p className="mt-2 max-w-sm text-[12px] leading-5 text-[#6b6b6b]">Matched properties and protected Residency discussions will stay organised here.</p>
              </div>
            ) : (
              <>
                <header className="flex min-h-[76px] items-center gap-3 border-b border-[#dddddd] bg-white px-4 md:px-6">
                  <button type="button" onClick={() => setActiveConvo(null)} aria-label="Back to conversations" className="flex h-9 w-9 items-center justify-center rounded-full border border-[#dddddd] text-[#555555] md:hidden"><ChevronLeft size={17} /></button>
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1c1c1c] text-[11px] font-semibold text-white">{String(activePartner?.partnerName || 'U').split(' ').map((part: string) => part[0]).join('').slice(0,2).toUpperCase()}</div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[14px] font-semibold text-[#1c1c1c]">{activePartner?.partnerName || 'Unknown User'}</p>
                    <p className="mt-0.5 text-[10px] text-[#6b6b6b]">{residencyPrivate ? 'Protected Residency conversation' : 'Private matched conversation'}</p>
                  </div>
                </header>

                {residencyPrivate && (
                  <div className="mx-4 mt-4 flex items-start gap-3 rounded-2xl border border-[#dddddd] bg-[#f1f1f1] px-4 py-3 md:mx-6">
                    <ShieldCheck size={16} className="mt-0.5 shrink-0 text-[#1c1c1c]" />
                    <p className="text-[11px] leading-5 text-[#555555]">Discuss dates, treatments, hours and rate here. Direct contact details, links and attachments remain restricted until the Residency booking is confirmed.</p>
                  </div>
                )}

                <div className="flex-1 overflow-y-auto px-4 py-6 md:px-7">
                  {messages.length === 0 ? (
                    <div className="flex h-full items-center justify-center text-center"><p className="max-w-xs text-[12px] leading-5 text-[#6b6b6b]">You are connected. Send the first message when you are ready.</p></div>
                  ) : (
                    <div className="mx-auto max-w-3xl space-y-4">
                      {messages.map((msg, i) => {
                        const mine = msg.sender_id === userId
                        return (
                          <div key={msg.id || i} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[82%] md:max-w-[68%] ${mine ? 'items-end' : 'items-start'} flex flex-col`}>
                              <div className={`px-4 py-3 text-[13px] leading-5 ${mine ? 'bg-accent text-white' : 'bg-surface text-ink'}`}>
                                {msg.content && <p className="whitespace-pre-wrap">{msg.content}</p>}
                                {msg.attachment_url && <div className="mt-2">{msg.attachment_type?.startsWith('image/') ? <a href={msg.attachment_url} target="_blank" rel="noopener noreferrer"><img loading="lazy" decoding="async" src={msg.attachment_url} alt={msg.attachment_name} className="max-w-[220px] rounded-xl" /></a> : <div className="flex items-center gap-2 text-xs"><FileText size={14} /><a href={msg.attachment_url} download={msg.attachment_name} className="underline hover:opacity-80">{msg.attachment_name}</a></div>}</div>}
                              </div>
                              <p className="mt-1 px-1 text-[9px] tracking-wide text-[#6b6b6b]">{formatTimestamp(msg.created_at)}</p>
                            </div>
                          </div>
                        )
                      })}
                      <div ref={bottomRef} />
                    </div>
                  )}
                </div>

                <div className="border-t border-[#dddddd] bg-white p-3 md:p-4">
                  {!residencyPrivate && attachmentFile && (
                    <div className="mb-3 flex items-center justify-between rounded-xl border border-[#dddddd] bg-[#f1f1f1] px-3 py-2.5">
                      <div className="flex min-w-0 items-center gap-2 text-[12px] text-[#3a3a3a]"><FileText size={15} /><span className="truncate">{attachmentFile.name}</span></div>
                      <button type="button" onClick={removeAttachment} className="ml-3 text-[#6b6b6b] hover:text-[#1c1c1c]">×</button>
                    </div>
                  )}
                  <div className="flex items-end gap-2">
                    <div className="flex min-w-0 flex-1 items-center border border-[#dddddd] bg-[#f1f1f1] px-3 py-1.5 focus-within:border-accent focus-within:bg-white">
                      <input type="text" aria-label="Write a message" value={newMsg} onChange={e => setNewMsg(e.target.value)} onKeyDown={e => e.key === 'Enter' && !attachmentUploading && sendMessage()} className="min-w-0 flex-1 bg-transparent px-1 py-2 text-[13px] text-[#1c1c1c] outline-none placeholder:text-[#6b6b6b]" placeholder={residencyPrivate ? 'Discuss the Residency without sharing contact details…' : 'Write a message…'} disabled={attachmentUploading} />
                      {!residencyPrivate && <><input ref={fileInputRef} type="file" aria-label="Attach a file" onChange={handleFileSelected} accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" style={{ display: 'none' }} /><button type="button" onClick={handleAttachmentClick} aria-label="Attach a file" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[#6b6b6b] transition hover:bg-[#f1f1f1] hover:text-[#1c1c1c]" disabled={attachmentUploading} title="Attach file"><Paperclip size={17} /></button></>}
                    </div>
                    <button type="button" onClick={sendMessage} aria-label="Send message" className="flex h-11 w-11 shrink-0 items-center justify-center bg-accent text-white transition hover:bg-[#333333] disabled:opacity-50" disabled={attachmentUploading || (!newMsg.trim() && !attachmentFile)}><Send size={17} /></button>
                  </div>
                </div>
              </>
            )}
          </section>
        </div>
      </div>
    </DashboardShell>
  )
}
