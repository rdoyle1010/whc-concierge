import { useEffect, useState } from 'react'
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { router } from 'expo-router'
import { supabase } from '../src/lib/supabase'

export default function NotificationsScreen(){
 const [items,setItems]=useState<any[]>([]); const [loading,setLoading]=useState(true); const [busy,setBusy]=useState('')
 useEffect(()=>{load()},[])
 async function load(){
  const {data:{user}}=await supabase.auth.getUser(); if(!user){router.replace('/login');return}
  const {data}=await supabase.from('notifications').select('id,type,title,message,link,is_read,created_at').eq('user_id',user.id).order('created_at',{ascending:false}).limit(50)
  setItems(data||[]); setLoading(false)
 }
 async function markDone(item:any){
  setBusy(item.id)
  const {error}=await supabase.from('notifications').update({is_read:true}).eq('id',item.id)
  if(!error)setItems(current=>current.map(row=>row.id===item.id?{...row,is_read:true}:row))
  setBusy('')
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
 const outstanding=items.filter(item=>!item.is_read).length
 return <ScrollView style={styles.scroll} contentContainerStyle={styles.page}>
  <Pressable onPress={()=>router.back()}><Text style={styles.back}>‹ Back</Text></Pressable><Text style={styles.eyebrow}>UPDATES</Text><Text style={styles.title}>Notifications</Text><Text style={styles.intro}>Viewing an update does not clear it. When you have dealt with it, tap ✓ Done. Genuine Agency or message actions stay highlighted until the action itself is completed.</Text>
  {!loading?<View style={styles.summary}><Text style={styles.summaryNumber}>{outstanding}</Text><Text style={styles.summaryCopy}>still need your attention</Text></View>:null}
  {loading?<ActivityIndicator color="#092b45" style={{marginTop:30}}/>:null}
  {!loading&&items.length===0?<View style={styles.empty}><Text style={styles.emptyTitle}>You’re all caught up.</Text><Text style={styles.emptyCopy}>New updates will appear here.</Text></View>:null}
  <View style={styles.list}>{items.map(item=><View key={item.id} style={[styles.card,!item.is_read&&styles.cardNew]}><Pressable onPress={()=>open(item)}><View style={styles.row}><Text style={styles.cardTitle}>{item.title}</Text><Text style={item.is_read?styles.seen:styles.new}>{item.is_read?'DONE':'NEW'}</Text></View>{item.message?<Text style={styles.copy}>{item.message}</Text>:null}<Text style={styles.date}>{item.created_at?new Date(item.created_at).toLocaleString('en-GB',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}):''}</Text><Text style={styles.open}>Open related area →</Text></Pressable>{!item.is_read?<Pressable disabled={busy===item.id} onPress={()=>markDone(item)} style={styles.doneButton}><Text style={styles.doneText}>{busy===item.id?'Saving…':'✓ Mark done'}</Text></Pressable>:null}</View>)}</View>
 </ScrollView>
}
const styles=StyleSheet.create({scroll:{flex:1,backgroundColor:'#fff'},page:{paddingHorizontal:22,paddingTop:64,paddingBottom:110},back:{color:'#66747c',fontSize:13,marginBottom:34},eyebrow:{color:'#71808a',fontSize:9,letterSpacing:2.1,marginBottom:10},title:{color:'#092b45',fontSize:31,fontWeight:'500'},intro:{color:'#66747c',fontSize:13,lineHeight:20,marginTop:10,marginBottom:18},summary:{backgroundColor:'#f4f7f8',padding:14,flexDirection:'row',alignItems:'baseline',gap:8,marginBottom:18},summaryNumber:{color:'#092b45',fontSize:24,fontWeight:'700'},summaryCopy:{color:'#66747c',fontSize:11},list:{gap:10},card:{borderWidth:1,borderColor:'#dce3e7',padding:18,backgroundColor:'#fff'},cardNew:{borderColor:'#efb2b2',backgroundColor:'#fffafa'},row:{flexDirection:'row',justifyContent:'space-between',gap:12},cardTitle:{color:'#173246',fontSize:15,fontWeight:'600',flex:1},seen:{color:'#89959c',fontSize:8,letterSpacing:1.2},new:{color:'#d62828',fontSize:8,fontWeight:'800',letterSpacing:1.2},copy:{color:'#66747c',fontSize:12,lineHeight:18,marginTop:7},date:{color:'#8b989f',fontSize:10,marginTop:10},open:{color:'#092b45',fontSize:10,fontWeight:'700',marginTop:10},doneButton:{borderTopWidth:1,borderTopColor:'#efdada',marginTop:14,paddingTop:12,alignItems:'flex-end'},doneText:{color:'#8f1d1d',fontSize:11,fontWeight:'700'},empty:{backgroundColor:'#f4f7f8',padding:20},emptyTitle:{color:'#173246',fontSize:15,fontWeight:'600'},emptyCopy:{color:'#71808a',fontSize:12,marginTop:6}})