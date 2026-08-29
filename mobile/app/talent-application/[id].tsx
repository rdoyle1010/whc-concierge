import { useEffect, useMemo, useState } from 'react'
import { ActivityIndicator, Alert, Linking, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { supabase } from '../../src/lib/supabase'
import { palette, radius, space, type } from '../../src/lib/theme'

const WEB_URL = process.env.EXPO_PUBLIC_WEB_URL || 'https://talent.wellnesshousecollective.co.uk'

type Interview = {
  id: string
  round_number: number
  interview_method: string
  proposed_slots: string[] | null
  selected_slot: string | null
  status: string
  employer_note: string | null
  candidate_note?: string | null
  meeting_link: string | null
  venue_address: string | null
  contact_name: string | null
  preparation_required: string | null
  assessment_type: string | null
  assessment_details: string | null
}

type Offer = {
  id: string
  status: string
  employer_note: string | null
  candidate_note: string | null
  offered_at: string | null
  responded_at: string | null
}

function stageLabel(status: string) {
  const labels: Record<string, string> = {
    pending: 'Under review', reviewed: 'Under review', shortlisted: 'Under review', interview: 'Interview stage', offered: 'Offer received', accepted: 'Offer accepted', rejected: 'Application closed', withdrawn: 'Withdrawn',
  }
  return labels[status] || status.replaceAll('_', ' ')
}

function interviewMethod(method: string) {
  if (method === 'teams') return 'Microsoft Teams'
  if (method === 'google_meet') return 'Google Meet'
  if (method === 'zoom') return 'Zoom'
  if (method === 'phone') return 'Phone call'
  if (method === 'in_person') return 'In person'
  return method
}

function displayDate(value: string) {
  return new Date(value).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })
}

function interviewTitle(round: number) {
  return round === 1 ? 'First interview' : 'Second interview'
}

export default function TalentApplicationScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const [application, setApplication] = useState<any>(null)
  const [interviews, setInterviews] = useState<Interview[]>([])
  const [offer, setOffer] = useState<Offer | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState('')
  const [error, setError] = useState('')
  const [note, setNote] = useState('')
  const [alternativeFor, setAlternativeFor] = useState<string | null>(null)
  const [alternativeNote, setAlternativeNote] = useState('')

  useEffect(() => { void load() }, [id])

  async function authHeaders() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.access_token) throw new Error('Your session has expired. Please sign in again.')
    return { Authorization: `Bearer ${session.access_token}` }
  }

  async function load() {
    setLoading(true)
    setError('')
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user || !id) { router.replace('/login'); return }
      const { data: account } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle()
      if (account?.role === 'employer') { router.replace('/applications'); return }

      const { data: row, error: rowError } = await supabase.from('applications')
        .select('id,status,match_score,job_listings(job_title,location,job_type,salary_display_text,employer_profiles(property_name,company_name))')
        .eq('id', id).maybeSingle()
      if (rowError) throw rowError
      setApplication(row)

      const headers = await authHeaders()
      const response = await fetch(`${WEB_URL}/api/talent/applications/pipeline?applicationId=${encodeURIComponent(id)}`, { headers })
      const body = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(body?.error || 'Could not load application progress.')
      setInterviews(body.interviews || [])
      setOffer(body.offer || null)
      if (body.applicationStatus && row) setApplication({ ...row, status: body.applicationStatus })
    } catch (e: any) {
      setError(e?.message || 'Could not load this application.')
    } finally {
      setLoading(false)
    }
  }

  const job = useMemo(() => application ? (Array.isArray(application.job_listings) ? application.job_listings[0] : application.job_listings) : null, [application])
  const employer = useMemo(() => job ? (Array.isArray(job.employer_profiles) ? job.employer_profiles[0] : job.employer_profiles) : null, [job])
  const orderedInterviews = useMemo(() => [...interviews].sort((a, b) => a.round_number - b.round_number), [interviews])
  const firstInterview = orderedInterviews.find(item => item.round_number === 1) || null
  const secondInterview = orderedInterviews.find(item => item.round_number === 2) || null
  const completedCount = orderedInterviews.filter(item => item.status === 'completed').length

  async function post(path: string, payload: Record<string, unknown>) {
    const headers = await authHeaders()
    const response = await fetch(`${WEB_URL}${path}`, { method: 'POST', headers: { ...headers, 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    const body = await response.json().catch(() => ({}))
    if (!response.ok) throw new Error(body?.error || 'Could not update your application.')
    return body
  }

  async function chooseInterview(interview: Interview, slot: string) {
    setBusy(`interview-${interview.id}`); setError('')
    try {
      const body = await post('/api/talent/applications/interview', { action: 'confirm', interviewId: interview.id, selectedSlot: slot, note: note.trim() })
      setInterviews(current => current.map(item => item.id === interview.id ? body.interview : item))
      setApplication((current: any) => current ? { ...current, status: 'interview' } : current)
      setNote('')
      Alert.alert('Interview confirmed', 'Your interview time is confirmed. All joining or arrival details are shown in the application.')
    } catch (e: any) { setError(e.message) }
    finally { setBusy('') }
  }

  async function requestAlternative(interview: Interview) {
    if (alternativeNote.trim().length < 10) {
      Alert.alert('Tell the employer your availability', 'Add the days or times that would work for you.')
      return
    }
    setBusy(`alternative-${interview.id}`); setError('')
    try {
      const body = await post('/api/talent/applications/interview', { action: 'request_alternative', interviewId: interview.id, note: alternativeNote.trim() })
      setInterviews(current => current.map(item => item.id === interview.id ? body.interview : item))
      setAlternativeFor(null); setAlternativeNote('')
      Alert.alert('Availability sent', 'The employer has been notified and can send you new interview options.')
    } catch (e: any) { setError(e.message) }
    finally { setBusy('') }
  }

  async function respondOffer(action: 'accept' | 'decline') {
    if (!application) return
    setBusy(action); setError('')
    try {
      const body = await post('/api/talent/applications/offer', { applicationId: application.id, action, note: note.trim() })
      setOffer(body.offer || null); setApplication({ ...application, status: body.applicationStatus }); setNote('')
      Alert.alert(action === 'accept' ? 'Offer accepted' : 'Offer declined', action === 'accept' ? 'The employer has been notified. Congratulations.' : 'The employer has been notified of your decision.')
    } catch (e: any) { setError(e.message) }
    finally { setBusy('') }
  }

  async function openJoinLink(link: string) {
    try { await Linking.openURL(link) } catch { Alert.alert('Could not open link', 'Please copy the meeting link and open it in your browser or meeting app.') }
  }

  async function openDirections(address: string) {
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`
    try { await Linking.openURL(url) } catch { Alert.alert('Could not open directions', address) }
  }

  function InterviewStep({ interview, step }: { interview: Interview; step: number }) {
    const proposed = interview.status === 'proposed'
    const confirmed = interview.status === 'confirmed'
    const completed = interview.status === 'completed'
    const online = ['teams', 'google_meet', 'zoom'].includes(interview.interview_method)
    const phone = interview.interview_method === 'phone'
    const inPerson = interview.interview_method === 'in_person'
    const alternativeSent = proposed && Boolean(interview.candidate_note)

    return <View style={styles.stepCard}>
      <View style={styles.stepHeader}><View style={{ flex: 1 }}><Text style={styles.stepEyebrow}>STEP {step}</Text><Text style={styles.stepTitle}>{interviewTitle(interview.round_number)}</Text></View><View style={[styles.statusPill, (confirmed || completed) && styles.statusPillActive]}><Text style={[styles.statusPillText, (confirmed || completed) && styles.statusPillTextActive]}>{completed ? 'COMPLETED' : confirmed ? 'CONFIRMED' : alternativeSent ? 'EMPLOYER REPLY NEEDED' : 'ACTION NEEDED'}</Text></View></View>

      <Text style={styles.method}>{interviewMethod(interview.interview_method)}</Text>
      {interview.contact_name ? <Text style={styles.small}>Interviewer/contact: {interview.contact_name}</Text> : null}
      {interview.employer_note ? <View style={styles.messageBox}><Text style={styles.messageLabel}>MESSAGE FROM EMPLOYER</Text><Text style={styles.messageText}>{interview.employer_note}</Text></View> : null}

      {proposed ? <>
        <Text style={styles.actionTitle}>Choose and confirm your interview time</Text>
        <Text style={styles.copy}>Select the time that works for you. If none work, send the employer your availability instead.</Text>
        {(interview.proposed_slots || []).map(slot => <Pressable key={slot} disabled={!!busy} onPress={() => chooseInterview(interview, slot)} style={styles.slot}><Text style={styles.slotDate}>{displayDate(slot)}</Text><Text style={styles.confirmAction}>{busy === `interview-${interview.id}` ? 'Confirming…' : 'Confirm this time'}</Text></Pressable>)}
        {alternativeSent ? <View style={styles.alternativeSent}><Text style={styles.alternativeSentTitle}>Alternative times requested ✓</Text><Text style={styles.copy}>{interview.candidate_note}</Text><Text style={styles.small}>The employer can now send new options.</Text></View> : alternativeFor === interview.id ? <View style={styles.alternativeBox}><Text style={styles.label}>Tell the employer when you are available</Text><TextInput value={alternativeNote} onChangeText={setAlternativeNote} multiline style={styles.altInput} placeholder="For example: Tuesday after 2pm, Wednesday morning or Thursday after 4pm…" placeholderTextColor={palette.quiet}/><Pressable disabled={!!busy} onPress={() => requestAlternative(interview)} style={styles.altSend}><Text style={styles.altSendText}>{busy === `alternative-${interview.id}` ? 'Sending…' : 'Send my availability'}</Text></Pressable><Pressable onPress={() => { setAlternativeFor(null); setAlternativeNote('') }} style={styles.altCancel}><Text style={styles.altCancelText}>Cancel</Text></Pressable></View> : <Pressable onPress={() => setAlternativeFor(interview.id)} style={styles.noneButton}><Text style={styles.noneButtonText}>None of these times work</Text></Pressable>}
      </> : interview.selected_slot ? <View style={styles.confirmedBox}><Text style={styles.confirmedEyebrow}>{completed ? 'INTERVIEW COMPLETED' : 'INTERVIEW CONFIRMED'}</Text><Text style={styles.confirmedDate}>{displayDate(interview.selected_slot)}</Text><Text style={styles.confirmedCopy}>{completed ? 'Your interview is complete. The employer will now decide the next step.' : 'You are booked in. Your interview logistics are below.'}</Text></View> : null}

      {(confirmed || completed) && online && interview.meeting_link ? <Pressable onPress={() => openJoinLink(interview.meeting_link!)} style={styles.logisticsButton}><Text style={styles.logisticsButtonText}>Join {interviewMethod(interview.interview_method)}</Text><Text style={styles.logisticsArrow}>↗</Text></Pressable> : null}
      {(confirmed || completed) && inPerson && interview.venue_address ? <><View style={styles.logisticsCard}><Text style={styles.logisticsLabel}>INTERVIEW LOCATION</Text><Text style={styles.logisticsText}>{interview.venue_address}</Text></View><Pressable onPress={() => openDirections(interview.venue_address!)} style={styles.logisticsButton}><Text style={styles.logisticsButtonText}>Open directions</Text><Text style={styles.logisticsArrow}>↗</Text></Pressable></> : null}
      {(confirmed || completed) && phone && interview.meeting_link ? <View style={styles.logisticsCard}><Text style={styles.logisticsLabel}>PHONE INSTRUCTIONS</Text><Text style={styles.logisticsText}>{interview.meeting_link}</Text></View> : null}

      {interview.preparation_required ? <><Text style={styles.label}>Preparation</Text><Text style={styles.copy}>{interview.preparation_required}</Text></> : null}
      {interview.assessment_type ? <><Text style={styles.label}>Assessment</Text><Text style={styles.copy}>{[interview.assessment_type, interview.assessment_details].filter(Boolean).join(' · ')}</Text></> : null}
    </View>
  }

  if (loading) return <View style={styles.center}><ActivityIndicator color={palette.ink} /></View>
  if (!application) return <View style={styles.center}><Text style={styles.error}>{error || 'Application not found.'}</Text></View>

  const applicationClosed = ['rejected', 'withdrawn'].includes(application.status)
  const awaitingDecision = completedCount > 0 && !secondInterview && !offer && !applicationClosed

  return <ScrollView style={styles.scroll} contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled">
    <Pressable onPress={() => router.back()} style={styles.backButton}><Text style={styles.back}>‹ Applications</Text></Pressable>
    <Text style={styles.eyebrow}>YOUR APPLICATION</Text><Text style={styles.title}>{job?.job_title || 'Role'}</Text><Text style={styles.meta}>{[employer?.property_name || employer?.company_name, job?.location].filter(Boolean).join(' · ')}</Text>
    <View style={styles.stageBox}><View style={{flex:1}}><Text style={styles.stageLabel}>CURRENT STAGE</Text><Text style={styles.stage}>{stageLabel(application.status)}</Text></View>{application.match_score ? <View style={styles.matchPill}><Text style={styles.match}>{application.match_score}%</Text><Text style={styles.matchLabel}>MATCH</Text></View> : null}</View>

    <View style={styles.receivedCard}><View style={styles.receivedIcon}><Text style={styles.receivedTick}>✓</Text></View><View style={{ flex: 1 }}><Text style={styles.stepEyebrow}>STEP 1</Text><Text style={styles.receivedTitle}>Application received</Text><Text style={styles.receivedCopy}>We’ve received your application and the hiring team is reviewing it. You’ll get a separate interview invitation here if they would like to move forward.</Text></View></View>

    {firstInterview ? <InterviewStep interview={firstInterview} step={2} /> : !applicationClosed && !offer ? <View style={styles.waitingCard}><Text style={styles.waitingEyebrow}>WHAT HAPPENS NEXT</Text><Text style={styles.waitingTitle}>Your application is under review.</Text><Text style={styles.copy}>There is nothing you need to do right now. If the employer wants to progress your application, your first interview invitation and available times will appear here.</Text></View> : null}
    {awaitingDecision ? <View style={styles.waitingCard}><Text style={styles.waitingEyebrow}>NEXT STEP</Text><Text style={styles.waitingTitle}>Awaiting employer decision</Text><Text style={styles.copy}>Your first interview is complete. The employer can now make an offer, close the application, or invite you to a second interview if they need another stage.</Text></View> : null}
    {secondInterview ? <InterviewStep interview={secondInterview} step={3} /> : null}

    {offer ? <View style={styles.offerCard}><Text style={styles.offerEyebrow}>{secondInterview ? 'FINAL STEP' : 'NEXT STEP'}</Text><Text style={styles.offerTitle}>{offer.status === 'offered' ? 'You have a job offer.' : offer.status === 'accepted' ? 'Offer accepted.' : 'Offer update.'}</Text><Text style={styles.offerStatus}>{offer.status === 'offered' ? 'OFFER RECEIVED' : offer.status.toUpperCase()}</Text>{offer.employer_note ? <Text style={styles.offerNote}>{offer.employer_note}</Text> : null}{offer.status === 'offered' ? <><Text style={styles.offerLabel}>Optional note to employer</Text><TextInput value={note} onChangeText={setNote} multiline style={styles.textarea} placeholder="Add a short response if you wish…" placeholderTextColor="#AEBBC1"/><Pressable disabled={!!busy} onPress={() => respondOffer('accept')} style={styles.acceptButton}><Text style={styles.acceptButtonText}>{busy === 'accept' ? 'Sending…' : 'Accept job offer'}</Text></Pressable><Pressable disabled={!!busy} onPress={() => respondOffer('decline')} style={styles.declineButton}><Text style={styles.declineText}>{busy === 'decline' ? 'Sending…' : 'Decline offer'}</Text></Pressable></> : offer.candidate_note ? <Text style={styles.offerSmall}>Your response: {offer.candidate_note}</Text> : null}</View> : null}

    {application.status === 'rejected' ? <View style={styles.closedCard}><Text style={styles.closedEyebrow}>APPLICATION CLOSED</Text><Text style={styles.closedTitle}>Not progressing on this occasion</Text><Text style={styles.copy}>This application has now closed. Any message from the employer remains in your application history.</Text></View> : null}
    {application.status === 'withdrawn' ? <View style={styles.closedCard}><Text style={styles.closedEyebrow}>APPLICATION WITHDRAWN</Text><Text style={styles.closedTitle}>You withdrew from this role</Text><Text style={styles.copy}>This application is no longer active.</Text></View> : null}
    {error ? <View style={styles.errorCard}><Text style={styles.error}>{error}</Text></View> : null}
  </ScrollView>
}

const styles = StyleSheet.create({
  scroll:{flex:1,backgroundColor:palette.stone},page:{paddingHorizontal:space.page,paddingTop:18,paddingBottom:118},center:{flex:1,alignItems:'center',justifyContent:'center',padding:28,backgroundColor:palette.stone},backButton:{alignSelf:'flex-start',paddingVertical:6,marginBottom:22},back:{color:palette.muted,fontSize:13,fontFamily:type.sans},eyebrow:{color:palette.quiet,fontSize:8,letterSpacing:2.1,marginBottom:9,fontWeight:'700',fontFamily:type.sans},title:{color:palette.inkStrong,fontSize:34,lineHeight:40,fontWeight:'400',fontFamily:type.serif},meta:{color:palette.muted,fontSize:11.5,lineHeight:18,marginTop:7,fontFamily:type.sans},stageBox:{backgroundColor:palette.inkStrong,padding:18,marginTop:22,borderRadius:radius.large,flexDirection:'row',alignItems:'center',gap:12},stageLabel:{color:'#CBD5D9',fontSize:7.5,letterSpacing:1.3,fontWeight:'700',fontFamily:type.sans},stage:{color:palette.paper,fontSize:20,lineHeight:25,fontWeight:'400',fontFamily:type.serif,marginTop:5},matchPill:{backgroundColor:palette.paper,paddingHorizontal:10,paddingVertical:8,borderRadius:radius.medium,alignItems:'center'},match:{color:palette.inkStrong,fontSize:15,fontWeight:'800',fontFamily:type.sans},matchLabel:{color:palette.quiet,fontSize:6.5,letterSpacing:.8,fontWeight:'800',marginTop:1,fontFamily:type.sans},receivedCard:{backgroundColor:palette.paper,borderWidth:1,borderColor:palette.line,padding:17,borderRadius:radius.large,marginTop:18,flexDirection:'row',gap:13},receivedIcon:{width:30,height:30,borderRadius:15,backgroundColor:palette.sageSoft,alignItems:'center',justifyContent:'center'},receivedTick:{color:palette.sage,fontSize:16,fontWeight:'800'},stepEyebrow:{color:palette.quiet,fontSize:7.5,letterSpacing:1.4,fontWeight:'700',fontFamily:type.sans},receivedTitle:{color:palette.inkStrong,fontSize:20,lineHeight:25,fontWeight:'400',fontFamily:type.serif,marginTop:3},receivedCopy:{color:palette.muted,fontSize:11.5,lineHeight:18,fontFamily:type.sans,marginTop:6},waitingCard:{backgroundColor:palette.paper,borderWidth:1,borderColor:palette.line,padding:17,borderRadius:radius.large,marginTop:12},waitingEyebrow:{color:palette.quiet,fontSize:7.5,letterSpacing:1.4,fontWeight:'700',fontFamily:type.sans},waitingTitle:{color:palette.inkStrong,fontSize:19,lineHeight:24,fontWeight:'400',fontFamily:type.serif,marginTop:4,marginBottom:7},stepCard:{backgroundColor:palette.paper,borderWidth:1,borderColor:palette.line,padding:17,borderRadius:radius.large,marginTop:12},stepHeader:{flexDirection:'row',justifyContent:'space-between',gap:12,alignItems:'flex-start'},stepTitle:{color:palette.inkStrong,fontSize:22,lineHeight:27,fontWeight:'400',fontFamily:type.serif,marginTop:4},statusPill:{backgroundColor:'#F4EEE1',paddingHorizontal:8,paddingVertical:5,borderRadius:999},statusPillActive:{backgroundColor:palette.sageSoft},statusPillText:{color:'#7A6845',fontSize:7,fontWeight:'800',letterSpacing:.7,fontFamily:type.sans},statusPillTextActive:{color:palette.sage},method:{color:palette.text,fontSize:11,fontWeight:'700',fontFamily:type.sans,marginTop:8},messageBox:{backgroundColor:palette.stone,padding:13,borderRadius:radius.medium,marginTop:12},messageLabel:{color:palette.quiet,fontSize:7,letterSpacing:1.1,fontWeight:'800',fontFamily:type.sans},messageText:{color:palette.text,fontSize:11.5,lineHeight:18,fontFamily:type.sans,marginTop:5},actionTitle:{color:palette.inkStrong,fontSize:15,fontWeight:'700',fontFamily:type.sans,marginTop:16,marginBottom:4},copy:{color:palette.muted,fontSize:11.5,lineHeight:18,fontFamily:type.sans},slot:{borderWidth:1,borderColor:palette.lineStrong,padding:13,marginTop:9,backgroundColor:palette.paper,borderRadius:radius.medium},slotDate:{color:palette.inkStrong,fontSize:12,fontWeight:'700',fontFamily:type.sans},confirmAction:{color:palette.sage,fontSize:10,fontWeight:'800',fontFamily:type.sans,marginTop:5},noneButton:{borderWidth:1,borderColor:palette.lineStrong,padding:13,alignItems:'center',borderRadius:radius.medium,marginTop:11},noneButtonText:{color:palette.ink,fontSize:10.5,fontWeight:'700'},alternativeBox:{backgroundColor:palette.stone,padding:13,borderRadius:radius.medium,marginTop:11},altInput:{borderWidth:1,borderColor:palette.line,minHeight:90,padding:11,textAlignVertical:'top',color:palette.text,backgroundColor:palette.paper,borderRadius:radius.medium,fontSize:11},altSend:{backgroundColor:palette.inkStrong,paddingVertical:12,alignItems:'center',borderRadius:radius.medium,marginTop:9},altSendText:{color:palette.paper,fontSize:10.5,fontWeight:'700'},altCancel:{paddingVertical:10,alignItems:'center'},altCancelText:{color:palette.muted,fontSize:10.5},alternativeSent:{backgroundColor:palette.sageSoft,padding:13,borderRadius:radius.medium,marginTop:11},alternativeSentTitle:{color:palette.sage,fontSize:10.5,fontWeight:'800',marginBottom:5},confirmedBox:{backgroundColor:palette.sageSoft,padding:14,marginTop:14,borderRadius:radius.medium},confirmedEyebrow:{color:palette.sage,fontSize:7.5,fontWeight:'800',letterSpacing:1.1,fontFamily:type.sans},confirmedDate:{color:palette.inkStrong,fontSize:13,fontWeight:'700',marginTop:4,fontFamily:type.sans},confirmedCopy:{color:palette.muted,fontSize:10.5,lineHeight:16,marginTop:6,fontFamily:type.sans},logisticsCard:{backgroundColor:palette.stone,padding:13,borderRadius:radius.medium,marginTop:11},logisticsLabel:{color:palette.quiet,fontSize:7.5,letterSpacing:1,fontWeight:'800'},logisticsText:{color:palette.text,fontSize:11.5,lineHeight:18,marginTop:5},logisticsButton:{backgroundColor:palette.inkStrong,paddingHorizontal:14,paddingVertical:13,borderRadius:radius.medium,marginTop:11,flexDirection:'row',justifyContent:'space-between',alignItems:'center'},logisticsButtonText:{color:palette.paper,fontSize:11,fontWeight:'800'},logisticsArrow:{color:palette.paper,fontSize:15},label:{color:palette.text,fontSize:9.5,fontWeight:'700',marginTop:15,marginBottom:6,fontFamily:type.sans},small:{color:palette.muted,fontSize:10,lineHeight:16,marginTop:8,fontFamily:type.sans},offerCard:{backgroundColor:palette.inkStrong,padding:18,borderRadius:radius.large,marginTop:14},offerEyebrow:{color:'#CBD5D9',fontSize:7.5,letterSpacing:1.3,fontWeight:'700',fontFamily:type.sans},offerTitle:{color:palette.paper,fontSize:22,lineHeight:27,fontWeight:'400',fontFamily:type.serif,marginTop:5},offerStatus:{color:'#DCE4E7',fontSize:8,fontWeight:'800',letterSpacing:1.2,marginTop:8,fontFamily:type.sans},offerNote:{color:'#DCE4E7',fontSize:11,lineHeight:18,marginTop:10,fontFamily:type.sans},offerLabel:{color:'#DCE4E7',fontSize:9.5,fontWeight:'700',marginTop:16,marginBottom:6,fontFamily:type.sans},textarea:{borderWidth:1,borderColor:'rgba(255,255,255,.22)',minHeight:90,padding:12,textAlignVertical:'top',color:palette.paper,fontSize:11,backgroundColor:'rgba(255,255,255,.06)',borderRadius:radius.medium,fontFamily:type.sans},acceptButton:{backgroundColor:palette.paper,paddingVertical:14,alignItems:'center',borderRadius:radius.medium,marginTop:13},acceptButtonText:{color:palette.inkStrong,fontSize:11,fontWeight:'800',fontFamily:type.sans},declineButton:{borderWidth:1,borderColor:'rgba(255,255,255,.28)',paddingVertical:13,alignItems:'center',borderRadius:radius.medium,marginTop:9},declineText:{color:palette.paper,fontSize:10.5,fontWeight:'700',fontFamily:type.sans},offerSmall:{color:'#DCE4E7',fontSize:10.5,lineHeight:17,marginTop:12,fontFamily:type.sans},closedCard:{backgroundColor:palette.paper,borderWidth:1,borderColor:palette.line,padding:17,borderRadius:radius.large,marginTop:12},closedEyebrow:{color:palette.quiet,fontSize:7.5,letterSpacing:1.3,fontWeight:'700',fontFamily:type.sans},closedTitle:{color:palette.inkStrong,fontSize:19,lineHeight:24,fontWeight:'400',fontFamily:type.serif,marginTop:4,marginBottom:7},errorCard:{backgroundColor:'#FFF3F3',borderWidth:1,borderColor:'#E9CACA',padding:13,borderRadius:radius.medium,marginTop:12},error:{color:palette.danger,fontSize:11,lineHeight:17,fontFamily:type.sans}
})