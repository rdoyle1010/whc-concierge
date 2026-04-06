'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import Navbar from '@/components/Navbar'
import { Send, MessageSquare, ArrowLeft } from 'lucide-react'
import { notify } from '@/lib/notify'
import Link from 'next/link'

export default function MessagesPage() {
  const supabase = createClient()
  const [userId, setUserId] = useState('')
  const [threads, setThreads] = useState<any[]>([])
  const [activeThread, setActiveThread] = useState<string | null>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [newMsg, setNewMsg] = useState('')
  const [loading, setLoading] = useState(true)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUserId(user.id)

      // Load threads
      const { data: threadData } = await supabase
        .from('message_threads')
        .select('*')
        .or(`participant_1.eq.${user.id},participant_2.eq.${user.id}`)
        .order('last_message_at', { ascending: false })

      // Also check legacy messages table
      const { data: legacyMsgs } = await supabase
        .from('messages')
        .select('*')
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order('created_at', { ascending: false })

      // Build thread list from both sources
      const partnerMap = new Map<string, { partnerId: string; lastMessage: any; unread: number }>()

      for (const msg of legacyMsgs || []) {
        const partnerId = msg.sender_id === user.id ? msg.receiver_id : msg.sender_id
        if (!partnerMap.has(partnerId)) {
          partnerMap.set(partnerId, { partnerId, lastMessage: msg, unread: 0 })
        }
        if (msg.receiver_id === user.id && !msg.read) {
          partnerMap.get(partnerId)!.unread++
        }
      }

      setThreads(Array.from(partnerMap.values()))
      setLoading(false)
    }
    load()
  }, [])

  useEffect(() => {
    if (!activeThread || !userId) return
    async function loadMessages() {
      const { data } = await supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${userId},receiver_id.eq.${activeThread}),and(sender_id.eq.${activeThread},receiver_id.eq.${userId})`)
        .order('created_at', { ascending: true })
      setMessages(data || [])
      await supabase.from('messages').update({ read: true }).eq('sender_id', activeThread).eq('receiver_id', userId).eq('read', false)
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
    }
    loadMessages()

    // Realtime subscription
    const channel = supabase.channel(`messages-${activeThread}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
        const msg = payload.new as any
        if ((msg.sender_id === userId && msg.receiver_id === activeThread) || (msg.sender_id === activeThread && msg.receiver_id === userId)) {
          setMessages(prev => [...prev, msg])
          setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
        }
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [activeThread, userId])

  const sendMessage = async () => {
    if (!newMsg.trim() || !activeThread) return
    const content = newMsg.trim()
    setNewMsg('')
    setMessages(prev => [...prev, { sender_id: userId, receiver_id: activeThread, content, created_at: new Date().toISOString() }])
    await supabase.from('messages').insert({ sender_id: userId, receiver_id: activeThread, content, read: false })
    notify(activeThread, 'new_message', 'New message', content.length > 80 ? content.slice(0, 80) + '...' : content, '/messages')
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
  }

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <div className="pt-16 h-screen flex flex-col">
        <div className="flex-1 flex overflow-hidden max-w-7xl mx-auto w-full">
          {/* Thread list */}
          <div className={`w-80 border-r border-neutral-100 overflow-y-auto ${activeThread ? 'hidden md:block' : ''}`}>
            <div className="p-4 border-b border-neutral-100">
              <h2 className="font-bold text-black">Messages</h2>
            </div>
            {loading ? (
              <div className="p-8 text-center"><div className="animate-spin w-6 h-6 border-2 border-black border-t-transparent rounded-full mx-auto" /></div>
            ) : threads.length === 0 ? (
              <div className="p-8 text-center text-neutral-300"><MessageSquare size={24} className="mx-auto mb-2" /><p className="text-sm">No conversations yet</p></div>
            ) : threads.map((t) => (
              <button key={t.partnerId} onClick={() => setActiveThread(t.partnerId)}
                className={`w-full text-left px-4 py-3 border-b border-neutral-50 hover:bg-neutral-50 transition-colors ${activeThread === t.partnerId ? 'bg-neutral-50' : ''}`}>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-black truncate">{t.partnerId.slice(0, 8)}...</p>
                  {t.unread > 0 && <span className="w-5 h-5 bg-black text-white text-xs rounded-full flex items-center justify-center">{t.unread}</span>}
                </div>
                <p className="text-xs text-neutral-400 truncate mt-0.5">{t.lastMessage?.content}</p>
              </button>
            ))}
          </div>

          {/* Messages */}
          <div className={`flex-1 flex flex-col ${!activeThread ? 'hidden md:flex' : ''}`}>
            {!activeThread ? (
              <div className="flex-1 flex items-center justify-center text-neutral-300"><p className="text-sm">Select a conversation</p></div>
            ) : (
              <>
                <div className="p-4 border-b border-neutral-100 flex items-center space-x-3">
                  <button onClick={() => setActiveThread(null)} className="md:hidden text-neutral-400"><ArrowLeft size={18} /></button>
                  <p className="text-sm font-medium text-black">{activeThread.slice(0, 8)}...</p>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {messages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.sender_id === userId ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-xs px-4 py-2.5 text-sm ${
                        msg.sender_id === userId ? 'bg-black text-white' : 'bg-neutral-100 text-black'
                      }`}>{msg.content}</div>
                    </div>
                  ))}
                  <div ref={bottomRef} />
                </div>
                <div className="p-4 border-t border-neutral-100">
                  <div className="flex space-x-3">
                    <input type="text" value={newMsg} onChange={(e) => setNewMsg(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                      className="input-field flex-1" placeholder="Type a message..." />
                    <button onClick={sendMessage} className="btn-primary !px-4"><Send size={16} /></button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
