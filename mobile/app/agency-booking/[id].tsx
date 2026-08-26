import { useEffect, useState } from 'react'
import { ActivityIndicator, Alert, AppState, Linking, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { supabase } from '../../src/lib/supabase'

type Booking = {
  id: string
  shift_date: string | null
  shift_start_time: string | null
  shift_end_time: string | null
  shift_type?: string | null
  hours?: number | null
  rate: number
  status: string
  urgent?: boolean | null
  expires_at?: string | null
  booking_group?: string | null
  cascade_queue?: unknown[] | null
  cascade_position?: number | null
  cascade_total?: number | null
  platform_fee?: number | null
  paid_at?: string | null
  fee_paid_at?: string | null
  amount_paid?: number | null
  payout_amount?: number | null
  payout_status?: string | null
  employer_name?: string | null
  employer_location?: string | null
  employer_postcode?: string | null
  distance_miles?: number | null
  nearest_transport?: string | null
  transport_walk_minutes?: number | null
  parking_available?: boolean | null
  taxi_support?: boolean | null
  taxi_notes?: string | null
  candidate_name?: string | null
  viewer_role?: 'candidate' | 'employer'
}

const WEB_URL = process.env.EXPO_PUBLIC_WEB_URL || 'https://talent.wellnesshousecollective.co.uk'

function timeLabel(value?: string | null) { return value ? value.slice(0, 5) : '' }

export default function AgencyBookingScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const [booking, setBooking] = useState<Booking | null>(null)
  const [counterRate, setCounterRate] = useState('')
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState('')
  const [error, setError] = useState('')

  useEffect(() => { load() }, [id])
  useEffect(() => {
    const subscription = AppState.addEventListener('change', state => {
      if (state === 'active' && booking?.id) load(false)
    })
    return () => subscription.remove()
  }, [booking?.id])

  async function authFetch(path: string, options?: RequestInit) {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.access_token) throw new Error('Your session has expired. Please sign in again.')
    const response = await fetch(`${WEB_URL}${path}`, {
      ...options,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}`, ...(options?.headers || {}) },
    })
    const body = await response.json().catch(() => ({}))
    if (!response.ok) throw new Error(body?.error || 'Could not update this shift.')
    return body
  }

  async function load(showSpinner = true) {
    if (showSpinner) setLoading(true)
    setError('')
    try {
      const payload = await authFetch('/api/agency/booking')
      const found = ((payload?.bookings || []) as Booking[]).find(row => row.id === id) || null
      setBooking(found)
      if (found?.rate) setCounterRate(String(found.rate))
    } catch (e: any) {
      setError(e?.message || 'Could not load this shift.')
    } finally {
      if (showSpinner) setLoading(false)
    }
  }

  async function act(action: 'accept' | 'decline' | 'counter' | 'accept_group') {
    if (!booking) return
    if (action === 'counter') {
      const rate = Number(counterRate)
      if (!Number.isFinite(rate) || rate <= 0) {
        Alert.alert('Enter a rate', 'Enter the hourly rate you want to counter with.')
        return
      }
    }
    setBusy(action)
    setError('')
    try {
      const result = await authFetch('/api/mobile/agency/booking-action', {
        method: 'POST',
        body: JSON.stringify({ bookingId: booking.id, action, rate: action === 'counter' ? Number(counterRate) : undefined }),
      })
      const successCopy = action === 'accept_group'
        ? `All ${result?.accepted || ''} standing shifts accepted.`
        : action === 'accept'
          ? (result?.paymentRequired ? `Offer accepted. The property now needs to confirm payment${result?.totalDue ? ` (£${result.totalDue})` : ''}.` : 'Offer accepted.')
          : action === 'decline'
            ? (result?.message || 'Offer declined.')
            : 'Counter-offer sent.'
      Alert.alert('Agency shift updated', successCopy)
      await load(false)
    } catch (e: any) {
      setError(e?.message || 'Could not update this shift.')
    } finally {
      setBusy('')
    }
  }

  async function startPayment() {
    if (!booking) return
    setBusy('payment')
    setError('')
    try {
      const result = await authFetch('/api/mobile/agency/checkout', {
        method: 'POST',
        body: JSON.stringify({ bookingId: booking.id }),
      })
      if (!result?.url) throw new Error('Stripe checkout could not be opened.')
      Alert.alert(
        'Confirm Agency booking',
        `Professional: £${result.gross}\nWHC platform fee: £${result.fee}\nTotal to pay: £${result.total}\n\nThe professional receives the full £${result.gross} agreed shift amount after the completed shift.`,
        [
          { text: 'Not yet', style: 'cancel' },
          { text: `Pay £${result.total}`, onPress: () => Linking.openURL(result.url).catch(() => setError('Could not open secure payment. Please try again.')) },
        ],
      )
    } catch (e: any) {
      setError(e?.message || 'Could not start payment.')
    } finally {
      setBusy('')
    }
  }

  if (loading) return <View style={styles.center}><ActivityIndicator color="#092b45" /></View>
  if (!booking) return <View style={styles.center}><Text style={styles.error}>{error || 'Shift not found.'}</Text><Pressable onPress={() => router.back()}><Text style={styles.back}>‹ Agency</Text></Pressable></View>

  const candidateView = booking.viewer_role === 'candidate'
  const open = ['pending', 'countered'].includes(booking.status)
  const employerCanAccept = !candidateView && booking.status === 'countered'
  const employerCanPay = !candidateView && booking.status === 'accepted' && !booking.paid_at && !booking.fee_paid_at
  const paid = Boolean(booking.paid_at || booking.fee_paid_at || booking.status === 'confirmed')
  const name = candidateView ? (booking.employer_name || 'Property') : (booking.candidate_name || 'Professional')
  const expiredInMinutes = booking.expires_at ? Math.max(0, Math.ceil((new Date(booking.expires_at).getTime() - Date.now()) / 60000)) : null
  const effectiveHours = booking.hours && booking.hours > 0 ? booking.hours : 8
  const shiftGross = booking.rate * effectiveHours
  const fee = booking.platform_fee && booking.platform_fee > 0 ? booking.platform_fee : Math.ceil(shiftGross * 0.10)
  const expectedTotal = shiftGross + fee

  return <ScrollView style={styles.scroll} contentContainerStyle={styles.page}>
    <Pressable onPress={() => router.back()}><Text style={styles.back}>‹ Agency</Text></Pressable>
    <Text style={styles.eyebrow}>{booking.urgent ? 'URGENT AGENCY SHIFT' : 'AGENCY SHIFT'}</Text>
    <Text style={styles.title}>{name}</Text>
    <Text style={styles.meta}>{[booking.shift_date, `${timeLabel(booking.shift_start_time)}${booking.shift_end_time ? ` - ${timeLabel(booking.shift_end_time)}` : ''}`, booking.shift_type].filter(Boolean).join(' · ')}</Text>

    <View style={styles.rateBox}>
      <Text style={styles.rate}>£{booking.rate}/hr</Text>
      <Text style={styles.total}>£{shiftGross} professional pay · £{fee} WHC fee · £{expectedTotal} total</Text>
    </View>
    <Text style={styles.stage}>STATUS  {booking.status.toUpperCase()}</Text>
    {paid ? <Text style={styles.confirmed}>PAYMENT RECEIVED · BOOKING CONFIRMED</Text> : null}
    {open && expiredInMinutes != null ? <Text style={[styles.expiry, expiredInMinutes < 60 && styles.expiryUrgent]}>{expiredInMinutes > 0 ? `${expiredInMinutes} minutes left to respond` : 'Response window has expired'}</Text> : null}
    {booking.cascade_total && candidateView ? <Text style={styles.cascade}>Urgent cover queue: position {booking.cascade_position || 1} of {booking.cascade_total}. If you decline or the timer expires, the offer moves automatically.</Text> : null}

    {candidateView ? <View style={styles.travelBox}>
      <Text style={styles.sectionTitle}>Before you accept</Text>
      {booking.employer_location ? <Text style={styles.line}>{booking.employer_location}{booking.employer_postcode ? ` · ${booking.employer_postcode}` : ''}</Text> : null}
      {booking.distance_miles != null ? <Text style={styles.line}>{booking.distance_miles} miles from you</Text> : null}
      {booking.nearest_transport ? <Text style={styles.line}>Nearest transport: {booking.nearest_transport}{booking.transport_walk_minutes != null ? ` · ${booking.transport_walk_minutes} min walk` : ''}</Text> : null}
      {booking.parking_available ? <Text style={styles.line}>Parking available</Text> : null}
      {booking.taxi_support ? <Text style={styles.line}>Taxi support available{booking.taxi_notes ? ` · ${booking.taxi_notes}` : ''}</Text> : null}
    </View> : null}

    {employerCanPay ? <View style={styles.paymentBox}>
      <Text style={styles.sectionTitle}>Confirm this booking</Text>
      <Text style={styles.help}>The professional has accepted. Payment confirms the shift. WHC holds the agreed shift amount and pays the professional after the completed shift.</Text>
      <View style={styles.paymentLine}><Text style={styles.paymentLabel}>Professional</Text><Text style={styles.paymentValue}>£{shiftGross}</Text></View>
      <View style={styles.paymentLine}><Text style={styles.paymentLabel}>WHC platform fee</Text><Text style={styles.paymentValue}>£{fee}</Text></View>
      <View style={[styles.paymentLine, styles.paymentTotal]}><Text style={styles.paymentTotalLabel}>Total</Text><Text style={styles.paymentTotalValue}>£{expectedTotal}</Text></View>
      <Pressable disabled={!!busy} onPress={startPayment} style={[styles.primary, !!busy && styles.disabled]}><Text style={styles.primaryText}>{busy === 'payment' ? 'Preparing secure payment...' : `Pay & confirm £${expectedTotal}`}</Text></Pressable>
      <Pressable onPress={() => load(false)} style={styles.refresh}><Text style={styles.refreshText}>I have paid · refresh status</Text></Pressable>
    </View> : null}

    {open ? <View style={styles.actions}>
      {candidateView ? <>
        <Pressable disabled={!!busy} onPress={() => act('accept')} style={[styles.primary, !!busy && styles.disabled]}><Text style={styles.primaryText}>{busy === 'accept' ? 'Accepting...' : 'Accept shift'}</Text></Pressable>
        {booking.booking_group ? <Pressable disabled={!!busy} onPress={() => act('accept_group')} style={[styles.groupButton, !!busy && styles.disabled]}><Text style={styles.groupText}>{busy === 'accept_group' ? 'Accepting...' : 'Accept all standing shifts'}</Text></Pressable> : null}
        <View style={styles.counterBox}><Text style={styles.sectionTitle}>Counter offer</Text><Text style={styles.help}>Enter the hourly rate you would accept. The property can then accept or decline it.</Text><View style={styles.counterRow}><Text style={styles.currency}>£</Text><TextInput value={counterRate} onChangeText={setCounterRate} keyboardType="decimal-pad" style={styles.input} /><Text style={styles.perHour}>/hr</Text></View><Pressable disabled={!!busy} onPress={() => act('counter')} style={[styles.secondary, !!busy && styles.disabled]}><Text style={styles.secondaryText}>{busy === 'counter' ? 'Sending...' : 'Send counter offer'}</Text></Pressable></View>
        <Pressable disabled={!!busy} onPress={() => act('decline')} style={[styles.decline, !!busy && styles.disabled]}><Text style={styles.declineText}>{busy === 'decline' ? 'Declining...' : 'Decline shift'}</Text></Pressable>
      </> : <>
        {employerCanAccept ? <Pressable disabled={!!busy} onPress={() => act('accept')} style={[styles.primary, !!busy && styles.disabled]}><Text style={styles.primaryText}>{busy === 'accept' ? 'Accepting...' : `Accept £${booking.rate}/hr counter`}</Text></Pressable> : <Text style={styles.help}>Waiting for the professional to respond to your offer.</Text>}
        <Pressable disabled={!!busy} onPress={() => act('decline')} style={[styles.decline, !!busy && styles.disabled]}><Text style={styles.declineText}>{busy === 'decline' ? 'Declining...' : 'Decline / close offer'}</Text></Pressable>
      </>}
    </View> : !employerCanPay && !paid ? <View style={styles.closed}><Text style={styles.closedTitle}>This offer is no longer open.</Text><Text style={styles.help}>Its current status is {booking.status}.</Text></View> : null}

    {paid && !candidateView ? <View style={styles.closed}><Text style={styles.closedTitle}>Booking confirmed</Text><Text style={styles.help}>Payment has been received. The professional has been notified and WHC will manage the post-shift payout.</Text></View> : null}
    {error ? <Text style={styles.error}>{error}</Text> : null}
  </ScrollView>
}

const styles = StyleSheet.create({
  scroll:{flex:1,backgroundColor:'#fff'},page:{paddingHorizontal:22,paddingTop:64,paddingBottom:110},center:{flex:1,alignItems:'center',justifyContent:'center',padding:28,backgroundColor:'#fff'},back:{color:'#66747c',fontSize:13,marginBottom:34},eyebrow:{color:'#71808a',fontSize:9,letterSpacing:2,marginBottom:10},title:{color:'#092b45',fontSize:29,lineHeight:35,fontWeight:'500'},meta:{color:'#66747c',fontSize:12,lineHeight:18,marginTop:8},rateBox:{backgroundColor:'#f4f7f8',padding:18,marginTop:24},rate:{color:'#092b45',fontSize:26,fontWeight:'600'},total:{color:'#66747c',fontSize:11,lineHeight:17,marginTop:5},stage:{color:'#71808a',fontSize:9,letterSpacing:1.1,marginTop:16},confirmed:{color:'#456655',fontSize:10,fontWeight:'700',letterSpacing:.8,marginTop:8},expiry:{color:'#5b6670',fontSize:11,fontWeight:'600',marginTop:8},expiryUrgent:{color:'#8a3434'},cascade:{backgroundColor:'#fff7f3',color:'#7a4a3a',fontSize:10,lineHeight:16,padding:12,marginTop:12},travelBox:{borderTopWidth:1,borderTopColor:'#e3e8eb',paddingTop:20,marginTop:24},sectionTitle:{color:'#173246',fontSize:15,fontWeight:'600',marginBottom:7},line:{color:'#66747c',fontSize:11,lineHeight:18},paymentBox:{backgroundColor:'#f5f8f9',padding:18,marginTop:24},paymentLine:{flexDirection:'row',justifyContent:'space-between',paddingVertical:6},paymentLabel:{color:'#66747c',fontSize:11},paymentValue:{color:'#173246',fontSize:11,fontWeight:'600'},paymentTotal:{borderTopWidth:1,borderTopColor:'#dce4e8',marginTop:5,paddingTop:12,marginBottom:12},paymentTotalLabel:{color:'#173246',fontSize:13,fontWeight:'700'},paymentTotalValue:{color:'#092b45',fontSize:18,fontWeight:'700'},refresh:{alignItems:'center',paddingVertical:12},refreshText:{color:'#66747c',fontSize:10,fontWeight:'600'},actions:{borderTopWidth:1,borderTopColor:'#e3e8eb',paddingTop:22,marginTop:26},primary:{backgroundColor:'#092b45',paddingVertical:15,alignItems:'center'},primaryText:{color:'#fff',fontSize:12,fontWeight:'700'},groupButton:{borderWidth:1,borderColor:'#092b45',paddingVertical:14,alignItems:'center',marginTop:10},groupText:{color:'#092b45',fontSize:11,fontWeight:'700'},counterBox:{backgroundColor:'#f5f8f9',padding:16,marginTop:18},help:{color:'#71808a',fontSize:11,lineHeight:17},counterRow:{flexDirection:'row',alignItems:'center',marginTop:12},currency:{color:'#173246',fontSize:18,marginRight:5},input:{flex:1,borderWidth:1,borderColor:'#d7e0e4',paddingHorizontal:12,paddingVertical:11,color:'#173246',fontSize:14,backgroundColor:'#fff'},perHour:{color:'#66747c',fontSize:11,marginLeft:6},secondary:{borderWidth:1,borderColor:'#cfd9de',paddingVertical:13,alignItems:'center',marginTop:10},secondaryText:{color:'#173246',fontSize:11,fontWeight:'600'},decline:{paddingVertical:14,alignItems:'center',marginTop:12},declineText:{color:'#7a4a4a',fontSize:11,fontWeight:'600'},closed:{backgroundColor:'#f4f7f8',padding:17,marginTop:24},closedTitle:{color:'#173246',fontSize:14,fontWeight:'600',marginBottom:4},disabled:{opacity:.45},error:{color:'#9b2c2c',fontSize:11,lineHeight:17,marginTop:16}
})
