import { useEffect, useMemo, useState } from 'react'
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { supabase } from '../../src/lib/supabase'

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

  async function writeAiMessage(intent: MessageIntent) {
    if (!application || busy) return
    setBusy(`ai-${intent}`)
    setError('')
    try {
      const data = await api('/api/employer/applications/message-ai', {
        method: 'POST', body: JSON.stringify({ applicationId: application.id, intent }),
      })
      setNote(String(data.message || ''))
    } catch (e: any) {
      setError(e.message || 'Could not write the candidate message.')
    } finally {
      setBusy('')
    }
  }

  function requireNote(label: string) {
    if (note.trim().length < 20) {
      Alert.alert(`${label} message needed`, 'Use the AI assistant or write a short, clear message for the candidate before sending.')
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

  if (loading) return <View style={styles.center}><ActivityIndicator color="#092b45" /></View>
  if (!application) return <View style={styles.center}><Text style={styles.error}>{error || 'Application not found.'}</Text><Pressable onPress={() => router.back()}><Text style={styles.back}>‹ Back</Text></Pressable></View>

  const canShortlist = ['pending', 'reviewed'].includes(application.status)
  const canDecline = ['pending', 'reviewed', 'shortlisted', 'interview'].includes(application.status)
  const canScheduleInterview = ['shortlisted', 'interview'].includes(application.status) && !openInterview && completedInterviews.length < 3
  const canOffer = ['interview', 'offered'].includes(application.status) && completedInterviews.length > 0 && !openInterview
  const closed = ['accepted', 'rejected', 'withdrawn'].includes(application.status)
  const currentStage = stageIndex(application.status)
  const confirmedTime = openInterview?.selected_slot ? new Date(openInterview.selected_slot) : null
  const canCompleteCurrent = Boolean(openInterview?.status === 'confirmed' && confirmedTime && confirmedTime.getTime() <= Date.now())

  return <ScrollView style={styles.scroll} contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled">
    <Pressable onPress={() => router.back()}><Text style={styles.back}>‹ Applications</Text></Pressable>
    <Text style={styles.eyebrow}>MANAGE CANDIDATE</Text>
    <View style={styles.titleRow}><View style={{ flex: 1 }}><Text style={styles.title}>{candidate?.full_name || 'Candidate'}</Text><Text style={styles.meta}>{[candidate?.headline || candidate?.role_level, candidate?.location].filter(Boolean).join(' · ')}</Text></View>{application.match_score != null ? <View style={styles.scoreBox}><Text style={styles.score}>{application.match_score}%</Text><Text style={styles.scoreLabel}>MATCH</Text></View> : null}</View>
    <Text style={styles.role}>{job?.job_title || 'Role'}{job?.location ? ` · ${job.location}` : ''}</Text>

    <View style={styles.timeline}>{['Applied', 'Shortlisted', 'Interview', 'Offer', 'Accepted'].map((label, index) => <View key={label} style={styles.timelineItem}><View style={[styles.timelineDot, index <= currentStage && styles.timelineDotActive]} /><Text style={[styles.timelineLabel, index <= currentStage && styles.timelineLabelActive]}>{label}</Text></View>)}</View>
    <Text style={styles.stage}>CURRENT STAGE  {application.status.replaceAll('_', ' ').toUpperCase()}</Text>

    {candidate?.bio ? <View style={styles.section}><Text style={styles.sectionTitle}>Candidate profile</Text><Text style={styles.copy}>{candidate.bio}</Text></View> : null}

    {orderedInterviews.length ? <View style={styles.section}>
      <Text style={styles.sectionTitle}>Interview history</Text>
      {orderedInterviews.map(interview => <View key={interview.id} style={styles.interviewCard}>
        <View style={styles.interviewHeader}><Text style={styles.interviewTitle}>{roundLabel(interview.round_number)}</Text><Text style={[styles.interviewStatus, interview.status === 'completed' && styles.completedStatus]}>{interview.status.toUpperCase()}</Text></View>
        <Text style={styles.help}>{interview.interview_method.replaceAll('_', ' ')}{interview.selected_slot ? ` · ${displayDate(interview.selected_slot)}` : ''}</Text>
        {interview.status === 'proposed' ? <Text style={styles.waiting}>Waiting for the candidate to choose a time.</Text> : null}
        {interview.status === 'confirmed' && !canCompleteCurrent ? <Text style={styles.waiting}>Confirmed. Completion unlocks after the interview time.</Text> : null}
        {interview.id === openInterview?.id && canCompleteCurrent ? <Pressable onPress={() => completeInterview(interview)} disabled={!!busy} style={[styles.primary, !!busy && styles.disabled]}><Text style={styles.primaryText}>{busy === `complete-${interview.id}` ? 'Completing...' : 'Mark interview completed'}</Text></Pressable> : null}
      </View>)}
    </View> : null}

    {!closed ? <>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Message to candidate</Text>
        <Text style={styles.help}>Only messages appropriate to the current recruitment stage are shown. AI creates a draft; you remain in control of every word.</Text>
        <View style={styles.aiRow}>
          {canShortlist ? <Pressable onPress={() => writeAiMessage('shortlist')} disabled={!!busy} style={[styles.aiButton, !!busy && styles.disabled]}><Text style={styles.aiButtonText}>{busy === 'ai-shortlist' ? 'Writing…' : 'AI shortlist'}</Text></Pressable> : null}
          {canScheduleInterview ? <Pressable onPress={() => writeAiMessage('interview')} disabled={!!busy} style={[styles.aiButton, !!busy && styles.disabled]}><Text style={styles.aiButtonText}>{busy === 'ai-interview' ? 'Writing…' : 'AI interview'}</Text></Pressable> : null}
          {canOffer ? <Pressable onPress={() => writeAiMessage('offer')} disabled={!!busy} style={[styles.aiButton, !!busy && styles.disabled]}><Text style={styles.aiButtonText}>{busy === 'ai-offer' ? 'Writing…' : 'AI offer'}</Text></Pressable> : null}
          {canDecline ? <Pressable onPress={() => writeAiMessage('decline')} disabled={!!busy} style={[styles.aiButton, !!busy && styles.disabled]}><Text style={styles.aiButtonText}>{busy === 'ai-decline' ? 'Writing…' : 'AI decline'}</Text></Pressable> : null}
        </View>
        <TextInput value={note} onChangeText={setNote} multiline placeholder="AI message will appear here, or write your own..." style={styles.textarea} />
      </View>

      {canShortlist ? <View style={styles.actionGrid}>
        <Pressable onPress={() => decision('shortlisted')} disabled={!!busy} style={[styles.primary, !!busy && styles.disabled]}><Text style={styles.primaryText}>{busy === 'shortlisted' ? 'Sending...' : 'Shortlist candidate'}</Text></Pressable>
      </View> : null}

      {canScheduleInterview ? <View style={styles.section}>
        <Text style={styles.sectionTitle}>{roundLabel(nextRound)}</Text>
        <Text style={styles.help}>Offer two future times. The candidate chooses one before the interview is confirmed.</Text>
        <View style={styles.methodRow}>{(['video', 'teams', 'phone', 'in_person'] as InterviewMethod[]).map(value => <Pressable key={value} onPress={() => setMethod(value)} style={[styles.method, method === value && styles.methodActive]}><Text style={[styles.methodText, method === value && styles.methodTextActive]}>{value === 'in_person' ? 'In person' : value === 'teams' ? 'Teams' : value === 'video' ? 'Video' : 'Phone'}</Text></Pressable>)}</View>
        <Text style={styles.label}>First option</Text><TextInput value={slotOne} onChangeText={setSlotOne} style={styles.input} placeholder="YYYY-MM-DD HH:mm" />
        <Text style={styles.label}>Second option</Text><TextInput value={slotTwo} onChangeText={setSlotTwo} style={styles.input} placeholder="YYYY-MM-DD HH:mm" />
        {method === 'in_person' ? <><Text style={styles.label}>Venue</Text><TextInput value={venueAddress} onChangeText={setVenueAddress} style={styles.input} placeholder="Interview address" /></> : <><Text style={styles.label}>Meeting link (optional)</Text><TextInput value={meetingLink} onChangeText={setMeetingLink} style={styles.input} placeholder="Teams / video link" autoCapitalize="none" /></>}
        <Pressable onPress={inviteInterview} disabled={!!busy} style={[styles.primary, !!busy && styles.disabled]}><Text style={styles.primaryText}>{busy === 'interview' ? 'Sending...' : `Send ${roundLabel(nextRound).toLowerCase()} invitation`}</Text></Pressable>
      </View> : null}

      {canOffer ? <View style={styles.section}>
        <Text style={styles.sectionTitle}>Make an offer</Text>
        <Text style={styles.help}>{completedInterviews.length} interview{completedInterviews.length === 1 ? '' : 's'} completed. The candidate can now receive and respond to a formal offer.</Text>
        <Pressable onPress={makeOffer} disabled={!!busy} style={[styles.offer, !!busy && styles.disabled]}><Text style={styles.offerText}>{busy === 'offer' ? 'Sending...' : application.status === 'offered' ? 'Update offer message' : 'Send job offer'}</Text></Pressable>
      </View> : application.status === 'shortlisted' || application.status === 'interview' ? <View style={styles.lockedStep}><Text style={styles.lockedTitle}>Offer locked</Text><Text style={styles.help}>At least one confirmed interview must be completed before an offer can be created.</Text></View> : null}

      {canDecline ? <Pressable onPress={() => decision('rejected')} disabled={!!busy} style={[styles.secondary, !!busy && styles.disabled]}><Text style={styles.dangerText}>{busy === 'rejected' ? 'Sending...' : 'Not progressing'}</Text></Pressable> : null}
    </> : <View style={styles.closed}><Text style={styles.closedTitle}>This application is closed.</Text><Text style={styles.help}>No further recruitment action is available from this stage.</Text></View>}
    {error ? <Text style={styles.error}>{error}</Text> : null}
  </ScrollView>
}

const styles = StyleSheet.create({
  scroll:{flex:1,backgroundColor:'#fff'},page:{paddingHorizontal:22,paddingTop:64,paddingBottom:80},center:{flex:1,alignItems:'center',justifyContent:'center',padding:28,backgroundColor:'#fff'},back:{color:'#66747c',fontSize:13,marginBottom:34},eyebrow:{color:'#71808a',fontSize:9,letterSpacing:2.1,marginBottom:10},titleRow:{flexDirection:'row',gap:16,alignItems:'flex-start'},title:{color:'#092b45',fontSize:29,lineHeight:35,fontWeight:'500'},meta:{color:'#71808a',fontSize:12,lineHeight:18,marginTop:6},scoreBox:{borderWidth:1,borderColor:'#ccd8dd',paddingHorizontal:12,paddingVertical:8,alignItems:'center'},score:{color:'#092b45',fontSize:17,fontWeight:'700'},scoreLabel:{color:'#71808a',fontSize:7,letterSpacing:1.2,marginTop:2},role:{color:'#173246',fontSize:14,fontWeight:'600',marginTop:22},stage:{color:'#71808a',fontSize:9,letterSpacing:1.1,marginTop:12},timeline:{flexDirection:'row',justifyContent:'space-between',marginTop:24,gap:4},timelineItem:{flex:1,alignItems:'center'},timelineDot:{width:9,height:9,borderRadius:5,backgroundColor:'#d8e0e4'},timelineDotActive:{backgroundColor:'#092b45'},timelineLabel:{color:'#9aa5ab',fontSize:7.5,marginTop:5,textAlign:'center'},timelineLabelActive:{color:'#173246',fontWeight:'700'},section:{borderTopWidth:1,borderTopColor:'#e3e8eb',paddingTop:22,marginTop:26},sectionTitle:{color:'#173246',fontSize:17,fontWeight:'600',marginBottom:7},copy:{color:'#66747c',fontSize:13,lineHeight:21},help:{color:'#71808a',fontSize:11,lineHeight:17,marginBottom:12},interviewCard:{borderWidth:1,borderColor:'#dce3e7',padding:14,marginTop:10},interviewHeader:{flexDirection:'row',justifyContent:'space-between',gap:10},interviewTitle:{color:'#173246',fontSize:13,fontWeight:'700'},interviewStatus:{color:'#71808a',fontSize:8,letterSpacing:1},completedStatus:{color:'#315846',fontWeight:'800'},waiting:{color:'#8a5b18',fontSize:10.5,lineHeight:16,marginTop:7},aiRow:{flexDirection:'row',flexWrap:'wrap',gap:8,marginBottom:12},aiButton:{minWidth:'47%',flexGrow:1,borderWidth:1,borderColor:'#9fb1bb',backgroundColor:'#f4f7f8',paddingVertical:10,paddingHorizontal:8,alignItems:'center'},aiButtonText:{color:'#092b45',fontSize:9.5,fontWeight:'700'},textarea:{borderWidth:1,borderColor:'#d7e0e4',minHeight:110,padding:13,textAlignVertical:'top',fontSize:13,color:'#173246'},actionGrid:{gap:10,marginTop:14},primary:{backgroundColor:'#092b45',paddingVertical:15,alignItems:'center',marginTop:12},primaryText:{color:'#fff',fontSize:12,fontWeight:'700'},secondary:{borderWidth:1,borderColor:'#d7e0e4',paddingVertical:14,alignItems:'center',marginTop:18},dangerText:{color:'#7c3f3f',fontSize:12,fontWeight:'600'},disabled:{opacity:.45},methodRow:{flexDirection:'row',flexWrap:'wrap',gap:8,marginVertical:10},method:{borderWidth:1,borderColor:'#d7e0e4',paddingHorizontal:11,paddingVertical:9},methodActive:{backgroundColor:'#092b45',borderColor:'#092b45'},methodText:{color:'#66747c',fontSize:10},methodTextActive:{color:'#fff',fontWeight:'700'},label:{color:'#173246',fontSize:11,fontWeight:'600',marginTop:11,marginBottom:6},input:{borderWidth:1,borderColor:'#d7e0e4',paddingHorizontal:12,paddingVertical:12,color:'#173246',fontSize:12},offer:{borderWidth:1,borderColor:'#092b45',paddingVertical:15,alignItems:'center',marginTop:10},offerText:{color:'#092b45',fontSize:12,fontWeight:'700'},lockedStep:{backgroundColor:'#f4f7f8',padding:16,marginTop:24},lockedTitle:{color:'#173246',fontSize:13,fontWeight:'700',marginBottom:5},closed:{backgroundColor:'#f4f7f8',padding:18,marginTop:28},closedTitle:{color:'#173246',fontSize:14,fontWeight:'600',marginBottom:5},error:{color:'#9b2c2c',fontSize:12,lineHeight:18,marginTop:18},
})
