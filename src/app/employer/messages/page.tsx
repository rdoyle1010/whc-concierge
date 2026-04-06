'use client'

import { useEffect, useState, useRef } from 'react'
import DashboardShell from '@/components/DashboardShell'
import { createClient } from '@/lib/supabase/client'
import { Send, MessageSquare, Paperclip, FileText, Image as ImageIcon, Download } from 'lucide-react'

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

    const timeStr = msgDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })

    if (daysAgo === 0) return timeStr
    if (daysAgo < 7) return msgDate.toLocaleDateString('en-US', { weekday: 'short' }) + ' ' + timeStr
    return msgDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ' ' + timeStr
  }

  const handleAttachmentClick = () => {
    fileInputRef.current?.click()
  }

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
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUserId(user.id)

      const { data: allMsgs } = await supabase
        .from('messages')
        .select('*')
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order('created_at', { ascending: false })

      const partners = new Map<string, any>()
      for (const msg of allMsgs || []) {
        const partnerId = msg.sender_id === user.id ? msg.receiver_id : msg.sender_id
        if (!partners.has(partnerId)) {
          partners.set(partnerId, { partnerId, lastMessage: msg, unread: 0, partnerName: null })
        }
        if (msg.receiver_id === user.id && !msg.read) {
          partners.get(partnerId)!.unread++
        }
      }

      const partnerIds = Array.from(partners.keys())
      if (partnerIds.length > 0) {
        const { data: candProfiles } = await supabase
          .from('candidate_profiles')
          .select('user_id, full_name')
          .in('user_id', partnerIds)
        for (const cp of candProfiles || []) {
          const p = partners.get(cp.user_id)
          if (p) p.partnerName = cp.full_name
        }

        const { data: empProfiles } = await supabase
          .from('employer_profiles')
          .select('user_id, company_name, contact_name, property_name')
          .in('user_id', partnerIds)
        for (const ep of empProfiles || []) {
          const p = partners.get(ep.user_id)
          if (p && !p.partnerName) p.partnerName = ep.property_name || ep.company_name || ep.contact_name
        }
      }

      setConversations(Array.from(partners.values()))
      setLoading(false)
    }
    load()
  }, [])

  useEffect(() => {
    if (!activeConvo || !userId) return
    async function loadMessages() {
      const { data } = await supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${userId},receiver_id.eq.${activeConvo}),and(sender_id.eq.${activeConvo},receiver_id.eq.${userId})`)
        .order('created_at', { ascending: true })
      setMessages(data || [])
      await supabase.from('messages').update({ read: true }).eq('sender_id', activeConvo).eq('receiver_id', userId).eq('read', false)
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
    }
    loadMessages()
  }, [activeConvo, userId])

  const sendMessage = async () => {
    if ((!newMsg.trim() && !attachmentFile) || !activeConvo) return

    try {
      setAttachmentUploading(true)
      let attachmentUrl = null
      let attachmentName = null
      let attachmentType = null

      if (attachmentFile) {
        const fileExt = attachmentFile.name.split('.').pop()
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
        const { error: uploadError } = await supabase.storage
          .from('message-attachments')
          .upload(fileName, attachmentFile)

        if (uploadError) throw uploadError

        const { data: { publicUrl } } = supabase.storage
          .from('message-attachments')
          .getPublicUrl(fileName)

        attachmentUrl = publicUrl
        attachmentName = attachmentFile.name
        attachmentType = attachmentFile.type
      }

      await supabase.from('messages').insert({
        sender_id: userId,
        receiver_id: activeConvo,
        content: newMsg.trim() || null,
        attachment_url: attachmentUrl,
        attachment_name: attachmentName,
        attachment_type: attachmentType,
        read: false,
      })

      setMessages([...messages, {
        sender_id: userId,
        receiver_id: activeConvo,
        content: newMsg.trim() || null,
        attachment_url: attachmentUrl,
        attachment_name: attachmentName,
        attachment_type: attachmentType,
        created_at: new Date().toISOString(),
        read: false
      }])

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
      <h1 className="text-2xl font-serif font-bold text-ink mb-6">Messages</h1>
      <div className="dashboard-card p-0 overflow-hidden" style={{ height: 'calc(100vh - 200px)' }}>
        <div className="flex h-full">
          <div className="w-80 border-r border-gray-100 overflow-y-auto">
            {conversations.length === 0 ? (
              <div className="p-8 text-center text-gray-400"><MessageSquare size={32} className="mx-auto mb-2" /><p className="text-sm">No messages yet</p></div>
            ) : conversations.map((convo) => (
              <button key={convo.partnerId} onClick={() => setActiveConvo(convo.partnerId)}
                className={`w-full p-4 text-left border-b border-gray-50 hover:bg-gray-50 ${activeConvo === convo.partnerId ? 'bg-gold/5 border-l-2 border-l-gold' : ''}`}>
                <div className="flex items-center justify-between">
                  <p className="font-medium text-ink text-sm truncate">{convo.partnerName || 'Unknown User'}</p>
                  {convo.unread > 0 && <span className="w-5 h-5 bg-gold text-white text-xs rounded-full flex items-center justify-center">{convo.unread}</span>}
                </div>
                <p className="text-xs text-gray-400 truncate mt-1">{convo.lastMessage?.content}</p>
              </button>
            ))}
          </div>
          <div className="flex-1 flex flex-col">
            {!activeConvo ? (
              <div className="flex-1 flex items-center justify-center text-gray-400">Select a conversation</div>
            ) : (
              <>
                <div className="px-6 py-3 border-b border-gray-100">
                  <p className="font-medium text-ink text-sm">{activePartner?.partnerName || 'Unknown User'}</p>
                </div>
                <div className="flex-1 overflow-y-auto p-6 space-y-3">
                  {messages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.sender_id === userId ? 'justify-end' : 'justify-start'}`}>
                      <div className="flex flex-col">
                        <div className={`max-w-xs px-4 py-2.5 rounded-2xl text-sm ${msg.sender_id === userId ? 'bg-gold text-white rounded-br-sm' : 'bg-gray-100 text-ink rounded-bl-sm'}`}>
                          {msg.content && <p>{msg.content}</p>}
                          {msg.attachment_url && (
                            <div className="mt-2">
                              {(msg.attachment_type?.startsWith('image/')) ? (
                                <a href={msg.attachment_url} target="_blank" rel="noopener noreferrer">
                                  <img src={msg.attachment_url} alt={msg.attachment_name} className="max-w-[200px] rounded" />
                                </a>
                              ) : (
                                <div className="flex items-center gap-2 text-xs">
                                  <FileText size={14} />
                                  <a href={msg.attachment_url} download={msg.attachment_name} className="underline hover:opacity-80">
                                    {msg.attachment_name}
                                  </a>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                        <p className="text-xs text-gray-400 mt-1 px-2">{formatTimestamp(msg.created_at)}</p>
                      </div>
                    </div>
                  ))}
                  <div ref={bottomRef} />
                </div>
                <div className="p-4 border-t border-gray-100">
                  {attachmentFile && (
                    <div className="mb-3 p-3 bg-gray-50 rounded flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm text-ink">
                        <FileText size={16} />
                        <span className="truncate">{attachmentFile.name}</span>
                      </div>
                      <button onClick={removeAttachment} className="text-gray-400 hover:text-ink transition-colors">×</button>
                    </div>
                  )}
                  <div className="flex space-x-3">
                    <input type="text" value={newMsg} onChange={(e) => setNewMsg(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && !attachmentUploading && sendMessage()} className="input-field flex-1" placeholder="Type a message..." disabled={attachmentUploading} />
                    <input ref={fileInputRef} type="file" onChange={handleFileSelected} accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" style={{ display: 'none' }} />
                    <button onClick={handleAttachmentClick} className="btn-secondary !px-4" disabled={attachmentUploading} title="Attach file">
                      <Paperclip size={18} />
                    </button>
                    <button onClick={sendMessage} className="btn-primary !px-4" disabled={attachmentUploading}>
                      <Send size={18} />
                    </button>
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
