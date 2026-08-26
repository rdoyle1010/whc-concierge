import { useEffect, useState } from 'react'
import { ActivityIndicator, AppState, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { supabase } from '../../src/lib/supabase'

type Booking = {
  id: string
  candidate_name?: string | null
  property_name?: string | null
  start_date: string
  end_date: string
  days_required: number
  proposed_day_rate: number
  proposed_total: number
  agreed_day_rate?: number | null
  agreed_total?: number | null
  platform_fee?: number | null
  status: string
  paid_at?: string | null
  amount_paid?: number | null
  payout_amount?: number | null
}

const WEB_URL = process.env.EXPO_PUBLIC_WEB_URL || 'https://talent.wellnesshousecollective.co.uk'

export default function ResidencyPaymentScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const [booking, setBooking] = useState<Booking | null>(null)
  const [loading, setLoading] = useState(true)
  const [paying, setPaying] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    load()
    const subscription = AppState.addEventListener('change', state => {
      if (state === 'active') load(false)
    })
    return () => subscription.remove()
  }, [id])

  async function authFetch(path: string, options?: RequestInit) {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.access_token) throw new Error('Your session has expired. Please sign in again.')
    const response = await fetch(`${WEB_URL}${path}`, {
      ...options,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}`, ...(options?.headers || {}) },
    })
    const body = await response.json().catch(() => ({}))
    if (!response.ok) throw new Error(body?.error || 'Could not load Residency payment.')
    return body
  }

  async function load(showSpinner = true) {
    if (showSpinner) setLoading(true)
    setError('')
    try {
      const dashboard = await authFetch('/api/mobile/residency/dashboard')
      if (dashboard?.role !== 'employer') throw new Error('Only the property can pay for a Residency booking.')
      const found = ((dashboard?.bookings || []) as Booking[]).find(row => row.id === id) || null
      setBooking(found)
      if (!found) setError('Residency booking not found.')
    } catch (e: any) {
      setError(e?.message || 'Could not load Residency payment.')
    } finally {
      if (showSpinner) setLoading(false)
    }
  }

  async function pay() {
    if (!booking) return
    setPaying(true)
    setError('')
    try {
      const result = await authFetch('/api/residency/checkout', {
        method: 'POST',
        body: JSON.stringify({ bookingId: booking.id, returnUrl: WEB_URL }),
      })
      if (!result?.url) throw new Error('Stripe checkout did not return a payment link.')
      await Linking.openURL(result.url)
    } catch (e: any) {
      setError(e?.message || 'Could not start Residency payment.')
    } finally {
      setPaying(false)
    }
  }

  if (loading) return <View style={styles.center}><ActivityIndicator color="#092b45" /></View>
  if (!booking) return <View style={styles.center}><Text style={styles.error}>{error || 'Residency booking not found.'}</Text><Pressable onPress={() => router.back()}><Text style={styles.back}>‹ Residency</Text></Pressable></View>

  const gross = Number(booking.agreed_total || booking.proposed_total || 0)
  const fee = Number((gross * 0.10).toFixed(2))
  const total = Number((gross + fee).toFixed(2))
  const rate = Number(booking.agreed_day_rate || booking.proposed_day_rate || 0)
  const paid = Boolean(booking.paid_at && booking.status === 'confirmed')

  return <ScrollView style={styles.scroll} contentContainerStyle={styles.page}>
    <Pressable onPress={() => router.back()}><Text style={styles.back}>‹ Residency</Text></Pressable>
    <Text style={styles.eyebrow}>RESIDENCY PAYMENT</Text>
    <Text style={styles.title}>{paid ? 'Residency confirmed.' : 'Secure the booking.'}</Text>
    <Text style={styles.intro}>{paid ? 'Payment has been received and the Residency is confirmed for both the property and specialist.' : 'Review the agreed commercial terms before opening secure Stripe Checkout.'}</Text>

    <View style={styles.card}>
      <Text style={styles.cardTitle}>{booking.candidate_name || 'Residency specialist'}</Text>
      <Text style={styles.meta}>{booking.start_date} → {booking.end_date} · {booking.days_required} working days</Text>
      <View style={styles.row}><Text style={styles.label}>Agreed day rate</Text><Text style={styles.value}>£{rate.toFixed(2)}</Text></View>
      <View style={styles.row}><Text style={styles.label}>Specialist booking value</Text><Text style={styles.value}>£{gross.toFixed(2)}</Text></View>
      <View style={styles.row}><Text style={styles.label}>WHC platform fee (10%)</Text><Text style={styles.value}>£{fee.toFixed(2)}</Text></View>
      <View style={[styles.row, styles.totalRow]}><Text style={styles.totalLabel}>Total due</Text><Text style={styles.totalValue}>£{total.toFixed(2)}</Text></View>
    </View>

    {paid ? <View style={styles.confirmed}>
      <Text style={styles.confirmedTitle}>Payment received · Residency confirmed</Text>
      <Text style={styles.help}>The specialist booking value is recorded for payout after the Residency under the existing platform payout process.</Text>
    </View> : booking.status === 'accepted' ? <>
      <Pressable disabled={paying} onPress={pay} style={[styles.primary, paying && styles.disabled]}><Text style={styles.primaryText}>{paying ? 'Opening secure payment...' : `Pay £${total.toFixed(2)} securely with Stripe`}</Text></Pressable>
      <Text style={styles.help}>Card details are handled by Stripe and are never stored in the app or Supabase.</Text>
    </> : <View style={styles.notice}><Text style={styles.noticeTitle}>Payment is not available yet.</Text><Text style={styles.help}>This Residency must be accepted before the property can pay. Current status: {booking.status}.</Text></View>}

    <Pressable onPress={() => load(false)}><Text style={styles.refresh}>Refresh payment status</Text></Pressable>
    {error ? <Text style={styles.error}>{error}</Text> : null}
  </ScrollView>
}

const styles = StyleSheet.create({
  scroll:{flex:1,backgroundColor:'#fff'},page:{paddingHorizontal:22,paddingTop:64,paddingBottom:110},center:{flex:1,alignItems:'center',justifyContent:'center',padding:28,backgroundColor:'#fff'},back:{color:'#66747c',fontSize:13,marginBottom:34},eyebrow:{color:'#71808a',fontSize:9,letterSpacing:2.1,marginBottom:10},title:{color:'#092b45',fontSize:30,lineHeight:36,fontWeight:'500'},intro:{color:'#66747c',fontSize:14,lineHeight:21,marginTop:10,marginBottom:24},card:{borderWidth:1,borderColor:'#dce3e7',padding:18},cardTitle:{color:'#173246',fontSize:18,fontWeight:'600'},meta:{color:'#66747c',fontSize:11,lineHeight:17,marginTop:6,marginBottom:14},row:{flexDirection:'row',justifyContent:'space-between',gap:14,paddingVertical:10,borderTopWidth:1,borderTopColor:'#edf1f3'},label:{color:'#66747c',fontSize:11,flex:1},value:{color:'#173246',fontSize:11,fontWeight:'600'},totalRow:{marginTop:3},totalLabel:{color:'#092b45',fontSize:13,fontWeight:'700'},totalValue:{color:'#092b45',fontSize:16,fontWeight:'700'},primary:{backgroundColor:'#092b45',paddingVertical:16,alignItems:'center',marginTop:20},primaryText:{color:'#fff',fontSize:11,fontWeight:'700'},disabled:{opacity:.45},help:{color:'#71808a',fontSize:10,lineHeight:16,marginTop:10},confirmed:{backgroundColor:'#eef5f0',padding:16,marginTop:18},confirmedTitle:{color:'#456655',fontSize:13,fontWeight:'700'},notice:{backgroundColor:'#f4f7f8',padding:16,marginTop:18},noticeTitle:{color:'#173246',fontSize:13,fontWeight:'600'},refresh:{color:'#092b45',fontSize:10,fontWeight:'700',marginTop:18},error:{color:'#9b2c2c',fontSize:11,lineHeight:17,marginTop:16}
})
