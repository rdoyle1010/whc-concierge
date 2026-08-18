'use client'

import { useEffect, useState, useRef } from 'react'
import DashboardShell from '@/components/DashboardShell'
import { createClient } from '@/lib/supabase/client'
import { Send, MessageSquare, Paperclip, FileText } from 'lucide-react'

const THREAD_LIMIT = 100
const MESSAGE_FIELDS = 'id,sender_id,recipient_id,content,attachment_url,attachment_name,attachment_type,created_at,read'

export default function EmployerMessagesPage() {
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
    const daysAgo = Math.floor((today.getTime() - msgDay.getTime()) / (1000 * 60 * 60 * 24))
    const timeStr = msgDate.toLocaleTimeString('en-GB', { hour: 'numeric', minute: '2-digit' })
    if (daysAgo === 0) return timeStr
    if (daysAgo < 7) return msgDate.toLocaleDateString('en-GB', { weekday: 'short' }) + ' ' + timeStr
    return msgDate.toLocaleDateString('en-GB', { month: 'short', day: 'numeric' }) + ' ' + timeStr
  }

  const handleAttachmentClick = () => fileInputRef.current?.click()

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB')
      return
    }
    setAttachmentFile(file)
  }

  const removeAttachment = () => {
    setAttachmentFile(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  useEffect(() => {
    let active = true
    async function load() {
      const { data: sessionData } = await supabase.auth.getSession()
      const user = sessionData.session?.user
      if (!user || !active) { setLoading(false); return }
      setUserId(user.id)

      const res = await fetch('/api/messages/conversations')
      const body = res.ok ? await res.json().catch(() => ({ conversations: [] })) : { conversations: [] }
      if (!active) return
      const convoList = [...(body.conversations || [])]
      const to = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('to') : null
      if (to && to !== user.id) {
        if (!convoList.some((conversation: any) => conversation.partnerId === to)) {
          let partnerName: string | null = null
          const { data: cp } = await supabase.from('candidate_profiles').select('full_name').eq('user_id', to).maybeSingle()
          partnerName = cp?.full_name || null
          if (!partnerName) {
            const { data: ep } = await supabase.from('employer_profiles').select('property_name,company_name').eq('user_id', to).maybeSingle()
            partnerName = ep?.property_name || ep?.company_name || null
          }
          convoList.unshift({ partnerId: to, lastMessage: null, unread: 0, partnerName: partnerName || 'New conversation' })
        }
        setActiveConvo(to)
      }

      if (active) {
        setConversations(convoList)
        setLoading(false)
      }
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
      fetch('/api/messages/mark-read', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ partnerId: activeConvo }) }).catch(() => {})
      setConversations(current => current.map(c => c.partnerId === activeConvo ? { ...c, unread: 0 } : c))
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
    }
    loadMessages()
    return () => { active = false }
  }, [activeConvo, userId])

  const sendMessage = async () => {
    if ((!newMsg.trim() && !attachmentFile) || !activeConvo || attachmentUploading) return
    try {
      setAttachmentUploading(true)
      let attachmentUrl = null
      let attachmentName = null
      let attachmentType = null

      if (attachmentFile) {
        const fileExt = attachmentFile.name.split('.').pop()
        const fileName = `${userId}/messages/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
        const fd = new FormData()
        fd.append('file', attachmentFile)
        fd.append('bucket', 'message-attachments')
        fd.append('path', fileName)
        const upRes = await fetch('/api/upload', { method: 'POST', body: fd })
        const upJson = await upRes.json().catch(() => ({}))
        if (!upRes.ok || !upJson.url) throw new Error(upJson.error || 'Attachment upload failed')
        attachmentUrl = upJson.url
        attachmentName = attachmentFile.name
        attachmentType = attachmentFile.type
      }

      const content = newMsg.trim() || null
      const sendRes = await fetch('/api/messages/send', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipientId: activeConvo, content, attachmentUrl, attachmentName, attachmentType }),
      })
      if (!sendRes.ok) {
        const d = await sendRes.json().catch(() => ({}))
        alert(d.error || 'Message failed to send - please try again.')
        setAttachmentUploading(false)
        return
      }

      const optimistic = { sender_id: userId, recipient_id: activeConvo, content, attachment_url: attachmentUrl, attachment_name: attachmentName, attachment_type: attachmentType, created_at: new Date().toISOString(), read: false }
      setMessages(current => [...current, optimistic].slice(-THREAD_LIMIT))
      setConversations(current => current.map(c => c.partnerId === activeConvo ? { ...c, lastMessage: optimistic } : c))
      setNewMsg('')
      removeAttachment()
      setAttachmentUploading(false)
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
    } catch (error) {
      console.error('Error sending message:', error)
      alert('Failed to send message')
      setAttachmentUploading(false)
    }
  }

  const activePartner = conversations.find(c => c.partnerId === activeConvo)
  return (
    <DashboardShell role="employer">
      <h1 className="text-2xl font-semibold text-ink mb-6">Messages</h1>
      <div className="dashboard-card p-0 overflow-hidden" style={{ height: 'calc(100vh - 200px)' }}>
        <div className="flex h-full">
          <div className="w-80 border-r border-gray-100 overflow-y-auto">
            {loading ? <div className="p-8 text-center text-gray-400 text-sm">Loading conversations…</div> : conversations.length === 0 ? (
              <div className="p-8 text-center text-gray-400"><MessageSquare size={32} className="mx-auto mb-2" /><p className="text-sm">No messages yet</p></div>
            ) : conversations.map((convo) => (
              <button type="button" key={convo.partnerId} onClick={() => setActiveConvo(convo.partnerId)}
                className={`w-full p-4 text-left border-b border-gray-50 hover:bg-gray-50 ${activeConvo === convo.partnerId ? 'bg-gold/5 border-l-2 border-l-gold' : ''}`}>
                <div className="flex items-center justify-between">
                  <p className="font-medium text-ink text-sm truncate">{convo.partnerName || 'Unknown User'}</p>
                  {convo.unread > 0 && <span className="w-5 h-5 bg-gold text-white text-xs rounded-full flex items-center justify-center">{convo.unread > 9 ? '9+' : convo.unread}</span>}
                </div>
                <p className="text-xs text-gray-400 truncate mt-1">{convo.lastMessage?.content || (convo.lastMessage?.attachment_name ? `Attachment: ${convo.lastMessage.attachment_name}` : '')}</p>
              </button>
            ))}
          </div>
          <div className="flex-1 flex flex-col min-w-0">
            {!activeConvo ? (
              <div className="flex-1 flex items-center justify-center text-gray-400">Select a conversation</div>
            ) : (
              <>
                <div className="px-6 py-3 border-b border-gray-100"><p className="font-medium text-ink text-sm">{activePartner?.partnerName || 'Unknown User'}</p></div>
                <div className="flex-1 overflow-y-auto p-6 space-y-3">
                  {messages.map((msg, i) => (
                    <div key={msg.id || `${msg.created_at}-${i}`} className={`flex ${msg.sender_id === userId ? 'justify-end' : 'justify-start'}`}>
                      <div className="flex flex-col">
                        <div className={`max-w-xs px-4 py-2.5 rounded-2xl text-sm ${msg.sender_id === userId ? 'bg-gold text-white rounded-br-sm' : 'bg-gray-100 text-ink rounded-bl-sm'}`}>
                          {msg.content && <p>{msg.content}</p>}
                          {msg.attachment_url && <div className="mt-2">{msg.attachment_type?.startsWith('image/') ? <a href={msg.attachment_url} target="_blank" rel="noopener noreferrer"><img src={msg.attachment_url} alt={msg.attachment_name || 'Attachment'} className="max-w-[200px] rounded" /></a> : <div className="flex items-center gap-2 text-xs"><FileText size={14} /><a href={msg.attachment_url} download={msg.attachment_name} className="underline hover:opacity-80">{msg.attachment_name}</a></div>}</div>}
                        </div>
                        <p className="text-xs text-gray-400 mt-1 px-2">{formatTimestamp(msg.created_at)}</p>
                      </div>
                    </div>
                  ))}
                  <div ref={bottomRef} />
                </div>
                <div className="p-4 border-t border-gray-100">
                  {attachmentFile && <div className="mb-3 p-3 bg-gray-50 rounded flex items-center justify-between"><div className="flex items-center gap-2 text-sm text-ink"><FileText size={16} /><span className="truncate">{attachmentFile.name}</span></div><button type="button" onClick={removeAttachment} className="text-gray-400 hover:text-ink transition-colors">×</button></div>}
                  <div className="flex space-x-3">
                    <input type="text" value={newMsg} onChange={(e) => setNewMsg(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && !attachmentUploading && sendMessage()} className="input-field flex-1" placeholder="Type a message..." disabled={attachmentUploading} />
                    <input ref={fileInputRef} type="file" onChange={handleFileSelected} accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" style={{ display: 'none' }} />
                    <button type="button" onClick={handleAttachmentClick} className="btn-secondary !px-4" disabled={attachmentUploading} title="Attach file"><Paperclip size={18} /></button>
                    <button type="button" onClick={sendMessage} className="btn-primary !px-4" disabled={attachmentUploading}><Send size={18} /></button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </DashboardShell>
  )
}
