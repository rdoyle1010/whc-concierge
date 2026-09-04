import { useEffect, useState } from 'react'
import { ActivityIndicator, AppState, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { supabase } from '../../src/lib/supabase'
import { palette, radius, space, type } from '../../src/lib/theme'

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

const WEB_URL = process.env.EXPO_PUBLIC_WEB_URL || 'https://talenthousecollective.co.uk'

export default function ResidencyPaymentScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const [booking, setBooking] = useState<Booking | null>(null)
  const [loading, setLoading] = useState(true)
  const [paying, setPaying] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    void load()
    const subscription = AppState.addEventListener('change', state => {
      if (state === 'active') void load(false)
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

  if (loading) return <View style={styles.center}><ActivityIndicator color={palette.ink} /></View>
  if (!booking) return <View style={styles.center}><Text style={styles.error}>{error || 'Residency booking not found.'}</Text><Pressable onPress={() => router.back()}><Text style={styles.back}>‹ Residency</Text></Pressable></View>

  const gross = Number(booking.agreed_total || booking.proposed_total || 0)
  const fee = Number((gross * 0.10).toFixed(2))
  const total = Number((gross + fee).toFixed(2))
  const rate = Number(booking.agreed_day_rate || booking.proposed_day_rate || 0)
  const paid = Boolean(booking.paid_at && booking.status === 'confirmed')

  return <ScrollView style={styles.scroll} contentContainerStyle={styles.page}>
    <Pressable onPress={() => router.back()} style={styles.backButton}><Text style={styles.back}>‹ Residency</Text></Pressable>
    <Text style={styles.eyebrow}>RESIDENCY · SECURE PAYMENT</Text>
    <Text style={styles.title}>{paid ? 'Residency confirmed.' : 'Secure the placement.'}</Text>
    <Text style={styles.intro}>{paid ? 'Payment has been received and the Residency is confirmed for both the property and specialist.' : 'Review the agreed commercial terms before opening secure Stripe Checkout.'}</Text>

    <View style={[styles.statusCard, paid && styles.statusCardPaid]}>
      <View style={styles.statusTop}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.statusEyebrow, paid && styles.statusEyebrowPaid]}>{paid ? 'PAYMENT RECEIVED' : 'BOOKING STATUS'}</Text>
          <Text style={[styles.statusTitle, paid && styles.statusTitlePaid]}>{booking.candidate_name || 'Residency specialist'}</Text>
          <Text style={[styles.statusCopy, paid && styles.statusCopyPaid]}>{booking.start_date} → {booking.end_date} · {booking.days_required} working days</Text>
        </View>
        <View style={[styles.statusPill, paid && styles.statusPillPaid]}><Text style={[styles.statusPillText, paid && styles.statusPillTextPaid]}>{paid ? 'CONFIRMED' : booking.status.toUpperCase()}</Text></View>
      </View>
    </View>

    <View style={styles.commercialCard}>
      <Text style={styles.commercialEyebrow}>AGREED COMMERCIALS</Text>
      <View style={styles.commercialTop}>
        <View><Text style={styles.rate}>£{rate.toFixed(2)}<Text style={styles.rateUnit}>/day</Text></Text><Text style={styles.rateHelp}>{booking.days_required} working days</Text></View>
        <View style={styles.totalBlock}><Text style={styles.totalValueHero}>£{gross.toFixed(2)}</Text><Text style={styles.totalLabelHero}>specialist booking value</Text></View>
      </View>
      <View style={styles.breakdown}>
        <CostRow label="Specialist booking value" value={`£${gross.toFixed(2)}`} dark />
        <CostRow label="WHC platform fee (10%)" value={`£${fee.toFixed(2)}`} dark />
        <View style={styles.breakdownDivider} />
        <CostRow label="Total due" value={`£${total.toFixed(2)}`} dark strong />
      </View>
    </View>

    {paid ? <View style={styles.confirmedCard}>
      <Text style={styles.confirmedEyebrow}>CONFIRMED PLACEMENT</Text>
      <Text style={styles.confirmedTitle}>Payment received. The Residency is secured.</Text>
      <Text style={styles.confirmedCopy}>The specialist booking value is recorded for payout after the Residency under the existing WHC payout process.</Text>
      {booking.amount_paid ? <View style={styles.confirmedMeta}><Text style={styles.confirmedMetaLabel}>Amount paid</Text><Text style={styles.confirmedMetaValue}>£{Number(booking.amount_paid).toFixed(2)}</Text></View> : null}
    </View> : booking.status === 'accepted' ? <>
      <View style={styles.paymentCard}>
        <Text style={styles.sectionEyebrow}>READY TO CONFIRM</Text>
        <Text style={styles.sectionTitle}>Complete secure payment</Text>
        <Text style={styles.sectionCopy}>The specialist has accepted the Residency terms. Payment secures the booking and moves the placement into confirmed status.</Text>
        <Pressable disabled={paying} onPress={pay} style={[styles.primary, paying && styles.disabled]}>{paying ? <ActivityIndicator color={palette.paper} /> : <Text style={styles.primaryText}>Pay £{total.toFixed(2)} securely with Stripe</Text>}</Pressable>
        <Text style={styles.secureNote}>Card details are handled by Stripe and are never stored in the app or Supabase.</Text>
      </View>
    </> : <View style={styles.notice}>
      <Text style={styles.noticeEyebrow}>PAYMENT LOCKED</Text>
      <Text style={styles.noticeTitle}>This Residency is not ready for payment yet.</Text>
      <Text style={styles.noticeCopy}>The specialist must accept the Residency before the property can pay. Current status: {booking.status}.</Text>
    </View>}

    <View style={styles.protectionCard}>
      <Text style={styles.protectionEyebrow}>WHC PAYMENT PROTECTION</Text>
      <Text style={styles.protectionTitle}>Clear terms before money moves.</Text>
      <Text style={styles.protectionCopy}>The agreed day rate, booking value and WHC fee are shown before checkout. Stripe handles card processing securely and WHC records the confirmed payment against this Residency booking.</Text>
    </View>

    <Pressable onPress={() => load(false)} style={styles.refreshButton}><Text style={styles.refresh}>Refresh payment status</Text><Text style={styles.refreshArrow}>↻</Text></Pressable>
    {error ? <View style={styles.errorCard}><Text style={styles.errorTitle}>Payment status could not update</Text><Text style={styles.error}>{error}</Text></View> : null}
  </ScrollView>
}

function CostRow({ label, value, dark = false, strong = false }: { label: string; value: string; dark?: boolean; strong?: boolean }) {
  return <View style={styles.costRow}><Text style={[styles.costLabel, dark && styles.costLabelDark, strong && styles.costStrong]}>{label}</Text><Text style={[styles.costValue, dark && styles.costValueDark, strong && styles.costStrong]}>{value}</Text></View>
}

const styles = StyleSheet.create({
  scroll:{flex:1,backgroundColor:palette.stone},
  page:{paddingHorizontal:space.page,paddingTop:18,paddingBottom:118},
  center:{flex:1,alignItems:'center',justifyContent:'center',padding:28,backgroundColor:palette.stone},
  backButton:{alignSelf:'flex-start',paddingVertical:6,marginBottom:22},
  back:{color:palette.muted,fontSize:13,fontFamily:type.sans},
  eyebrow:{color:palette.quiet,fontSize:8,letterSpacing:2.1,marginBottom:9,fontWeight:'700',fontFamily:type.sans},
  title:{color:palette.inkStrong,fontSize:34,lineHeight:40,fontWeight:'400',fontFamily:type.serif,maxWidth:360},
  intro:{color:palette.muted,fontSize:13,lineHeight:20,marginTop:10,marginBottom:22,fontFamily:type.sans},
  statusCard:{backgroundColor:palette.paper,borderWidth:1,borderColor:palette.line,padding:17,borderRadius:radius.large,marginBottom:10},
  statusCardPaid:{backgroundColor:palette.inkStrong,borderColor:palette.inkStrong},
  statusTop:{flexDirection:'row',gap:12,alignItems:'flex-start'},
  statusEyebrow:{color:palette.quiet,fontSize:7.5,letterSpacing:1.3,fontWeight:'700',fontFamily:type.sans},
  statusEyebrowPaid:{color:'#CBD5D9'},
  statusTitle:{color:palette.inkStrong,fontSize:20,lineHeight:25,fontWeight:'400',fontFamily:type.serif,marginTop:5},
  statusTitlePaid:{color:palette.paper},
  statusCopy:{color:palette.muted,fontSize:10.5,lineHeight:17,marginTop:5,fontFamily:type.sans},
  statusCopyPaid:{color:'#DCE4E7'},
  statusPill:{backgroundColor:palette.stoneDeep,paddingHorizontal:8,paddingVertical:5,borderRadius:999},
  statusPillPaid:{backgroundColor:palette.paper},
  statusPillText:{color:palette.quiet,fontSize:7,fontWeight:'800',letterSpacing:.8,fontFamily:type.sans},
  statusPillTextPaid:{color:palette.inkStrong},
  commercialCard:{backgroundColor:palette.inkStrong,padding:18,borderRadius:radius.large,marginBottom:10},
  commercialEyebrow:{color:'#CBD5D9',fontSize:7.5,letterSpacing:1.3,fontWeight:'700',fontFamily:type.sans},
  commercialTop:{flexDirection:'row',justifyContent:'space-between',alignItems:'flex-end',gap:12,marginTop:6},
  rate:{color:palette.paper,fontSize:31,fontWeight:'400',fontFamily:type.serif},
  rateUnit:{fontSize:11,fontWeight:'600',fontFamily:type.sans},
  rateHelp:{color:'#D8E1E4',fontSize:8.5,marginTop:3,fontFamily:type.sans},
  totalBlock:{alignItems:'flex-end'},
  totalValueHero:{color:palette.paper,fontSize:21,fontWeight:'700',fontFamily:type.sans},
  totalLabelHero:{color:'#CBD5D9',fontSize:7.5,marginTop:3,fontFamily:type.sans},
  breakdown:{borderTopWidth:1,borderTopColor:'rgba(255,255,255,.16)',marginTop:14,paddingTop:8},
  costRow:{flexDirection:'row',justifyContent:'space-between',gap:12,paddingVertical:6},
  costLabel:{color:palette.muted,fontSize:9.5,fontFamily:type.sans},
  costValue:{color:palette.inkStrong,fontSize:10,fontWeight:'700',fontFamily:type.sans},
  costLabelDark:{color:'#D8E1E4'},
  costValueDark:{color:palette.paper},
  costStrong:{fontSize:12,fontWeight:'800'},
  breakdownDivider:{height:1,backgroundColor:'rgba(255,255,255,.16)',marginVertical:5},
  confirmedCard:{backgroundColor:palette.stoneDeep,padding:16,borderRadius:radius.large,marginBottom:10},
  confirmedEyebrow:{color:palette.sage,fontSize:7.5,letterSpacing:1.2,fontWeight:'800',fontFamily:type.sans},
  confirmedTitle:{color:palette.inkStrong,fontSize:18,lineHeight:23,fontWeight:'400',fontFamily:type.serif,marginTop:5},
  confirmedCopy:{color:palette.muted,fontSize:10.5,lineHeight:17,marginTop:5,fontFamily:type.sans},
  confirmedMeta:{flexDirection:'row',justifyContent:'space-between',gap:12,borderTopWidth:1,borderTopColor:palette.line,marginTop:12,paddingTop:10},
  confirmedMetaLabel:{color:palette.quiet,fontSize:9,fontFamily:type.sans},
  confirmedMetaValue:{color:palette.inkStrong,fontSize:10.5,fontWeight:'700',fontFamily:type.sans},
  paymentCard:{backgroundColor:palette.paper,borderWidth:1,borderColor:palette.line,padding:17,borderRadius:radius.large,marginBottom:10},
  sectionEyebrow:{color:palette.quiet,fontSize:7.5,letterSpacing:1.3,fontWeight:'700',fontFamily:type.sans},
  sectionTitle:{color:palette.inkStrong,fontSize:19,lineHeight:24,fontWeight:'400',fontFamily:type.serif,marginTop:5},
  sectionCopy:{color:palette.muted,fontSize:10.5,lineHeight:17,marginTop:5,fontFamily:type.sans},
  primary:{backgroundColor:palette.ink,paddingVertical:14,alignItems:'center',marginTop:14,borderRadius:radius.medium},
  primaryText:{color:palette.paper,fontSize:10.5,fontWeight:'700',fontFamily:type.sans},
  secureNote:{color:palette.quiet,fontSize:8.5,lineHeight:13,textAlign:'center',marginTop:7,fontFamily:type.sans},
  notice:{backgroundColor:palette.stoneDeep,padding:16,borderRadius:radius.large,marginBottom:10},
  noticeEyebrow:{color:palette.quiet,fontSize:7.5,letterSpacing:1.2,fontWeight:'700',fontFamily:type.sans},
  noticeTitle:{color:palette.inkStrong,fontSize:17,lineHeight:22,fontWeight:'400',fontFamily:type.serif,marginTop:5},
  noticeCopy:{color:palette.muted,fontSize:10.5,lineHeight:17,marginTop:5,fontFamily:type.sans},
  protectionCard:{backgroundColor:palette.paper,borderWidth:1,borderColor:palette.line,padding:16,borderRadius:radius.large},
  protectionEyebrow:{color:palette.quiet,fontSize:7.5,letterSpacing:1.2,fontWeight:'700',fontFamily:type.sans},
  protectionTitle:{color:palette.inkStrong,fontSize:17,lineHeight:22,fontWeight:'400',fontFamily:type.serif,marginTop:5},
  protectionCopy:{color:palette.muted,fontSize:10,lineHeight:16,marginTop:5,fontFamily:type.sans},
  refreshButton:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',paddingVertical:13,marginTop:7},
  refresh:{color:palette.ink,fontSize:9.5,fontWeight:'700',fontFamily:type.sans},
  refreshArrow:{color:palette.ink,fontSize:14},
  errorCard:{backgroundColor:palette.dangerSoft,borderWidth:1,borderColor:'#E8D7D4',padding:14,borderRadius:radius.large,marginTop:8},
  errorTitle:{color:palette.danger,fontSize:13,fontWeight:'700',fontFamily:type.sans},
  error:{color:palette.danger,fontSize:10.5,lineHeight:17,marginTop:4,fontFamily:type.sans},
  disabled:{opacity:.45},
})
