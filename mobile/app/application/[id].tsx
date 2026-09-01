import { useEffect, useMemo, useState } from 'react'
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { supabase } from '../../src/lib/supabase'

type InterviewMethod = 'teams' | 'video' | 'phone' | 'in_person'
type MessageIntent = 'shortlist' | 'decline' | 'offer'
type ApplicationRow = {
  id: string
  status: string
  match_score: number | null
  offer_declined?: boolean
  interviews?: { id: string; round_number: number; status: string; selected_slot?: string | null }[]
  candidate_profiles?: { full_name?: string | null; headline?: string | null; role_level?: string | null; location?: string | null; bio?: string | null; review_score?: number | null } | { full_name?: string | null; headline?: string | null; role_level?: string | null; location?: string | null; bio?: string | null; review_score?: number | null }[] | null
  job_listings?: { job_title?: string | null; location?: string | null } | { job_title?: string | null; location?: string | null }[] | null
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

export default function EmployerApplicationScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const [application, setApplication] = useState<ApplicationRow | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState('')
  const [error, setError] = useState('')
  const [note, setNote] = useState('')
  const [method, setMethod] = useState<InterviewMethod>('video')
  const [slotOne, setSlotOne] = useState(localDateInput(1, 10))
  const [slotTwo, setSlotTwo] = useState(localDateInput(2, 14))
  const [meetingLink, setMeetingLink] = useState('')
  const [venueAddress, setVenueAddress] = useState('')

  useEffect(() => { load() }, [id])

  async function load() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || !id) { router.replace('/login'); return }
    const { data: account } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle()
    if (account?.role !== 'employer') { router.replace('/applications'); return }
    try {
      // The inbox API returns the applicant's full profile whatever their
      // privacy settings (they applied to you), plus interview rounds.
      const inbox = await callApi('/api/employer/applications/inbox', undefined, 'GET')
      const row = (inbox.applications || []).find((application: any) => application.id === id)
      if (!row) { setError('Application not found.'); setLoading(false); return }
      setApplication(row as ApplicationRow)
    } catch (e: any) {
      setError(e?.message || 'Could not load this application.')
    }
    setLoading(false)
  }

  const candidate = useMemo(() => application ? (Array.isArray(application.candidate_profiles) ? application.candidate_profiles[0] : application.candidate_profiles) : null, [application])
  const job = useMemo(() => application ? (Array.isArray(application.job_listings) ? application.job_listings[0] : application.job_listings) : null, [application])

  async function callApi(path: string, payload?: Record<string, unknown>, methodOverride: 'GET' | 'POST' | 'PATCH' = 'POST') {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.access_token) throw new Error('Your session has expired. Please sign in again.')
    const response = await fetch(`${WEB_URL}${path}`, {
      method: methodOverride,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
      ...(payload !== undefined && methodOverride !== 'GET' ? { body: JSON.stringify(payload) } : {}),
    })
    const body = await response.json().catch(() => ({}))
    if (!response.ok) throw new Error(body?.error || 'Could not update this application.')
    return body
  }

  async function writeAiMessage(intent: MessageIntent) {
    if (!application || busy) return
    setBusy(`ai-${intent}`)
    setError('')
    try {
      const data = await callApi('/api/employer/applications/message-ai', { applicationId: application.id, intent })
      setNote(String(data.message || ''))
    } catch (e: any) {
      setError(e.message || 'Could not write the candidate message.')
    }
    setBusy('')
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
    setBusy(decisionValue); setError('')
    try {
      await callApi('/api/employer/applications/decision', { applicationId: application.id, decision: decisionValue, note: note.trim() })
      setApplication({ ...application, status: decisionValue })
      Alert.alert(decisionValue === 'shortlisted' ? 'Candidate shortlisted' : 'Application updated', 'The candidate has been notified through the platform.')
    } catch (e: any) { setError(e.message) }
    setBusy('')
  }

  async function inviteInterview() {
    if (!application) return
    const dates = [parseLocalDate(slotOne), parseLocalDate(slotTwo)].filter(Boolean) as Date[]
    if (!dates.length || dates.some(date => date.getTime() <= Date.now())) {
      Alert.alert('Check interview times', 'Use future times in the format YYYY-MM-DD HH:mm.')
      return
    }
    setBusy('interview'); setError('')
    try {
      await callApi('/api/employer/applications/interview', {
        applicationId: application.id,
        roundNumber: nextRound,
        interviewMethod: method,
        note: note.trim(),
        slots: dates.map(date => date.toISOString()),
        meetingLink: method === 'in_person' ? '' : meetingLink.trim(),
        venueAddress: method === 'in_person' ? venueAddress.trim() : '',
      })
      setApplication({ ...application, status: 'interview' })
      Alert.alert('Interview invitation sent', 'The candidate can now choose from the proposed times in My Applications.')
    } catch (e: any) { setError(e.message) }
    setBusy('')
  }

  async function makeOffer() {
    if (!application || !requireNote('Offer')) return
    setBusy('offer'); setError('')
    try {
      await callApi('/api/employer/applications/offer', { applicationId: application.id, note: note.trim() })
      setApplication({ ...application, status: 'offered' })
      Alert.alert('Offer sent', 'The candidate has been notified and can review the offer in My Applications.')
    } catch (e: any) { setError(e.message) }
    setBusy('')
  }

  async function markInterviewComplete() {
    if (!application || !latestInterview || busy) return
    setBusy('complete-interview'); setError('')
    try {
      await callApi('/api/employer/applications/interview', { interviewId: latestInterview.id }, 'PATCH')
      await load()
      Alert.alert('Interview marked complete', 'You can now arrange the next interview or make an offer.')
    } catch (e: any) { setError(e.message) }
    setBusy('')
  }

  async function completeHire() {
    if (!application || busy) return
    Alert.alert('Complete hire & close role?', 'The role will be closed, other applicants will be notified, and this placement will move to Hired history.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Complete hire', onPress: async () => {
        setBusy('complete-hire'); setError('')
        try {
          await callApi('/api/employer/applications/complete-hire', { applicationId: application.id })
          Alert.alert('Hire completed', 'Congratulations - the placement is recorded and the role has been closed.')
          router.replace('/applications')
        } catch (e: any) { setError(e.message) }
        setBusy('')
      } },
    ])
  }

  if (loading) return <View style={styles.center}><ActivityIndicator color="#0b2f4d" /></View>
  if (!application) return <View style={styles.center}><Text style={styles.error}>{error || 'Application not found.'}</Text><Pressable onPress={() => router.back()}><Text style={styles.back}>‹ Back</Text></Pressable></View>

  const interviews = application.interviews || []
  const latestInterview = interviews.length ? interviews[interviews.length - 1] : null
  const latestHeld = !!latestInterview && (latestInterview.status === 'completed' || (latestInterview.status === 'confirmed' && !!latestInterview.selected_slot && new Date(latestInterview.selected_slot).getTime() <= Date.now()))
  const latestAwaitingCompletion = !!latestInterview && latestInterview.status === 'confirmed' && !!latestInterview.selected_slot && new Date(latestInterview.selected_slot).getTime() <= Date.now()
  // Round to send next: update the current round while it is still proposed;
  // otherwise the next round (once the previous one has been held).
  const nextRound = !latestInterview ? 1 : latestInterview.status === 'proposed' ? latestInterview.round_number : latestHeld ? Math.min(latestInterview.round_number + 1, 3) : latestInterview.round_number
  const canInterview = ['shortlisted', 'interview'].includes(application.status) && (!latestInterview || latestInterview.status === 'proposed' || latestHeld)
  const canOffer = ['interview', 'offered'].includes(application.status) && (latestHeld || application.status === 'offered')
  const accepted = application.status === 'accepted'
  const closed = ['rejected', 'withdrawn'].includes(application.status)

  return <ScrollView style={styles.scroll} contentContainerStyle={styles.page}>
    <Pressable onPress={() => router.back()}><Text style={styles.back}>‹ Applications</Text></Pressable>
    <Text style={styles.eyebrow}>MANAGE CANDIDATE</Text>
    <View style={styles.titleRow}><View style={{ flex: 1 }}><Text style={styles.title}>{candidate?.full_name || 'Candidate'}</Text><Text style={styles.meta}>{[candidate?.headline || candidate?.role_level, candidate?.location].filter(Boolean).join(' · ')}</Text></View>{application.match_score ? <View style={styles.scoreBox}><Text style={styles.score}>{application.match_score}%</Text><Text style={styles.scoreLabel}>MATCH</Text></View> : null}</View>
    <Text style={styles.role}>{job?.job_title || 'Role'}{job?.location ? ` · ${job.location}` : ''}</Text>
    <Text style={styles.stage}>CURRENT STAGE  {application.status.replaceAll('_', ' ').toUpperCase()}</Text>
    {candidate?.bio ? <View style={styles.section}><Text style={styles.sectionTitle}>Candidate profile</Text><Text style={styles.copy}>{candidate.bio}</Text></View> : null}

    {!closed && !accepted ? <>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Message to candidate</Text>
        <Text style={styles.help}>Use AI to create a polished first draft from the real candidate, role and property details. You can edit every word before sending.</Text>
        <View style={styles.aiRow}>
          <Pressable onPress={() => writeAiMessage('shortlist')} disabled={!!busy} style={[styles.aiButton, !!busy && styles.disabled]}><Text style={styles.aiButtonText}>{busy === 'ai-shortlist' ? 'Writing…' : 'AI shortlist'}</Text></Pressable>
          <Pressable onPress={() => writeAiMessage('decline')} disabled={!!busy} style={[styles.aiButton, !!busy && styles.disabled]}><Text style={styles.aiButtonText}>{busy === 'ai-decline' ? 'Writing…' : 'AI decline'}</Text></Pressable>
          <Pressable onPress={() => writeAiMessage('offer')} disabled={!!busy} style={[styles.aiButton, !!busy && styles.disabled]}><Text style={styles.aiButtonText}>{busy === 'ai-offer' ? 'Writing…' : 'AI offer'}</Text></Pressable>
        </View>
        <TextInput value={note} onChangeText={setNote} multiline placeholder="AI message will appear here, or write your own..." style={styles.textarea} />
      </View>
      <View style={styles.actionGrid}>
        <Pressable onPress={() => decision('shortlisted')} disabled={!!busy || application.status === 'shortlisted'} style={[styles.primary, (busy !== '' || application.status === 'shortlisted') && styles.disabled]}><Text style={styles.primaryText}>{busy === 'shortlisted' ? 'Sending...' : application.status === 'shortlisted' ? 'Shortlisted ✓' : 'Shortlist candidate'}</Text></Pressable>
        <Pressable onPress={() => decision('rejected')} disabled={!!busy} style={[styles.secondary, busy !== '' && styles.disabled]}><Text style={styles.dangerText}>{busy === 'rejected' ? 'Sending...' : 'Not progressing'}</Text></Pressable>
      </View>

      {canInterview ? <View style={styles.section}><Text style={styles.sectionTitle}>Interview invitation</Text><Text style={styles.help}>Offer one or two future times. The candidate chooses their preferred slot.</Text><View style={styles.methodRow}>{(['video','teams','phone','in_person'] as InterviewMethod[]).map(value => <Pressable key={value} onPress={() => setMethod(value)} style={[styles.method, method === value && styles.methodActive]}><Text style={[styles.methodText, method === value && styles.methodTextActive]}>{value === 'in_person' ? 'In person' : value === 'teams' ? 'Teams' : value === 'video' ? 'Video' : 'Phone'}</Text></Pressable>)}</View><Text style={styles.label}>First option</Text><TextInput value={slotOne} onChangeText={setSlotOne} style={styles.input} placeholder="YYYY-MM-DD HH:mm" /><Text style={styles.label}>Second option</Text><TextInput value={slotTwo} onChangeText={setSlotTwo} style={styles.input} placeholder="YYYY-MM-DD HH:mm" />{method === 'in_person' ? <><Text style={styles.label}>Venue</Text><TextInput value={venueAddress} onChangeText={setVenueAddress} style={styles.input} placeholder="Interview address" /></> : <><Text style={styles.label}>Meeting link (optional)</Text><TextInput value={meetingLink} onChangeText={setMeetingLink} style={styles.input} placeholder="Teams / video link" autoCapitalize="none" /></>}<Pressable onPress={inviteInterview} disabled={!!busy} style={[styles.primary, busy !== '' && styles.disabled]}><Text style={styles.primaryText}>{busy === 'interview' ? 'Sending...' : latestInterview && latestInterview.status === 'proposed' && nextRound === latestInterview.round_number ? `Update interview ${nextRound} invitation` : `Send interview ${nextRound} invitation`}</Text></Pressable></View> : null}

      {latestAwaitingCompletion ? <View style={styles.section}><Text style={styles.sectionTitle}>Interview held?</Text><Text style={styles.help}>Interview {latestInterview?.round_number} was scheduled for a time that has now passed. Mark it complete to unlock the next interview or an offer.</Text><Pressable onPress={markInterviewComplete} disabled={!!busy} style={[styles.secondary, busy !== '' && styles.disabled]}><Text style={styles.completeText}>{busy === 'complete-interview' ? 'Saving...' : 'Mark interview complete'}</Text></Pressable></View> : null}

      {canOffer ? <View style={styles.section}><Text style={styles.sectionTitle}>Make an offer</Text><Text style={styles.help}>The candidate will receive an offer alert and can respond from My Applications.</Text><Pressable onPress={makeOffer} disabled={!!busy} style={[styles.offer, busy !== '' && styles.disabled]}><Text style={styles.offerText}>{busy === 'offer' ? 'Sending...' : application.status === 'offered' ? 'Resend / update offer' : 'Send job offer'}</Text></Pressable></View> : null}
    </> : accepted ? <View style={styles.section}><Text style={styles.sectionTitle}>Offer accepted 🎉</Text><Text style={styles.help}>Complete the hire to close the role, notify the other applicants and archive this placement to Hired history.</Text><Pressable onPress={completeHire} disabled={!!busy} style={[styles.primary, busy !== '' && styles.disabled]}><Text style={styles.primaryText}>{busy === 'complete-hire' ? 'Completing...' : 'Complete hire & close role'}</Text></Pressable></View> : <View style={styles.closed}><Text style={styles.closedTitle}>{(application as any).offer_declined ? 'The candidate declined the offer.' : 'This application is closed.'}</Text><Text style={styles.help}>No further recruitment action is available from this stage.</Text></View>}
    {error ? <Text style={styles.error}>{error}</Text> : null}
  </ScrollView>
}

const styles = StyleSheet.create({
  scroll:{flex:1,backgroundColor:'#fff'},page:{paddingHorizontal:22,paddingTop:64,paddingBottom:48},center:{flex:1,alignItems:'center',justifyContent:'center',padding:28,backgroundColor:'#fff'},back:{color:'#66747c',fontSize:13,marginBottom:34},eyebrow:{color:'#71808a',fontSize:9,letterSpacing:2.1,marginBottom:10},titleRow:{flexDirection:'row',gap:16,alignItems:'flex-start'},title:{color:'#0b2f4d',fontSize:29,lineHeight:35,fontWeight:'500'},meta:{color:'#71808a',fontSize:12,lineHeight:18,marginTop:6},scoreBox:{borderWidth:1,borderColor:'#ccd8dd',paddingHorizontal:12,paddingVertical:8,alignItems:'center'},score:{color:'#0b2f4d',fontSize:17,fontWeight:'700'},scoreLabel:{color:'#71808a',fontSize:7,letterSpacing:1.2,marginTop:2},role:{color:'#173246',fontSize:14,fontWeight:'600',marginTop:22},stage:{color:'#71808a',fontSize:9,letterSpacing:1.1,marginTop:8},section:{borderTopWidth:1,borderTopColor:'#e3e8eb',paddingTop:22,marginTop:26},sectionTitle:{color:'#173246',fontSize:17,fontWeight:'600',marginBottom:7},copy:{color:'#66747c',fontSize:13,lineHeight:21},help:{color:'#71808a',fontSize:11,lineHeight:17,marginBottom:12},aiRow:{flexDirection:'row',gap:8,marginBottom:12},aiButton:{flex:1,borderWidth:1,borderColor:'#9fb1bb',backgroundColor:'#f4f7f8',paddingVertical:10,paddingHorizontal:6,alignItems:'center'},aiButtonText:{color:'#0b2f4d',fontSize:9.5,fontWeight:'700'},textarea:{borderWidth:1,borderColor:'#d7e0e4',minHeight:110,padding:13,textAlignVertical:'top',fontSize:13,color:'#173246'},actionGrid:{gap:10,marginTop:14},primary:{backgroundColor:'#0b2f4d',paddingVertical:15,alignItems:'center',marginTop:12},primaryText:{color:'#fff',fontSize:12,fontWeight:'700'},secondary:{borderWidth:1,borderColor:'#d7e0e4',paddingVertical:14,alignItems:'center'},dangerText:{color:'#7c3f3f',fontSize:12,fontWeight:'600'},completeText:{color:'#0b6245',fontSize:12,fontWeight:'700'},disabled:{opacity:.45},methodRow:{flexDirection:'row',flexWrap:'wrap',gap:8,marginVertical:10},method:{borderWidth:1,borderColor:'#d7e0e4',paddingHorizontal:11,paddingVertical:9},methodActive:{backgroundColor:'#0b2f4d',borderColor:'#0b2f4d'},methodText:{color:'#66747c',fontSize:10},methodTextActive:{color:'#fff',fontWeight:'700'},label:{color:'#173246',fontSize:11,fontWeight:'600',marginTop:11,marginBottom:6},input:{borderWidth:1,borderColor:'#d7e0e4',paddingHorizontal:12,paddingVertical:12,color:'#173246',fontSize:12},offer:{borderWidth:1,borderColor:'#0b2f4d',paddingVertical:15,alignItems:'center',marginTop:10},offerText:{color:'#0b2f4d',fontSize:12,fontWeight:'700'},closed:{backgroundColor:'#f4f7f8',padding:18,marginTop:28},closedTitle:{color:'#173246',fontSize:14,fontWeight:'600',marginBottom:5},error:{color:'#9b2c2c',fontSize:12,lineHeight:18,marginTop:18},
})
