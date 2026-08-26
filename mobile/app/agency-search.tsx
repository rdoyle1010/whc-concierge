import { useMemo, useState } from 'react'
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { router } from 'expo-router'
import { supabase } from '../src/lib/supabase'

type Candidate = {
  id: string
  full_name?: string | null
  headline?: string | null
  role_level?: string | null
  experience_years?: number | null
  location?: string | null
  hourly_rate?: number | null
  review_score?: number | null
  review_count?: number | null
  whc_verified?: boolean | null
  has_insurance?: boolean | null
  distance_miles?: number | null
  travel_radius_miles?: number | null
  completed_shift_count?: number | null
  services_offered?: string[] | null
  is_featured?: boolean | null
}

const WEB_URL = process.env.EXPO_PUBLIC_WEB_URL || 'https://talent.wellnesshousecollective.co.uk'

function defaultDate() {
  const date = new Date()
  date.setDate(date.getDate() + 1)
  return date.toISOString().slice(0, 10)
}

export default function AgencySearchScreen() {
  const [shiftDate, setShiftDate] = useState(defaultDate())
  const [startTime, setStartTime] = useState('09:00')
  const [endTime, setEndTime] = useState('17:00')
  const [radius, setRadius] = useState('30')
  const [shiftType, setShiftType] = useState('Spa Therapist')
  const [repeatWeeks, setRepeatWeeks] = useState('1')
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [loading, setLoading] = useState(false)
  const [sendingId, setSendingId] = useState('')
  const [rates, setRates] = useState<Record<string, string>>({})
  const [searched, setSearched] = useState(false)
  const [error, setError] = useState('')

  async function authFetch(path: string, options?: RequestInit) {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.access_token) throw new Error('Your session has expired. Please sign in again.')
    const response = await fetch(`${WEB_URL}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
        ...(options?.headers || {}),
      },
    })
    const body = await response.json().catch(() => ({}))
    if (!response.ok) throw new Error(body?.error || 'Could not complete this Agency request.')
    return body
  }

  async function search() {
    setLoading(true)
    setError('')
    setSearched(true)
    try {
      const params = new URLSearchParams({
        shiftDate,
        shiftStartTime: startTime,
        shiftEndTime: endTime,
      })
      const parsedRadius = Number(radius)
      if (Number.isFinite(parsedRadius) && parsedRadius > 0) params.set('radius', String(parsedRadius))
      const payload = await authFetch(`/api/agency/directory?${params.toString()}`)
      const rows = (payload?.candidates || []) as Candidate[]
      setCandidates(rows)
      setRates(Object.fromEntries(rows.map(candidate => [candidate.id, candidate.hourly_rate ? String(candidate.hourly_rate) : ''])))
    } catch (e: any) {
      setCandidates([])
      setError(e?.message || 'Could not search Agency Talent.')
    } finally {
      setLoading(false)
    }
  }

  async function sendOffer(candidate: Candidate) {
    const rate = rates[candidate.id] || ''
    if (!rate || Number(rate) <= 0) {
      setError('Enter the hourly rate you want to offer.')
      return
    }
    setSendingId(candidate.id)
    setError('')
    try {
      const payload = await authFetch('/api/mobile/agency/create-offer', {
        method: 'POST',
        body: JSON.stringify({
          candidateId: candidate.id,
          shiftDate,
          shiftStartTime: startTime,
          shiftEndTime: endTime,
          shiftType,
          rate: Number(rate),
          repeatWeeks: Math.max(1, Math.min(8, Number(repeatWeeks) || 1)),
        }),
      })
      Alert.alert(
        payload?.urgent ? 'Urgent shift sent' : 'Shift offer sent',
        payload?.created > 1
          ? `${payload.created} weekly shift offers have been sent to ${candidate.full_name || 'the professional'}.`
          : `The shift offer has been sent to ${candidate.full_name || 'the professional'}.`,
        [{ text: 'View bookings', onPress: () => router.replace('/agency') }],
      )
    } catch (e: any) {
      setError(e?.message || 'Could not send this offer.')
    } finally {
      setSendingId('')
    }
  }

  const searchSummary = useMemo(() => `${shiftDate} · ${startTime} - ${endTime}${radius ? ` · up to ${radius} miles` : ''}`, [shiftDate, startTime, endTime, radius])

  return <ScrollView style={styles.scroll} contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled">
    <Pressable onPress={() => router.back()}><Text style={styles.back}>‹ Back to Agency</Text></Pressable>
    <Text style={styles.eyebrow}>EMPLOYER AGENCY SEARCH</Text>
    <Text style={styles.title}>Find available Talent</Text>
    <Text style={styles.intro}>Choose the exact shift first. The app will only show professionals who are approved, within the travel rules and genuinely available for the whole shift.</Text>

    <View style={styles.formCard}>
      <Text style={styles.formTitle}>Shift details</Text>
      <Text style={styles.label}>Date</Text>
      <TextInput value={shiftDate} onChangeText={setShiftDate} placeholder="YYYY-MM-DD" style={styles.input} autoCapitalize="none" />
      <View style={styles.twoCol}>
        <View style={styles.flex}><Text style={styles.label}>Start</Text><TextInput value={startTime} onChangeText={setStartTime} placeholder="09:00" style={styles.input} /></View>
        <View style={styles.flex}><Text style={styles.label}>Finish</Text><TextInput value={endTime} onChangeText={setEndTime} placeholder="17:00" style={styles.input} /></View>
      </View>
      <Text style={styles.label}>Search radius in miles</Text>
      <TextInput value={radius} onChangeText={setRadius} keyboardType="numeric" placeholder="30" style={styles.input} />
      <Text style={styles.label}>Shift type</Text>
      <TextInput value={shiftType} onChangeText={setShiftType} placeholder="Spa Therapist" style={styles.input} />
      <Text style={styles.label}>Repeat weekly</Text>
      <TextInput value={repeatWeeks} onChangeText={setRepeatWeeks} keyboardType="numeric" placeholder="1" style={styles.input} />
      <Text style={styles.help}>Enter 1 for a single shift, or up to 8 weeks for a standing booking. The professional must already be available for every repeat date.</Text>
      <Pressable onPress={search} disabled={loading} style={[styles.primaryButton, loading && styles.disabled]}>
        <Text style={styles.primaryText}>{loading ? 'Searching...' : 'Find available Talent'}</Text>
      </Pressable>
    </View>

    {error ? <Text style={styles.error}>{error}</Text> : null}
    {loading ? <ActivityIndicator color="#092b45" style={{ marginVertical: 25 }} /> : null}

    {searched && !loading ? <View style={styles.resultsHeader}>
      <Text style={styles.sectionTitle}>{candidates.length} available {candidates.length === 1 ? 'professional' : 'professionals'}</Text>
      <Text style={styles.summary}>{searchSummary}</Text>
    </View> : null}

    {searched && !loading && candidates.length === 0 ? <View style={styles.empty}><Text style={styles.emptyTitle}>No exact matches for this shift.</Text><Text style={styles.emptyCopy}>Try a different time, date or wider radius. The search will not show people who have not confirmed the full shift window.</Text></View> : null}

    <View style={styles.list}>{candidates.map(candidate => <View key={candidate.id} style={styles.card}>
      <View style={styles.topRow}>
        <View style={styles.flex}>
          <Text style={styles.cardTitle}>{candidate.full_name || 'Agency Professional'}</Text>
          <Text style={styles.meta}>{[candidate.headline || candidate.role_level, candidate.location].filter(Boolean).join(' · ')}</Text>
        </View>
        {candidate.is_featured ? <Text style={styles.featured}>FEATURED</Text> : null}
      </View>
      <View style={styles.tags}>
        {candidate.whc_verified ? <Text style={styles.tag}>WHC Verified</Text> : null}
        {candidate.has_insurance ? <Text style={styles.tag}>Insured</Text> : null}
        {candidate.experience_years != null ? <Text style={styles.tag}>{candidate.experience_years} yrs experience</Text> : null}
      </View>
      <View style={styles.facts}>
        {candidate.distance_miles != null ? <Text style={styles.fact}>{candidate.distance_miles} miles away</Text> : null}
        {candidate.review_score != null ? <Text style={styles.fact}>{candidate.review_score}/5 {candidate.review_count ? `(${candidate.review_count})` : ''}</Text> : null}
        {candidate.completed_shift_count ? <Text style={styles.fact}>{candidate.completed_shift_count} completed Agency shifts</Text> : null}
      </View>
      {candidate.services_offered?.length ? <Text style={styles.services}>{candidate.services_offered.slice(0, 5).join(' · ')}</Text> : null}
      <View style={styles.offerBox}>
        <Text style={styles.offerLabel}>Hourly rate to offer</Text>
        <View style={styles.rateRow}><Text style={styles.pound}>£</Text><TextInput value={rates[candidate.id] || ''} onChangeText={value => setRates(current => ({ ...current, [candidate.id]: value }))} keyboardType="numeric" style={styles.rateInput} placeholder={candidate.hourly_rate ? String(candidate.hourly_rate) : 'Rate'} /></View>
        {candidate.hourly_rate ? <Text style={styles.rateHint}>Professional’s listed rate: £{candidate.hourly_rate}/hr</Text> : null}
        <Pressable onPress={() => sendOffer(candidate)} disabled={sendingId === candidate.id} style={[styles.sendButton, sendingId === candidate.id && styles.disabled]}>
          <Text style={styles.sendText}>{sendingId === candidate.id ? 'Sending...' : `Send shift offer to ${candidate.full_name?.split(' ')[0] || 'Talent'}`}</Text>
        </Pressable>
      </View>
    </View>)}</View>
  </ScrollView>
}

const styles = StyleSheet.create({
  scroll:{flex:1,backgroundColor:'#fff'}, page:{paddingHorizontal:22,paddingTop:64,paddingBottom:110}, back:{color:'#66747c',fontSize:13,marginBottom:34}, eyebrow:{color:'#71808a',fontSize:9,letterSpacing:2.1,marginBottom:10}, title:{color:'#092b45',fontSize:31,lineHeight:37,fontWeight:'500'}, intro:{color:'#66747c',fontSize:14,lineHeight:21,marginTop:10,marginBottom:24}, formCard:{backgroundColor:'#f4f7f8',padding:18,marginBottom:22}, formTitle:{color:'#173246',fontSize:17,fontWeight:'600',marginBottom:15}, label:{color:'#173246',fontSize:10,fontWeight:'600',marginBottom:5,marginTop:10}, input:{backgroundColor:'#fff',borderWidth:1,borderColor:'#d7e0e4',paddingHorizontal:11,paddingVertical:11,color:'#173246',fontSize:12}, twoCol:{flexDirection:'row',gap:10}, flex:{flex:1}, help:{color:'#71808a',fontSize:10,lineHeight:15,marginTop:8}, primaryButton:{backgroundColor:'#092b45',padding:14,marginTop:16,alignItems:'center'}, primaryText:{color:'#fff',fontSize:11,fontWeight:'700'}, disabled:{opacity:.5}, error:{color:'#9b2c2c',fontSize:12,lineHeight:18,marginBottom:16}, resultsHeader:{marginBottom:12}, sectionTitle:{color:'#173246',fontSize:17,fontWeight:'600'}, summary:{color:'#71808a',fontSize:10,marginTop:4}, empty:{backgroundColor:'#f4f7f8',padding:18}, emptyTitle:{color:'#173246',fontSize:14,fontWeight:'600'}, emptyCopy:{color:'#71808a',fontSize:11,lineHeight:17,marginTop:5}, list:{gap:11}, card:{borderWidth:1,borderColor:'#dce3e7',padding:18}, topRow:{flexDirection:'row',gap:12,justifyContent:'space-between'}, cardTitle:{color:'#173246',fontSize:18,fontWeight:'600'}, meta:{color:'#66747c',fontSize:11,lineHeight:17,marginTop:4}, featured:{color:'#092b45',fontSize:8,fontWeight:'700',letterSpacing:1}, tags:{flexDirection:'row',flexWrap:'wrap',gap:6,marginTop:12}, tag:{backgroundColor:'#eef3f5',color:'#173246',fontSize:9,paddingHorizontal:8,paddingVertical:5}, facts:{flexDirection:'row',flexWrap:'wrap',gap:10,marginTop:12}, fact:{color:'#66747c',fontSize:10}, services:{color:'#71808a',fontSize:10,lineHeight:16,marginTop:10}, offerBox:{borderTopWidth:1,borderTopColor:'#edf1f3',marginTop:15,paddingTop:13}, offerLabel:{color:'#173246',fontSize:10,fontWeight:'600'}, rateRow:{flexDirection:'row',alignItems:'center',marginTop:7}, pound:{color:'#173246',fontSize:18,marginRight:6}, rateInput:{borderWidth:1,borderColor:'#d7e0e4',paddingHorizontal:11,paddingVertical:9,minWidth:100,color:'#173246',fontSize:13}, rateHint:{color:'#71808a',fontSize:9,marginTop:5}, sendButton:{backgroundColor:'#092b45',padding:12,alignItems:'center',marginTop:12}, sendText:{color:'#fff',fontSize:10,fontWeight:'700'}
})
