import { useEffect, useState } from 'react'
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { supabase } from '../../src/lib/supabase'

const WEB_URL=process.env.EXPO_PUBLIC_WEB_URL||'https://talent.wellnesshousecollective.co.uk'

// Mirrors containsRestrictedContactDetails in src/app/api/messages/send.
// Used only to warn before sending - the server is still what decides.
function looksLikeContactDetails(value:string){
 const text=value||''
 if(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i.test(text))return true
 if(/\b(?:https?:\/\/|www\.)\S+/i.test(text))return true
 if(/\b(?:whatsapp|telegram|signal|facetime|instagram|facebook|linkedin|snapchat)\b/i.test(text))return true
 return (text.match(/(?:\+?\d[\d\s().-]{5,}\d)/g)||[]).some(candidate=>(candidate.match(/\d/g)||[]).length>=7)
}

export default function MessageThread(){
 const {userId}=useLocalSearchParams<{userId:string}>(); const [me,setMe]=useState(''); const [person,setPerson]=useState<any>(null); const [items,setItems]=useState<any[]>([]); const [text,setText]=useState(''); const [loading,setLoading]=useState(true); const [sending,setSending]=useState(false); const [contactLocked,setContactLocked]=useState<boolean|null>(null); const [error,setError]=useState('')
 useEffect(()=>{load()},[userId])
 async function load(){ const {data:{user}}=await supabase.auth.getUser(); if(!user||!userId){router.replace('/login');return}; setMe(user.id)
  const [{data:profile},{data:messages}]=await Promise.all([
   supabase.from('profiles').select('id,full_name,email,role').eq('id',userId).maybeSingle(),
   supabase.from('messages').select('id,sender_id,recipient_id,content,read,created_at').or(`and(sender_id.eq.${user.id},recipient_id.eq.${userId}),and(sender_id.eq.${userId},recipient_id.eq.${user.id})`).order('created_at',{ascending:true})
  ])
  setPerson(profile); setItems(messages||[]); await supabase.from('messages').update({read:true}).eq('recipient_id',user.id).eq('sender_id',userId).eq('read',false); setLoading(false)
  // Ask the messaging API whether contact details are unlocked in this
  // conversation, so the composer can say so before anything is typed rather
  // than answering a written message with a 403.
  try{
   const {data:{session}}=await supabase.auth.getSession()
   if(!session?.access_token)return
   const res=await fetch(`${WEB_URL}/api/messages/send?recipientId=${encodeURIComponent(userId)}`,{headers:{Authorization:`Bearer ${session.access_token}`}})
   const payload=await res.json().catch(()=>({}))
   if(res.ok)setContactLocked(Boolean(payload?.contactRestricted))
  }catch{ /* the composer simply stays quiet if the state is unknown */ }
 }
 async function send(){ const body=text.trim(); if(!body||!me||!userId)return; setSending(true); setError('')
  // Send through the platform API: it verifies a real relationship exists,
  // filters off-platform contact details, and notifies + emails the recipient.
  try{
   const {data:{session}}=await supabase.auth.getSession()
   if(!session?.access_token)throw new Error('Your session has expired.')
   const res=await fetch(`${WEB_URL}/api/messages/send`,{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${session.access_token}`},body:JSON.stringify({recipientId:userId,content:body})})
   const payload=await res.json().catch(()=>({}))
   if(!res.ok)throw new Error(payload.error||'Could not send the message.')
   setItems([...items,payload.message||{id:String(Date.now()),sender_id:me,recipient_id:userId,content:body,read:false,created_at:new Date().toISOString()}]); setText('')
  }catch(e:any){
   setItems(items); setError(e?.message||'Could not send the message.')
  }
  setSending(false)
 }
 const draftHasContactDetails=contactLocked===true&&looksLikeContactDetails(text)
 return <KeyboardAvoidingView style={{flex:1}} behavior={Platform.OS==='ios'?'padding':undefined}><View style={styles.page}><Pressable onPress={()=>router.back()}><Text style={styles.back}>‹ Messages</Text></Pressable><Text style={styles.name}>{person?.full_name||person?.email||'Conversation'}</Text><Text style={styles.role}>{person?.role==='employer'?'EMPLOYER':'TALENT'}</Text>
  {loading?<ActivityIndicator color="#0b2f4d" style={{marginTop:30}}/>:<ScrollView style={styles.thread} contentContainerStyle={{paddingVertical:18,gap:10}}>{items.map(item=>{const mine=item.sender_id===me;return <View key={item.id} style={[styles.bubble,mine?styles.mine:styles.theirs]}><Text style={[styles.body,mine&&styles.mineText]}>{item.content}</Text><Text style={[styles.time,mine&&styles.mineTime]}>{item.created_at?new Date(item.created_at).toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'}):''}</Text></View>})}</ScrollView>}
  {error?<Text style={styles.error}>{error}</Text>:null}
  {contactLocked===true?<Text style={[styles.lockNote,draftHasContactDetails&&styles.lockNoteActive]}>{draftHasContactDetails?'That looks like a phone number, email, link or app name. Those unlock once there is a paid Agency booking, a confirmed Residency or an interview-stage application - this message will be refused until then.':'Phone numbers, emails, links and app names unlock once there is a paid Agency booking, a confirmed Residency or an interview-stage application. Until then, keep the conversation here - it protects both of you.'}</Text>:null}
  <View style={styles.composer}><TextInput value={text} onChangeText={setText} placeholder="Write a message..." multiline style={styles.input}/><Pressable onPress={send} style={styles.send}><Text style={styles.sendText}>{sending?'...':'Send'}</Text></Pressable></View></View></KeyboardAvoidingView>
}
const styles=StyleSheet.create({page:{flex:1,backgroundColor:'#fff',paddingTop:64,paddingHorizontal:18},back:{color:'#66747c',fontSize:13,marginBottom:18},name:{color:'#0b2f4d',fontSize:22,fontWeight:'600'},role:{color:'#87949b',fontSize:8,letterSpacing:1.5,marginTop:4,paddingBottom:14,borderBottomWidth:1,borderBottomColor:'#e4e9ec'},thread:{flex:1},bubble:{maxWidth:'82%',paddingHorizontal:14,paddingVertical:11},mine:{alignSelf:'flex-end',backgroundColor:'#0b2f4d'},theirs:{alignSelf:'flex-start',backgroundColor:'#f2f5f6'},body:{color:'#173246',fontSize:14,lineHeight:20},mineText:{color:'#fff'},time:{fontSize:9,color:'#87949b',marginTop:5},mineTime:{color:'#c7d1d7'},composer:{flexDirection:'row',alignItems:'flex-end',gap:8,paddingVertical:12,borderTopWidth:1,borderTopColor:'#e4e9ec'},input:{flex:1,borderWidth:1,borderColor:'#dce3e7',minHeight:44,maxHeight:110,paddingHorizontal:12,paddingVertical:10,fontSize:14},send:{backgroundColor:'#0b2f4d',paddingHorizontal:17,paddingVertical:13},sendText:{color:'#fff',fontWeight:'600',fontSize:12},lockNote:{color:'#7d8890',fontSize:10,lineHeight:15,paddingTop:10},lockNoteActive:{color:'#8a3434',fontWeight:'600'},error:{color:'#9b2c2c',fontSize:11,lineHeight:17,paddingTop:10}})
