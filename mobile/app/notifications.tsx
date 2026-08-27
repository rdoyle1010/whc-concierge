import { useEffect, useState } from 'react'
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { router } from 'expo-router'
import { supabase } from '../src/lib/supabase'

export default function NotificationsScreen(){
 const [items,setItems]=useState<any[]>([]); const [loading,setLoading]=useState(true)
 useEffect(()=>{load()},[])
 async function load(){
  const {data:{user}}=await supabase.auth.getUser(); if(!user){router.replace('/login');return}
  const {data}=await supabase.from('notifications').select('id,type,title,message,link,is_read,created_at').eq('user_id',user.id).order('created_at',{ascending:false}).limit(50)
  const rows=data||[]
  setItems(rows.map((item:any)=>({...item,is_read:true})))
  const unreadIds=rows.filter((item:any)=>!item.is_read).map((item:any)=>item.id)
  if(unreadIds.length) await supabase.from('notifications').update({is_read:true}).in('id',unreadIds)
  setLoading(false)
 }
 async function open(item:any){
  const link=String(item.link||'')
  if(link.includes('interview-ready')) router.push('/interview-ready')
  else if(link.includes('application')) router.push('/applications')
  else if(link.includes('message')) router.push('/messages')
  else if(link.includes('agency')) router.push('/agency')
  else if(link.includes('reputation')||link.includes('review')||link.includes('reference')) router.push('/reputation')
  else if(link.includes('academy')) router.push('/academy')
  else if(link.includes('profile')||link.includes('verification')) router.push('/profile')
 }
 return <ScrollView style={styles.scroll} contentContainerStyle={styles.page}>
  <Pressable onPress={()=>router.back()}><Text style={styles.back}>‹ Back</Text></Pressable><Text style={styles.eyebrow}>UPDATES</Text><Text style={styles.title}>Notifications</Text><Text style={styles.intro}>Applications, bookings, messages and important platform updates. Opening this page marks these updates as seen; actions you still need to complete remain highlighted in the relevant section.</Text>
  {loading?<ActivityIndicator color="#092b45" style={{marginTop:30}}/>:null}
  {!loading&&items.length===0?<View style={styles.empty}><Text style={styles.emptyTitle}>You’re all caught up.</Text><Text style={styles.emptyCopy}>New updates will appear here.</Text></View>:null}
  <View style={styles.list}>{items.map(item=><Pressable key={item.id} onPress={()=>open(item)} style={styles.card}><View style={styles.row}><Text style={styles.cardTitle}>{item.title}</Text><Text style={styles.seen}>SEEN</Text></View>{item.message?<Text style={styles.copy}>{item.message}</Text>:null}<Text style={styles.date}>{item.created_at?new Date(item.created_at).toLocaleString('en-GB',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}):''}</Text></Pressable>)}</View>
 </ScrollView>
}
const styles=StyleSheet.create({scroll:{flex:1,backgroundColor:'#fff'},page:{paddingHorizontal:22,paddingTop:64,paddingBottom:110},back:{color:'#66747c',fontSize:13,marginBottom:34},eyebrow:{color:'#71808a',fontSize:9,letterSpacing:2.1,marginBottom:10},title:{color:'#092b45',fontSize:31,fontWeight:'500'},intro:{color:'#66747c',fontSize:13,lineHeight:20,marginTop:10,marginBottom:26},list:{gap:10},card:{borderWidth:1,borderColor:'#dce3e7',padding:18,backgroundColor:'#fff'},row:{flexDirection:'row',justifyContent:'space-between',gap:12},cardTitle:{color:'#173246',fontSize:15,fontWeight:'600',flex:1},seen:{color:'#89959c',fontSize:8,letterSpacing:1.2},copy:{color:'#66747c',fontSize:12,lineHeight:18,marginTop:7},date:{color:'#8b989f',fontSize:10,marginTop:10},empty:{backgroundColor:'#f4f7f8',padding:20},emptyTitle:{color:'#173246',fontSize:15,fontWeight:'600'},emptyCopy:{color:'#71808a',fontSize:12,marginTop:6}})