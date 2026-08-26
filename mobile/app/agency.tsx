import { useEffect, useMemo, useState } from 'react'
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { router } from 'expo-router'
import { supabase } from '../src/lib/supabase'

type Role = 'talent' | 'employer'
type WindowRow = { id: string; date: string; start_time: string; end_time: string; timezone?: string | null }
type BookingRow = {
  id: string
  shift_date: string | null
  shift_start_time: string | null
  shift_end_time: string | null
  shift_type?: string | null
  hours?: number | null
  status: string
  rate: number
  urgent: boolean | null
  expires_at?: string | null
  paid_at?: string | null
  distance_miles?: number | null
  candidate_travel_radius?: number | null
  within_radius?: boolean | null
  employer_name?: string | null
  employer_user_id?: string | null
  employer_location?: string | null
  employer_review_score?: number | null
  employer_review_count?: number | null
  employer_postcode?: string | null
  commute_car_required?: boolean | null
  nearest_transport?: string | null
  transport_walk_minutes?: number | null
  parking_available?: boolean | null
  taxi_support?: boolean | null
  taxi_notes?: string | null
  travel_notes?: string | null
  candidate_name?: string | null
  candidate_user_id?: string | null
  reviewed_by_viewer?: boolean | null
  viewer_role?: 'candidate' | 'employer'
}

type DayDraft = { date: string; start: string; end: string }

const WEB_URL = process.env.EXPO_PUBLIC_WEB_URL || 'https://talent.wellnesshousecollective.co.uk'

function timeLabel(value?: string | null) { return value ? value.slice(0, 5) : '' }
function dateLabel(date: string) { return new Date(`${date}T12:00:00`).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }) }

function nextSevenDays(): DayDraft[] {
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date()
    date.setDate(date.getDate() + index)
    return { date: date.toISOString().slice(0, 10), start: '09:00', end: '17:00' }
  })
}

export default function AgencyScreen() {
  const [role, setRole] = useState<Role>('talent')
  const [windows, setWindows] = useState<WindowRow[]>([])
  const [bookings, setBookings] = useState<BookingRow[]>([])
  const [drafts, setDrafts] = useState<DayDraft[]>(nextSevenDays())
  const [loading, setLoading] = useState(true)
  const [savingDate, setSavingDate] = useState('')
  const [error, setError] = useState('')

  useEffect(() => { load() }, [])

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
    if (!response.ok) throw new Error(body?.error || 'Could not load Agency data.')
    return body
  }

  async function load() {
    setLoading(true)
    setError('')
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.replace('/login'); return }
      const { data: account } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle()
      const resolved: Role = account?.role === 'employer' ? 'employer' : 'talent'
      setRole(resolved)

      const bookingPayload = await authFetch('/api/agency/booking')
      setBookings((bookingPayload?.bookings || []) as BookingRow[])

      if (resolved === 'talent') {
        const availabilityPayload = await authFetch('/api/agency/availability')
        const futureWindows = (availabilityPayload?.windows || []) as WindowRow[]
        setWindows(futureWindows)
        setDrafts(current => current.map(day => {
          const existing = futureWindows.find(window => window.date === day.date)
          return existing ? { ...day, start: timeLabel(existing.start_time), end: timeLabel(existing.end_time) } : day
        }))
      }
    } catch (e: any) {
      setError(e?.message || 'Could not load Agency data.')
    } finally {
      setLoading(false)
    }
  }

  const upcoming = useMemo(() => bookings.filter(booking => !['declined', 'cancelled', 'expired'].includes(booking.status)), [bookings])

  function updateDraft(date: string, field: 'start' | 'end', value: string) {
    setDrafts(current => current.map(day => day.date === date ? { ...day, [field]: value } : day))
  }

  async function saveAvailability(day: DayDraft, state: 'available' | 'unavailable' | 'clear') {
    setSavingDate(day.date)
    setError('')
    try {
      await authFetch('/api/agency/availability', {
        method: 'POST',
        body: JSON.stringify({ date: day.date, state, startTime: day.start, endTime: day.end }),
      })
      const payload = await authFetch('/api/agency/availability')
      setWindows((payload?.windows || []) as WindowRow[])
      Alert.alert(state === 'available' ? 'Availability saved' : state === 'unavailable' ? 'Marked unavailable' : 'Availability cleared', `${dateLabel(day.date)} has been updated.`)
    } catch (e: any) {
      setError(e?.message || 'Could not update availability.')
    } finally {
      setSavingDate('')
    }
  }

  return <ScrollView style={styles.scroll} contentContainerStyle={styles.page}>
    <Pressable onPress={() => router.back()}><Text style={styles.back}>‹ Back</Text></Pressable>
    <Text style={styles.eyebrow}>AGENCY</Text>
    <Text style={styles.title}>{role === 'talent' ? 'Your flexible work' : 'Agency staffing'}</Text>
    <Text style={styles.intro}>{role === 'talent' ? 'Set different hours for each day, then see the exact travel information before accepting work.' : 'See your flexible staffing bookings, shift status and the candidate attached to each request.'}</Text>
    {loading ? <ActivityIndicator color="#092b45" style={{ marginTop: 30 }} /> : null}
    {error ? <Text style={styles.error}>{error}</Text> : null}

    {role === 'talent' && !loading ? <View style={styles.section}>
      <Text style={styles.sectionTitle}>Next 7 days</Text>
      <Text style={styles.help}>Every day can be different. Enter times as HH:MM, for example 09:00 to 17:00 or 13:00 to 21:00.</Text>
      {drafts.map(day => {
        const existing = windows.some(window => window.date === day.date)
        return <View key={day.date} style={styles.availabilityCard}>
          <View style={styles.dayTop}><View><Text style={styles.rowMain}>{dateLabel(day.date)}</Text><Text style={styles.savedState}>{existing ? 'Availability set' : 'Not confirmed'}</Text></View></View>
          <View style={styles.timeRow}>
            <View style={{ flex: 1 }}><Text style={styles.label}>From</Text><TextInput value={day.start} onChangeText={value => updateDraft(day.date, 'start', value)} placeholder="09:00" style={styles.input} keyboardType="numbers-and-punctuation" /></View>
            <View style={{ flex: 1 }}><Text style={styles.label}>Until</Text><TextInput value={day.end} onChangeText={value => updateDraft(day.date, 'end', value)} placeholder="17:00" style={styles.input} keyboardType="numbers-and-punctuation" /></View>
          </View>
          <View style={styles.buttonRow}>
            <Pressable disabled={savingDate === day.date} onPress={() => saveAvailability(day, 'available')} style={[styles.saveButton, savingDate === day.date && styles.disabled]}><Text style={styles.saveText}>{savingDate === day.date ? 'Saving...' : 'Save hours'}</Text></Pressable>
            <Pressable disabled={savingDate === day.date} onPress={() => saveAvailability(day, 'unavailable')} style={styles.outlineButton}><Text style={styles.outlineText}>Unavailable</Text></Pressable>
            {existing ? <Pressable disabled={savingDate === day.date} onPress={() => saveAvailability(day, 'clear')}><Text style={styles.clearText}>Clear</Text></Pressable> : null}
          </View>
        </View>
      })}
    </View> : null}

    {!loading ? <View style={styles.section}>
      <Text style={styles.sectionTitle}>{role === 'talent' ? 'Shift offers & bookings' : 'Bookings'}</Text>
      {upcoming.length === 0 ? <Text style={styles.emptyCopy}>No agency bookings to show yet.</Text> : upcoming.map(booking => {
        const name = role === 'talent' ? (booking.employer_name || 'Property') : (booking.candidate_name || 'Talent')
        const reviewable = Boolean(booking.paid_at && ['confirmed', 'completed'].includes(booking.status) && !booking.reviewed_by_viewer)
        const reviewedId = role === 'talent' ? booking.employer_user_id : booking.candidate_user_id
        return <View key={booking.id} style={styles.card}>
          <View style={styles.topRow}><Text style={styles.status}>{booking.status}</Text>{booking.urgent ? <Text style={styles.urgent}>URGENT</Text> : null}</View>
          <Text style={styles.cardTitle}>{name}</Text>
          <Text style={styles.cardCopy}>{[booking.shift_type, booking.shift_date, `${timeLabel(booking.shift_start_time)}${booking.shift_end_time ? ` - ${timeLabel(booking.shift_end_time)}` : ''}`, booking.rate ? `£${booking.rate}/hr` : null].filter(Boolean).join('  ·  ')}</Text>
          {role === 'talent' ? <View style={styles.travelBox}>
            <Text style={styles.travelTitle}>Getting there</Text>
            {booking.employer_location ? <Text style={styles.travelLine}>{booking.employer_location}{booking.employer_postcode ? ` · ${booking.employer_postcode}` : ''}</Text> : null}
            {booking.distance_miles != null ? <Text style={styles.travelLine}>{booking.distance_miles} miles from you{booking.candidate_travel_radius ? ` · your radius ${booking.candidate_travel_radius} miles` : ''}</Text> : null}
            {booking.within_radius === false ? <Text style={styles.warning}>This appears to be outside your saved travel radius.</Text> : null}
            {booking.nearest_transport ? <Text style={styles.travelLine}>Nearest transport: {booking.nearest_transport}{booking.transport_walk_minutes != null ? ` · ${booking.transport_walk_minutes} min walk` : ''}</Text> : null}
            {booking.commute_car_required ? <Text style={styles.travelLine}>Car recommended / required</Text> : null}
            {booking.parking_available ? <Text style={styles.travelLine}>Parking available</Text> : null}
            {booking.taxi_support ? <Text style={styles.travelLine}>Taxi support available{booking.taxi_notes ? ` · ${booking.taxi_notes}` : ''}</Text> : null}
            {booking.travel_notes ? <Text style={styles.travelLine}>{booking.travel_notes}</Text> : null}
            {booking.employer_review_score != null ? <Text style={styles.travelLine}>Property rating: {booking.employer_review_score}/5{booking.employer_review_count ? ` from ${booking.employer_review_count} reviews` : ''}</Text> : null}
          </View> : null}
          {booking.status === 'pending' || booking.status === 'countered' ? <Text style={styles.pendingHint}>{role === 'talent' ? 'Offer response actions are the next Agency mobile step.' : 'Waiting for the professional to respond.'}</Text> : null}
          {reviewable && reviewedId ? <Pressable onPress={() => router.push({ pathname: '/agency-review/[id]', params: { id: booking.id, reviewedId, type: role === 'talent' ? 'employer' : 'candidate', name } })} style={styles.reviewButton}><Text style={styles.reviewButtonText}>Leave shift review →</Text></Pressable> : null}
          {booking.reviewed_by_viewer ? <Text style={styles.reviewed}>Review submitted ✓</Text> : null}
        </View>
      })}
    </View> : null}
  </ScrollView>
}

const styles = StyleSheet.create({
  scroll:{flex:1,backgroundColor:'#fff'}, page:{paddingHorizontal:22,paddingTop:64,paddingBottom:110}, back:{color:'#66747c',fontSize:13,marginBottom:34}, eyebrow:{color:'#71808a',fontSize:9,letterSpacing:2.1,marginBottom:10}, title:{color:'#092b45',fontSize:31,lineHeight:37,fontWeight:'500'}, intro:{color:'#66747c',fontSize:14,lineHeight:21,marginTop:10,marginBottom:28}, section:{marginBottom:30}, sectionTitle:{color:'#173246',fontSize:17,fontWeight:'600',marginBottom:8}, help:{color:'#71808a',fontSize:11,lineHeight:17,marginBottom:14}, availabilityCard:{borderWidth:1,borderColor:'#dce3e7',padding:16,marginBottom:10}, dayTop:{flexDirection:'row',justifyContent:'space-between',alignItems:'center'}, rowMain:{color:'#173246',fontSize:14,fontWeight:'600'}, savedState:{color:'#71808a',fontSize:9,marginTop:3,textTransform:'uppercase',letterSpacing:.8}, timeRow:{flexDirection:'row',gap:10,marginTop:13}, label:{color:'#173246',fontSize:10,fontWeight:'600',marginBottom:5}, input:{borderWidth:1,borderColor:'#d7e0e4',paddingHorizontal:10,paddingVertical:10,color:'#173246',fontSize:12}, buttonRow:{flexDirection:'row',alignItems:'center',gap:9,marginTop:13,flexWrap:'wrap'}, saveButton:{backgroundColor:'#092b45',paddingHorizontal:13,paddingVertical:11}, saveText:{color:'#fff',fontSize:10,fontWeight:'700'}, outlineButton:{borderWidth:1,borderColor:'#cfd9de',paddingHorizontal:12,paddingVertical:10}, outlineText:{color:'#66747c',fontSize:10,fontWeight:'600'}, clearText:{color:'#7a4a4a',fontSize:10,padding:8}, disabled:{opacity:.45}, card:{borderWidth:1,borderColor:'#dce3e7',padding:18,marginBottom:10}, topRow:{flexDirection:'row',justifyContent:'space-between'}, status:{color:'#71808a',fontSize:9,textTransform:'uppercase',letterSpacing:1.2}, urgent:{color:'#8a3434',fontSize:8,letterSpacing:1.2,fontWeight:'700'}, cardTitle:{color:'#173246',fontSize:17,fontWeight:'600',marginTop:8}, cardCopy:{color:'#66747c',fontSize:12,lineHeight:18,marginTop:6}, travelBox:{backgroundColor:'#f5f8f9',padding:13,marginTop:14}, travelTitle:{color:'#173246',fontSize:11,fontWeight:'700',marginBottom:5}, travelLine:{color:'#66747c',fontSize:10,lineHeight:16,marginTop:2}, warning:{color:'#8a3434',fontSize:10,lineHeight:15,marginTop:4,fontWeight:'600'}, pendingHint:{color:'#71808a',fontSize:10,lineHeight:16,marginTop:12,fontStyle:'italic'}, reviewButton:{borderTopWidth:1,borderTopColor:'#edf1f3',paddingTop:12,marginTop:14}, reviewButtonText:{color:'#092b45',fontSize:10,fontWeight:'700'}, reviewed:{color:'#456655',fontSize:10,fontWeight:'600',marginTop:10}, emptyCopy:{color:'#71808a',fontSize:12,lineHeight:18,backgroundColor:'#f4f7f8',padding:17}, error:{color:'#9b2c2c',fontSize:12,marginBottom:18}
})
