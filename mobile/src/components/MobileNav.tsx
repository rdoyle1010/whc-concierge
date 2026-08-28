import { useEffect, useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { router, usePathname } from 'expo-router'
import * as Notifications from 'expo-notifications'
import { supabase } from '../lib/supabase'
import { palette, type } from '../lib/theme'

type Role = 'talent' | 'employer'
type NavItem = { label:string; href:string; symbol:string }

const talentItems:NavItem[]=[
  {label:'Home',href:'/home',symbol:'⌂'},
  {label:'Jobs',href:'/jobs',symbol:'◌'},
  {label:'Applications',href:'/applications',symbol:'◇'},
  {label:'Messages',href:'/messages',symbol:'✉'},
  {label:'Profile',href:'/profile',symbol:'○'},
]
const employerItems:NavItem[]=[
  {label:'Home',href:'/home',symbol:'⌂'},
  {label:'Jobs',href:'/jobs',symbol:'◌'},
  {label:'Match',href:'/match',symbol:'♡'},
  {label:'Applications',href:'/applications',symbol:'◇'},
  {label:'Messages',href:'/messages',symbol:'✉'},
]

export default function MobileNav(){
  const pathname=usePathname()
  const [role,setRole]=useState<Role>('talent')
  const [unreadMessages,setUnreadMessages]=useState(0)
  const [agencyCount,setAgencyCount]=useState(0)

  useEffect(()=>{
    if(pathname==='/'||pathname==='/login'||pathname==='/admin')return
    let active=true
    let channel:any

    async function loadCounts(userId:string,resolvedRole?:Role){
      const roleToUse=resolvedRole||role
      const {count:messageCount}=await supabase.from('messages').select('id',{count:'exact',head:true}).eq('recipient_id',userId).eq('read',false)
      let agency=0
      if(roleToUse==='talent'){
        const {data:candidate}=await supabase.from('candidate_profiles').select('id').eq('user_id',userId).maybeSingle()
        if(candidate?.id){const {count}=await supabase.from('agency_bookings').select('id',{count:'exact',head:true}).eq('candidate_id',candidate.id).in('status',['pending','offered','requested','countered']);agency=count||0}
      }else{
        const {data:employer}=await supabase.from('employer_profiles').select('id').eq('user_id',userId).maybeSingle()
        if(employer?.id){const {count}=await supabase.from('agency_bookings').select('id',{count:'exact',head:true}).eq('employer_id',employer.id).in('status',['pending','offered','requested','countered']);agency=count||0}
      }
      if(!active)return
      const messages=messageCount||0
      setUnreadMessages(messages)
      setAgencyCount(agency)
      try{await Notifications.setBadgeCountAsync(messages+agency)}catch{}
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
          .on('postgres_changes',{event:'*',schema:'public',table:'agency_bookings'},()=>loadCounts(user.id,resolved))
          .subscribe()
      }
    }

    void load()
    const interval=setInterval(load,15000)
    return()=>{
      active=false
      clearInterval(interval)
      if(channel)supabase.removeChannel(channel)
    }
  },[pathname])

  if(pathname==='/'||pathname==='/login'||pathname==='/admin'||pathname.startsWith('/message/')||pathname.startsWith('/job/')||pathname.startsWith('/application/')||pathname.startsWith('/talent-application/'))return null
  const items=role==='employer'?employerItems:talentItems
  const totalAttention=unreadMessages+agencyCount

  return <View style={styles.wrap}>{items.map(item=>{
    const active=pathname===item.href
    const badge=item.href==='/messages'?unreadMessages:item.href==='/home'?totalAttention:0
    return <Pressable key={item.href} onPress={()=>router.replace(item.href as never)} style={styles.item}>
      <View style={styles.iconWrap}><Text style={[styles.symbol,active&&styles.activeSymbol]}>{item.symbol}</Text>{badge>0?<View style={styles.badge}><Text style={styles.badgeText}>{badge>99?'99+':badge}</Text></View>:null}</View>
      <Text numberOfLines={1} style={[styles.label,active&&styles.activeLabel]}>{item.label}</Text>
      {active?<View style={styles.activeLine}/>:null}
    </Pressable>
  })}</View>
}

const styles=StyleSheet.create({
  wrap:{height:70,borderTopWidth:1,borderTopColor:palette.line,backgroundColor:palette.paper,flexDirection:'row',alignItems:'stretch'},
  item:{flex:1,alignItems:'center',justifyContent:'center',paddingTop:7,paddingBottom:6,position:'relative'},
  iconWrap:{position:'relative',minWidth:26,alignItems:'center'},
  symbol:{color:palette.quiet,fontSize:18,lineHeight:20,fontFamily:type.sans},
  label:{color:palette.quiet,fontSize:8.5,marginTop:3,fontFamily:type.sans},
  activeSymbol:{color:palette.inkStrong},
  activeLabel:{color:palette.inkStrong,fontWeight:'700'},
  activeLine:{position:'absolute',bottom:0,width:24,height:2,backgroundColor:palette.inkStrong,borderRadius:1},
  badge:{position:'absolute',top:-8,right:-13,minWidth:18,height:18,paddingHorizontal:4,borderRadius:9,backgroundColor:palette.danger,alignItems:'center',justifyContent:'center',borderWidth:1.5,borderColor:palette.paper},
  badgeText:{color:'#fff',fontSize:8,fontWeight:'800'},
})
