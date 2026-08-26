import { useEffect, useState } from 'react'
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native'
import { router } from 'expo-router'
import { supabase } from '../src/lib/supabase'

type Role = 'talent' | 'employer'
type ResidencyProfile = {
  id: string
  reference: string
  title?: string | null
  bio?: string | null
  primary_specialism?: string | null
  secondary_specialisms?: string[]
  qualifications?: string[]
  brand_experience?: string[]
  current_location?: string | null
  travel_availability?: string | null
  preferred_duration?: string | null
  day_rate?: number | null
  weekly_rate?: number | null
  monthly_rate?: number | null
  negotiable?: boolean
  available_from?: string | null
  years_experience?: number | null
  is_featured?: boolean
}

type Booking = {
  id: string
  residency_profile_id: string
  property_name?: string | null
  employer_name?: string | null
  employer_location?: string | null
  employer_user_id?: string | null
  candidate_name?: string | null
  candidate_user_id?: string | null
  primary_specialism?: string | null
  start_date: string
  end_date: string
  days_required: number
  proposed_day_rate: number
  proposed_total: number
  agreed_day_rate?: number | null
  agreed_total?: number | null
  platform_fee?: number | null
  accommodation_included?: boolean | null
  travel_included?: boolean | null
  services_required?: string | null
  notes?: string | null
  status: string
  paid_at?: string | null
}

const WEB_URL = process.env.EXPO_PUBLIC_WEB_URL || 'https://talent.wellnesshousecollective.co.uk'

function futureDate(days: number) {
  const date = new Date()
  date.setDate(date.getDate() + days)
  return date.toISOString().slice(0, 10)
}

export default function ResidencyScreen() {
  const [role, setRole] = useState<Role>('talent')
  const [bookings, setBookings] = useState<Booking[]>([])
  const [profiles, setProfiles] = useState<ResidencyProfile[]>([])
  const [propertyName, setPropertyName] = useState('')
  const [member, setMember] = useState(false)
  const [listingStatus, setListingStatus] = useState('')
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState('')
  const [error, setError] = useState('')
  const [offerTarget, setOfferTarget] = useState<ResidencyProfile | null>(null)
  const [startDate, setStartDate] = useState(futureDate(14))
  const [endDate, setEndDate] = useState(futureDate(20))
  const [daysRequired, setDaysRequired] = useState('5')
  const [dayRate, setDayRate] = useState('')
  const [services, setServices] = useState('')
  const [notes, setNotes] = useState('')
  const [accommodation, setAccommodation] = useState(true)
  const [travel, setTravel] = useState(false)
  const [counterRates, setCounterRates] = useState<Record<string, string>>({})

  useEffect(() => { load() }, [])

  async function authFetch(path: string, options?: RequestInit) {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.access_token) throw new Error('Your session has expired. Please sign in again.')
    const response = await fetch(`${WEB_URL}${path}`, {
      ...options,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}`, ...(options?.headers || {}) },
    })
    const body = await response.json().catch(() => ({}))
    if (!response.ok) throw new Error(body?.error || 'Could not update Residency.')
    return body
  }

  async function load() {
    setLoading(true)
    setError('')
    try {
      const dashboard = await authFetch('/api/mobile/residency/dashboard')
      const resolved: Role = dashboard?.role === 'employer' ? 'employer' : 'talent'
      setRole(resolved)
      setBookings((dashboard?.bookings || []) as Booking[])
      if (resolved === 'employer') {
        setPropertyName(dashboard?.employer?.propertyName || '')
        const response = await fetch(`${WEB_URL}/api/residency/public`)
        const publicData = await response.json().catch(() => ({}))
        if (!response.ok) throw new Error(publicData?.error || 'Could not load Residency specialists.')
        setProfiles((publicData?.profiles || []) as ResidencyProfile[])
      } else {
        setMember(Boolean(dashboard?.candidate?.residencyMember))
        setListingStatus(dashboard?.candidate?.listing?.approval_status || '')
        setCounterRates(Object.fromEntries(((dashboard?.bookings || []) as Booking[]).map(row => [row.id, String(row.proposed_day_rate || '')])))
      }
    } catch (e: any) {
      setError(e?.message || 'Could not load Residency.')
    } finally {
      setLoading(false)
    }
  }

  async function startConversation(profile: ResidencyProfile) {
    setBusy(`conversation-${profile.id}`)
    setError('')
    try {
      const result = await authFetch('/api/residency/conversation', { method: 'POST', body: JSON.stringify({ listingId: profile.id }) })
      Alert.alert('Private conversation started', 'You can now message the specialist and send a structured Residency offer.')
      if (result?.recipientId) router.push({ pathname: '/message/[userId]', params: { userId: result.recipientId } })
    } catch (e: any) {
      setError(e?.message || 'Could not start the Residency conversation.')
    } finally {
      setBusy('')
    }
  }

  function prepareOffer(profile: ResidencyProfile) {
    setOfferTarget(profile)
    setDayRate(profile.day_rate ? String(profile.day_rate) : '')
    setServices(profile.primary_specialism || '')
    setNotes('')
  }

  async function sendOffer() {
    if (!offerTarget) return
    const days = Number(daysRequired)
    const rate = Number(dayRate)
    if (!propertyName.trim() || !startDate || !endDate || !Number.isFinite(days) || days < 1 || !Number.isFinite(rate) || rate <= 0) {
      Alert.alert('Complete the offer', 'Add the property, dates, days required and proposed day rate.')
      return
    }
    setBusy(`offer-${offerTarget.id}`)
    setError('')
    try {
      const result = await authFetch('/api/residency/offer', {
        method: 'POST',
        body: JSON.stringify({
          listingId: offerTarget.id,
          propertyName: propertyName.trim(),
          startDate,
          endDate,
          daysRequired: days,
          proposedDayRate: rate,
          accommodationIncluded: accommodation,
          travelIncluded: travel,
          servicesRequired: services,
          notes,
        }),
      })
      Alert.alert('Residency offer sent', `Offer value £${result?.proposedTotal || days * rate}. The specialist can accept, counter or decline.`)
      setOfferTarget(null)
      await load()
    } catch (e: any) {
      setError(e?.message || 'Could not send the Residency offer.')
    } finally {
      setBusy('')
    }
  }

  async function talentRespond(booking: Booking, action: 'accept' | 'counter' | 'decline') {
    setBusy(`${action}-${booking.id}`)
    setError('')
    try {
      await authFetch('/api/residency/respond', {
        method: 'POST',
        body: JSON.stringify({ bookingId: booking.id, action, counterDayRate: action === 'counter' ? Number(counterRates[booking.id]) : undefined }),
      })
      Alert.alert('Residency updated', action === 'accept' ? 'Offer accepted. The property can now confirm and pay.' : action === 'counter' ? 'Counter-offer sent.' : 'Offer declined.')
      await load()
    } catch (e: any) {
      setError(e?.message || 'Could not update the Residency offer.')
    } finally {
      setBusy('')
    }
  }

  async function employerRespond(booking: Booking, action: 'accept' | 'decline') {
    setBusy(`${action}-${booking.id}`)
    setError('')
    try {
      await authFetch('/api/residency/employer-respond', { method: 'POST', body: JSON.stringify({ bookingId: booking.id, action }) })
      Alert.alert('Residency updated', action === 'accept' ? 'Counter-offer accepted. Secure payment is the next step.' : 'Counter-offer declined.')
      await load()
    } catch (e: any) {
      setError(e?.message || 'Could not update the Residency offer.')
    } finally {
      setBusy('')
    }
  }

  if (loading) return <View style={styles.center}><ActivityIndicator color="#092b45" /></View>

  return <ScrollView style={styles.scroll} contentContainerStyle={styles.page}>
    <Pressable onPress={() => router.back()}><Text style={styles.back}>‹ Back</Text></Pressable>
    <Text style={styles.eyebrow}>RESIDENCY</Text>
    <Text style={styles.title}>{role === 'employer' ? 'Bring expertise into your property.' : 'Your specialist residencies.'}</Text>
    <Text style={styles.intro}>{role === 'employer' ? 'Discover approved specialists for longer-form spa and wellness residencies, start privately, then send a structured offer.' : 'Review structured residency offers, negotiate your day rate and keep every booking in one place.'}</Text>
    {error ? <Text style={styles.error}>{error}</Text> : null}

    {role === 'talent' ? <>
      <View style={styles.membershipCard}>
        <Text style={styles.sectionTitle}>{member ? 'Residency membership active' : 'Residency membership required'}</Text>
        <Text style={styles.help}>{member ? `Your specialist listing${listingStatus ? ` is ${listingStatus}` : ''}. Employers can discover you through the protected Residency directory.` : 'Your listing only appears publicly while your Residency membership is active.'}</Text>
      </View>
      <Text style={styles.sectionTitle}>Offers & bookings</Text>
      {bookings.length === 0 ? <Text style={styles.empty}>No Residency offers yet.</Text> : bookings.map(booking => {
        const open = ['offered', 'countered'].includes(booking.status)
        const confirmed = booking.status === 'confirmed' && Boolean(booking.paid_at)
        return <View key={booking.id} style={styles.card}>
          <View style={styles.cardTop}><Text style={styles.status}>{booking.status}</Text><Text style={styles.rate}>£{booking.proposed_day_rate}/day</Text></View>
          <Text style={styles.cardTitle}>{booking.employer_name || booking.property_name || 'Property'}</Text>
          <Text style={styles.meta}>{booking.start_date} → {booking.end_date} · {booking.days_required} days · £{booking.proposed_total} proposed</Text>
          {booking.employer_location ? <Text style={styles.line}>{booking.employer_location}</Text> : null}
          {booking.services_required ? <Text style={styles.line}>Required: {booking.services_required}</Text> : null}
          {booking.accommodation_included ? <Text style={styles.line}>Accommodation included</Text> : null}
          {booking.travel_included ? <Text style={styles.line}>Travel included</Text> : null}
          {booking.notes ? <Text style={styles.note}>{booking.notes}</Text> : null}
          {open ? <View style={styles.actions}>
            <Pressable disabled={!!busy} onPress={() => talentRespond(booking, 'accept')} style={styles.primary}><Text style={styles.primaryText}>Accept offer</Text></Pressable>
            <View style={styles.counterRow}><Text style={styles.currency}>£</Text><TextInput value={counterRates[booking.id] || ''} onChangeText={value => setCounterRates(current => ({ ...current, [booking.id]: value }))} keyboardType="decimal-pad" style={styles.input} /><Text style={styles.per}>/day</Text></View>
            <Pressable disabled={!!busy} onPress={() => talentRespond(booking, 'counter')} style={styles.secondary}><Text style={styles.secondaryText}>Send counter-offer</Text></Pressable>
            <Pressable disabled={!!busy} onPress={() => talentRespond(booking, 'decline')} style={styles.decline}><Text style={styles.declineText}>Decline</Text></Pressable>
          </View> : null}
          {booking.status === 'accepted' ? <Text style={styles.confirmHint}>Accepted · awaiting secure payment from the property.</Text> : null}
          {confirmed ? <Text style={styles.confirmHint}>Payment received · Residency confirmed.</Text> : null}
          {booking.employer_user_id ? <Pressable onPress={() => router.push({ pathname: '/message/[userId]', params: { userId: booking.employer_user_id } })}><Text style={styles.messageLink}>Message property →</Text></Pressable> : null}
        </View>
      })}
    </> : <>
      <Text style={styles.sectionTitle}>Your Residency bookings</Text>
      {bookings.length === 0 ? <Text style={styles.empty}>No Residency offers sent yet.</Text> : bookings.map(booking => {
        const confirmed = booking.status === 'confirmed' && Boolean(booking.paid_at)
        return <View key={booking.id} style={styles.card}>
          <View style={styles.cardTop}><Text style={styles.status}>{booking.status}</Text><Text style={styles.rate}>£{booking.proposed_day_rate}/day</Text></View>
          <Text style={styles.cardTitle}>{booking.candidate_name || 'Residency specialist'}</Text>
          <Text style={styles.meta}>{booking.start_date} → {booking.end_date} · {booking.days_required} days · £{booking.proposed_total}</Text>
          {booking.primary_specialism ? <Text style={styles.line}>{booking.primary_specialism}</Text> : null}
          {booking.status === 'countered' ? <View style={styles.actions}><Text style={styles.help}>The specialist has countered at £{booking.proposed_day_rate}/day.</Text><Pressable disabled={!!busy} onPress={() => employerRespond(booking, 'accept')} style={styles.primary}><Text style={styles.primaryText}>Accept counter-offer</Text></Pressable><Pressable disabled={!!busy} onPress={() => employerRespond(booking, 'decline')} style={styles.decline}><Text style={styles.declineText}>Decline counter</Text></Pressable></View> : null}
          {booking.status === 'accepted' ? <Pressable onPress={() => router.push({ pathname: '/residency-payment/[id]', params: { id: booking.id } })} style={styles.paymentButton}><Text style={styles.paymentButtonText}>Pay & confirm Residency →</Text></Pressable> : null}
          {confirmed ? <Text style={styles.confirmHint}>Payment received · Residency confirmed.</Text> : null}
          {booking.candidate_user_id ? <Pressable onPress={() => router.push({ pathname: '/message/[userId]', params: { userId: booking.candidate_user_id } })}><Text style={styles.messageLink}>Message specialist →</Text></Pressable> : null}
        </View>
      })}

      <Text style={[styles.sectionTitle,{marginTop:26}]}>Discover Residency specialists</Text>
      {profiles.length === 0 ? <Text style={styles.empty}>No active Residency specialists are currently listed.</Text> : profiles.map(profile => <View key={profile.id} style={styles.card}>
        <View style={styles.cardTop}><Text style={styles.status}>{profile.is_featured ? 'FEATURED' : profile.reference}</Text>{profile.day_rate ? <Text style={styles.rate}>from £{profile.day_rate}/day</Text> : null}</View>
        <Text style={styles.cardTitle}>{profile.title || profile.primary_specialism || 'Wellness specialist'}</Text>
        <Text style={styles.meta}>{[profile.current_location, profile.years_experience ? `${profile.years_experience} years experience` : null, profile.preferred_duration].filter(Boolean).join(' · ')}</Text>
        {profile.bio ? <Text style={styles.note}>{profile.bio}</Text> : null}
        {profile.secondary_specialisms?.length ? <Text style={styles.line}>Specialisms: {profile.secondary_specialisms.slice(0,4).join(', ')}</Text> : null}
        {profile.qualifications?.length ? <Text style={styles.line}>Qualifications: {profile.qualifications.slice(0,3).join(', ')}</Text> : null}
        {profile.brand_experience?.length ? <Text style={styles.line}>Brand experience: {profile.brand_experience.slice(0,3).join(', ')}</Text> : null}
        {profile.travel_availability ? <Text style={styles.line}>Will travel: {profile.travel_availability}</Text> : null}
        {profile.available_from ? <Text style={styles.line}>Available from: {profile.available_from}</Text> : null}
        <View style={styles.actions}>
          <Pressable disabled={!!busy} onPress={() => startConversation(profile)} style={styles.secondary}><Text style={styles.secondaryText}>{busy === `conversation-${profile.id}` ? 'Starting...' : 'Start private conversation'}</Text></Pressable>
          <Pressable disabled={!!busy} onPress={() => prepareOffer(profile)} style={styles.primary}><Text style={styles.primaryText}>Prepare structured offer</Text></Pressable>
        </View>
      </View>)}

      {offerTarget ? <View style={styles.offerPanel}>
        <View style={styles.panelTop}><Text style={styles.sectionTitle}>Offer · {offerTarget.reference}</Text><Pressable onPress={() => setOfferTarget(null)}><Text style={styles.close}>Close</Text></Pressable></View>
        <Text style={styles.help}>A private Residency conversation must exist before a formal offer can be sent.</Text>
        <Text style={styles.label}>Property</Text><TextInput value={propertyName} onChangeText={setPropertyName} style={styles.fullInput} />
        <View style={styles.twoCol}><View style={{flex:1}}><Text style={styles.label}>Start date</Text><TextInput value={startDate} onChangeText={setStartDate} style={styles.fullInput} /></View><View style={{flex:1}}><Text style={styles.label}>End date</Text><TextInput value={endDate} onChangeText={setEndDate} style={styles.fullInput} /></View></View>
        <View style={styles.twoCol}><View style={{flex:1}}><Text style={styles.label}>Days required</Text><TextInput value={daysRequired} onChangeText={setDaysRequired} keyboardType="number-pad" style={styles.fullInput} /></View><View style={{flex:1}}><Text style={styles.label}>Day rate £</Text><TextInput value={dayRate} onChangeText={setDayRate} keyboardType="decimal-pad" style={styles.fullInput} /></View></View>
        <Text style={styles.label}>Services required</Text><TextInput value={services} onChangeText={setServices} style={styles.fullInput} multiline />
        <Text style={styles.label}>Notes</Text><TextInput value={notes} onChangeText={setNotes} style={[styles.fullInput,{minHeight:72}]} multiline />
        <View style={styles.switchRow}><Text style={styles.switchLabel}>Accommodation included</Text><Switch value={accommodation} onValueChange={setAccommodation} /></View>
        <View style={styles.switchRow}><Text style={styles.switchLabel}>Travel included</Text><Switch value={travel} onValueChange={setTravel} /></View>
        <Pressable disabled={!!busy} onPress={sendOffer} style={styles.primary}><Text style={styles.primaryText}>{busy === `offer-${offerTarget.id}` ? 'Sending...' : 'Send Residency offer'}</Text></Pressable>
      </View> : null}
    </>}
  </ScrollView>
}

const styles = StyleSheet.create({
  scroll:{flex:1,backgroundColor:'#fff'},page:{paddingHorizontal:22,paddingTop:64,paddingBottom:120},center:{flex:1,alignItems:'center',justifyContent:'center',backgroundColor:'#fff'},back:{color:'#66747c',fontSize:13,marginBottom:34},eyebrow:{color:'#71808a',fontSize:9,letterSpacing:2.1,marginBottom:10},title:{color:'#092b45',fontSize:30,lineHeight:36,fontWeight:'500'},intro:{color:'#66747c',fontSize:14,lineHeight:21,marginTop:10,marginBottom:28},sectionTitle:{color:'#173246',fontSize:17,fontWeight:'600',marginBottom:10},membershipCard:{backgroundColor:'#f4f7f8',padding:18,marginBottom:24},help:{color:'#71808a',fontSize:11,lineHeight:17},empty:{color:'#71808a',fontSize:12,lineHeight:18,backgroundColor:'#f4f7f8',padding:17,marginBottom:18},card:{borderWidth:1,borderColor:'#dce3e7',padding:18,marginBottom:11},cardTop:{flexDirection:'row',justifyContent:'space-between',gap:10},status:{color:'#71808a',fontSize:9,textTransform:'uppercase',letterSpacing:1.1},rate:{color:'#092b45',fontSize:12,fontWeight:'700'},cardTitle:{color:'#173246',fontSize:18,fontWeight:'600',marginTop:8},meta:{color:'#66747c',fontSize:11,lineHeight:17,marginTop:5},line:{color:'#66747c',fontSize:10,lineHeight:16,marginTop:6},note:{color:'#5f6d75',fontSize:11,lineHeight:17,marginTop:10},actions:{marginTop:14,gap:9},primary:{backgroundColor:'#092b45',paddingVertical:14,alignItems:'center'},primaryText:{color:'#fff',fontSize:11,fontWeight:'700'},secondary:{borderWidth:1,borderColor:'#cfd9de',paddingVertical:13,alignItems:'center'},secondaryText:{color:'#173246',fontSize:11,fontWeight:'600'},decline:{paddingVertical:12,alignItems:'center'},declineText:{color:'#7a4a4a',fontSize:11,fontWeight:'600'},counterRow:{flexDirection:'row',alignItems:'center'},currency:{color:'#173246',fontSize:17,marginRight:5},input:{flex:1,borderWidth:1,borderColor:'#d7e0e4',paddingHorizontal:12,paddingVertical:10,color:'#173246',backgroundColor:'#fff'},per:{color:'#66747c',fontSize:11,marginLeft:6},confirmHint:{backgroundColor:'#eef5f0',color:'#456655',fontSize:10,lineHeight:16,padding:11,marginTop:12},paymentButton:{backgroundColor:'#092b45',paddingVertical:13,alignItems:'center',marginTop:12},paymentButtonText:{color:'#fff',fontSize:10,fontWeight:'700'},messageLink:{color:'#092b45',fontSize:10,fontWeight:'700',marginTop:12},offerPanel:{borderWidth:1,borderColor:'#ccd8dd',padding:18,marginTop:18,backgroundColor:'#f8fafb'},panelTop:{flexDirection:'row',justifyContent:'space-between',alignItems:'center'},close:{color:'#71808a',fontSize:10},label:{color:'#173246',fontSize:10,fontWeight:'600',marginTop:12,marginBottom:5},fullInput:{borderWidth:1,borderColor:'#d7e0e4',paddingHorizontal:11,paddingVertical:10,color:'#173246',fontSize:12,backgroundColor:'#fff'},twoCol:{flexDirection:'row',gap:10},switchRow:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',paddingVertical:10,borderBottomWidth:1,borderBottomColor:'#e8edef'},switchLabel:{color:'#66747c',fontSize:11},error:{color:'#9b2c2c',fontSize:11,lineHeight:17,marginBottom:16}
})
