import { useEffect, useRef, useState } from 'react'
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { supabase } from '../../src/lib/supabase'
import { palette, radius, space, type } from '../../src/lib/theme'

function roleLabel(role?:string|null){return role==='employer'?'Employer':role==='admin'?'Wellness House':'Talent'}

export default function MessageThread(){
  const {userId}=useLocalSearchParams<{userId:string}>()
  const [me,setMe]=useState('')
  const [person,setPerson]=useState<any>(null)
  const [items,setItems]=useState<any[]>([])
  const [text,setText]=useState('')
  const [loading,setLoading]=useState(true)
  const [sending,setSending]=useState(false)
  const [error,setError]=useState('')
  const threadRef=useRef<ScrollView>(null)

  useEffect(()=>{void load()},[userId])
  useEffect(()=>{if(!loading)setTimeout(()=>threadRef.current?.scrollToEnd({animated:false}),50)},[loading,items.length])

  async function load(){
    setLoading(true);setError('')
    const {data:{user}}=await supabase.auth.getUser()
    if(!user||!userId){router.replace('/login');return}
    setMe(user.id)
    const [{data:profile},{data:messages,error:messageError}]=await Promise.all([
      supabase.from('profiles').select('id,full_name,email,role').eq('id',userId).maybeSingle(),
      supabase.from('messages').select('id,sender_id,recipient_id,content,read,created_at').or(`and(sender_id.eq.${user.id},recipient_id.eq.${userId}),and(sender_id.eq.${userId},recipient_id.eq.${user.id})`).order('created_at',{ascending:true})
    ])
    if(messageError){setError(messageError.message);setLoading(false);return}
    setPerson(profile)
    setItems(messages||[])
    await supabase.from('messages').update({read:true}).eq('recipient_id',user.id).eq('sender_id',userId).eq('read',false)
    setLoading(false)
  }

  async function send(){
    const body=text.trim()
    if(!body||!me||!userId||sending)return
    setSending(true);setError('')
    const {data,error}=await supabase.from('messages').insert({sender_id:me,recipient_id:userId,content:body,read:false}).select('id,sender_id,recipient_id,content,read,created_at').single()
    if(!error&&data){
      setItems(current=>[...current,data])
      setText('')
      supabase.functions.invoke('mobile-event-push',{body:{eventType:'new_message',recordId:data.id}}).catch(()=>null)
    }else if(error){setError(error.message)}
    setSending(false)
  }

  const name=person?.full_name||person?.email||'Conversation'

  return <KeyboardAvoidingView style={styles.keyboard} behavior={Platform.OS==='ios'?'padding':undefined} keyboardVerticalOffset={8}>
    <View style={styles.page}>
      <View style={styles.header}>
        <Pressable onPress={()=>router.back()} style={styles.backButton}><Text style={styles.back}>‹ Messages</Text></Pressable>
        <View style={styles.personRow}>
          <View style={styles.avatar}><Text style={styles.avatarText}>{name.slice(0,1).toUpperCase()}</Text></View>
          <View style={{flex:1}}><Text numberOfLines={1} style={styles.name}>{name}</Text><Text style={styles.role}>{roleLabel(person?.role).toUpperCase()}</Text></View>
        </View>
      </View>

      {loading?<ActivityIndicator color={palette.ink} style={{marginTop:30}}/>:<ScrollView ref={threadRef} style={styles.thread} contentContainerStyle={styles.threadContent} keyboardShouldPersistTaps="handled">
        {items.length===0?<View style={styles.empty}><Text style={styles.emptyEyebrow}>PRIVATE CONVERSATION</Text><Text style={styles.emptyTitle}>Start the conversation.</Text><Text style={styles.emptyCopy}>Keep recruitment, Agency or Residency details here so both sides have one clear record.</Text></View>:null}
        {items.map(item=>{
          const mine=item.sender_id===me
          return <View key={item.id} style={[styles.messageRow,mine?styles.messageRowMine:styles.messageRowTheirs]}>
            <View style={[styles.bubble,mine?styles.mine:styles.theirs]}>
              <Text style={[styles.body,mine&&styles.mineText]}>{item.content}</Text>
              <Text style={[styles.time,mine&&styles.mineTime]}>{item.created_at?new Date(item.created_at).toLocaleString('en-GB',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}):''}</Text>
            </View>
          </View>
        })}
      </ScrollView>}

      {error?<Text style={styles.error}>{error}</Text>:null}
      <View style={styles.composer}>
        <TextInput value={text} onChangeText={setText} placeholder="Write a message…" placeholderTextColor={palette.quiet} multiline style={styles.input}/>
        <Pressable disabled={!text.trim()||sending} onPress={send} style={[styles.send,(!text.trim()||sending)&&styles.sendDisabled]}><Text style={styles.sendText}>{sending?'Sending…':'Send'}</Text></Pressable>
      </View>
    </View>
  </KeyboardAvoidingView>
}

const styles=StyleSheet.create({
  keyboard:{flex:1,backgroundColor:palette.stone},
  page:{flex:1,backgroundColor:palette.stone,paddingTop:18},
  header:{paddingHorizontal:space.page,paddingBottom:14,borderBottomWidth:1,borderBottomColor:palette.line},
  backButton:{alignSelf:'flex-start',paddingVertical:6,marginBottom:14},
  back:{color:palette.muted,fontSize:13},
  personRow:{flexDirection:'row',gap:11,alignItems:'center'},
  avatar:{width:42,height:42,borderRadius:21,backgroundColor:palette.sageSoft,alignItems:'center',justifyContent:'center'},
  avatarText:{color:palette.inkStrong,fontFamily:type.serif,fontSize:17,fontWeight:'400'},
  name:{color:palette.inkStrong,fontFamily:type.serif,fontSize:22,lineHeight:27,fontWeight:'400'},
  role:{color:palette.quiet,fontSize:7.5,letterSpacing:1.4,fontWeight:'700',marginTop:3},
  thread:{flex:1},
  threadContent:{paddingHorizontal:space.page,paddingVertical:18,gap:9},
  messageRow:{width:'100%',flexDirection:'row'},
  messageRowMine:{justifyContent:'flex-end'},
  messageRowTheirs:{justifyContent:'flex-start'},
  bubble:{maxWidth:'82%',paddingHorizontal:14,paddingVertical:11,borderRadius:radius.large},
  mine:{backgroundColor:palette.inkStrong,borderBottomRightRadius:5},
  theirs:{backgroundColor:palette.paper,borderWidth:1,borderColor:palette.line,borderBottomLeftRadius:5},
  body:{color:palette.text,fontSize:13,lineHeight:19},
  mineText:{color:palette.paper},
  time:{fontSize:8.5,color:palette.quiet,marginTop:6},
  mineTime:{color:'#C8D1D2'},
  empty:{backgroundColor:palette.paper,borderWidth:1,borderColor:palette.line,padding:18,borderRadius:radius.large,marginTop:12},
  emptyEyebrow:{color:palette.quiet,fontSize:7.5,letterSpacing:1.2,fontWeight:'700'},
  emptyTitle:{color:palette.inkStrong,fontFamily:type.serif,fontSize:19,fontWeight:'400',marginTop:5},
  emptyCopy:{color:palette.muted,fontSize:10.5,lineHeight:17,marginTop:6},
  error:{color:palette.danger,fontSize:10.5,lineHeight:16,paddingHorizontal:space.page,paddingBottom:6},
  composer:{flexDirection:'row',alignItems:'flex-end',gap:8,paddingHorizontal:space.page,paddingTop:11,paddingBottom:14,borderTopWidth:1,borderTopColor:palette.line,backgroundColor:palette.paper},
  input:{flex:1,borderWidth:1,borderColor:palette.line,minHeight:44,maxHeight:110,paddingHorizontal:12,paddingVertical:10,fontSize:12.5,color:palette.text,backgroundColor:palette.stone,borderRadius:radius.medium},
  send:{backgroundColor:palette.inkStrong,paddingHorizontal:16,paddingVertical:13,borderRadius:radius.medium},
  sendDisabled:{opacity:.4},
  sendText:{color:palette.paper,fontWeight:'700',fontSize:10.5}
})
