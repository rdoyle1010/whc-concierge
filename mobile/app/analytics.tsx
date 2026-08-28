import { useEffect, useMemo, useState } from 'react'
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { router } from 'expo-router'
import { supabase } from '../src/lib/supabase'
import { palette, radius, space, type } from '../src/lib/theme'

type JobRow={id:string;title:string;tier:string;daysLive:number;totalApps:number;shortlisted:number;avgScore:number;status:string}
const WEB_URL=process.env.EXPO_PUBLIC_WEB_URL||'https://talent.wellnesshousecollective.co.uk'

export default function AnalyticsScreen(){
 const [loading,setLoading]=useState(true)
 const [error,setError]=useState('')
 const [stats,setStats]=useState({activeListings:0,totalAppsMonth:0,totalAppsLastMonth:0,avgMatch:0,avgDaysToFirst:0})
 const [jobs,setJobs]=useState<JobRow[]>([])
 const [funnel,setFunnel]=useState<Record<string,number>>({})
 const [topSkills,setTopSkills]=useState<string[]>([])

 useEffect(()=>{void load()},[])

 async function load(){
  setLoading(true);setError('')
  try{
   const {data:{session}}=await supabase.auth.getSession()
   if(!session?.access_token){router.replace('/login');return}
   const res=await fetch(`${WEB_URL}/api/mobile/analytics`,{headers:{Authorization:`Bearer ${session.access_token}`}})
   const body=await res.json().catch(()=>({}))
   if(res.status===403){router.replace('/home');return}
   if(!res.ok)throw new Error(body.error||'Could not load analytics.')
   setStats({
    activeListings:Number(body.stats?.activeListings||0),
    totalAppsMonth:Number(body.stats?.totalAppsMonth||0),
    totalAppsLastMonth:Number(body.stats?.totalAppsLastMonth||0),
    avgMatch:Number(body.stats?.avgMatch||0),
    avgDaysToFirst:Number(body.stats?.avgDaysToFirst||0),
   })
   setJobs(body.jobs||[])
   setFunnel(body.funnel||{})
   setTopSkills(body.topSkills||[])
  }catch(e:any){setError(e?.message||'Could not load analytics.')}
  finally{setLoading(false)}
 }

 const pct=stats.totalAppsLastMonth>0?Math.round(((stats.totalAppsMonth-stats.totalAppsLastMonth)/stats.totalAppsLastMonth)*100):stats.totalAppsMonth>0?100:0
 const maxFunnel=Math.max(1,funnel.total||0)
 const sortedJobs=useMemo(()=>[...jobs].sort((a,b)=>b.totalApps-a.totalApps),[jobs])

 return <ScrollView style={styles.scroll} contentContainerStyle={styles.page}>
  <Pressable onPress={()=>router.back()} style={styles.backButton}><Text style={styles.back}>‹ Back</Text></Pressable>
  <Text style={styles.eyebrow}>EMPLOYER PERFORMANCE</Text>
  <Text style={styles.title}>Recruitment analytics</Text>
  <Text style={styles.intro}>A clear view of what is attracting Talent, where applications are moving and which roles need attention.</Text>

  {loading?<View style={styles.loading}><ActivityIndicator color={palette.ink}/><Text style={styles.loadingCopy}>Loading employer performance…</Text></View>:null}
  {error?<View style={styles.errorCard}><Text style={styles.errorTitle}>Analytics unavailable</Text><Text style={styles.error}>{error}</Text></View>:null}

  {!loading&&!error?<>
   <View style={styles.heroCard}>
    <Text style={styles.heroEyebrow}>THIS MONTH</Text>
    <View style={styles.heroRow}><View><Text style={styles.heroNumber}>{stats.totalAppsMonth}</Text><Text style={styles.heroLabel}>applications received</Text></View>{pct!==0?<View style={styles.changePill}><Text style={styles.changeText}>{pct>0?'+':''}{pct}% vs last month</Text></View>:null}</View>
   </View>

   <View style={styles.grid}>
    <Stat label="Active roles" value={String(stats.activeListings)} note="currently live"/>
    <Stat label="Average match" value={stats.avgMatch?`${stats.avgMatch}%`:'—'} note="across applicants"/>
    <Stat label="First application" value={`${stats.avgDaysToFirst}d`} note="average response time"/>
    <Stat label="Shortlisted" value={String(funnel.shortlisted||0)} note="currently in funnel"/>
   </View>

   <Section title="Application journey" eyebrow="FUNNEL" copy="See where candidates are sitting from first application through to accepted." />
   <View style={styles.card}>{[['Applications received','total'],['Pending review','pending'],['Shortlisted','shortlisted'],['Accepted','accepted']].map(([label,key],index)=>{
    const count=funnel[key]||0
    const width=Math.max(3,Math.round(count/maxFunnel*100))
    return <View key={key} style={[styles.funnelRow,index===3&&styles.noMargin]}>
     <View style={styles.funnelTop}><Text style={styles.funnelLabel}>{label}</Text><Text style={styles.funnelCount}>{count}</Text></View>
     <View style={styles.track}><View style={[styles.fill,{width:`${width}%`}]} /></View>
    </View>
   })}
    <View style={styles.rejected}><Text style={styles.rejectedLabel}>Not progressing</Text><Text style={styles.rejectedCount}>{funnel.rejected||0}</Text></View>
   </View>

   <Section title="What Talent brings" eyebrow="TOP SKILLS" copy="The skills appearing most often across people applying to your roles." />
   <View style={styles.card}>{topSkills.length?topSkills.map((skill,index)=><View key={skill} style={[styles.skillRow,index===topSkills.length-1&&styles.noBorder]}><Text style={styles.rank}>{String(index+1).padStart(2,'0')}</Text><Text style={styles.skill}>{skill}</Text></View>):<Text style={styles.empty}>Applicant skill data will appear here once roles receive applications.</Text>}</View>

   <Section title="Role performance" eyebrow="LIVE ROLES" copy="Compare response, shortlist volume and average match across your current listings." />
   <View style={styles.list}>{sortedJobs.length?sortedJobs.map(job=><Pressable key={job.id} onPress={()=>router.push({pathname:'/employer-job/[id]',params:{id:job.id}})} style={styles.job}>
    <View style={styles.jobTop}><View style={styles.jobHeading}><Text style={styles.jobTitle}>{job.title}</Text><Text style={styles.jobMeta}>{job.tier} · {job.daysLive} days live</Text></View><Text style={styles.jobStatus}>{job.status.toUpperCase()}</Text></View>
    <View style={styles.jobMetrics}><MiniMetric value={String(job.totalApps)} label="applications"/><MiniMetric value={String(job.shortlisted)} label="shortlisted"/><MiniMetric value={job.avgScore?`${job.avgScore}%`:'—'} label="avg match"/></View>
    <View style={styles.openRow}><Text style={styles.open}>Open role</Text><Text style={styles.arrow}>→</Text></View>
   </Pressable>):<View style={styles.card}><Text style={styles.empty}>No roles yet. Role performance will appear once you begin recruiting.</Text></View>}</View>
  </>:null}
 </ScrollView>
}

function Stat({label,value,note}:{label:string;value:string;note:string}){return <View style={styles.stat}><Text style={styles.statValue}>{value}</Text><Text style={styles.statLabel}>{label}</Text><Text style={styles.statNote}>{note}</Text></View>}
function MiniMetric({value,label}:{value:string;label:string}){return <View style={styles.miniMetric}><Text style={styles.miniValue}>{value}</Text><Text style={styles.miniLabel}>{label}</Text></View>}
function Section({title,eyebrow,copy}:{title:string;eyebrow:string;copy:string}){return <View style={styles.sectionWrap}><Text style={styles.sectionEyebrow}>{eyebrow}</Text><Text style={styles.section}>{title}</Text><Text style={styles.sectionCopy}>{copy}</Text></View>}

const styles=StyleSheet.create({
 scroll:{flex:1,backgroundColor:palette.stone},
 page:{paddingHorizontal:space.page,paddingTop:18,paddingBottom:110},
 backButton:{alignSelf:'flex-start',paddingVertical:6,marginBottom:22},
 back:{color:palette.muted,fontSize:13,fontFamily:type.sans},
 eyebrow:{color:palette.quiet,fontSize:8,letterSpacing:2.2,fontWeight:'700',marginBottom:9,fontFamily:type.sans},
 title:{color:palette.inkStrong,fontSize:34,lineHeight:40,fontWeight:'400',fontFamily:type.serif},
 intro:{color:palette.muted,fontSize:13,lineHeight:20,marginTop:10,marginBottom:22,fontFamily:type.sans},
 loading:{backgroundColor:palette.paper,borderWidth:1,borderColor:palette.line,borderRadius:radius.large,padding:24,alignItems:'center'},
 loadingCopy:{color:palette.muted,fontSize:10,marginTop:10,fontFamily:type.sans},
 errorCard:{backgroundColor:palette.dangerSoft,borderWidth:1,borderColor:'#E9D8D5',borderRadius:radius.large,padding:16},
 errorTitle:{color:palette.danger,fontFamily:type.serif,fontSize:18},
 error:{color:palette.danger,fontSize:10.5,lineHeight:17,marginTop:4,fontFamily:type.sans},
 heroCard:{backgroundColor:palette.inkStrong,padding:19,borderRadius:radius.large,marginBottom:11},
 heroEyebrow:{color:'#C7D0D2',fontSize:7.5,letterSpacing:1.4,fontWeight:'700',fontFamily:type.sans},
 heroRow:{flexDirection:'row',alignItems:'flex-end',justifyContent:'space-between',gap:12,marginTop:3},
 heroNumber:{color:palette.paper,fontSize:38,lineHeight:42,fontFamily:type.serif},
 heroLabel:{color:'#D8DEDF',fontSize:10,fontFamily:type.sans},
 changePill:{borderWidth:1,borderColor:'rgba(255,255,255,.25)',paddingHorizontal:9,paddingVertical:7,borderRadius:radius.small},
 changeText:{color:palette.paper,fontSize:8.5,fontWeight:'700',fontFamily:type.sans},
 grid:{flexDirection:'row',flexWrap:'wrap',gap:10},
 stat:{width:'48%',backgroundColor:palette.paper,borderWidth:1,borderColor:palette.line,borderRadius:radius.large,padding:15,minHeight:112},
 statValue:{color:palette.inkStrong,fontSize:28,fontFamily:type.serif},
 statLabel:{color:palette.text,fontSize:10.5,fontWeight:'700',marginTop:6,fontFamily:type.sans},
 statNote:{color:palette.quiet,fontSize:8.5,lineHeight:13,marginTop:3,fontFamily:type.sans},
 sectionWrap:{marginTop:29,marginBottom:10},
 sectionEyebrow:{color:palette.quiet,fontSize:7.5,letterSpacing:1.5,fontWeight:'700',fontFamily:type.sans},
 section:{color:palette.inkStrong,fontSize:22,lineHeight:27,fontWeight:'400',marginTop:4,fontFamily:type.serif},
 sectionCopy:{color:palette.muted,fontSize:10.5,lineHeight:17,marginTop:4,fontFamily:type.sans},
 card:{backgroundColor:palette.paper,borderWidth:1,borderColor:palette.line,borderRadius:radius.large,padding:17},
 funnelRow:{marginBottom:16},
 noMargin:{marginBottom:0},
 funnelTop:{flexDirection:'row',justifyContent:'space-between',marginBottom:7},
 funnelLabel:{color:palette.text,fontSize:10.5,fontFamily:type.sans},
 funnelCount:{color:palette.inkStrong,fontSize:11,fontWeight:'700',fontFamily:type.sans},
 track:{height:6,backgroundColor:palette.stoneDeep,borderRadius:3,overflow:'hidden'},
 fill:{height:6,backgroundColor:palette.ink,borderRadius:3},
 rejected:{flexDirection:'row',justifyContent:'space-between',borderTopWidth:1,borderTopColor:palette.line,marginTop:15,paddingTop:13},
 rejectedLabel:{color:palette.quiet,fontSize:9.5,fontFamily:type.sans},
 rejectedCount:{color:palette.text,fontSize:10.5,fontWeight:'700',fontFamily:type.sans},
 skillRow:{flexDirection:'row',alignItems:'center',gap:12,paddingVertical:11,borderBottomWidth:1,borderBottomColor:palette.line},
 noBorder:{borderBottomWidth:0},
 rank:{width:26,color:palette.quiet,fontSize:9,letterSpacing:1,fontWeight:'700',fontFamily:type.sans},
 skill:{color:palette.text,fontSize:11.5,fontFamily:type.sans,flex:1},
 list:{gap:10},
 job:{backgroundColor:palette.paper,borderWidth:1,borderColor:palette.line,borderRadius:radius.large,padding:17},
 jobTop:{flexDirection:'row',justifyContent:'space-between',gap:12},
 jobHeading:{flex:1},
 jobTitle:{color:palette.inkStrong,fontSize:18,lineHeight:22,fontFamily:type.serif},
 jobStatus:{color:palette.sage,fontSize:7.5,fontWeight:'800',letterSpacing:1.1,fontFamily:type.sans},
 jobMeta:{color:palette.quiet,fontSize:9.5,marginTop:4,fontFamily:type.sans},
 jobMetrics:{flexDirection:'row',borderTopWidth:1,borderBottomWidth:1,borderColor:palette.line,marginTop:14,paddingVertical:12},
 miniMetric:{flex:1},
 miniValue:{color:palette.inkStrong,fontSize:17,fontFamily:type.serif},
 miniLabel:{color:palette.quiet,fontSize:7.5,marginTop:2,fontFamily:type.sans},
 openRow:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',paddingTop:12},
 open:{color:palette.ink,fontSize:10,fontWeight:'700',fontFamily:type.sans},
 arrow:{color:palette.ink,fontSize:15},
 empty:{color:palette.muted,fontSize:10.5,lineHeight:17,fontFamily:type.sans},
})