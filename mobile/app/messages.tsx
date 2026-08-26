import { useEffect, useMemo, useState } from 'react'
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { router } from 'expo-router'
import { supabase } from '../src/lib/supabase'

type MessageRow = { id: string; sender_id: string; recipient_id: string; content: string; read: boolean | null; created_at: string | null; profiles?: any }
type Person = { id: string; full_name: string | null; email: string | null; role: string | null }

export default function MessagesScreen() {
  const [userId, setUserId] = useState('')
  const [messages, setMessages] = useState<MessageRow[]>([])
  const [people, setPeople] = useState<Record<string, Person>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.replace('/login'); return }
      setUserId(user.id)
      const { data, error: queryError } = await supabase.from('messages').select('id,sender_id,recipient_id,content,read,created_at').or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`).order('created_at', { ascending: false })
      if (queryError) { setError(queryError.message); setLoading(false); return }
      const rows = (data || []) as MessageRow[]
      setMessages(rows)
      const ids = Array.from(new Set(rows.flatMap(row => [row.sender_id, row.recipient_id]).filter(id => id !== user.id)))
      if (ids.length) {
        const { data: profiles } = await supabase.from('profiles').select('id,full_name,email,role').in('id', ids)
        setPeople(Object.fromEntries((profiles || []).map(person => [person.id, person as Person])))
      }
      setLoading(false)
    }
    load()
  }, [])

  const threads = useMemo(() => {
    const seen = new Set<string>()
    return messages.filter(message => {
      const other = message.sender_id === userId ? message.recipient_id : message.sender_id
      if (seen.has(other)) return false
      seen.add(other)
      return true
    })
  }, [messages, userId])

  return <ScrollView style={styles.scroll} contentContainerStyle={styles.page}>
    <Pressable onPress={() => router.back()}><Text style={styles.back}>‹ Back</Text></Pressable>
    <Text style={styles.eyebrow}>CONVERSATIONS</Text>
    <Text style={styles.title}>Messages</Text>
    <Text style={styles.intro}>Your employer and talent conversations, synced with the website.</Text>
    {loading ? <ActivityIndicator color="#092b45" style={{ marginTop: 30 }} /> : null}
    {error ? <Text style={styles.error}>{error}</Text> : null}
    {!loading && threads.length === 0 ? <View style={styles.empty}><Text style={styles.emptyTitle}>No messages yet.</Text><Text style={styles.emptyCopy}>When a conversation starts on the platform, it will appear here.</Text></View> : null}
    <View style={styles.list}>{threads.map(message => {
      const otherId = message.sender_id === userId ? message.recipient_id : message.sender_id
      const person = people[otherId]
      const unread = message.recipient_id === userId && !message.read
      return <View key={message.id} style={[styles.card, unread && styles.unreadCard]}>
        <View style={styles.row}><Text style={styles.name}>{person?.full_name || person?.email || 'Platform member'}</Text>{unread ? <Text style={styles.unread}>NEW</Text> : null}</View>
        <Text numberOfLines={2} style={styles.preview}>{message.content}</Text>
        <Text style={styles.date}>{message.created_at ? new Date(message.created_at).toLocaleString('en-GB', { day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' }) : ''}</Text>
      </View>
    })}</View>
  </ScrollView>
}

const styles = StyleSheet.create({ scroll:{flex:1,backgroundColor:'#fff'}, page:{paddingHorizontal:22,paddingTop:64,paddingBottom:44}, back:{color:'#66747c',fontSize:13,marginBottom:34}, eyebrow:{color:'#71808a',fontSize:9,letterSpacing:2.1,marginBottom:10}, title:{color:'#092b45',fontSize:31,lineHeight:37,fontWeight:'500'}, intro:{color:'#66747c',fontSize:14,lineHeight:21,marginTop:10,marginBottom:26}, list:{gap:10}, card:{borderWidth:1,borderColor:'#dce3e7',padding:18}, unreadCard:{backgroundColor:'#f6f9fa',borderColor:'#b9c7ce'}, row:{flexDirection:'row',justifyContent:'space-between',gap:10}, name:{color:'#173246',fontSize:15,fontWeight:'600',flex:1}, unread:{color:'#092b45',fontSize:8,letterSpacing:1.4}, preview:{color:'#66747c',fontSize:12,lineHeight:18,marginTop:7}, date:{color:'#8b989f',fontSize:10,marginTop:10}, empty:{backgroundColor:'#f4f7f8',padding:20}, emptyTitle:{color:'#173246',fontSize:15,fontWeight:'600'}, emptyCopy:{color:'#71808a',fontSize:12,lineHeight:18,marginTop:6}, error:{color:'#9b2c2c',fontSize:12,marginBottom:18} })