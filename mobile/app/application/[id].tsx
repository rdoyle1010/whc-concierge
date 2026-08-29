import { useEffect, useMemo, useState } from 'react'
import { ActivityIndicator, Alert, Image, Linking, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { supabase } from '../../src/lib/supabase'
import { palette, radius, space, type } from '../../src/lib/theme'

const WEB_URL=process.env.EXPO_PUBLIC_WEB_URL||'https://talent.wellnesshousecollective.co.uk'
type InterviewMethod='teams'|'google_meet'|'zoom'|'phone'|'in_person'
type MessageIntent='interview'|'decline'|'offer'
type Detail={application:any;candidate:any;job:any;employer:any}
type Interview={id:string;round_number:number;interview_method:InterviewMethod;proposed_slots:string[]|null;selected_slot:string|null;status:string;employer_note?:string|null;candidate_note?:string|null;meeting_link?:string|null;venue_address?:string|null;contact_name?:string|null}

function values(value:any){return Array.isArray(value)?value.filter(Boolean):[]}
function when(value?:string|null){if(!value)return'—';const d=new Date(value);return Number.isNaN(d.getTime())?'—':d.toLocaleString('en-GB',{dateStyle:'medium',timeStyle:'short'})}
function localInput(days:number,hour:number){const d=new Date();d.setDate(d.getDate()+days);d.setHours(hour,0,0,0);const pad=(n:number)=>String(n).padStart(2,'0');return`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:00`}
function parseLocal(value:string){const m=value.trim().match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})$/);if(!m)return null;const[,y,mo,da,h,mi]=m;const d=new Date(Number(y),Number(mo)-1,Number(da),Number(h),Number(mi));return Number.isNaN(d.getTime())?null:d}
function methodLabel(method:InterviewMethod){return method==='teams'?'Microsoft Teams':method==='google_meet'?'Google Meet':method==='zoom'?'Zoom':method==='phone'?'Phone':'In person'}
function stageLabel(status:string){const map:Record<string,string>={pending:'Under review',reviewed:'Under review',shortlisted:'Shortlisted',interview:'Interview',offered:'Offer sent',accepted:'Accepted',rejected:'Not progressing',withdrawn:'Withdrawn'};return map[status]||status}

export default function EmployerApplicationScreen(){
  const {id}=useLocalSearchParams<{id:string}>()
  const [detail,setDetail]=useState<Detail|null>(null)
  const [interviews,setInterviews]=useState<Interview[]>([])
  const [loading,setLoading]=useState(true)
  const [busy,setBusy]=useState('')
  const [error,setError]=useState('')
  const [note,setNote]=useState('')
  const [method,setMethod]=useState<InterviewMethod>('teams')
  const [slotOne,setSlotOne]=useState(localInput(1,10))
  const [slotTwo,setSlotTwo]=useState(localInput(2,14))
  const [meetingLink,setMeetingLink]=useState('')
  const [venue,setVenue]=useState('')
  const [contact,setContact]=useState('')
  const [phoneInstructions,setPhoneInstructions]=useState('')

  useEffect(()=>{void load()},[id])

  async function api(path:string,options?:RequestInit){
    const{data:{session}}=await supabase.auth.getSession()
    if(!session?.access_token)throw new Error('Your session has expired. Please sign in again.')
    const response=await fetch(`${WEB_URL}${path}`,{...options,headers:{Authorization:`Bearer ${session.access_token}`,...(options?.body?{'Content-Type':'application/json'}:{}),...(options?.headers||{})}})
    const body=await response.json().catch(()=>({}))
    if(!response.ok)throw new Error(body?.error||'Could not update this application.')
    return body
  }

  async function load(){
    if(!id)return
    setLoading(true);setError('')
    try{
      const data=await api(`/api/employer/applications/detail?applicationId=${encodeURIComponent(id)}`)
      setDetail(data)
      const interviewData=await api(`/api/employer/applications/interview?applicationId=${encodeURIComponent(id)}`)
      setInterviews(interviewData.interviews||[])
    }catch(e:any){setError(e?.message||'Could not load this application.')}
    finally{setLoading(false)}
  }

  const application=detail?.application
  const candidate=detail?.candidate
  const job=detail?.job
  const ordered=useMemo(()=>[...interviews].sort((a,b)=>a.round_number-b.round_number),[interviews])
  const completed=ordered.filter(i=>i.status==='completed')
  const openInterview=ordered.find(i=>i.status==='proposed'||i.status==='confirmed')||null
  const nextRound=Math.min(2,completed.length+1)
  const experience=Number(candidate?.experience_years||candidate?.years_experience||0)

  async function draftMessage(intent:MessageIntent){
    if(!application||busy)return
    setBusy(`ai-${intent}`);setError('')
    try{
      const data=await api('/api/employer/applications/message-ai',{method:'POST',body:JSON.stringify({applicationId:application.id,intent})})
      setNote(String(data.message||''))
    }catch(e:any){setError(e?.message||'Could not draft the candidate message.')}
    finally{setBusy('')}
  }

  async function invite(){
    if(!application||busy)return
    const dates=[parseLocal(slotOne),parseLocal(slotTwo)]
    if(dates.some(d=>!d||d.getTime()<=Date.now())){Alert.alert('Check interview times','Use two future times in the format YYYY-MM-DD HH:mm.');return}
    if(!contact.trim()){Alert.alert('Add the interviewer','Enter the name of the person the candidate will meet.');return}
    if(['teams','google_meet','zoom'].includes(method)&&!meetingLink.trim()){Alert.alert('Add the meeting link',`Paste the ${methodLabel(method)} link before sending.`);return}
    if(method==='in_person'&&!venue.trim()){Alert.alert('Add the location','Enter the interview address and arrival point.');return}
    if(method==='phone'&&!phoneInstructions.trim()){Alert.alert('Add phone details','Add who will call whom and the phone number to use.');return}
    setBusy('interview');setError('')
    try{
      await api('/api/employer/applications/interview',{method:'POST',body:JSON.stringify({action:'schedule',applicationId:application.id,roundNumber:nextRound,interviewMethod:method,slots:(dates as Date[]).map(d=>d.toISOString()),note:note.trim(),meetingLink:meetingLink.trim(),venueAddress:venue.trim(),contactName:contact.trim(),phoneInstructions:phoneInstructions.trim()})})
      setNote('');await load();Alert.alert('Interview invitation sent','The candidate can review the message and choose a time or request alternatives.')
    }catch(e:any){setError(e.message)}finally{setBusy('')}
  }

  async function decline(){
    if(!application||busy)return
    if(note.trim().length<20){Alert.alert('Add a candidate message','Use AI decline or write a short, respectful message before sending.');return}
    setBusy('decline');setError('')
    try{await api('/api/employer/applications/decision',{method:'POST',body:JSON.stringify({applicationId:application.id,decision:'rejected',note:note.trim()})});await load();Alert.alert('Candidate notified','The application has been closed and the candidate notified.')}catch(e:any){setError(e.message)}finally{setBusy('')}
  }

  async function completeInterview(interview:Interview){
    if(!application)return
    setBusy(`complete-${interview.id}`);setError('')
    try{await api('/api/employer/applications/interview',{method:'POST',body:JSON.stringify({action:'complete',applicationId:application.id,interviewId:interview.id})});await load();Alert.alert('Interview completed','You can now choose the next recruitment step.')}catch(e:any){setError(e.message)}finally{setBusy('')}
  }

  async function offer(){
    if(!application||busy)return
    if(note.trim().length<20){Alert.alert('Add an offer message','Use AI offer or write the candidate offer message first.');return}
    setBusy('offer');setError('')
    try{await api('/api/employer/applications/offer',{method:'POST',body:JSON.stringify({applicationId:application.id,note:note.trim()})});await load();Alert.alert('Offer sent','The candidate can now review and respond in Applications.')}catch(e:any){setError(e.message)}finally{setBusy('')}
  }

  if(loading)return<View style={styles.center}><ActivityIndicator color={palette.ink}/></View>
  if(!detail)return<View style={styles.center}><Text style={styles.error}>{error||'Application not found.'}</Text><Pressable onPress={()=>router.back()}><Text style={styles.back}>‹ Applications</Text></Pressable></View>

  const canProgress=['pending','reviewed','shortlisted','interview'].includes(application.status)
  const canInvite=canProgress&&!openInterview&&completed.length<2
  const canOffer=completed.length>0&&!openInterview&&!['offered','accepted','rejected','withdrawn'].includes(application.status)
  const qualifications=values(candidate.qualifications)
  const brands=values(candidate.product_houses)
  const systems=values(candidate.systems_experience)
  const skills=values(candidate.business_skills)

  return<ScrollView style={styles.scroll} contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled">
    <Pressable onPress={()=>router.back()}><Text style={styles.back}>‹ Applications</Text></Pressable>
    <Text style={styles.eyebrow}>SUBMITTED APPLICATION</Text>
    <Text style={styles.pageTitle}>Review the person before the process.</Text>

    <View style={styles.hero}>
      <View style={styles.personRow}>
        {candidate.profile_image_url?<Image source={{uri:candidate.profile_image_url}} style={styles.photo}/>:<View style={styles.photoPlaceholder}><Text style={styles.initial}>{String(candidate.full_name||'T').slice(0,1)}</Text></View>}
        <View style={{flex:1}}><Text style={styles.name}>{candidate.full_name||'Candidate'}</Text><Text style={styles.headline}>{candidate.headline||candidate.role_level||'Spa & wellness professional'}</Text><Text style={styles.meta}>{[candidate.location,experience?`${experience} years experience`:null].filter(Boolean).join(' · ')}</Text></View>
        {application.match_score!=null?<View style={styles.scoreBox}><Text style={styles.score}>{application.match_score}%</Text><Text style={styles.scoreLabel}>MATCH</Text></View>:null}
      </View>
      <View style={styles.roleBox}><Text style={styles.roleEyebrow}>APPLIED FOR</Text><Text style={styles.roleTitle}>{job.job_title}</Text><Text style={styles.meta}>{[job.location,job.salary_display_text,job.job_type].filter(Boolean).join(' · ')}</Text><Text style={styles.submitted}>Submitted {when(application.submitted_at)}</Text></View>
    </View>

    {application.match_explanation?<View style={styles.matchReason}><Text style={styles.matchReasonEyebrow}>WHY THEY MATCH THIS ROLE</Text>{application.match_label?<Text style={styles.matchReasonLabel}>{application.match_label}</Text>:null}<Text style={styles.matchReasonCopy}>{application.match_explanation}</Text></View>:null}

    <View style={styles.stage}><Text style={styles.stageEyebrow}>CURRENT STAGE</Text><Text style={styles.stageValue}>{stageLabel(application.status)}</Text></View>
    {candidate.bio?<Section label="PROFILE" title="Candidate overview"><Text style={styles.copy}>{candidate.bio}</Text></Section>:null}
    <Section label="APPLICATION" title="Covering letter"><Text style={styles.letter}>{application.cover_letter||'No covering letter was submitted.'}</Text></Section>
    {candidate.cv_signed_url?<Pressable onPress={()=>Linking.openURL(candidate.cv_signed_url)} style={styles.cv}><View><Text style={styles.cvLabel}>CV</Text><Text style={styles.cvTitle}>Open candidate CV</Text></View><Text style={styles.arrow}>→</Text></Pressable>:null}

    <Section label="CAREER EVIDENCE" title="What they bring">
      <View style={styles.metrics}><View style={styles.metric}><Text style={styles.metricValue}>{experience||'—'}</Text><Text style={styles.metricLabel}>years experience</Text></View><View style={styles.metric}><Text style={styles.metricValue}>{candidate.review_score?Number(candidate.review_score).toFixed(1):'—'}</Text><Text style={styles.metricLabel}>verified rating</Text></View></View>
      {qualifications.length?<Tags title="Qualifications" items={qualifications}/>:null}{brands.length?<Tags title="Product houses" items={brands}/>:null}{systems.length?<Tags title="Systems" items={systems}/>:null}{skills.length?<Tags title="Business skills" items={skills}/>:null}
    </Section>

    {ordered.length?<Section label="INTERVIEWS" title="Interview history">{ordered.map(iv=>{const confirmed=iv.status==='confirmed'&&iv.selected_slot;const canComplete=confirmed&&new Date(iv.selected_slot as string).getTime()<=Date.now();return<View key={iv.id} style={styles.interview}><View style={styles.interviewTop}><Text style={styles.interviewTitle}>Interview {iv.round_number} · {methodLabel(iv.interview_method)}</Text><Text style={styles.interviewStatus}>{iv.status.toUpperCase()}</Text></View><Text style={styles.meta}>{iv.selected_slot?when(iv.selected_slot):'Waiting for candidate time confirmation'}</Text>{iv.candidate_note?<Text style={styles.reply}>Candidate: {iv.candidate_note}</Text>:null}{canComplete?<Pressable onPress={()=>completeInterview(iv)} style={styles.secondary}><Text style={styles.secondaryText}>Mark interview completed</Text></Pressable>:null}</View>})}</Section>:null}

    {canProgress?<View style={styles.workflow}>
      <Text style={styles.workflowEyebrow}>RECRUITMENT DECISION</Text><Text style={styles.workflowTitle}>{completed.length?'Choose the next step':'Invite to interview or close the application'}</Text><Text style={styles.workflowCopy}>Draft the communication first, then send the recruitment action.</Text>
      <View style={styles.aiRow}><Pressable onPress={()=>draftMessage('interview')} disabled={!!busy} style={styles.ai}><Text style={styles.aiText}>{busy==='ai-interview'?'Writing…':'AI interview letter'}</Text></Pressable><Pressable onPress={()=>draftMessage('decline')} disabled={!!busy} style={styles.ai}><Text style={styles.aiText}>{busy==='ai-decline'?'Writing…':'AI decline'}</Text></Pressable>{canOffer?<Pressable onPress={()=>draftMessage('offer')} disabled={!!busy} style={styles.ai}><Text style={styles.aiText}>{busy==='ai-offer'?'Writing…':'AI offer'}</Text></Pressable>:null}</View>
      <TextInput value={note} onChangeText={setNote} multiline placeholder="AI draft will appear here, or write your own candidate message..." placeholderTextColor={palette.quiet} style={styles.note}/>

      {canInvite?<View style={styles.interviewForm}><Text style={styles.formTitle}>{completed.length?'Second interview':'First interview'}</Text><View style={styles.methodRow}>{(['teams','google_meet','zoom','phone','in_person'] as InterviewMethod[]).map(item=><Pressable key={item} onPress={()=>setMethod(item)} style={[styles.method,method===item&&styles.methodActive]}><Text style={[styles.methodText,method===item&&styles.methodTextActive]}>{methodLabel(item)}</Text></Pressable>)}</View>
        <TextInput value={contact} onChangeText={setContact} placeholder="Interviewer / contact name" placeholderTextColor={palette.quiet} style={styles.input}/>
        <TextInput value={slotOne} onChangeText={setSlotOne} placeholder="First option · YYYY-MM-DD HH:mm" placeholderTextColor={palette.quiet} style={styles.input}/><TextInput value={slotTwo} onChangeText={setSlotTwo} placeholder="Second option · YYYY-MM-DD HH:mm" placeholderTextColor={palette.quiet} style={styles.input}/>
        {['teams','google_meet','zoom'].includes(method)?<TextInput value={meetingLink} onChangeText={setMeetingLink} placeholder={`${methodLabel(method)} meeting link`} placeholderTextColor={palette.quiet} style={styles.input}/>:null}
        {method==='in_person'?<TextInput value={venue} onChangeText={setVenue} placeholder="Interview address and arrival point" placeholderTextColor={palette.quiet} style={styles.input}/>:null}
        {method==='phone'?<TextInput value={phoneInstructions} onChangeText={setPhoneInstructions} multiline placeholder="Phone instructions · who calls whom + contact number, e.g. Rebecca will call Sarah on 07..." placeholderTextColor={palette.quiet} style={styles.phoneInput}/>:null}
        <Pressable disabled={!!busy} onPress={invite} style={styles.primary}><Text style={styles.primaryText}>{busy==='interview'?'Sending…':`Send ${completed.length?'second ':'first '}interview invitation`}</Text></Pressable>
      </View>:null}
      {canOffer?<Pressable disabled={!!busy} onPress={offer} style={styles.offer}><Text style={styles.offerText}>{busy==='offer'?'Sending offer…':'Make offer'}</Text></Pressable>:null}
      <Pressable disabled={!!busy} onPress={decline} style={styles.decline}><Text style={styles.declineText}>{busy==='decline'?'Closing application…':'Not progressing'}</Text></Pressable>
    </View>:null}
    {error?<Text style={styles.error}>{error}</Text>:null}
  </ScrollView>
}

function Section({label,title,children}:{label:string;title:string;children:any}){return<View style={styles.section}><Text style={styles.sectionLabel}>{label}</Text><Text style={styles.sectionTitle}>{title}</Text>{children}</View>}
function Tags({title,items}:{title:string;items:any[]}){return<View style={styles.tagBlock}><Text style={styles.tagTitle}>{title}</Text><View style={styles.tags}>{items.map((item,index)=><View key={`${String(item)}-${index}`} style={styles.tag}><Text style={styles.tagText}>{String(item)}</Text></View>)}</View></View>}

const styles=StyleSheet.create({
  center:{flex:1,backgroundColor:palette.stone,alignItems:'center',justifyContent:'center',padding:24},scroll:{flex:1,backgroundColor:palette.stone},page:{paddingHorizontal:space.page,paddingTop:20,paddingBottom:130},back:{fontSize:13,color:palette.muted,marginBottom:28},eyebrow:{fontSize:8,letterSpacing:2,color:palette.sage,fontWeight:'800'},pageTitle:{fontFamily:type.serif,fontSize:34,lineHeight:40,color:palette.inkStrong,marginTop:7,marginBottom:18},hero:{backgroundColor:palette.paper,borderWidth:1,borderColor:palette.line,borderRadius:radius.large,padding:18},personRow:{flexDirection:'row',gap:12,alignItems:'center'},photo:{width:62,height:62,borderRadius:31},photoPlaceholder:{width:62,height:62,borderRadius:31,backgroundColor:palette.sageSoft,alignItems:'center',justifyContent:'center'},initial:{fontFamily:type.serif,fontSize:25,color:palette.inkStrong},name:{fontFamily:type.serif,fontSize:25,color:palette.inkStrong},headline:{fontSize:11,color:palette.muted,marginTop:2},meta:{fontSize:10.5,lineHeight:16,color:palette.muted,marginTop:4},scoreBox:{alignItems:'flex-end'},score:{fontSize:22,fontWeight:'800',color:palette.sage},scoreLabel:{fontSize:7,letterSpacing:1.2,fontWeight:'800',color:palette.quiet},roleBox:{borderTopWidth:1,borderTopColor:palette.line,marginTop:16,paddingTop:14},roleEyebrow:{fontSize:7.5,letterSpacing:1.4,color:'#9A7436',fontWeight:'800'},roleTitle:{fontSize:16,fontWeight:'800',color:palette.inkStrong,marginTop:4},submitted:{fontSize:9.5,color:palette.quiet,marginTop:7},matchReason:{backgroundColor:'#FDF6EC',borderWidth:1,borderColor:'#EADFC9',borderRadius:radius.large,padding:16,marginTop:14},matchReasonEyebrow:{fontSize:8,letterSpacing:1.3,fontWeight:'800',color:'#9A7436'},matchReasonLabel:{fontSize:11,fontWeight:'800',color:palette.sage,marginTop:6},matchReasonCopy:{fontSize:10.5,lineHeight:17,color:palette.muted,marginTop:5},stage:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',backgroundColor:palette.stoneDeep,borderRadius:radius.medium,padding:14,marginTop:14},stageEyebrow:{fontSize:8,letterSpacing:1.5,color:palette.quiet,fontWeight:'800'},stageValue:{fontSize:13,fontWeight:'800',color:palette.inkStrong},section:{backgroundColor:palette.paper,borderWidth:1,borderColor:palette.line,borderRadius:radius.large,padding:18,marginTop:14},sectionLabel:{fontSize:8,letterSpacing:1.5,color:palette.sage,fontWeight:'800'},sectionTitle:{fontFamily:type.serif,fontSize:24,color:palette.inkStrong,marginTop:5,marginBottom:9},copy:{fontSize:11.5,lineHeight:19,color:palette.text},letter:{fontSize:11.5,lineHeight:20,color:palette.text},cv:{backgroundColor:palette.inkStrong,borderRadius:radius.large,padding:17,marginTop:14,flexDirection:'row',justifyContent:'space-between',alignItems:'center'},cvLabel:{fontSize:7.5,letterSpacing:1.4,color:'rgba(255,255,255,.55)',fontWeight:'800'},cvTitle:{fontSize:13,color:palette.paper,fontWeight:'800',marginTop:3},arrow:{fontSize:22,color:palette.paper},metrics:{flexDirection:'row',gap:9},metric:{flex:1,backgroundColor:palette.stoneDeep,borderRadius:radius.medium,padding:12},metricValue:{fontFamily:type.serif,fontSize:24,color:palette.inkStrong},metricLabel:{fontSize:8.5,color:palette.muted},tagBlock:{marginTop:14},tagTitle:{fontSize:9.5,fontWeight:'800',color:palette.inkStrong,marginBottom:7},tags:{flexDirection:'row',flexWrap:'wrap',gap:6},tag:{backgroundColor:palette.stoneDeep,borderRadius:999,paddingHorizontal:9,paddingVertical:6},tagText:{fontSize:8.5,color:palette.text},interview:{backgroundColor:palette.stone,borderRadius:radius.medium,padding:12,marginTop:8},interviewTop:{flexDirection:'row',justifyContent:'space-between',gap:10},interviewTitle:{fontSize:10.5,fontWeight:'800',color:palette.inkStrong},interviewStatus:{fontSize:8,fontWeight:'800',color:palette.sage},reply:{fontSize:10,lineHeight:16,color:palette.text,marginTop:7},secondary:{borderWidth:1,borderColor:palette.lineStrong,borderRadius:radius.medium,paddingVertical:11,alignItems:'center',marginTop:9},secondaryText:{fontSize:10,fontWeight:'800',color:palette.inkStrong},workflow:{backgroundColor:palette.sageSoft,borderRadius:radius.large,padding:18,marginTop:16},workflowEyebrow:{fontSize:8,letterSpacing:1.5,color:palette.sage,fontWeight:'800'},workflowTitle:{fontFamily:type.serif,fontSize:24,lineHeight:29,color:palette.inkStrong,marginTop:5},workflowCopy:{fontSize:11,lineHeight:18,color:palette.muted,marginTop:6},aiRow:{flexDirection:'row',flexWrap:'wrap',gap:7,marginTop:13},ai:{borderWidth:1,borderColor:palette.lineStrong,backgroundColor:palette.paper,borderRadius:999,paddingHorizontal:11,paddingVertical:8},aiText:{fontSize:9,fontWeight:'800',color:palette.inkStrong},note:{minHeight:120,backgroundColor:palette.paper,borderWidth:1,borderColor:palette.lineStrong,borderRadius:radius.medium,padding:12,textAlignVertical:'top',color:palette.text,fontSize:11,marginTop:10},interviewForm:{marginTop:13},formTitle:{fontSize:11,fontWeight:'800',color:palette.inkStrong,marginBottom:8},methodRow:{flexDirection:'row',flexWrap:'wrap',gap:6,marginBottom:8},method:{backgroundColor:palette.paper,borderWidth:1,borderColor:palette.line,borderRadius:999,paddingHorizontal:9,paddingVertical:7},methodActive:{backgroundColor:palette.inkStrong,borderColor:palette.inkStrong},methodText:{fontSize:8.5,color:palette.muted},methodTextActive:{color:palette.paper,fontWeight:'800'},input:{height:48,backgroundColor:palette.paper,borderWidth:1,borderColor:palette.lineStrong,borderRadius:radius.medium,paddingHorizontal:12,color:palette.text,fontSize:11,marginTop:7},phoneInput:{minHeight:86,backgroundColor:palette.paper,borderWidth:1,borderColor:palette.lineStrong,borderRadius:radius.medium,padding:12,textAlignVertical:'top',color:palette.text,fontSize:11,marginTop:7},primary:{backgroundColor:palette.inkStrong,borderRadius:radius.medium,paddingVertical:13,alignItems:'center',marginTop:9},primaryText:{color:palette.paper,fontSize:10.5,fontWeight:'800'},offer:{backgroundColor:palette.inkStrong,borderRadius:radius.medium,paddingVertical:13,alignItems:'center',marginTop:12},offerText:{color:palette.paper,fontSize:10.5,fontWeight:'800'},decline:{borderWidth:1,borderColor:'#D9B1B1',borderRadius:radius.medium,paddingVertical:13,alignItems:'center',marginTop:10},declineText:{color:palette.danger,fontSize:10.5,fontWeight:'800'},error:{color:palette.danger,fontSize:11,lineHeight:17,marginTop:12}
})