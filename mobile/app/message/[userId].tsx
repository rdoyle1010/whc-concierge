import { useEffect, useState } from 'react'
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { supabase } from '../../src/lib/supabase'

export default function MessageThread(){
 const {userId}=useLocalSearchParams<{userId:string}>(); const [me,setMe]=useState(''); const [person,setPerson]=useState<any>(null); const [items,setItems]=useState<any[]>([]); const [text,setText]=useState(''); const [loading,setLoading]=useState(true); const [sending,setSending]=useState(false)
 useEffect(()=>{load()},[userId])
 async function load(){ const {data:{user}}=await supabase.auth.getUser(); if(!user||!userId){router.replace('/login');return}; setMe(user.id)
  const [{data:profile},{data:messages}]=await Promise.all([
   supabase.from('profiles').select('id,full_name,email,role').eq('id',userId).maybeSingle(),
   supabase.from('messages').select('id,sender_id,recipient_id,content,read,created_at').or(`and(sender_id.eq.${user.id},recipient_id.eq.${userId}),and(sender_id.eq.${userId},recipient_id.eq.${user.id})`).order('created_at',{ascending:true})
  ])
  setPerson(profile); setItems(messages||[]); await supabase.from('messages').update({read:true}).eq('recipient_id',user.id).eq('sender_id',userId).eq('read',false); setLoading(false)
 }
 async function send(){ const body=text.trim(); if(!body||!me||!userId)return; setSending(true)
  const {data,error}=await supabase.from('messages').insert({sender_id:me,recipient_id:userId,content:body,read:false}).select('id,sender_id,recipient_id,content,read,created_at').single()
  if(!error&&data){
   setItems([...items,data]); setText('')
   supabase.functions.invoke('mobile-event-push',{body:{eventType:'new_message',recordId:data.id}}).catch(()=>null)
  }
  setSending(false)
 }
 return <KeyboardAvoidingView style={{flex:1}} behavior={Platform.OS==='ios'?'padding':undefined}><View style={styles.page}><Pressable onPress={()=>router.back()}><Text style={styles.back}>‹ Messages</Text></Pressable><Text style={styles.name}>{person?.full_name||person?.email||'Conversation'}</Text><Text style={styles.role}>{person?.role==='employer'?'EMPLOYER':'TALENT'}</Text>
  {loading?<ActivityIndicator color="#092b45" style={{marginTop:30}}/>:<ScrollView style={styles.thread} contentContainerStyle={{paddingVertical:18,gap:10}}>{items.map(item=>{const mine=item.sender_id===me;return <View key={item.id} style={[styles.bubble,mine?styles.mine:styles.theirs]}><Text style={[styles.body,mine&&styles.mineText]}>{item.content}</Text><Text style={[styles.time,mine&&styles.mineTime]}>{item.created_at?new Date(item.created_at).toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'}):''}</Text></View>})}</ScrollView>}
  <View style={styles.composer}><TextInput value={text} onChangeText={setText} placeholder="Write a message..." multiline style={styles.input}/><Pressable onPress={send} style={styles.send}><Text style={styles.sendText}>{sending?'...':'Send'}</Text></Pressable></View></View></KeyboardAvoidingView>
}
const styles=StyleSheet.create({page:{flex:1,backgroundColor:'#fff',paddingTop:64,paddingHorizontal:18},back:{color:'#66747c',fontSize:13,marginBottom:18},name:{color:'#092b45',fontSize:22,fontWeight:'600'},role:{color:'#87949b',fontSize:8,letterSpacing:1.5,marginTop:4,paddingBottom:14,borderBottomWidth:1,borderBottomColor:'#e4e9ec'},thread:{flex:1},bubble:{maxWidth:'82%',paddingHorizontal:14,paddingVertical:11},mine:{alignSelf:'flex-end',backgroundColor:'#092b45'},theirs:{alignSelf:'flex-start',backgroundColor:'#f2f5f6'},body:{color:'#173246',fontSize:14,lineHeight:20},mineText:{color:'#fff'},time:{fontSize:9,color:'#87949b',marginTop:5},mineTime:{color:'#c7d1d7'},composer:{flexDirection:'row',alignItems:'flex-end',gap:8,paddingVertical:12,borderTopWidth:1,borderTopColor:'#e4e9ec'},input:{flex:1,borderWidth:1,borderColor:'#dce3e7',minHeight:44,maxHeight:110,paddingHorizontal:12,paddingVertical:10,fontSize:14},send:{backgroundColor:'#092b45',paddingHorizontal:17,paddingVertical:13},sendText:{color:'#fff',fontWeight:'600',fontSize:12}})
