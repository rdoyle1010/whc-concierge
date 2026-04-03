'use client'

import { useEffect, useState, useRef } from 'react'
import DashboardShell from '@/components/DashboardShell'
import { createClient } from '@/lib/supabase/client'
import { Send, MessageSquare } from 'lucide-react'

export default function TalentMessagesPage() {
  const supabase = createClient()
  const [userId, setUserId] = useState('')
  const [conversations, setConversations] = useState<any[]>([])
  const [activeConvo, setActiveConvo] = useState<string | null>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [newMsg, setNewMsg] = useState('')
  const [loading, setLoading] = useState(true)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUserId(user.id)

      // Get all messages for this user
      const { data: allMsgs } = await supabase
        .from('messages')
        .select('*')
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order('created_at', { ascending: false })

      // Group by conversation partner
      const partners = new Map<string, any>()
      for (const msg of allMsgs || []) {
        const partnerId = msg.sender_id === user.id ? msg.receiver_id : msg.sender_id
        if (!partners.has(partnerId)) {
          partners.set(partnerId, { partnerId, lastMessage: msg, unread: 0 })
        }
        if (msg.receiver_id === user.id && !msg.read) {
          const p = partners.get(partnerId)!
          p.unread++
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

      // Mark as read
      await supabase.from('messages').update({ read: true })
        .eq('sender_id', activeConvo).eq('receiver_id', userId).eq('read', false)

      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
    }
    loadMessages()
  }, [activeConvo, userId])

  const sendMessage = async () => {
    if (!newMsg.trim() || !activeConvo) return

    await supabase.from('messages').insert({
      sender_id: userId,
      receiver_id: activeConvo,
      content: newMsg.trim(),
      read: false,
    })

    setMessages([...messages, { sender_id: userId, receiver_id: activeConvo, content: newMsg.trim(), created_at: new Date().toISOString(), read: false }])
    setNewMsg('')
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
  }

  return (
    <DashboardShell role="talent">
      <h1 className="text-2xl font-serif font-bold text-ink mb-6">Messages</h1>

      <div className="dashboard-card p-0 overflow-hidden" style={{ height: 'calc(100vh - 200px)' }}>
        <div className="flex h-full">
          {/* Conversation list */}
          <div className="w-80 border-r border-gray-100 overflow-y-auto">
            {conversations.length === 0 ? (
              <div className="p-8 text-center text-gray-400">
                <MessageSquare size={32} className="mx-auto mb-2" />
                <p className="text-sm">No messages yet</p>
              </div>
            ) : conversations.map((convo) => (
              <button key={convo.partnerId}
                onClick={() => setActiveConvo(convo.partnerId)}
                className={`w-full p-4 text-left border-b border-gray-50 hover:bg-gray-50 transition-colors ${
                  activeConvo === convo.partnerId ? 'bg-gold/5 border-l-2 border-l-gold' : ''
                }`}>
                <div className="flex items-center justify-between">
                  <p className="font-medium text-ink text-sm truncate">{convo.partnerId.slice(0, 8)}...</p>
                  {convo.unread > 0 && (
                    <span className="w-5 h-5 bg-gold text-white text-xs rounded-full flex items-center justify-center">{convo.unread}</span>
                  )}
                </div>
                <p className="text-xs text-gray-400 truncate mt-1">{convo.lastMessage?.content}</p>
              </button>
            ))}
          </div>

          {/* Messages */}
          <div className="flex-1 flex flex-col">
            {!activeConvo ? (
              <div className="flex-1 flex items-center justify-center text-gray-400">
                <p>Select a conversation to start messaging</p>
              </div>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                  {messages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.sender_id === userId ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-xs px-4 py-2.5 rounded-2xl text-sm ${
                        msg.sender_id === userId ? 'bg-gold text-white rounded-br-sm' : 'bg-gray-100 text-ink rounded-bl-sm'
                      }`}>
                        {msg.content}
                      </div>
                    </div>
                  ))}
                  <div ref={bottomRef} />
                </div>
                <div className="p-4 border-t border-gray-100">
                  <div className="flex space-x-3">
                    <input type="text" value={newMsg} onChange={(e) => setNewMsg(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                      className="input-field flex-1" placeholder="Type a message..." />
                    <button onClick={sendMessage} className="btn-primary !px-4">
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
