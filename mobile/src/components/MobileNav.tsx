import { useEffect, useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { router, usePathname } from 'expo-router'
import * as Notifications from 'expo-notifications'
import { supabase } from '../lib/supabase'

type Role = 'talent' | 'employer'
type NavItem = { label:string; href:string; symbol:string }

const talentItems:NavItem[]=[
  {label:'Home',href:'/home',symbol:'⌂'},
  {label:'Jobs',href:'/jobs',symbol:'◉'},
  {label:'Saved',href:'/saved',symbol:'♡'},
  {label:'Messages',href:'/messages',symbol:'✉'},
  {label:'Profile',href:'/profile',symbol:'○'},
]
const employerItems:NavItem[]=[
  {label:'Home',href:'/home',symbol:'⌂'},
  {label:'Jobs',href:'/jobs',symbol:'◉'},
  {label:'Applicants',href:'/applications',symbol:'◇'},
  {label:'Messages',href:'/messages',symbol:'✉'},
  {label:'Agency',href:'/agency',symbol:'○'},
]

export default function MobileNav(){
  const pathname=usePathname()
  const [role,setRole]=useState<Role>('talent')
  const [unreadMessages,setUnreadMessages]=useState(0)
  const [actionCount,setActionCount]=useState(0)
  const [agencyCount,setAgencyCount]=useState(0)

  useEffect(()=>{
    if(pathname==='/'||pathname==='/login'||pathname==='/admin')return
    let active=true
    let channel:any

    async function loadCounts(userId:string,resolvedRole?:Role){
      const roleToUse=resolvedRole||role
      const [{count:messageCount},{count:notificationCount}]=await Promise.all([
        supabase.from('messages').select('id',{count:'exact',head:true}).eq('recipient_id',userId).eq('read',false),
        supabase.from('notifications').select('id',{count:'exact',head:true}).eq('user_id',userId).eq('requires_action',true).is('done_at',null),
      ])
      let agency=0
      if(roleToUse==='talent'){
        const {data:candidate}=await supabase.from('candidate_profiles').select('id').eq('user_id',userId).maybeSingle()
        if(candidate?.id){const {count}=await supabase.from('agency_bookings').select('id',{count:'exact',head:true}).eq('candidate_id',candidate.id).in('status',['pending','offered','requested','countered']);agency=count||0}
      }else{
        const {data:employer}=await supabase.from('employer_profiles').select('id').eq('user_id',userId).maybeSingle()
        if(employer?.id){const {count}=await supabase.from('agency_bookings').select('id',{count:'exact',head:true}).eq('employer_id',employer.id).in('status',['pending','offered','requested','countered','accepted']);agency=count||0}
      }
      if(!active)return
      const messages=messageCount||0
      const actions=notificationCount||0
      setUnreadMessages(messages)
      setActionCount(actions)
      setAgencyCount(agency)
      try{await Notifications.setBadgeCountAsync(messages+actions+agency)}catch{}
    }

    async function load(){
      const {data:{user}}=await supabase.auth.getUser()
      if(!user||!active)return
      const {data:account}=await supabase.from('profiles').select('role').eq('id',user.id).maybeSingle()
      const resolved:Role=account?.role==='employer'?'employer':'talent'
      setRole(resolved)
      await loadCounts(user.id,resolved)
      if(!channel){
        channel=supabase.channel(`mobile-attention-${user.id}`)
          .on('postgres_changes',{event:'*',schema:'public',table:'messages',filter:`recipient_id=eq.${user.id}`},()=>loadCounts(user.id,resolved))
          .on('postgres_changes',{event:'*',schema:'public',table:'notifications',filter:`user_id=eq.${user.id}`},()=>loadCounts(user.id,resolved))
          .on('postgres_changes',{event:'*',schema:'public',table:'agency_bookings'},()=>loadCounts(user.id,resolved))
          .subscribe()
      }
    }

    load()
    const interval=setInterval(load,30000)
    return()=>{
      active=false
      clearInterval(interval)
      if(channel)supabase.removeChannel(channel)
    }
  },[pathname])

  if(pathname==='/'||pathname==='/login'||pathname==='/admin'||pathname.startsWith('/message/')||pathname.startsWith('/job/'))return null
  const items=role==='employer'?employerItems:talentItems
  const totalAttention=unreadMessages+actionCount+agencyCount

  return <View style={styles.wrap}>{items.map(item=>{
    const active=pathname===item.href
    const badge=item.href==='/messages'?unreadMessages:item.href==='/home'?totalAttention:item.href==='/agency'?agencyCount:0
    return <Pressable key={item.href} onPress={()=>router.replace(item.href as never)} style={styles.item}>
      <View style={styles.iconWrap}><Text style={[styles.symbol,active&&styles.active]}>{item.symbol}</Text>{badge>0?<View style={styles.badge}><Text style={styles.badgeText}>{badge>99?'99+':badge}</Text></View>:null}</View>
      <Text style={[styles.label,active&&styles.active,badge>0&&styles.attentionLabel]}>{item.label}</Text>
    </Pressable>
  })}</View>
}

const styles=StyleSheet.create({wrap:{height:64,borderTopWidth:1,borderTopColor:'#e6ebee',backgroundColor:'#fff',flexDirection:'row',alignItems:'center',justifyContent:'space-around'},item:{flex:1,alignItems:'center',justifyContent:'center',gap:2},iconWrap:{position:'relative',minWidth:26,alignItems:'center'},symbol:{color:'#8a969d',fontSize:19,lineHeight:21},label:{color:'#8a969d',fontSize:9},active:{color:'#092b45',fontWeight:'700'},attentionLabel:{color:'#8f1d1d',fontWeight:'800'},badge:{position:'absolute',top:-8,right:-12,minWidth:19,height:19,paddingHorizontal:4,borderRadius:10,backgroundColor:'#d62828',alignItems:'center',justifyContent:'center',borderWidth:1.5,borderColor:'#fff'},badgeText:{color:'#fff',fontSize:8,fontWeight:'900'}})
