import { useEffect, useMemo, useState } from 'react'
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { supabase } from '../../src/lib/supabase'

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

  async function requestAlternative(interview: Interview) {
    if (note.trim().length < 10) {
      Alert.alert('Add your availability first', 'Use the note box below the offer times to say when you ARE available, then request alternatives.')
      return
    }
    setBusy(`alt-${interview.id}`); setError('')
    try {
      await post('/api/talent/applications/interview', { interviewId: interview.id, action: 'request_alternative', note: note.trim() })
      Alert.alert('Request sent', 'The property has been asked to offer new interview times.')
      setNote('')
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

  if (loading) return <View style={styles.center}><ActivityIndicator color="#092b45" /></View>
  if (!application) return <View style={styles.center}><Text style={styles.error}>{error || 'Application not found.'}</Text></View>

  return <ScrollView style={styles.scroll} contentContainerStyle={styles.page}>
    <Pressable onPress={() => router.back()}><Text style={styles.back}>‹ Applications</Text></Pressable>
    <Text style={styles.eyebrow}>YOUR APPLICATION</Text>
    <Text style={styles.title}>{job?.job_title || 'Role'}</Text>
    <Text style={styles.meta}>{[employer?.property_name || employer?.company_name, job?.location].filter(Boolean).join(' · ')}</Text>
    <View style={styles.stageBox}><Text style={styles.stageLabel}>CURRENT STAGE</Text><Text style={styles.stage}>{offer?.status==='declined'&&application.status==='rejected'?'Offer declined by you':stageLabel(application.status)}</Text>{application.match_score ? <Text style={styles.match}>{application.match_score}% match</Text> : null}</View>

    {interviews.map(interview => <View key={interview.id} style={styles.section}>
      <Text style={styles.sectionTitle}>Interview {interview.round_number}</Text>
      <Text style={styles.copy}>{interviewMethod(interview.interview_method)}</Text>
      {interview.employer_note ? <Text style={styles.note}>{interview.employer_note}</Text> : null}
      {interview.preparation_required ? <><Text style={styles.label}>Preparation</Text><Text style={styles.copy}>{interview.preparation_required}</Text></> : null}
      {interview.assessment_type ? <><Text style={styles.label}>Assessment</Text><Text style={styles.copy}>{[interview.assessment_type, interview.assessment_details].filter(Boolean).join(' · ')}</Text></> : null}
      {interview.status === 'proposed' ? <>
        <Text style={styles.label}>Choose your interview time</Text>
        {(interview.proposed_slots || []).map(slot => <Pressable key={slot} disabled={!!busy} onPress={() => chooseInterview(interview, slot)} style={styles.slot}><Text style={styles.slotText}>{displayDate(slot)}</Text><Text style={styles.choose}>Choose →</Text></Pressable>)}
        <Text style={styles.label}>None of these times work?</Text>
        <TextInput value={note} onChangeText={setNote} multiline style={styles.textarea} placeholder="Tell the property when you are available..." />
        <Pressable disabled={!!busy} onPress={() => requestAlternative(interview)} style={styles.secondary}><Text style={styles.altText}>{busy === `alt-${interview.id}` ? 'Sending...' : 'Request alternative times'}</Text></Pressable>
      </> : interview.selected_slot ? <View style={styles.confirmed}><Text style={styles.confirmedTitle}>Confirmed</Text><Text style={styles.copy}>{displayDate(interview.selected_slot)}</Text></View> : null}
      {interview.meeting_link ? <Text style={styles.small}>Meeting link: {interview.meeting_link}</Text> : null}
      {interview.venue_address ? <Text style={styles.small}>Venue: {interview.venue_address}</Text> : null}
      {interview.contact_name ? <Text style={styles.small}>Contact: {interview.contact_name}</Text> : null}
    </View>)}

    {offer ? <View style={styles.section}>
      <Text style={styles.sectionTitle}>Job offer</Text>
      <Text style={styles.offerStatus}>{offer.status === 'offered' ? 'OFFER RECEIVED' : offer.status.toUpperCase()}</Text>
      {offer.employer_note ? <Text style={styles.note}>{offer.employer_note}</Text> : null}
      {offer.status === 'offered' ? <>
        <Text style={styles.label}>Optional note to employer</Text>
        <TextInput value={note} onChangeText={setNote} multiline style={styles.textarea} placeholder="Add a short response if you wish..." />
        <Pressable disabled={!!busy} onPress={() => respondOffer('accept')} style={styles.primary}><Text style={styles.primaryText}>{busy === 'accept' ? 'Sending...' : 'Accept offer'}</Text></Pressable>
        <Pressable disabled={!!busy} onPress={() => respondOffer('decline')} style={styles.secondary}><Text style={styles.declineText}>{busy === 'decline' ? 'Sending...' : 'Decline offer'}</Text></Pressable>
      </> : offer.candidate_note ? <Text style={styles.small}>Your response: {offer.candidate_note}</Text> : null}
    </View> : null}

    {!interviews.length && !offer ? <View style={styles.empty}><Text style={styles.emptyTitle}>Application submitted.</Text><Text style={styles.copy}>Any shortlist, interview or offer updates will appear here and in your notifications.</Text></View> : null}
    {error ? <Text style={styles.error}>{error}</Text> : null}
  </ScrollView>
}

const styles = StyleSheet.create({
  scroll:{flex:1,backgroundColor:'#fff'},page:{paddingHorizontal:22,paddingTop:64,paddingBottom:48},center:{flex:1,alignItems:'center',justifyContent:'center',padding:28,backgroundColor:'#fff'},back:{color:'#66747c',fontSize:13,marginBottom:34},eyebrow:{color:'#71808a',fontSize:9,letterSpacing:2.1,marginBottom:10},title:{color:'#092b45',fontSize:29,lineHeight:35,fontWeight:'500'},meta:{color:'#71808a',fontSize:12,lineHeight:18,marginTop:7},stageBox:{backgroundColor:'#f4f7f8',padding:18,marginTop:24},stageLabel:{color:'#71808a',fontSize:8,letterSpacing:1.4},stage:{color:'#173246',fontSize:19,fontWeight:'600',marginTop:5},match:{color:'#526976',fontSize:11,marginTop:6},section:{borderTopWidth:1,borderTopColor:'#e3e8eb',paddingTop:22,marginTop:26},sectionTitle:{color:'#173246',fontSize:18,fontWeight:'600',marginBottom:8},label:{color:'#173246',fontSize:11,fontWeight:'700',marginTop:16,marginBottom:7},copy:{color:'#66747c',fontSize:13,lineHeight:20},note:{color:'#526976',fontSize:13,lineHeight:20,marginTop:10},slot:{borderWidth:1,borderColor:'#d7e0e4',padding:14,marginTop:8,flexDirection:'row',justifyContent:'space-between',gap:12},slotText:{color:'#173246',fontSize:12,fontWeight:'600'},choose:{color:'#092b45',fontSize:11,fontWeight:'700'},confirmed:{backgroundColor:'#f4f7f8',padding:14,marginTop:12},confirmedTitle:{color:'#092b45',fontSize:10,fontWeight:'700',letterSpacing:1.2,marginBottom:4},small:{color:'#71808a',fontSize:11,lineHeight:17,marginTop:8},offerStatus:{color:'#092b45',fontSize:10,fontWeight:'700',letterSpacing:1.2},textarea:{borderWidth:1,borderColor:'#d7e0e4',minHeight:90,padding:12,textAlignVertical:'top',color:'#173246',fontSize:12},primary:{backgroundColor:'#092b45',paddingVertical:15,alignItems:'center',marginTop:14},primaryText:{color:'#fff',fontSize:12,fontWeight:'700'},secondary:{borderWidth:1,borderColor:'#d7e0e4',paddingVertical:14,alignItems:'center',marginTop:10},declineText:{color:'#7c3f3f',fontSize:12,fontWeight:'600'},altText:{color:'#9c7a42',fontSize:12,fontWeight:'700'},empty:{backgroundColor:'#f4f7f8',padding:18,marginTop:28},emptyTitle:{color:'#173246',fontSize:15,fontWeight:'600',marginBottom:6},error:{color:'#9b2c2c',fontSize:12,lineHeight:18,marginTop:18}
})
