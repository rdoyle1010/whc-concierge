import { useCallback, useMemo, useState } from 'react'
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { router, useFocusEffect } from 'expo-router'
import { supabase } from '../src/lib/supabase'
import { palette, radius, space, type } from '../src/lib/theme'

type MessageRow = { id: string; sender_id: string; recipient_id: string; content: string; read: boolean | null; created_at: string | null }
type Person = { id: string; full_name: string | null; email: string | null; role: string | null }

function roleLabel(role?:string|null){return role==='employer'?'Employer':role==='admin'?'Talent House':'Talent'}

export default function MessagesScreen() {
  const [userId, setUserId] = useState('')
  const [messages, setMessages] = useState<MessageRow[]>([])
  const [people, setPeople] = useState<Record<string, Person>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
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
    } else {
      setPeople({})
    }
    setLoading(false)
  }, [])

  useFocusEffect(useCallback(() => {
    void load()
    return undefined
  }, [load]))

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
    <Pressable onPress={() => router.back()} style={styles.backButton}><Text style={styles.back}>‹ Back</Text></Pressable>
    <Text style={styles.eyebrow}>CONVERSATIONS</Text>
    <View style={styles.headingRow}>
      <Text style={styles.title}>Messages</Text>
      {unreadCount>0?<View style={styles.count}><Text style={styles.countText}>{unreadCount}</Text></View>:null}
    </View>
    <Text style={styles.intro}>Private conversations linked to recruitment, Agency work and Residency. Open a thread to continue where you left off.</Text>

    {loading ? <ActivityIndicator color={palette.ink} style={{ marginTop: 24 }} /> : null}
    {error ? <Text style={styles.error}>{error}</Text> : null}

    {!loading && threads.length === 0 ? <View style={styles.empty}>
      <Text style={styles.emptyEyebrow}>INBOX CLEAR</Text>
      <Text style={styles.emptyTitle}>No conversations yet.</Text>
      <Text style={styles.emptyCopy}>Messages begin from real platform activity, so there is no need to start cold conversations here.</Text>
    </View> : null}

    <View style={styles.list}>{threads.map(message => {
      const otherId = message.sender_id === userId ? message.recipient_id : message.sender_id
      const person = people[otherId]
      const unread = message.recipient_id === userId && !message.read
      const name=person?.full_name || person?.email || 'Platform member'
      return <Pressable key={message.id} onPress={()=>router.push(`/message/${otherId}`)} style={[styles.card, unread && styles.unreadCard]}>
        <View style={styles.row}>
          <View style={[styles.avatar,unread&&styles.avatarUnread]}><Text style={styles.avatarText}>{name.slice(0,1).toUpperCase()}</Text></View>
          <View style={{flex:1}}>
            <View style={styles.nameRow}>
              <View style={{flex:1}}><Text numberOfLines={1} style={styles.name}>{name}</Text><Text style={styles.personRole}>{roleLabel(person?.role)}</Text></View>
              {unread ? <View style={styles.unreadPill}><Text style={styles.unread}>NEW</Text></View> : null}
            </View>
            <Text numberOfLines={2} style={[styles.preview,unread&&styles.previewUnread]}>{message.content}</Text>
            <Text style={styles.date}>{message.created_at ? new Date(message.created_at).toLocaleString('en-GB', { day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' }) : ''}</Text>
          </View>
          <Text style={styles.arrow}>›</Text>
        </View>
      </Pressable>
    })}</View>
  </ScrollView>
}

const styles = StyleSheet.create({
  scroll:{flex:1,backgroundColor:palette.stone},
  page:{paddingHorizontal:space.page,paddingTop:18,paddingBottom:118},
  backButton:{alignSelf:'flex-start',paddingVertical:6,marginBottom:22},
  back:{color:palette.muted,fontSize:13},
  eyebrow:{color:palette.quiet,fontSize:8,letterSpacing:2.2,fontWeight:'700',marginBottom:9},
  headingRow:{flexDirection:'row',alignItems:'center',gap:10},
  title:{color:palette.inkStrong,fontFamily:type.serif,fontSize:34,lineHeight:40,fontWeight:'400'},
  count:{minWidth:26,height:26,borderRadius:13,backgroundColor:palette.inkStrong,alignItems:'center',justifyContent:'center'},
  countText:{color:palette.paper,fontSize:10,fontWeight:'800'},
  intro:{color:palette.muted,fontSize:13,lineHeight:20,marginTop:10,marginBottom:22,maxWidth:365},
  list:{gap:9},
  card:{borderWidth:1,borderColor:palette.line,padding:15,backgroundColor:palette.paper,borderRadius:radius.large},
  unreadCard:{borderColor:'#BCC8BF',backgroundColor:'#FBFCFA'},
  row:{flexDirection:'row',gap:12,alignItems:'center'},
  avatar:{width:42,height:42,borderRadius:21,backgroundColor:palette.stoneDeep,alignItems:'center',justifyContent:'center'},
  avatarUnread:{backgroundColor:palette.sageSoft},
  avatarText:{color:palette.inkStrong,fontFamily:type.serif,fontSize:17,fontWeight:'400'},
  nameRow:{flexDirection:'row',justifyContent:'space-between',gap:8,alignItems:'flex-start'},
  name:{color:palette.inkStrong,fontSize:13.5,fontWeight:'700'},
  personRole:{color:palette.quiet,fontSize:7.5,letterSpacing:1.1,fontWeight:'700',marginTop:3,textTransform:'uppercase'},
  unreadPill:{backgroundColor:palette.sageSoft,paddingHorizontal:7,paddingVertical:4,borderRadius:999},
  unread:{color:palette.sage,fontSize:7.5,letterSpacing:1,fontWeight:'800'},
  preview:{color:palette.muted,fontSize:10.5,lineHeight:16,marginTop:7},
  previewUnread:{color:palette.text,fontWeight:'600'},
  date:{color:palette.quiet,fontSize:9,marginTop:7},
  arrow:{color:palette.quiet,fontSize:18},
  empty:{backgroundColor:palette.paper,borderWidth:1,borderColor:palette.line,padding:20,borderRadius:radius.large},
  emptyEyebrow:{color:palette.quiet,fontSize:7.5,letterSpacing:1.2,fontWeight:'700'},
  emptyTitle:{color:palette.inkStrong,fontFamily:type.serif,fontSize:20,fontWeight:'400',marginTop:5},
  emptyCopy:{color:palette.muted,fontSize:10.5,lineHeight:17,marginTop:6},
  error:{color:palette.danger,fontSize:11,lineHeight:17,marginBottom:16}
})
