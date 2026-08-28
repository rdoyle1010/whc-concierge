import { useEffect, useMemo, useState } from 'react'
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { supabase } from '../../src/lib/supabase'
import { palette, radius, space, type } from '../../src/lib/theme'

type InterviewMethod = 'teams' | 'video' | 'phone' | 'in_person'
type MessageIntent = 'shortlist' | 'interview' | 'decline' | 'offer'
type ApplicationRow = {
  id: string
  status: string
  match_score: number | null
  candidate_profiles?: CandidateProfile | CandidateProfile[] | null
  job_listings?: JobSummary | JobSummary[] | null
}
type CandidateProfile = {
  full_name?: string | null
  headline?: string | null
  role_level?: string | null
  location?: string | null
  bio?: string | null
  review_score?: number | null
}
type JobSummary = { job_title?: string | null; location?: string | null }
type Interview = {
  id: string
  round_number: number
  interview_method: InterviewMethod
  proposed_slots: string[] | null
  selected_slot: string | null
  status: 'proposed' | 'confirmed' | 'cancelled' | 'completed'
  employer_note?: string | null
}

const WEB_URL = process.env.EXPO_PUBLIC_WEB_URL || 'https://talent.wellnesshousecollective.co.uk'

function localDateInput(days: number, hour: number) {
  const date = new Date()
  date.setDate(date.getDate() + days)
  date.setHours(hour, 0, 0, 0)
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:00`
}

function parseLocalDate(value: string) {
  const match = value.trim().match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})$/)
  if (!match) return null
  const [, y, m, d, h, min] = match
  const date = new Date(Number(y), Number(m) - 1, Number(d), Number(h), Number(min), 0, 0)
  return Number.isNaN(date.getTime()) ? null : date
}

function displayDate(value?: string | null) {
  if (!value) return ''
  return new Date(value).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })
}

function roundLabel(round: number) {
  return round === 1 ? 'First interview' : round === 2 ? 'Second interview' : 'Final interview'
}

function stageIndex(status: string) {
  if (['accepted'].includes(status)) return 4
  if (['offered'].includes(status)) return 3
  if (['interview'].includes(status)) return 2
  if (['shortlisted'].includes(status)) return 1
  return 0
}

function stageLabel(status:string){
  const map:Record<string,string>={pending:'Applied',reviewed:'Reviewing',shortlisted:'Shortlisted',interview:'Interview',offered:'Offer sent',accepted:'Accepted',rejected:'Not progressing',withdrawn:'Withdrawn'}
  return map[status]||status.replaceAll('_',' ')
}

export default function EmployerApplicationScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const [application, setApplication] = useState<ApplicationRow | null>(null)
  const [interviews, setInterviews] = useState<Interview[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState('')
  const [error, setError] = useState('')
  const [note, setNote] = useState('')
  const [method, setMethod] = useState<InterviewMethod>('video')
  const [slotOne, setSlotOne] = useState(localDateInput(1, 10))
  const [slotTwo, setSlotTwo] = useState(localDateInput(2, 14))
  const [meetingLink, setMeetingLink] = useState('')
  const [venueAddress, setVenueAddress] = useState('')

  useEffect(() => { void load() }, [id])

  async function authHeaders() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.access_token) throw new Error('Your session has expired. Please sign in again.')
    return { Authorization: `Bearer ${session.access_token}` }
  }

  async function api(path: string, options?: RequestInit) {
    const headers = await authHeaders()
    const response = await fetch(`${WEB_URL}${path}`, {
      ...options,
      headers: { ...headers, ...(options?.body ? { 'Content-Type': 'application/json' } : {}), ...(options?.headers || {}) },
    })
    const body = await response.json().catch(() => ({}))
    if (!response.ok) throw new Error(body?.error || 'Could not update this application.')
    return body
  }

  async function load() {
    setLoading(true)
    setError('')
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user || !id) { router.replace('/login'); return }
      const { data: account } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle()
      if (account?.role !== 'employer') { router.replace('/applications'); return }
      const { data, error: queryError } = await supabase.from('applications')
        .select('id,status,match_score,candidate_profiles(full_name,headline,role_level,location,bio,review_score),job_listings(job_title,location)')
        .eq('id', id)
        .maybeSingle()
      if (queryError) throw queryError
      setApplication(data as ApplicationRow | null)
      if (data?.id) {
        const payload = await api(`/api/employer/applications/interview?applicationId=${encodeURIComponent(data.id)}`)
        setInterviews((payload.interviews || []) as Interview[])
      } else {
        setInterviews([])
      }
    } catch (e: any) {
      setError(e?.message || 'Could not load this application.')
    } finally {
      setLoading(false)
    }
  }

  const candidate = useMemo(() => application ? (Array.isArray(application.candidate_profiles) ? application.candidate_profiles[0] : application.candidate_profiles) : null, [application])
  const job = useMemo(() => application ? (Array.isArray(application.job_listings) ? application.job_listings[0] : application.job_listings) : null, [application])
  const orderedInterviews = useMemo(() => [...interviews].sort((a, b) => a.round_number - b.round_number), [interviews])
  const completedInterviews = orderedInterviews.filter(item => item.status === 'completed')
  const openInterview = orderedInterviews.find(item => item.status === 'proposed' || item.status === 'confirmed') || null
  const nextRound = Math.min(3, completedInterviews.length + 1)

  async function writeMessage(intent: MessageIntent) {
    if (!application || busy) return
    setBusy(`draft-${intent}`)
    setError('')
    try {
      const data = await api('/api/employer/applications/message-ai', {
        method: 'POST', body: JSON.stringify({ applicationId: application.id, intent }),
      })
      setNote(String(data.message || ''))
    } catch (e: any) {
      setError(e.message || 'Could not draft the candidate message.')
    } finally {
      setBusy('')
    }
  }

  function requireNote(label: string) {
    if (note.trim().length < 20) {
      Alert.alert(`${label} message needed`, 'Write a short, clear candidate message or use Draft message before sending.')
      return false
    }
    return true
  }

  async function decision(decisionValue: 'shortlisted' | 'rejected') {
    if (!application || !requireNote(decisionValue === 'shortlisted' ? 'Shortlist' : 'Candidate')) return
    setBusy(decisionValue)
    setError('')
    try {
      await api('/api/employer/applications/decision', {
        method: 'POST', body: JSON.stringify({ applicationId: application.id, decision: decisionValue, note: note.trim() }),
      })
      setNote('')
      await load()
      Alert.alert(decisionValue === 'shortlisted' ? 'Candidate shortlisted' : 'Application updated', 'The candidate has been notified through the platform.')
    } catch (e: any) { setError(e.message) }
    finally { setBusy('') }
  }

  async function inviteInterview() {
    if (!application) return
    const dates = [parseLocalDate(slotOne), parseLocalDate(slotTwo)].filter(Boolean) as Date[]
    if (dates.length !== 2 || dates.some(date => date.getTime() <= Date.now())) {
      Alert.alert('Check interview times', 'Enter two future options in the format YYYY-MM-DD HH:mm.')
      return
    }
    setBusy('interview')
    setError('')
    try {
      await api('/api/employer/applications/interview', {
        method: 'POST',
        body: JSON.stringify({
          action: 'schedule',
          applicationId: application.id,
          roundNumber: nextRound,
          interviewMethod: method,
          note: note.trim(),
          slots: dates.map(date => date.toISOString()),
          meetingLink: method === 'in_person' ? '' : meetingLink.trim(),
          venueAddress: method === 'in_person' ? venueAddress.trim() : '',
        }),
      })
      setNote('')
      await load()
      Alert.alert(`${roundLabel(nextRound)} invitation sent`, 'The candidate can now choose from the proposed times in Applications.')
    } catch (e: any) { setError(e.message) }
    finally { setBusy('') }
  }

  async function completeInterview(interview: Interview) {
    if (!application) return
    setBusy(`complete-${interview.id}`)
    setError('')
    try {
      await api('/api/employer/applications/interview', {
        method: 'POST', body: JSON.stringify({ action: 'complete', applicationId: application.id, interviewId: interview.id }),
      })
      await load()
      Alert.alert('Interview completed', 'You can now schedule another interview or move to a job offer.')
    } catch (e: any) { setError(e.message) }
    finally { setBusy('') }
  }

  async function makeOffer() {
    if (!application || !requireNote('Offer')) return
    setBusy('offer')
    setError('')
    try {
      await api('/api/employer/applications/offer', {
        method: 'POST', body: JSON.stringify({ applicationId: application.id, note: note.trim() }),
      })
      setNote('')
      await load()
      Alert.alert('Offer sent', 'The candidate has been notified and can review the offer in Applications.')
    } catch (e: any) { setError(e.message) }
    finally { setBusy('') }
  }

  if (loading) return <View style={styles.center}><ActivityIndicator color={palette.ink} /></View>
  if (!application) return <View style={styles.center}><Text style={styles.error}>{error || 'Application not found.'}</Text><Pressable onPress={() => router.back()}><Text style={styles.back}>‹ Back</Text></Pressable></View>

  const canShortlist = ['pending', 'reviewed'].includes(application.status)
  const canDecline = ['pending', 'reviewed', 'shortlisted', 'interview'].includes(application.status)
  const canScheduleInterview = ['shortlisted', 'interview'].includes(application.status) && !openInterview && completedInterviews.length < 3
  const canOffer = ['interview', 'offered'].includes(application.status) && completedInterviews.length > 0 && !openInterview
  const closed = ['accepted', 'rejected', 'withdrawn'].includes(application.status)
  const currentStage = stageIndex(application.status)
  const confirmedTime = openInterview?.selected_slot ? new Date(openInterview.selected_slot) : null
  const canCompleteCurrent = Boolean(openInterview?.status === 'confirmed' && confirmedTime && confirmedTime.getTime() <= Date.now())
  const draftIntent:MessageIntent=canShortlist?'shortlist':canScheduleInterview?'interview':canOffer?'offer':'decline'

  return <ScrollView style={styles.scroll} contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled">
    <Pressable onPress={() => router.back()} style={styles.backButton}><Text style={styles.back}>‹ Applications</Text></Pressable>
    <Text style={styles.eyebrow}>CANDIDATE</Text>
    <View style={styles.titleRow}>
      <View style={{ flex: 1 }}><Text style={styles.title}>{candidate?.full_name || 'Candidate'}</Text><Text style={styles.meta}>{[candidate?.headline || candidate?.role_level, candidate?.location].filter(Boolean).join(' · ')}</Text></View>
      {application.match_score != null ? <View style={styles.scoreBox}><Text style={styles.score}>{application.match_score}%</Text><Text style={styles.scoreLabel}>MATCH</Text></View> : null}
    </View>
    <Text style={styles.role}>{job?.job_title || 'Role'}{job?.location ? ` · ${job.location}` : ''}</Text>
    {candidate?.review_score?<Text style={styles.reputation}>{Number(candidate.review_score).toFixed(1)} ★ verified reputation</Text>:null}

    <View style={styles.stageCard}>
      <View style={styles.stageTop}><Text style={styles.stageEyebrow}>CURRENT STAGE</Text><Text style={styles.stageValue}>{stageLabel(application.status)}</Text></View>
      <View style={styles.timeline}>{['Applied', 'Shortlisted', 'Interview', 'Offer', 'Accepted'].map((label, index) => <View key={label} style={styles.timelineItem}><View style={[styles.timelineDot, index <= currentStage && styles.timelineDotActive]} /><Text style={[styles.timelineLabel, index <= currentStage && styles.timelineLabelActive]}>{label}</Text></View>)}</View>
    </View>

    {candidate?.bio ? <View style={styles.section}><Text style={styles.sectionEyebrow}>PROFILE</Text><Text style={styles.sectionTitle}>Candidate overview</Text><Text style={styles.copy}>{candidate.bio}</Text></View> : null}

    {orderedInterviews.length ? <View style={styles.section}>
      <Text style={styles.sectionEyebrow}>INTERVIEWS</Text><Text style={styles.sectionTitle}>Interview history</Text>
      {orderedInterviews.map(interview => <View key={interview.id} style={styles.interviewCard}>
        <View style={styles.interviewHeader}><Text style={styles.interviewTitle}>{roundLabel(interview.round_number)}</Text><View style={[styles.interviewPill,interview.status==='completed'&&styles.completedPill]}><Text style={[styles.interviewStatus,interview.status==='completed'&&styles.completedStatus]}>{interview.status.toUpperCase()}</Text></View></View>
        <Text style={styles.help}>{interview.interview_method.replaceAll('_', ' ')}{interview.selected_slot ? ` · ${displayDate(interview.selected_slot)}` : ''}</Text>
        {interview.status === 'proposed' ? <Text style={styles.waiting}>Waiting for the candidate to choose a time.</Text> : null}
        {interview.status === 'confirmed' && !canCompleteCurrent ? <Text style={styles.confirmed}>Confirmed. Completion unlocks after the interview time.</Text> : null}
        {interview.id === openInterview?.id && canCompleteCurrent ? <Pressable onPress={() => completeInterview(interview)} disabled={!!busy} style={[styles.primary, !!busy && styles.disabled]}><Text style={styles.primaryText}>{busy === `complete-${interview.id}` ? 'Completing…' : 'Mark interview completed'}</Text></Pressable> : null}
      </View>)}
    </View> : null}

    {!closed ? <>
      <View style={styles.section}>
        <Text style={styles.sectionEyebrow}>COMMUNICATION</Text><Text style={styles.sectionTitle}>Message to candidate</Text>
        <Text style={styles.help}>Write in your own voice. If useful, Draft message creates a starting point based on the current recruitment stage; you still review and control every word.</Text>
        <Pressable onPress={() => writeMessage(draftIntent)} disabled={!!busy} style={[styles.draftButton,!!busy&&styles.disabled]}><Text style={styles.draftButtonText}>{busy===`draft-${draftIntent}`?'Drafting…':'Draft message'}</Text><Text style={styles.draftArrow}>→</Text></Pressable>
        <TextInput value={note} onChangeText={setNote} multiline placeholder="Write your message to the candidate…" placeholderTextColor={palette.quiet} style={styles.textarea} />
      </View>

      {canShortlist ? <View style={styles.actionSection}>
        <Text style={styles.sectionEyebrow}>NEXT STEP</Text><Text style={styles.sectionTitle}>Make a decision</Text><Text style={styles.help}>Shortlisting moves the candidate forward and sends the message above.</Text>
        <Pressable onPress={() => decision('shortlisted')} disabled={!!busy} style={[styles.primary, !!busy && styles.disabled]}><Text style={styles.primaryText}>{busy === 'shortlisted' ? 'Sending…' : 'Shortlist candidate'}</Text></Pressable>
      </View> : null}

      {canScheduleInterview ? <View style={styles.section}>
        <Text style={styles.sectionEyebrow}>NEXT STEP</Text><Text style={styles.sectionTitle}>{roundLabel(nextRound)}</Text>
        <Text style={styles.help}>Offer two future times. The candidate chooses one before the interview is confirmed.</Text>
        <View style={styles.methodRow}>{(['video', 'teams', 'phone', 'in_person'] as InterviewMethod[]).map(value => <Pressable key={value} onPress={() => setMethod(value)} style={[styles.method, method === value && styles.methodActive]}><Text style={[styles.methodText, method === value && styles.methodTextActive]}>{value === 'in_person' ? 'In person' : value === 'teams' ? 'Teams' : value === 'video' ? 'Video' : 'Phone'}</Text></Pressable>)}</View>
        <Text style={styles.label}>First option</Text><TextInput value={slotOne} onChangeText={setSlotOne} style={styles.input} placeholder="YYYY-MM-DD HH:mm" placeholderTextColor={palette.quiet} />
        <Text style={styles.label}>Second option</Text><TextInput value={slotTwo} onChangeText={setSlotTwo} style={styles.input} placeholder="YYYY-MM-DD HH:mm" placeholderTextColor={palette.quiet} />
        {method === 'in_person' ? <><Text style={styles.label}>Venue</Text><TextInput value={venueAddress} onChangeText={setVenueAddress} style={styles.input} placeholder="Interview address" placeholderTextColor={palette.quiet} /></> : <><Text style={styles.label}>Meeting link <Text style={styles.optional}>(optional)</Text></Text><TextInput value={meetingLink} onChangeText={setMeetingLink} style={styles.input} placeholder="Teams / video link" placeholderTextColor={palette.quiet} autoCapitalize="none" /></>}
        <Pressable onPress={inviteInterview} disabled={!!busy} style={[styles.primary, !!busy && styles.disabled]}><Text style={styles.primaryText}>{busy === 'interview' ? 'Sending…' : `Send ${roundLabel(nextRound).toLowerCase()} invitation`}</Text></Pressable>
      </View> : null}

      {canOffer ? <View style={styles.offerSection}>
        <Text style={styles.sectionEyebrow}>OFFER</Text><Text style={styles.offerTitle}>Ready to make the offer?</Text>
        <Text style={styles.offerCopy}>{completedInterviews.length} interview{completedInterviews.length === 1 ? '' : 's'} completed. The message above will accompany the formal offer.</Text>
        <Pressable onPress={makeOffer} disabled={!!busy} style={[styles.offerButton, !!busy && styles.disabled]}><Text style={styles.offerButtonText}>{busy === 'offer' ? 'Sending…' : application.status === 'offered' ? 'Update offer message' : 'Send job offer'}</Text></Pressable>
      </View> : application.status === 'shortlisted' || application.status === 'interview' ? <View style={styles.lockedStep}><Text style={styles.lockedEyebrow}>OFFER</Text><Text style={styles.lockedTitle}>Complete an interview first</Text><Text style={styles.help}>At least one confirmed interview must be completed before an offer can be created.</Text></View> : null}

      {canDecline ? <View style={styles.declineSection}><Text style={styles.declineHelp}>Not the right fit? The candidate receives the message above when you close their application.</Text><Pressable onPress={() => decision('rejected')} disabled={!!busy} style={[styles.secondary, !!busy && styles.disabled]}><Text style={styles.dangerText}>{busy === 'rejected' ? 'Sending…' : 'Not progressing'}</Text></Pressable></View> : null}
    </> : <View style={styles.closed}><Text style={styles.closedEyebrow}>RECRUITMENT CLOSED</Text><Text style={styles.closedTitle}>{stageLabel(application.status)}</Text><Text style={styles.help}>No further recruitment action is available from this stage.</Text></View>}
    {error ? <Text style={styles.error}>{error}</Text> : null}
  </ScrollView>
}

const styles = StyleSheet.create({
  scroll:{flex:1,backgroundColor:palette.stone},
  page:{paddingHorizontal:space.page,paddingTop:18,paddingBottom:118},
  center:{flex:1,alignItems:'center',justifyContent:'center',padding:28,backgroundColor:palette.stone},
  backButton:{alignSelf:'flex-start',paddingVertical:6,marginBottom:22},
  back:{color:palette.muted,fontSize:13},
  eyebrow:{color:palette.quiet,fontSize:8,letterSpacing:2.2,fontWeight:'700',marginBottom:9},
  titleRow:{flexDirection:'row',gap:16,alignItems:'flex-start'},
  title:{color:palette.inkStrong,fontSize:31,lineHeight:37,fontWeight:'400',fontFamily:type.serif},
  meta:{color:palette.muted,fontSize:11.5,lineHeight:18,marginTop:5},
  scoreBox:{backgroundColor:palette.sageSoft,paddingHorizontal:11,paddingVertical:8,alignItems:'center',borderRadius:radius.medium},
  score:{color:palette.sage,fontSize:17,fontWeight:'800'},
  scoreLabel:{color:palette.sage,fontSize:7,letterSpacing:1.1,marginTop:1,fontWeight:'800'},
  role:{color:palette.text,fontSize:12.5,fontWeight:'700',marginTop:18},
  reputation:{color:palette.sage,fontSize:10,fontWeight:'700',marginTop:6},
  stageCard:{backgroundColor:palette.paper,borderWidth:1,borderColor:palette.line,padding:16,borderRadius:radius.large,marginTop:18},
  stageTop:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',gap:12},
  stageEyebrow:{color:palette.quiet,fontSize:7.5,letterSpacing:1.2,fontWeight:'700'},
  stageValue:{color:palette.inkStrong,fontSize:11,fontWeight:'800'},
  timeline:{flexDirection:'row',justifyContent:'space-between',marginTop:15,gap:4},
  timelineItem:{flex:1,alignItems:'center'},
  timelineDot:{width:8,height:8,borderRadius:4,backgroundColor:palette.stoneDeep},
  timelineDotActive:{backgroundColor:palette.sage},
  timelineLabel:{color:palette.quiet,fontSize:7.5,marginTop:5,textAlign:'center'},
  timelineLabelActive:{color:palette.text,fontWeight:'700'},
  section:{borderTopWidth:1,borderTopColor:palette.line,paddingTop:22,marginTop:26},
  actionSection:{backgroundColor:palette.paper,borderWidth:1,borderColor:palette.line,padding:17,borderRadius:radius.large,marginTop:24},
  sectionEyebrow:{color:palette.quiet,fontSize:8,letterSpacing:1.6,fontWeight:'700',marginBottom:5},
  sectionTitle:{color:palette.inkStrong,fontSize:21,lineHeight:26,fontWeight:'400',fontFamily:type.serif,marginBottom:7},
  copy:{color:palette.muted,fontSize:12,lineHeight:19},
  help:{color:palette.muted,fontSize:10.5,lineHeight:17,marginBottom:11},
  interviewCard:{borderWidth:1,borderColor:palette.line,padding:14,marginTop:9,backgroundColor:palette.paper,borderRadius:radius.medium},
  interviewHeader:{flexDirection:'row',justifyContent:'space-between',gap:10,alignItems:'center'},
  interviewTitle:{color:palette.inkStrong,fontSize:12.5,fontWeight:'700'},
  interviewPill:{backgroundColor:'#F5F0E5',paddingHorizontal:7,paddingVertical:4,borderRadius:999},
  completedPill:{backgroundColor:palette.sageSoft},
  interviewStatus:{color:'#7A6845',fontSize:7.5,letterSpacing:.8,fontWeight:'800'},
  completedStatus:{color:palette.sage},
  waiting:{color:'#80652C',fontSize:10,lineHeight:16,marginTop:7},
  confirmed:{color:palette.sage,fontSize:10,lineHeight:16,marginTop:7},
  draftButton:{borderWidth:1,borderColor:palette.lineStrong,backgroundColor:palette.paper,paddingHorizontal:12,paddingVertical:11,flexDirection:'row',justifyContent:'space-between',alignItems:'center',borderRadius:radius.medium,marginBottom:9},
  draftButtonText:{color:palette.ink,fontSize:10.5,fontWeight:'700'},
  draftArrow:{color:palette.ink,fontSize:15},
  textarea:{borderWidth:1,borderColor:palette.line,minHeight:112,padding:13,textAlignVertical:'top',fontSize:12,color:palette.text,backgroundColor:palette.paper,borderRadius:radius.medium},
  primary:{backgroundColor:palette.inkStrong,paddingVertical:14,alignItems:'center',marginTop:11,borderRadius:radius.medium},
  primaryText:{color:palette.paper,fontSize:10.5,fontWeight:'700'},
  secondary:{borderWidth:1,borderColor:'#D9BCBC',paddingVertical:13,alignItems:'center',backgroundColor:palette.paper,borderRadius:radius.medium},
  dangerText:{color:palette.danger,fontSize:10.5,fontWeight:'700'},
  disabled:{opacity:.45},
  methodRow:{flexDirection:'row',flexWrap:'wrap',gap:7,marginVertical:10},
  method:{borderWidth:1,borderColor:palette.lineStrong,paddingHorizontal:10,paddingVertical:9,backgroundColor:palette.paper,borderRadius:radius.medium},
  methodActive:{backgroundColor:palette.inkStrong,borderColor:palette.inkStrong},
  methodText:{color:palette.muted,fontSize:9.5,fontWeight:'600'},
  methodTextActive:{color:palette.paper,fontWeight:'700'},
  label:{color:palette.text,fontSize:10,fontWeight:'700',marginTop:10,marginBottom:5},
  optional:{color:palette.quiet,fontWeight:'500'},
  input:{borderWidth:1,borderColor:palette.line,paddingHorizontal:12,paddingVertical:11,color:palette.text,fontSize:11.5,backgroundColor:palette.paper,borderRadius:radius.medium},
  offerSection:{backgroundColor:palette.inkStrong,padding:17,borderRadius:radius.large,marginTop:24},
  offerTitle:{color:palette.paper,fontFamily:type.serif,fontSize:21,lineHeight:26,fontWeight:'400'},
  offerCopy:{color:'#D8DEDF',fontSize:10.5,lineHeight:17,marginTop:6},
  offerButton:{backgroundColor:palette.paper,paddingVertical:13,alignItems:'center',marginTop:13,borderRadius:radius.medium},
  offerButtonText:{color:palette.inkStrong,fontSize:10.5,fontWeight:'800'},
  lockedStep:{backgroundColor:palette.paper,borderWidth:1,borderColor:palette.line,padding:16,borderRadius:radius.large,marginTop:24},
  lockedEyebrow:{color:palette.quiet,fontSize:7.5,letterSpacing:1.2,fontWeight:'700'},
  lockedTitle:{color:palette.inkStrong,fontFamily:type.serif,fontSize:18,fontWeight:'400',marginTop:4,marginBottom:5},
  declineSection:{marginTop:22},
  declineHelp:{color:palette.quiet,fontSize:9.5,lineHeight:15,textAlign:'center',marginBottom:9,paddingHorizontal:8},
  closed:{backgroundColor:palette.paper,borderWidth:1,borderColor:palette.line,padding:18,borderRadius:radius.large,marginTop:26},
  closedEyebrow:{color:palette.quiet,fontSize:7.5,letterSpacing:1.2,fontWeight:'700'},
  closedTitle:{color:palette.inkStrong,fontFamily:type.serif,fontSize:19,fontWeight:'400',marginTop:4,marginBottom:5},
  error:{color:palette.danger,fontSize:11,lineHeight:17,marginTop:16},
})