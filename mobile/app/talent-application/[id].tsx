import { useEffect, useMemo, useState } from 'react'
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
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
    pending: 'Applied', reviewed: 'Reviewed', shortlisted: 'Shortlisted', interview: 'Interview', offered: 'Offer received', accepted: 'Accepted', rejected: 'Not progressing', withdrawn: 'Withdrawn',
  }
  return labels[status] || status.replaceAll('_', ' ')
}

function interviewMethod(method: string) {
  if (method === 'teams') return 'Microsoft Teams'
  if (method === 'video') return 'Video call'
  if (method === 'phone') return 'Phone call'
  if (method === 'in_person') return 'In person'
  return method
}

function displayDate(value: string) {
  return new Date(value).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })
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

  useEffect(() => { load() }, [id])

  async function authHeaders() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.access_token) throw new Error('Your session has expired. Please sign in again.')
    return { Authorization: `Bearer ${session.access_token}` }
  }

  async function load() {
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
    }
    setLoading(false)
  }

  const job = useMemo(() => application ? (Array.isArray(application.job_listings) ? application.job_listings[0] : application.job_listings) : null, [application])
  const employer = useMemo(() => job ? (Array.isArray(job.employer_profiles) ? job.employer_profiles[0] : job.employer_profiles) : null, [job])

  async function post(path: string, payload: Record<string, unknown>) {
    const headers = await authHeaders()
    const response = await fetch(`${WEB_URL}${path}`, {
      method: 'POST', headers: { ...headers, 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
    })
    const body = await response.json().catch(() => ({}))
    if (!response.ok) throw new Error(body?.error || 'Could not update your application.')
    return body
  }

  async function chooseInterview(interview: Interview, slot: string) {
    setBusy(`interview-${interview.id}`); setError('')
    try {
      const body = await post('/api/talent/applications/interview', { interviewId: interview.id, selectedSlot: slot, note: note.trim() })
      setInterviews(current => current.map(item => item.id === interview.id ? body.interview : item))
      setApplication((current: any) => current ? { ...current, status: 'interview' } : current)
      Alert.alert('Interview confirmed', 'The employer has been notified of your chosen time.')
    } catch (e: any) { setError(e.message) }
    setBusy('')
  }

  async function respondOffer(action: 'accept' | 'decline') {
    if (!application) return
    setBusy(action); setError('')
    try {
      const body = await post('/api/talent/applications/offer', { applicationId: application.id, action, note: note.trim() })
      setOffer(body.offer || null)
      setApplication({ ...application, status: body.applicationStatus })
      Alert.alert(action === 'accept' ? 'Offer accepted' : 'Offer declined', action === 'accept' ? 'The employer has been notified. Congratulations.' : 'The employer has been notified of your decision.')
    } catch (e: any) { setError(e.message) }
    setBusy('')
  }

  if (loading) return <View style={styles.center}><ActivityIndicator color={palette.ink} /></View>
  if (!application) return <View style={styles.center}><Text style={styles.error}>{error || 'Application not found.'}</Text></View>

  return <ScrollView style={styles.scroll} contentContainerStyle={styles.page}>
    <Pressable onPress={() => router.back()} style={styles.backButton}><Text style={styles.back}>‹ Applications</Text></Pressable>
    <Text style={styles.eyebrow}>YOUR APPLICATION</Text>
    <Text style={styles.title}>{job?.job_title || 'Role'}</Text>
    <Text style={styles.meta}>{[employer?.property_name || employer?.company_name, job?.location].filter(Boolean).join(' · ')}</Text>

    <View style={styles.stageBox}>
      <View style={{flex:1}}><Text style={styles.stageLabel}>CURRENT STAGE</Text><Text style={styles.stage}>{stageLabel(application.status)}</Text></View>
      {application.match_score ? <View style={styles.matchPill}><Text style={styles.match}>{application.match_score}%</Text><Text style={styles.matchLabel}>MATCH</Text></View> : null}
    </View>

    {interviews.map(interview => <View key={interview.id} style={styles.sectionCard}>
      <View style={styles.sectionHeader}><View><Text style={styles.sectionEyebrow}>INTERVIEW {interview.round_number}</Text><Text style={styles.sectionTitle}>{interviewMethod(interview.interview_method)}</Text></View><View style={styles.statusPill}><Text style={styles.statusPillText}>{interview.status.toUpperCase()}</Text></View></View>
      {interview.employer_note ? <Text style={styles.note}>{interview.employer_note}</Text> : null}
      {interview.preparation_required ? <><Text style={styles.label}>Preparation</Text><Text style={styles.copy}>{interview.preparation_required}</Text></> : null}
      {interview.assessment_type ? <><Text style={styles.label}>Assessment</Text><Text style={styles.copy}>{[interview.assessment_type, interview.assessment_details].filter(Boolean).join(' · ')}</Text></> : null}
      {interview.status === 'proposed' ? <>
        <Text style={styles.label}>Choose your interview time</Text>
        {(interview.proposed_slots || []).map(slot => <Pressable key={slot} disabled={!!busy} onPress={() => chooseInterview(interview, slot)} style={styles.slot}><Text style={styles.slotText}>{displayDate(slot)}</Text><Text style={styles.choose}>Choose →</Text></Pressable>)}
      </> : interview.selected_slot ? <View style={styles.confirmed}><Text style={styles.confirmedEyebrow}>CONFIRMED</Text><Text style={styles.confirmedDate}>{displayDate(interview.selected_slot)}</Text></View> : null}
      {interview.meeting_link ? <Text style={styles.small}>Meeting link: {interview.meeting_link}</Text> : null}
      {interview.venue_address ? <Text style={styles.small}>Venue: {interview.venue_address}</Text> : null}
      {interview.contact_name ? <Text style={styles.small}>Contact: {interview.contact_name}</Text> : null}
    </View>)}

    {offer ? <View style={styles.offerCard}>
      <Text style={styles.offerEyebrow}>JOB OFFER</Text>
      <Text style={styles.offerTitle}>{offer.status === 'offered' ? 'You have an offer.' : offer.status === 'accepted' ? 'Offer accepted.' : 'Offer update.'}</Text>
      <Text style={styles.offerStatus}>{offer.status === 'offered' ? 'OFFER RECEIVED' : offer.status.toUpperCase()}</Text>
      {offer.employer_note ? <Text style={styles.offerNote}>{offer.employer_note}</Text> : null}
      {offer.status === 'offered' ? <>
        <Text style={styles.offerLabel}>Optional note to employer</Text>
        <TextInput value={note} onChangeText={setNote} multiline style={styles.textarea} placeholder="Add a short response if you wish..." placeholderTextColor={palette.quiet} />
        <Pressable disabled={!!busy} onPress={() => respondOffer('accept')} style={styles.primary}><Text style={styles.primaryText}>{busy === 'accept' ? 'Sending...' : 'Accept offer'}</Text></Pressable>
        <Pressable disabled={!!busy} onPress={() => respondOffer('decline')} style={styles.secondary}><Text style={styles.declineText}>{busy === 'decline' ? 'Sending...' : 'Decline offer'}</Text></Pressable>
      </> : offer.candidate_note ? <Text style={styles.offerSmall}>Your response: {offer.candidate_note}</Text> : null}
    </View> : null}

    {!interviews.length && !offer ? <View style={styles.empty}><Text style={styles.emptyEyebrow}>APPLICATION ACTIVE</Text><Text style={styles.emptyTitle}>Application submitted.</Text><Text style={styles.copy}>Any shortlist, interview or offer updates will appear here and in your notifications.</Text></View> : null}
    {error ? <View style={styles.errorCard}><Text style={styles.error}>{error}</Text></View> : null}
  </ScrollView>
}

const styles = StyleSheet.create({
  scroll:{flex:1,backgroundColor:palette.stone},
  page:{paddingHorizontal:space.page,paddingTop:18,paddingBottom:118},
  center:{flex:1,alignItems:'center',justifyContent:'center',padding:28,backgroundColor:palette.stone},
  backButton:{alignSelf:'flex-start',paddingVertical:6,marginBottom:22},
  back:{color:palette.muted,fontSize:13,fontFamily:type.sans},
  eyebrow:{color:palette.quiet,fontSize:8,letterSpacing:2.1,marginBottom:9,fontWeight:'700',fontFamily:type.sans},
  title:{color:palette.inkStrong,fontSize:34,lineHeight:40,fontWeight:'400',fontFamily:type.serif},
  meta:{color:palette.muted,fontSize:11.5,lineHeight:18,marginTop:7,fontFamily:type.sans},
  stageBox:{backgroundColor:palette.inkStrong,padding:18,marginTop:22,borderRadius:radius.large,flexDirection:'row',alignItems:'center',gap:12},
  stageLabel:{color:'#CBD5D9',fontSize:7.5,letterSpacing:1.3,fontWeight:'700',fontFamily:type.sans},
  stage:{color:palette.paper,fontSize:20,lineHeight:25,fontWeight:'400',fontFamily:type.serif,marginTop:5},
  matchPill:{backgroundColor:palette.paper,paddingHorizontal:10,paddingVertical:8,borderRadius:radius.medium,alignItems:'center'},
  match:{color:palette.inkStrong,fontSize:15,fontWeight:'800',fontFamily:type.sans},
  matchLabel:{color:palette.quiet,fontSize:6.5,letterSpacing:.8,fontWeight:'800',marginTop:1,fontFamily:type.sans},
  sectionCard:{backgroundColor:palette.paper,borderWidth:1,borderColor:palette.line,padding:17,borderRadius:radius.large,marginTop:12},
  sectionHeader:{flexDirection:'row',justifyContent:'space-between',gap:12,alignItems:'flex-start'},
  sectionEyebrow:{color:palette.quiet,fontSize:7.5,letterSpacing:1.3,fontWeight:'700',fontFamily:type.sans},
  sectionTitle:{color:palette.inkStrong,fontSize:20,lineHeight:25,fontWeight:'400',fontFamily:type.serif,marginTop:4},
  statusPill:{backgroundColor:palette.stoneDeep,paddingHorizontal:8,paddingVertical:5,borderRadius:999},
  statusPillText:{color:palette.quiet,fontSize:7,fontWeight:'800',letterSpacing:.7,fontFamily:type.sans},
  label:{color:palette.text,fontSize:9.5,fontWeight:'700',marginTop:15,marginBottom:6,fontFamily:type.sans},
  copy:{color:palette.muted,fontSize:11.5,lineHeight:18,fontFamily:type.sans},
  note:{color:palette.muted,fontSize:11.5,lineHeight:18,marginTop:12,fontFamily:type.sans},
  slot:{borderWidth:1,borderColor:palette.lineStrong,padding:13,marginTop:8,flexDirection:'row',justifyContent:'space-between',gap:12,backgroundColor:palette.stone,borderRadius:radius.medium},
  slotText:{color:palette.inkStrong,fontSize:10.5,fontWeight:'700',fontFamily:type.sans},
  choose:{color:palette.ink,fontSize:10,fontWeight:'700',fontFamily:type.sans},
  confirmed:{backgroundColor:palette.sageSoft,padding:14,marginTop:12,borderRadius:radius.medium},
  confirmedEyebrow:{color:palette.sage,fontSize:7.5,fontWeight:'800',letterSpacing:1.1,fontFamily:type.sans},
  confirmedDate:{color:palette.inkStrong,fontSize:12,fontWeight:'700',marginTop:4,fontFamily:type.sans},
  small:{color:palette.muted,fontSize:10,lineHeight:16,marginTop:8,fontFamily:type.sans},
  offerCard:{backgroundColor:palette.inkStrong,padding:18,borderRadius:radius.large,marginTop:14},
  offerEyebrow:{color:'#CBD5D9',fontSize:7.5,letterSpacing:1.3,fontWeight:'700',fontFamily:type.sans},
  offerTitle:{color:palette.paper,fontSize:22,lineHeight:27,fontWeight:'400',fontFamily:type.serif,marginTop:5},
  offerStatus:{color:'#DCE4E7',fontSize:8,fontWeight:'800',letterSpacing:1.2,marginTop:8,fontFamily:type.sans},
  offerNote:{color:'#DCE4E7',fontSize:11,lineHeight:18,marginTop:10,fontFamily:type.sans},
  offerLabel:{color:'#DCE4E7',fontSize:9.5,fontWeight:'700',marginTop:16,marginBottom:6,fontFamily:type.sans},
  textarea:{borderWidth:1,borderColor:'rgba(255,255,255,.22)',minHeight:90,padding:12,textAlignVertical:'top',color:palette.paper,fontSize:11,backgroundColor:'rgba(255,255,255,.06)',borderRadius:radius.medium,fontFamily:type.sans},
  primary:{backgroundColor:palette.paper,paddingVertical:14,alignItems:'center',marginTop:13,borderRadius:radius.medium},
  primaryText:{color:palette.inkStrong,fontSize:10.5,fontWeight:'800',fontFamily:type.sans},
  secondary:{borderWidth:1,borderColor:'rgba(255,255,255,.26)',paddingVertical:13,alignItems:'center',marginTop:9,borderRadius:radius.medium},
  declineText:{color:'#F1D8D8',fontSize:10.5,fontWeight:'700',fontFamily:type.sans},
  offerSmall:{color:'#DCE4E7',fontSize:10,lineHeight:16,marginTop:10,fontFamily:type.sans},
  empty:{backgroundColor:palette.paper,borderWidth:1,borderColor:palette.line,padding:18,marginTop:14,borderRadius:radius.large},
  emptyEyebrow:{color:palette.quiet,fontSize:7.5,letterSpacing:1.2,fontWeight:'700',fontFamily:type.sans},
  emptyTitle:{color:palette.inkStrong,fontSize:19,lineHeight:24,fontWeight:'400',fontFamily:type.serif,marginTop:5,marginBottom:6},
  errorCard:{backgroundColor:palette.dangerSoft,padding:13,borderRadius:radius.medium,marginTop:14},
  error:{color:palette.danger,fontSize:10.5,lineHeight:17,fontFamily:type.sans}
})
