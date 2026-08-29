import { useEffect, useMemo, useState } from 'react'
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { router } from 'expo-router'
import { supabase } from '../src/lib/supabase'
import { palette, radius, space, type } from '../src/lib/theme'

function stateOf(item:any){if(item.done_at)return'DONE';if(item.opened_at)return'OPEN';return'NEW'}

export default function NotificationsScreen(){
 const [items,setItems]=useState<any[]>([])
 const [loading,setLoading]=useState(true)
 const [busy,setBusy]=useState('')

 useEffect(()=>{void load()},[])

 async function load(){
  const {data:{user}}=await supabase.auth.getUser()
  if(!user){router.replace('/login');return}
  const {data}=await supabase.from('notifications').select('id,type,title,message,link,is_read,requires_action,opened_at,done_at,created_at').eq('user_id',user.id).order('created_at',{ascending:false}).limit(75)
  setItems(data||[])
  setLoading(false)
 }

 async function markDone(item:any){
  setBusy(item.id)
  const now=new Date().toISOString()
  const {error}=await supabase.from('notifications').update({is_read:true,opened_at:item.opened_at||now,done_at:now}).eq('id',item.id)
  if(!error)setItems(current=>current.map(row=>row.id===item.id?{...row,is_read:true,opened_at:row.opened_at||now,done_at:now}:row))
  setBusy('')
 }

 async function markAllDone(){
  const outstanding=items.filter(item=>item.requires_action&&!item.done_at)
  if(!outstanding.length)return
  Alert.alert(
   'Mark every action as done?',
   `This will mark all ${outstanding.length} outstanding action${outstanding.length===1?'':'s'} as completed and remove them from your attention count. Only continue if you have genuinely dealt with them.`,
   [
    {text:'Cancel',style:'cancel'},
    {text:'Mark all done',onPress:async()=>{
      setBusy('all')
      const {data:{user}}=await supabase.auth.getUser()
      if(!user){setBusy('');return}
      const now=new Date().toISOString()
      const {error}=await supabase.from('notifications').update({is_read:true,opened_at:now,done_at:now}).eq('user_id',user.id).eq('requires_action',true).is('done_at',null)
      if(!error)setItems(current=>current.map(row=>row.requires_action&&!row.done_at?{...row,is_read:true,opened_at:row.opened_at||now,done_at:now}:row))
      setBusy('')
    }},
   ]
  )
 }

 async function markOpened(item:any){
  if(item.opened_at||item.done_at)return
  const now=new Date().toISOString()
  const {error}=await supabase.from('notifications').update({opened_at:now,is_read:true}).eq('id',item.id)
  if(!error)setItems(current=>current.map(row=>row.id===item.id?{...row,opened_at:now,is_read:true}:row))
 }

 async function open(item:any){
  await markOpened(item)
  const link=String(item.link||'')
  if(link.includes('interview-ready'))router.push('/interview-ready')
  else if(link.includes('application'))router.push('/applications')
  else if(link.includes('message'))router.push('/messages')
  else if(link.includes('agency'))router.push('/agency')
  else if(link.includes('reputation')||link.includes('review')||link.includes('reference'))router.push('/reputation')
  else if(link.includes('academy'))router.push('/academy')
  else if(link.includes('before-you-arrive')||link.includes('arrival'))router.push('/before-you-arrive')
  else if(link.includes('award'))router.push('/awards')
  else if(link.includes('billing')||link.includes('featured')||link.includes('membership'))router.push('/billing')
  else if(link.includes('profile')||link.includes('verification'))router.push('/profile')
  else if(link.includes('job')||link.includes('interest')||link.includes('match'))router.push('/jobs')
 }

 const outstanding=useMemo(()=>items.filter(item=>item.requires_action&&!item.done_at).length,[items])
 const actionItems=items.filter(item=>item.requires_action&&!item.done_at)
 const doneItems=items.filter(item=>item.requires_action&&item.done_at)
 const updates=items.filter(item=>!item.requires_action)

 const renderItem=(item:any)=>{
  const state=stateOf(item)
  const stateStyle=state==='NEW'?styles.stateNew:state==='OPEN'?styles.stateOpen:styles.stateDone
  return <View key={item.id} style={[styles.card,state==='NEW'&&item.requires_action?styles.cardNew:null,state==='DONE'?styles.cardDone:null]}>
   <Pressable onPress={()=>open(item)}>
    <View style={styles.row}>
     <Text style={styles.cardTitle}>{item.title}</Text>
     <View style={[styles.statePill,stateStyle]}><Text style={[styles.stateText,state==='NEW'?styles.stateTextNew:state==='OPEN'?styles.stateTextOpen:styles.stateTextDone]}>{item.requires_action?state:'UPDATE'}</Text></View>
    </View>
    {item.message?<Text style={styles.copy}>{item.message}</Text>:null}
    <Text style={styles.date}>{item.created_at?new Date(item.created_at).toLocaleString('en-GB',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}):''}</Text>
    {item.link?<View style={styles.openRow}><Text style={styles.open}>Open related area</Text><Text style={styles.arrow}>→</Text></View>:null}
   </Pressable>
   {item.requires_action&&state!=='DONE'?<Pressable disabled={busy===item.id||busy==='all'} onPress={()=>markDone(item)} style={styles.doneButton}><Text style={styles.doneText}>{busy===item.id?'Saving…':'Mark as done'}</Text></Pressable>:null}
  </View>
 }

 return <ScrollView style={styles.scroll} contentContainerStyle={styles.page}>
  <Pressable onPress={()=>router.back()} style={styles.backButton}><Text style={styles.back}>‹ Back</Text></Pressable>
  <Text style={styles.eyebrow}>ACTIVITY</Text>
  <Text style={styles.title}>Notifications</Text>
  <Text style={styles.intro}>A focused inbox for things that genuinely need your attention, plus useful updates from your applications, Agency work and account.</Text>

  {!loading?<View style={styles.summary}>
   <View><Text style={styles.summaryNumber}>{outstanding}</Text><Text style={styles.summaryCopy}>outstanding action{outstanding===1?'':'s'}</Text></View>
   {outstanding>0?<Pressable disabled={busy==='all'} onPress={markAllDone} style={styles.bulkButton}><Text style={styles.bulkText}>{busy==='all'?'Saving…':'Mark all done'}</Text></Pressable>:null}
  </View>:null}

  {loading?<ActivityIndicator color={palette.ink} style={{marginTop:30}}/>:null}
  {!loading&&outstanding===0?<View style={styles.empty}><Text style={styles.emptyTitle}>You’re up to date.</Text><Text style={styles.emptyCopy}>Nothing currently needs your attention. New actions will appear here when something genuinely requires you.</Text></View>:null}
  {actionItems.length?<><Text style={styles.section}>NEEDS ACTION</Text><View style={styles.list}>{actionItems.map(renderItem)}</View></>:null}
  {updates.length?<><Text style={styles.section}>UPDATES</Text><View style={styles.list}>{updates.map(renderItem)}</View></>:null}
  {doneItems.length?<><Text style={styles.section}>RECENTLY COMPLETED</Text><View style={styles.list}>{doneItems.slice(0,10).map(renderItem)}</View></>:null}
 </ScrollView>
}

const styles=StyleSheet.create({
 scroll:{flex:1,backgroundColor:palette.stone},
 page:{paddingHorizontal:space.page,paddingTop:18,paddingBottom:118},
 backButton:{alignSelf:'flex-start',paddingVertical:6,marginBottom:22},
 back:{color:palette.muted,fontSize:13},
 eyebrow:{color:palette.quiet,fontSize:8,letterSpacing:2.2,fontWeight:'700',marginBottom:9},
 title:{color:palette.inkStrong,fontFamily:type.serif,fontSize:34,lineHeight:40,fontWeight:'400'},
 intro:{color:palette.muted,fontSize:13,lineHeight:20,marginTop:10,marginBottom:22,maxWidth:360},
 summary:{backgroundColor:palette.inkStrong,padding:18,flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:12,marginBottom:24,borderRadius:radius.large},
 summaryNumber:{color:palette.paper,fontFamily:type.serif,fontSize:31,fontWeight:'400'},
 summaryCopy:{color:'#D8DEDF',fontSize:10.5,marginTop:2},
 bulkButton:{borderWidth:1,borderColor:'rgba(255,255,255,.28)',paddingHorizontal:12,paddingVertical:10,borderRadius:radius.medium},
 bulkText:{color:palette.paper,fontSize:10,fontWeight:'700'},
 section:{color:palette.quiet,fontSize:8,fontWeight:'700',letterSpacing:1.7,marginTop:22,marginBottom:9},
 list:{gap:10},
 card:{borderWidth:1,borderColor:palette.line,padding:17,backgroundColor:palette.paper,borderRadius:radius.large},
 cardNew:{borderColor:'#D9B7B3'},
 cardDone:{opacity:.58},
 row:{flexDirection:'row',justifyContent:'space-between',gap:12,alignItems:'flex-start'},
 cardTitle:{color:palette.inkStrong,fontSize:15,fontWeight:'700',flex:1,lineHeight:20},
 statePill:{paddingHorizontal:8,paddingVertical:5,borderRadius:999},
 stateNew:{backgroundColor:palette.dangerSoft},
 stateOpen:{backgroundColor:'#F5F0E5'},
 stateDone:{backgroundColor:palette.sageSoft},
 stateText:{fontSize:7.5,fontWeight:'800',letterSpacing:.8},
 stateTextNew:{color:palette.danger},
 stateTextOpen:{color:'#7A6845'},
 stateTextDone:{color:palette.sage},
 copy:{color:palette.muted,fontSize:11.5,lineHeight:18,marginTop:8},
 date:{color:palette.quiet,fontSize:9.5,marginTop:11},
 openRow:{borderTopWidth:1,borderTopColor:palette.line,marginTop:13,paddingTop:12,flexDirection:'row',justifyContent:'space-between',alignItems:'center'},
 open:{color:palette.ink,fontSize:10.5,fontWeight:'700'},
 arrow:{color:palette.ink,fontSize:15},
 doneButton:{marginTop:12,alignSelf:'flex-start',borderWidth:1,borderColor:palette.lineStrong,paddingHorizontal:11,paddingVertical:9,borderRadius:radius.medium},
 doneText:{color:palette.text,fontSize:10,fontWeight:'700'},
 empty:{backgroundColor:palette.paper,borderWidth:1,borderColor:palette.line,padding:20,borderRadius:radius.large},
 emptyTitle:{color:palette.inkStrong,fontFamily:type.serif,fontSize:20,fontWeight:'400'},
 emptyCopy:{color:palette.muted,fontSize:11.5,lineHeight:18,marginTop:6},
})