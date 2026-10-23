import { useEffect, useMemo, useState } from 'react'
import { ActivityIndicator, Alert, Image, Linking, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { supabase } from '../../src/lib/supabase'
import { palette, radius, space, type } from '../../src/lib/theme'

const WEB_URL = process.env.EXPO_PUBLIC_WEB_URL || 'https://talenthousecollective.co.uk'
type InterviewMethod = 'teams'|'google_meet'|'zoom'|'phone'|'in_person'
type MessageIntent = 'shortlist'|'interview'|'decline'|'offer'
type Interview = { id:string; round_number:number; interview_method:InterviewMethod; proposed_slots:string[]|null; selected_slot:string|null; status:string; employer_note?:string|null; candidate_note?:string|null; meeting_link?:string|null; venue_address?:string|null; contact_name?:string|null }

type Detail = { application:any; candidate:any; job:any; employer:any }

function values(value:any){ return Array.isArray(value) ? value.filter(Boolean) : [] }
function when(value?:string|null){ if(!value) return '—'; const d=new Date(value); return Number.isNaN(d.getTime())?'—':d.toLocaleString('en-GB',{dateStyle:'medium',timeStyle:'short'}) }
function localInput(days:number,hour:number){ const d=new Date(); d.setDate(d.getDate()+days); d.setHours(hour,0,0,0); const pad=(n:number)=>String(n).padStart(2,'0'); return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:00` }
function parseLocal(value:string){ const m=value.trim().match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})$/); if(!m)return null; const[,y,mo,da,h,mi]=m; const d=new Date(Number(y),Number(mo)-1,Number(da),Number(h),Number(mi)); return Number.isNaN(d.getTime())?null:d }
function methodLabel(method:InterviewMethod){ return method==='teams'?'Microsoft Teams':method==='google_meet'?'Google Meet':method==='zoom'?'Zoom':method==='phone'?'Phone':'In person' }
function stageLabel(status:string){ const map:Record<string,string>={pending:'Under review',reviewed:'Under review',shortlisted:'Shortlisted',interview:'Interview',offered:'Offer sent',accepted:'Accepted',rejected:'Not progressing',withdrawn:'Withdrawn'}; return map[status]||status }

export default function EmployerApplicationScreen(){
  const { id } = useLocalSearchParams<{id:string}>()
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

  useEffect(()=>{ void load() },[id])

  async function api(path:string, options?:RequestInit){
    const {data:{session}}=await supabase.auth.getSession()
    if(!session?.access_token) throw new Error('Your session has expired. Please sign in again.')
    const response=await fetch(`${WEB_URL}${path}`,{...options,headers:{Authorization:`Bearer ${session.access_token}`,...(options?.body?{'Content-Type':'application/json'}:{}),...(options?.headers||{})}})
    const body=await response.json().catch(()=>({}))
    if(!response.ok) throw new Error(body?.error||'Could not update this application.')
    return body
  }

  async function load(){
    if(!id)return
    setLoading(true); setError('')
    try{
      const data=await api(`/api/employer/applications/detail?applicationId=${encodeURIComponent(id)}`)
      setDetail(data)
      const interviewData=await api(`/api/employer/applications/interview?applicationId=${encodeURIComponent(id)}`)
      setInterviews(interviewData.interviews||[])
    }catch(e:any){ setError(e?.message||'Could not load this application.') }
    finally{ setLoading(false) }
  }

  const application=detail?.application
  const candidate=detail?.candidate
  const job=detail?.job
  const ordered=useMemo(()=>[...interviews].sort((a,b)=>a.round_number-b.round_number),[interviews])
  const completed=ordered.filter(i=>i.status==='completed')
  const openInterview=ordered.find(i=>i.status==='proposed'||i.status==='confirmed')||null
  const roundOne=ordered.find(i=>i.round_number===1)||null
  const roundTwo=ordered.find(i=>i.round_number===2)||null
  const experience=Number(candidate?.experience_years||candidate?.years_experience||0)

  async function draftMessage(intent:MessageIntent){
    if(!application||busy)return
    setBusy(`ai-${intent}`); setError('')
    try{ const data=await api('/api/employer/applications/message-ai',{method:'POST',body:JSON.stringify({applicationId:application.id,intent})}); setNote(String(data.message||'')) }
    catch(e:any){ setError(e?.message||'Could not draft the candidate message.') }
    finally{ setBusy('') }
  }

  async function shortlist(){
    if(!application||busy)return
    if(note.trim().length<20){ Alert.alert('Add a shortlist message','Use AI shortlist or write a short message before progressing the candidate.'); return }
    setBusy('shortlist'); setError('')
    try{ await api('/api/employer/applications/decision',{method:'POST',body:JSON.stringify({applicationId:application.id,decision:'shortlisted',note:note.trim()})}); setNote(''); await load(); Alert.alert('Candidate shortlisted','You can now arrange the first interview.') }
    catch(e:any){ setError(e.message) }
    finally{ setBusy('') }
  }

  async function invite(roundNumber:number){
    if(!application||busy)return
    const dates=[parseLocal(slotOne),parseLocal(slotTwo)]
    if(dates.some(d=>!d||d.getTime()<=Date.now())){ Alert.alert('Check interview times','Use two future times in the format YYYY-MM-DD HH:mm.'); return }
    if(!contact.trim()){ Alert.alert('Add the interviewer','Enter the name of the person the candidate will meet.'); return }
    if(['teams','google_meet','zoom'].includes(method)&&!meetingLink.trim()){ Alert.alert('Add the meeting link',`Paste the ${methodLabel(method)} link before sending.`); return }
    if(method==='in_person'&&!venue.trim()){ Alert.alert('Add the location','Enter the interview address and arrival point.'); return }
    if(method==='phone'&&!phoneInstructions.trim()){ Alert.alert('Add phone details','Add who will call whom and the phone number to use.'); return }
    setBusy(`interview-${roundNumber}`); setError('')
    try{
      await api('/api/employer/applications/interview',{method:'POST',body:JSON.stringify({action:'schedule',applicationId:application.id,roundNumber,interviewMethod:method,slots:(dates as Date[]).map(d=>d.toISOString()),note:note.trim(),meetingLink:meetingLink.trim(),venueAddress:venue.trim(),contactName:contact.trim(),phoneInstructions:phoneInstructions.trim()})})
      setNote(''); await load(); Alert.alert(`${roundNumber===1?'First':'Second'} interview invitation sent`,'The candidate can choose a time or request alternatives in their application.')
    }catch(e:any){ setError(e.message) }
    finally{ setBusy('') }
  }

  async function completeInterview(interview:Interview){
    if(!application||busy)return
    setBusy(`complete-${interview.id}`); setError('')
    try{ await api('/api/employer/applications/interview',{method:'POST',body:JSON.stringify({action:'complete',applicationId:application.id,interviewId:interview.id})}); await load(); Alert.alert('Interview completed','The next website-equivalent recruitment options are now available.') }
    catch(e:any){ setError(e.message) }
    finally{ setBusy('') }
  }

  async function decline(){
    if(!application||busy)return
    if(note.trim().length<20){ Alert.alert('Add a candidate message','Use AI decline or write a respectful message before closing the application.'); return }
    setBusy('decline'); setError('')
    try{ await api('/api/employer/applications/decision',{method:'POST',body:JSON.stringify({applicationId:application.id,decision:'rejected',note:note.trim()})}); setNote(''); await load(); Alert.alert('Candidate notified','The application is now closed. You can reopen it later if you reconsider.') }
    catch(e:any){ setError(e.message) }
    finally{ setBusy('') }
  }

  async function reopen(){
    if(!application||busy)return
    setBusy('reopen'); setError('')
    try{ await api('/api/employer/applications/reopen',{method:'POST',body:JSON.stringify({applicationId:application.id})}); await load(); Alert.alert('Application reopened','The candidate is back under review and can be progressed again.') }
    catch(e:any){ setError(e.message) }
    finally{ setBusy('') }
  }

  async function offer(){
    if(!application||busy)return
    if(note.trim().length<20){ Alert.alert('Add an offer message','Use AI offer or write the candidate offer message first.'); return }
    setBusy('offer'); setError('')
    try{ await api('/api/employer/applications/offer',{method:'POST',body:JSON.stringify({applicationId:application.id,note:note.trim()})}); setNote(''); await load(); Alert.alert('Offer sent','The candidate can review and respond from their Applications area.') }
    catch(e:any){ setError(e.message) }
    finally{ setBusy('') }
  }

  if(loading)return <View style={styles.center}><ActivityIndicator color={palette.ink}/></View>
  if(!detail)return <View style={styles.center}><Text style={styles.error}>{error||'Application not found.'}</Text><Pressable onPress={()=>router.back()}><Text style={styles.back}>‹ Applications</Text></Pressable></View>

  const underReview=['pending','reviewed'].includes(application.status)
  const shortlisted=application.status==='shortlisted'
  const interviewing=application.status==='interview'
  const rejected=application.status==='rejected'
  const offerReady=interviewing&&completed.length>0&&!openInterview&&!application.status.includes('offered')
  const canArrangeFirst=shortlisted&&!roundOne
  const canArrangeSecond=interviewing&&completed.length===1&&!roundTwo&&!openInterview
  const canComplete=openInterview?.status==='confirmed'&&openInterview.selected_slot&&new Date(openInterview.selected_slot).getTime()<=Date.now()
  const qualifications=values(candidate.qualifications), brands=values(candidate.product_houses), systems=values(candidate.systems_experience), skills=values(candidate.business_skills)

  return <ScrollView style={styles.scroll} contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled">
    <Pressable onPress={()=>router.back()}><Text style={styles.back}>‹ Applications</Text></Pressable>
    <Text style={styles.eyebrow}>SUBMITTED APPLICATION</Text><Text style={styles.title}>Review the person before the process.</Text>

    <View style={styles.card}>
      <View style={styles.personRow}>{candidate.profile_image_url?<Image source={{uri:candidate.profile_image_url}} style={styles.photo}/>:<View style={styles.photoPlaceholder}><Text style={styles.initial}>{String(candidate.full_name||'T').slice(0,1)}</Text></View>}<View style={{flex:1}}><Text style={styles.name}>{candidate.full_name||'Candidate'}</Text><Text style={styles.meta}>{candidate.headline||candidate.role_level||'Spa & wellness professional'}</Text><Text style={styles.small}>{[candidate.location,experience?`${experience} years experience`:null].filter(Boolean).join(' · ')}</Text></View>{application.match_score!=null?<View><Text style={styles.score}>{application.match_score}%</Text><Text style={styles.scoreLabel}>MATCH</Text></View>:null}</View>
      <View style={styles.roleBox}><Text style={styles.label}>APPLIED FOR</Text><Text style={styles.role}>{job.job_title}</Text><Text style={styles.small}>{[job.location,job.salary_display_text,job.job_type].filter(Boolean).join(' · ')}</Text><Text style={styles.small}>Submitted {when(application.submitted_at)}</Text></View>
    </View>

    {application.match_explanation?<View style={styles.reason}><Text style={styles.label}>WHY THEY MATCH THIS ROLE</Text>{application.match_label?<Text style={styles.reasonTitle}>{application.match_label}</Text>:null}<Text style={styles.copy}>{application.match_explanation}</Text></View>:null}
    <View style={styles.stage}><Text style={styles.label}>CURRENT STAGE</Text><Text style={styles.stageValue}>{stageLabel(application.status)}</Text></View>

    {candidate.bio?<Section title="Candidate overview"><Text style={styles.copy}>{candidate.bio}</Text></Section>:null}
    <Section title="Covering letter"><Text style={styles.copy}>{application.cover_letter||'No covering letter was submitted.'}</Text></Section>
    {candidate.cv_signed_url?<Pressable onPress={()=>Linking.openURL(candidate.cv_signed_url)} style={styles.linkCard}><Text style={styles.linkText}>Open candidate CV</Text><Text style={styles.arrow}>→</Text></Pressable>:null}
    <Section title="Career evidence"><Text style={styles.small}>{experience||'—'} years experience</Text>{qualifications.length?<Tags title="Qualifications" items={qualifications}/>:null}{brands.length?<Tags title="Product houses" items={brands}/>:null}{systems.length?<Tags title="Systems" items={systems}/>:null}{skills.length?<Tags title="Business skills" items={skills}/>:null}</Section>

    {ordered.length?<Section title="Interview history">{ordered.map(iv=><View key={iv.id} style={styles.interview}><View style={styles.row}><Text style={styles.interviewTitle}>Interview {iv.round_number} · {methodLabel(iv.interview_method)}</Text><Text style={styles.status}>{iv.status.toUpperCase()}</Text></View><Text style={styles.small}>{iv.selected_slot?when(iv.selected_slot):'Waiting for candidate time confirmation'}</Text>{iv.candidate_note?<Text style={styles.reply}>Candidate: {iv.candidate_note}</Text>:null}{iv.id===openInterview?.id&&canComplete?<Pressable onPress={()=>completeInterview(iv)} style={styles.secondary}><Text style={styles.secondaryText}>Mark interview completed</Text></Pressable>:null}</View>)}</Section>:null}

    {rejected?<View style={styles.workflow}><Text style={styles.label}>RECONSIDER</Text><Text style={styles.workflowTitle}>Reopen this application?</Text><Text style={styles.copy}>Move the candidate back to Under review so you can shortlist and progress them again.</Text><Pressable disabled={!!busy} onPress={reopen} style={styles.primary}><Text style={styles.primaryText}>{busy==='reopen'?'Reopening…':'Reopen application'}</Text></Pressable></View>:null}

    {underReview?<View style={styles.workflow}><Text style={styles.label}>NEXT ACTION</Text><Text style={styles.workflowTitle}>Shortlist or close the application</Text><Text style={styles.copy}>This mirrors the website: an application must be shortlisted before the first interview.</Text><View style={styles.aiRow}><AiButton label="AI shortlist" busy={busy==='ai-shortlist'} onPress={()=>draftMessage('shortlist')}/><AiButton label="AI decline" busy={busy==='ai-decline'} onPress={()=>draftMessage('decline')}/></View><MessageBox note={note} setNote={setNote}/><Pressable disabled={!!busy} onPress={shortlist} style={styles.primary}><Text style={styles.primaryText}>{busy==='shortlist'?'Shortlisting…':'Shortlist candidate'}</Text></Pressable><Pressable disabled={!!busy} onPress={decline} style={styles.danger}><Text style={styles.dangerText}>Not progressing</Text></Pressable></View>:null}

    {shortlisted?<View style={styles.workflow}><Text style={styles.label}>NEXT ACTION</Text><Text style={styles.workflowTitle}>Arrange the first interview</Text><View style={styles.aiRow}><AiButton label="AI interview letter" busy={busy==='ai-interview'} onPress={()=>draftMessage('interview')}/><AiButton label="AI decline" busy={busy==='ai-decline'} onPress={()=>draftMessage('decline')}/></View><MessageBox note={note} setNote={setNote}/>{canArrangeFirst?<InterviewForm round={1} method={method} setMethod={setMethod} contact={contact} setContact={setContact} slotOne={slotOne} setSlotOne={setSlotOne} slotTwo={slotTwo} setSlotTwo={setSlotTwo} meetingLink={meetingLink} setMeetingLink={setMeetingLink} venue={venue} setVenue={setVenue} phoneInstructions={phoneInstructions} setPhoneInstructions={setPhoneInstructions} busy={busy} onSend={()=>invite(1)}/>:null}<Pressable disabled={!!busy} onPress={decline} style={styles.danger}><Text style={styles.dangerText}>Not progressing</Text></Pressable></View>:null}

    {interviewing?<View style={styles.workflow}><Text style={styles.label}>RECRUITMENT DECISION</Text>{openInterview?<><Text style={styles.workflowTitle}>{openInterview.status==='proposed'?'Waiting for candidate response':'Interview confirmed'}</Text><Text style={styles.copy}>{openInterview.status==='proposed'?'The candidate must choose a proposed time or request alternatives before this stage can move forward.':'The interview is booked. Once the confirmed interview time has passed, mark it completed to unlock the next stage.'}</Text></>:<><Text style={styles.workflowTitle}>Choose the next step</Text><Text style={styles.copy}>{completed.length===1?'Interview 1 is complete. Arrange Interview 2, make an offer, or close the application.':'Interview 2 is complete. Make an offer or close the application.'}</Text></>}
      {!openInterview&&completed.length>0?<View style={styles.aiRow}><AiButton label={completed.length===1?'AI second interview':'AI interview'} busy={busy==='ai-interview'} onPress={()=>draftMessage('interview')}/><AiButton label="AI offer" busy={busy==='ai-offer'} onPress={()=>draftMessage('offer')}/><AiButton label="AI decline" busy={busy==='ai-decline'} onPress={()=>draftMessage('decline')}/></View>:null}
      {!openInterview&&completed.length>0?<MessageBox note={note} setNote={setNote}/>:null}
      {canArrangeSecond?<InterviewForm round={2} method={method} setMethod={setMethod} contact={contact} setContact={setContact} slotOne={slotOne} setSlotOne={setSlotOne} slotTwo={slotTwo} setSlotTwo={setSlotTwo} meetingLink={meetingLink} setMeetingLink={setMeetingLink} venue={venue} setVenue={setVenue} phoneInstructions={phoneInstructions} setPhoneInstructions={setPhoneInstructions} busy={busy} onSend={()=>invite(2)}/>:null}
      {offerReady?<Pressable disabled={!!busy} onPress={offer} style={styles.primary}><Text style={styles.primaryText}>{busy==='offer'?'Sending offer…':'Make offer'}</Text></Pressable>:null}
      <Pressable disabled={!!busy} onPress={decline} style={styles.danger}><Text style={styles.dangerText}>Not progressing</Text></Pressable>
    </View>:null}

    {error?<Text style={styles.error}>{error}</Text>:null}
  </ScrollView>
}

function Section({title,children}:{title:string;children:any}){ return <View style={styles.card}><Text style={styles.sectionTitle}>{title}</Text>{children}</View> }
function Tags({title,items}:{title:string;items:string[]}){ return <View style={{marginTop:14}}><Text style={styles.label}>{title.toUpperCase()}</Text><View style={styles.tags}>{items.map(item=><View key={item} style={styles.tag}><Text style={styles.tagText}>{item}</Text></View>)}</View></View> }
function AiButton({label,busy,onPress}:{label:string;busy:boolean;onPress:()=>void}){ return <Pressable onPress={onPress} disabled={busy} style={styles.ai}><Text style={styles.aiText}>{busy?'Writing…':label}</Text></Pressable> }
function MessageBox({note,setNote}:{note:string;setNote:(v:string)=>void}){ return <TextInput value={note} onChangeText={setNote} multiline placeholder="AI draft will appear here, or write your own candidate message..." placeholderTextColor={palette.quiet} style={styles.note}/> }
function InterviewForm(props:any){ const methods:InterviewMethod[]=['teams','google_meet','zoom','phone','in_person']; return <View style={styles.interviewForm}><Text style={styles.formTitle}>{props.round===1?'First interview':'Second interview'}</Text><View style={styles.methodRow}>{methods.map(item=><Pressable key={item} onPress={()=>props.setMethod(item)} style={[styles.method,props.method===item&&styles.methodActive]}><Text style={[styles.methodText,props.method===item&&styles.methodTextActive]}>{methodLabel(item)}</Text></Pressable>)}</View><TextInput value={props.contact} onChangeText={props.setContact} placeholder="Interviewer / contact name" placeholderTextColor={palette.quiet} style={styles.input}/><TextInput value={props.slotOne} onChangeText={props.setSlotOne} placeholder="First option · YYYY-MM-DD HH:mm" placeholderTextColor={palette.quiet} style={styles.input}/><TextInput value={props.slotTwo} onChangeText={props.setSlotTwo} placeholder="Second option · YYYY-MM-DD HH:mm" placeholderTextColor={palette.quiet} style={styles.input}/>{['teams','google_meet','zoom'].includes(props.method)?<TextInput value={props.meetingLink} onChangeText={props.setMeetingLink} placeholder={`${methodLabel(props.method)} meeting link`} placeholderTextColor={palette.quiet} style={styles.input}/>:null}{props.method==='in_person'?<TextInput value={props.venue} onChangeText={props.setVenue} placeholder="Interview address and arrival point" placeholderTextColor={palette.quiet} style={styles.input}/>:null}{props.method==='phone'?<TextInput value={props.phoneInstructions} onChangeText={props.setPhoneInstructions} multiline placeholder="Who calls whom + contact number" placeholderTextColor={palette.quiet} style={styles.note}/>:null}<Pressable disabled={!!props.busy} onPress={props.onSend} style={styles.primary}><Text style={styles.primaryText}>{props.busy?.startsWith('interview-')?'Sending…':`Send ${props.round===1?'first':'second'} interview invitation`}</Text></Pressable></View> }

const styles=StyleSheet.create({scroll:{flex:1,backgroundColor:palette.stone},page:{paddingHorizontal:space.page,paddingTop:space.lg,paddingBottom:110,gap:14},center:{flex:1,alignItems:'center',justifyContent:'center',backgroundColor:palette.stone,padding:24},back:{color:palette.muted,fontSize:13},eyebrow:{fontSize:9,letterSpacing:2.2,fontWeight:'800',color:palette.quiet,marginTop:8},title:{fontFamily:type.serif,fontSize:34,lineHeight:40,color:palette.inkStrong},card:{backgroundColor:palette.paper,borderWidth:1,borderColor:palette.line,borderRadius:radius.large,padding:18},personRow:{flexDirection:'row',alignItems:'center',gap:12},photo:{width:58,height:58,borderRadius:29},photoPlaceholder:{width:58,height:58,borderRadius:29,backgroundColor:palette.stoneDeep,alignItems:'center',justifyContent:'center'},initial:{fontFamily:type.serif,fontSize:24,color:palette.inkStrong},name:{fontFamily:type.serif,fontSize:25,color:palette.inkStrong},meta:{fontSize:12,lineHeight:18,color:palette.muted},small:{fontSize:10.5,lineHeight:16,color:palette.quiet,marginTop:4},score:{fontSize:27,fontWeight:'700',color:palette.muted},scoreLabel:{fontSize:8,letterSpacing:1.5,color:palette.quiet,textAlign:'center'},roleBox:{marginTop:16,borderTopWidth:1,borderTopColor:palette.line,paddingTop:14},label:{fontSize:8,letterSpacing:1.6,fontWeight:'800',color:palette.sage},role:{fontFamily:type.serif,fontSize:22,color:palette.inkStrong,marginTop:4},reason:{backgroundColor:palette.sageSoft,borderRadius:radius.large,padding:18},reasonTitle:{fontSize:15,fontWeight:'700',color:palette.inkStrong,marginTop:7},copy:{fontSize:12,lineHeight:19,color:palette.muted,marginTop:8},stage:{backgroundColor:palette.paper,borderWidth:1,borderColor:palette.line,borderRadius:radius.large,padding:16,flexDirection:'row',justifyContent:'space-between',alignItems:'center'},stageValue:{fontSize:14,fontWeight:'800',color:palette.inkStrong},sectionTitle:{fontFamily:type.serif,fontSize:23,color:palette.inkStrong,marginBottom:8},linkCard:{backgroundColor:palette.paper,borderWidth:1,borderColor:palette.line,borderRadius:radius.large,padding:18,flexDirection:'row',justifyContent:'space-between',alignItems:'center'},linkText:{fontWeight:'800',fontSize:13,color:palette.ink},arrow:{fontSize:20,color:palette.ink},tags:{flexDirection:'row',flexWrap:'wrap',gap:7,marginTop:8},tag:{backgroundColor:palette.stoneDeep,borderRadius:99,paddingHorizontal:10,paddingVertical:6},tagText:{fontSize:10,color:palette.muted},interview:{backgroundColor:palette.stone,borderRadius:radius.medium,padding:14,marginTop:8},row:{flexDirection:'row',justifyContent:'space-between',gap:10},interviewTitle:{fontWeight:'800',fontSize:12,color:palette.inkStrong},status:{fontSize:8,fontWeight:'800',color:palette.quiet},reply:{fontSize:10.5,lineHeight:16,color:palette.muted,marginTop:7},workflow:{backgroundColor:palette.sageSoft,borderRadius:radius.large,padding:18,gap:12},workflowTitle:{fontFamily:type.serif,fontSize:27,lineHeight:32,color:palette.inkStrong},aiRow:{flexDirection:'row',flexWrap:'wrap',gap:8},ai:{borderWidth:1,borderColor:palette.line,borderRadius:99,paddingHorizontal:13,paddingVertical:9,backgroundColor:palette.paper},aiText:{fontSize:10.5,fontWeight:'800',color:palette.inkStrong},note:{minHeight:120,borderWidth:1,borderColor:palette.line,borderRadius:radius.medium,backgroundColor:palette.paper,padding:13,fontSize:12,color:palette.text,textAlignVertical:'top'},interviewForm:{gap:10},formTitle:{fontSize:14,fontWeight:'800',color:palette.inkStrong},methodRow:{flexDirection:'row',flexWrap:'wrap',gap:7},method:{borderWidth:1,borderColor:palette.line,borderRadius:99,paddingHorizontal:11,paddingVertical:8,backgroundColor:palette.paper},methodActive:{backgroundColor:palette.inkStrong,borderColor:palette.inkStrong},methodText:{fontSize:10,color:palette.muted},methodTextActive:{color:palette.paper,fontWeight:'800'},input:{borderWidth:1,borderColor:palette.line,borderRadius:radius.medium,backgroundColor:palette.paper,padding:13,fontSize:12,color:palette.text},primary:{backgroundColor:palette.inkStrong,borderRadius:radius.medium,paddingVertical:14,alignItems:'center'},primaryText:{color:palette.paper,fontWeight:'800',fontSize:12},secondary:{marginTop:10,borderWidth:1,borderColor:palette.line,borderRadius:radius.medium,paddingVertical:10,alignItems:'center',backgroundColor:palette.paper},secondaryText:{fontSize:10.5,fontWeight:'800',color:palette.inkStrong},danger:{borderWidth:1,borderColor:'#d8b8b8',borderRadius:radius.medium,paddingVertical:13,alignItems:'center',backgroundColor:palette.paper},dangerText:{color:palette.danger,fontWeight:'800',fontSize:11},error:{color:palette.danger,fontSize:11,lineHeight:17,marginTop:4}})
