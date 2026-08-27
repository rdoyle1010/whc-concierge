import { useEffect, useMemo, useState } from 'react'
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { router } from 'expo-router'
import { supabase } from '../src/lib/supabase'

type MessageRow = { id: string; sender_id: string; recipient_id: string; content: string; read: boolean | null; created_at: string | null }
type Person = { id: string; full_name: string | null; email: string | null; role: string | null }

export default function MessagesScreen() {
  const [userId, setUserId] = useState('')
  const [messages, setMessages] = useState<MessageRow[]>([])
  const [people, setPeople] = useState<Record<string, Person>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => { load() }, [])
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

  const threads = useMemo(() => {
    const seen = new Set<string>()
    return messages.filter(message => {
      const other = message.sender_id === userId ? message.recipient_id : message.sender_id
      if (seen.has(other)) return false
      seen.add(other)
      return true
    })
  }, [messages, userId])

  const unreadCount = messages.filter(message => message.recipient_id === userId && !message.read).length

  return <ScrollView style={styles.scroll} contentContainerStyle={styles.page}>
    <Pressable onPress={() => router.back()}><Text style={styles.back}>‹ Back</Text></Pressable>
    <View style={styles.headingRow}><View style={{flex:1}}><Text style={styles.eyebrow}>CONVERSATIONS</Text><Text style={styles.title}>Messages</Text></View>{unreadCount>0?<View style={styles.count}><Text style={styles.countText}>{unreadCount}</Text></View>:null}</View>
    <Text style={styles.intro}>Your Wellness House conversations in one place. Messages stay synced with the website.</Text>
    {loading ? <ActivityIndicator color="#092b45" style={{ marginTop: 24 }} /> : null}
    {error ? <Text style={styles.error}>{error}</Text> : null}
    {!loading && threads.length === 0 ? <View style={styles.empty}><Text style={styles.emptyTitle}>No conversations yet.</Text><Text style={styles.emptyCopy}>Applications, Agency activity and employer conversations will appear here when they begin.</Text></View> : null}
    <View style={styles.list}>{threads.map(message => {
      const otherId = message.sender_id === userId ? message.recipient_id : message.sender_id
      const person = people[otherId]
      const unread = message.recipient_id === userId && !message.read
      return <Pressable key={message.id} onPress={()=>router.push(`/message/${otherId}`)} style={[styles.card, unread && styles.unreadCard]}>
        <View style={styles.row}><View style={styles.avatar}><Text style={styles.avatarText}>{(person?.full_name || person?.email || 'P').slice(0,1).toUpperCase()}</Text></View><View style={{flex:1}}><View style={styles.nameRow}><Text numberOfLines={1} style={styles.name}>{person?.full_name || person?.email || 'Platform member'}</Text>{unread ? <Text style={styles.unread}>NEW</Text> : null}</View><Text numberOfLines={2} style={styles.preview}>{message.content}</Text><Text style={styles.date}>{message.created_at ? new Date(message.created_at).toLocaleString('en-GB', { day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' }) : ''}</Text></View></View>
      </Pressable>
    })}</View>
  </ScrollView>
}

const styles = StyleSheet.create({
  scroll:{flex:1,backgroundColor:'#fff'}, page:{paddingHorizontal:22,paddingTop:18,paddingBottom:30}, back:{color:'#66747c',fontSize:14,marginBottom:26},
  headingRow:{flexDirection:'row',alignItems:'flex-start',gap:12},eyebrow:{color:'#71808a',fontSize:8,letterSpacing:2,marginBottom:8}, title:{color:'#092b45',fontSize:29,lineHeight:34,fontWeight:'500'},
  count:{minWidth:30,height:30,borderRadius:15,backgroundColor:'#092b45',alignItems:'center',justifyContent:'center',marginTop:4},countText:{color:'#fff',fontSize:11,fontWeight:'700'},
  intro:{color:'#66747c',fontSize:13,lineHeight:20,marginTop:9,marginBottom:22}, list:{gap:9}, card:{borderWidth:1,borderColor:'#dce3e7',padding:15}, unreadCard:{backgroundColor:'#f6f9fa',borderColor:'#b9c7ce'},
  row:{flexDirection:'row',gap:12},avatar:{width:38,height:38,borderRadius:19,backgroundColor:'#edf2f4',alignItems:'center',justifyContent:'center'},avatarText:{color:'#092b45',fontSize:13,fontWeight:'700'},
  nameRow:{flexDirection:'row',justifyContent:'space-between',gap:8},name:{color:'#173246',fontSize:14,fontWeight:'600',flex:1}, unread:{color:'#092b45',fontSize:8,letterSpacing:1.2,fontWeight:'700'}, preview:{color:'#66747c',fontSize:11,lineHeight:17,marginTop:5}, date:{color:'#8b989f',fontSize:9,marginTop:7},
  empty:{backgroundColor:'#f4f7f8',padding:18}, emptyTitle:{color:'#173246',fontSize:14,fontWeight:'600'}, emptyCopy:{color:'#71808a',fontSize:11,lineHeight:17,marginTop:6}, error:{color:'#9b2c2c',fontSize:11,marginBottom:16}
})
