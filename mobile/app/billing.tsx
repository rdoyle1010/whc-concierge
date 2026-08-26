import { useEffect, useState } from 'react'
import { ActivityIndicator, Alert, AppState, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { router } from 'expo-router'
import { supabase } from '../src/lib/supabase'

type Role = 'talent' | 'employer'
type FeaturedEmployerOffer = {
  product_key: string
  label: string
  description: string
  price_pence: number
  billing_interval: 'month' | 'year' | 'one_off'
}
type StatusPayload = { role: Role; profile: any; featuredEmployerOffer?: FeaturedEmployerOffer | null }

const WEB_URL = process.env.EXPO_PUBLIC_WEB_URL || 'https://talent.wellnesshousecollective.co.uk'

function dateLabel(value?: string | null) {
  if (!value) return ''
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '' : date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

function priceLabel(pence: number, interval?: string | null) {
  const pounds = pence / 100
  const amount = Number.isInteger(pounds) ? `£${pounds}` : `£${pounds.toFixed(2)}`
  return interval === 'year' ? `${amount} / year` : interval === 'month' ? `${amount} / month` : amount
}

export default function BillingScreen() {
  const [data, setData] = useState<StatusPayload | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    load()
    const sub = AppState.addEventListener('change', state => { if (state === 'active') load(false) })
    return () => sub.remove()
  }, [])

  async function authFetch(path: string, options?: RequestInit) {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.access_token) throw new Error('Your session has expired. Please sign in again.')
    const response = await fetch(`${WEB_URL}${path}`, {
      ...options,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}`, ...(options?.headers || {}) },
    })
    const body = await response.json().catch(() => ({}))
    if (!response.ok) throw new Error(body?.error || 'Could not load billing.')
    return body
  }

  async function load(showSpinner = true) {
    if (showSpinner) setLoading(true)
    setError('')
    try {
      setData(await authFetch('/api/mobile/billing/status'))
    } catch (e: any) {
      setError(e?.message || 'Could not load billing.')
    } finally {
      if (showSpinner) setLoading(false)
    }
  }

  async function checkout(product: string) {
    setBusy(product); setError('')
    try {
      const result = await authFetch('/api/commercial/checkout', {
        method: 'POST',
        body: JSON.stringify({ product, returnUrl: WEB_URL }),
      })
      if (!result?.url) throw new Error('Checkout did not return a secure payment link.')
      Alert.alert('Secure checkout', 'Stripe will open securely. Return to the app after payment and your membership will refresh automatically.')
      await Linking.openURL(result.url)
    } catch (e: any) {
      setError(e?.message || 'Could not start checkout.')
    } finally {
      setBusy('')
    }
  }

  async function checkoutFeaturedEmployer() {
    if (!data?.profile?.id) return
    setBusy('featured_employer'); setError('')
    try {
      const result = await authFetch('/api/stripe/featured-employer', {
        method: 'POST',
        body: JSON.stringify({ employerId: data.profile.id, returnUrl: WEB_URL, returnPath: '/billing' }),
      })
      if (!result?.url) throw new Error('Featured Employer checkout did not return a secure payment link.')
      Alert.alert('Featured Employer', 'Stripe will open securely. Return to the app after payment and your Featured status will refresh automatically.')
      await Linking.openURL(result.url)
    } catch (e: any) {
      setError(e?.message || 'Could not start Featured Employer checkout.')
    } finally {
      setBusy('')
    }
  }

  async function manage(scope = '') {
    setBusy(scope === 'featured_employer' ? 'manage_featured' : 'manage'); setError('')
    try {
      const result = await authFetch('/api/billing/portal', {
        method: 'POST',
        body: JSON.stringify({ returnUrl: WEB_URL, returnPath: '/billing', ...(scope ? { scope } : {}) }),
      })
      if (!result?.url) throw new Error('Billing portal unavailable.')
      await Linking.openURL(result.url)
    } catch (e: any) {
      setError(e?.message || 'Could not open billing management.')
    } finally {
      setBusy('')
    }
  }

  if (loading) return <View style={styles.center}><ActivityIndicator color="#092b45" /></View>
  if (!data?.profile) return <View style={styles.center}><Text style={styles.error}>{error || 'Billing profile not found.'}</Text></View>

  const { role, profile } = data
  const tier = String(profile.membership_tier || 'free').toLowerCase()
  const paidMembership = role === 'talent' ? ['standard', 'pro'].includes(tier) : ['pro', 'group'].includes(tier)
  const renewal = dateLabel(profile.membership_renews_at)
  const featuredActive = role === 'employer' && Boolean(profile.featured_employer && (!profile.featured_until || new Date(profile.featured_until).getTime() > Date.now()))

  return <ScrollView style={styles.scroll} contentContainerStyle={styles.page}>
    <Pressable onPress={() => router.back()}><Text style={styles.back}>‹ Back</Text></Pressable>
    <Text style={styles.eyebrow}>MEMBERSHIP & BILLING</Text>
    <Text style={styles.title}>{role === 'talent' ? 'Invest in your career.' : 'Your recruitment membership.'}</Text>
    <Text style={styles.intro}>{role === 'talent' ? 'See your live entitlements, upgrade your membership and manage Featured Talent from the same account as the website.' : 'See your employer membership, included job allowance and Featured Employer visibility in one place.'}</Text>
    {error ? <Text style={styles.error}>{error}</Text> : null}

    <View style={styles.currentCard}>
      <View style={styles.row}><View><Text style={styles.label}>CURRENT PLAN</Text><Text style={styles.plan}>{tier === 'free' ? 'Free' : tier.charAt(0).toUpperCase() + tier.slice(1)}</Text></View><Text style={styles.status}>{paidMembership ? 'ACTIVE' : 'FREE'}</Text></View>
      {renewal ? <Text style={styles.line}>{profile.membership_cancel_at_period_end ? 'Access ends' : 'Renews'} {renewal}</Text> : null}
      {role === 'talent' ? <>
        <Text style={styles.line}>{Number(profile.interview_ready_credits || 0)} Interview Ready credit{Number(profile.interview_ready_credits || 0) === 1 ? '' : 's'} available</Text>
        <Text style={styles.line}>{Number(profile.academy_discount_pct || 0)}% Academy discount</Text>
        {Number(profile.free_feature_credits || 0) > 0 ? <Text style={styles.line}>{profile.free_feature_credits} free Featured Talent credit</Text> : null}
      </> : <>
        {tier === 'group' ? <Text style={styles.line}>{Math.max(0, Number(profile.annual_job_allowance || 0) - Number(profile.annual_jobs_used || 0))} of {Number(profile.annual_job_allowance || 0)} included jobs remaining</Text> : null}
        {tier === 'pro' ? <Text style={styles.line}>Standard Jobs discounted to £99</Text> : null}
      </>}
      {paidMembership ? <Pressable disabled={!!busy} onPress={() => manage()} style={styles.secondary}><Text style={styles.secondaryText}>{busy === 'manage' ? 'Opening...' : 'Manage membership & payment method'}</Text></Pressable> : null}
    </View>

    {role === 'talent' ? <>
      {!paidMembership ? <>
        <Text style={styles.sectionTitle}>Talent membership</Text>
        <View style={styles.card}><Text style={styles.cardTitle}>Standard</Text><Text style={styles.price}>£9.99 / month</Text><Text style={styles.copy}>1 Interview Ready credit each month, enhanced matching and 10% Academy discount.</Text><Pressable disabled={!!busy} onPress={() => checkout('talent_standard')} style={styles.primary}><Text style={styles.primaryText}>{busy === 'talent_standard' ? 'Opening...' : 'Choose Standard'}</Text></Pressable></View>
        <View style={styles.card}><Text style={styles.cardTitle}>Pro</Text><Text style={styles.price}>£19.99 / month</Text><Text style={styles.copy}>10 Interview Ready credits each month, priority visibility, advanced preparation and 20% Academy discount.</Text><Pressable disabled={!!busy} onPress={() => checkout('talent_pro')} style={styles.primary}><Text style={styles.primaryText}>{busy === 'talent_pro' ? 'Opening...' : 'Choose Pro'}</Text></Pressable></View>
      </> : null}

      <Text style={styles.sectionTitle}>Featured Talent</Text>
      {profile.is_featured && profile.featured_until ? <View style={styles.activeBox}><Text style={styles.activeTitle}>Featured until {dateLabel(profile.featured_until)}</Text><Text style={styles.copy}>Your profile currently receives premium visibility in employer discovery and WHC featured placements.</Text></View> : null}
      <View style={styles.card}><Text style={styles.cardTitle}>7 days</Text><Text style={styles.price}>£9.99</Text><Text style={styles.copy}>A short visibility boost for active job searching.</Text><Pressable disabled={!!busy} onPress={() => checkout('featured_talent_7')} style={styles.secondary}><Text style={styles.secondaryText}>{busy === 'featured_talent_7' ? 'Opening...' : 'Feature me for 7 days'}</Text></Pressable></View>
      <View style={styles.card}><Text style={styles.cardTitle}>30 days</Text><Text style={styles.price}>£24.99</Text><Text style={styles.copy}>A month of premium profile visibility.</Text><Pressable disabled={!!busy} onPress={() => checkout('featured_talent_30')} style={styles.secondary}><Text style={styles.secondaryText}>{busy === 'featured_talent_30' ? 'Opening...' : 'Feature me for 30 days'}</Text></Pressable></View>

      <Text style={styles.sectionTitle}>Other paid services</Text>
      <View style={styles.miniCard}><Text style={styles.cardTitle}>Agency Register</Text><Text style={styles.copy}>{profile.agency_available ? `Active${profile.agency_tier ? ` · ${profile.agency_tier}` : ''}` : 'Not currently listed'}</Text><Pressable onPress={() => router.push('/agency-account')}><Text style={styles.link}>Manage Agency →</Text></Pressable></View>
      <View style={styles.miniCard}><Text style={styles.cardTitle}>Residency</Text><Text style={styles.copy}>{profile.residency_member ? 'Membership active' : 'No active Residency membership'}</Text><Pressable onPress={() => router.push('/residency-setup')}><Text style={styles.link}>Manage Residency →</Text></Pressable></View>
    </> : <>
      {!paidMembership ? <>
        <Text style={styles.sectionTitle}>Employer membership</Text>
        <View style={styles.card}><Text style={styles.cardTitle}>Employer Pro</Text><Text style={styles.price}>£499 / year</Text><Text style={styles.copy}>Full Talent search, enhanced matching, analytics and £99 Standard Jobs.</Text><Pressable disabled={!!busy} onPress={() => checkout('employer_pro')} style={styles.primary}><Text style={styles.primaryText}>{busy === 'employer_pro' ? 'Opening...' : 'Choose Employer Pro'}</Text></Pressable></View>
        <View style={styles.card}><Text style={styles.cardTitle}>Employer Group</Text><Text style={styles.price}>£999 / year</Text><Text style={styles.copy}>Multi-property recruitment, advanced tools and up to 20 included jobs each year.</Text><Pressable disabled={!!busy} onPress={() => checkout('employer_group')} style={styles.primary}><Text style={styles.primaryText}>{busy === 'employer_group' ? 'Opening...' : 'Choose Employer Group'}</Text></Pressable></View>
      </> : null}

      <Text style={styles.sectionTitle}>Featured Employer</Text>
      {featuredActive ? <View style={styles.activeBox}>
        <Text style={styles.activeTitle}>Featured Employer active</Text>
        <Text style={styles.copy}>{profile.featured_until ? `Current paid period runs until ${dateLabel(profile.featured_until)}.` : 'Your property currently receives enhanced visibility.'}</Text>
        <Pressable disabled={!!busy} onPress={() => manage('featured_employer')} style={styles.secondary}><Text style={styles.secondaryText}>{busy === 'manage_featured' ? 'Opening...' : 'Manage Featured subscription'}</Text></Pressable>
      </View> : data.featuredEmployerOffer ? <View style={styles.card}>
        <Text style={styles.cardTitle}>{data.featuredEmployerOffer.label}</Text>
        <Text style={styles.price}>{priceLabel(data.featuredEmployerOffer.price_pence, data.featuredEmployerOffer.billing_interval)}</Text>
        <Text style={styles.copy}>{data.featuredEmployerOffer.description}</Text>
        <Text style={styles.copy}>Featured property placement, homepage exposure and a launch alert to approved Talent. This is separate from Employer Pro/Group and Preferred Employer.</Text>
        <Pressable disabled={!!busy} onPress={checkoutFeaturedEmployer} style={styles.primary}><Text style={styles.primaryText}>{busy === 'featured_employer' ? 'Opening...' : 'Go Featured'}</Text></Pressable>
      </View> : <View style={styles.miniCard}><Text style={styles.copy}>Featured Employer is not currently available for purchase.</Text></View>}
    </>}
  </ScrollView>
}

const styles = StyleSheet.create({
  scroll:{flex:1,backgroundColor:'#fff'},page:{paddingHorizontal:22,paddingTop:64,paddingBottom:120},center:{flex:1,alignItems:'center',justifyContent:'center',padding:24,backgroundColor:'#fff'},back:{color:'#66747c',fontSize:13,marginBottom:34},eyebrow:{color:'#71808a',fontSize:9,letterSpacing:2.1,marginBottom:10},title:{color:'#092b45',fontSize:30,lineHeight:36,fontWeight:'500'},intro:{color:'#66747c',fontSize:14,lineHeight:21,marginTop:10,marginBottom:24},currentCard:{backgroundColor:'#f4f7f8',padding:18,marginBottom:28},row:{flexDirection:'row',justifyContent:'space-between',gap:12},label:{color:'#71808a',fontSize:8,letterSpacing:1.5},plan:{color:'#092b45',fontSize:24,fontWeight:'600',marginTop:4},status:{color:'#456655',fontSize:9,fontWeight:'700',letterSpacing:1.1,paddingTop:4},line:{color:'#66747c',fontSize:11,lineHeight:17,marginTop:7},sectionTitle:{color:'#173246',fontSize:17,fontWeight:'600',marginBottom:10,marginTop:6},card:{borderWidth:1,borderColor:'#dce3e7',padding:18,marginBottom:11},miniCard:{borderWidth:1,borderColor:'#e2e8eb',padding:16,marginBottom:10},cardTitle:{color:'#173246',fontSize:17,fontWeight:'600'},price:{color:'#092b45',fontSize:20,fontWeight:'600',marginTop:5},copy:{color:'#71808a',fontSize:11,lineHeight:17,marginTop:7},primary:{backgroundColor:'#092b45',paddingVertical:14,alignItems:'center',marginTop:14},primaryText:{color:'#fff',fontSize:11,fontWeight:'700'},secondary:{borderWidth:1,borderColor:'#cbd7dc',paddingVertical:13,alignItems:'center',marginTop:14},secondaryText:{color:'#173246',fontSize:11,fontWeight:'600'},activeBox:{backgroundColor:'#eef5f0',padding:16,marginBottom:11},activeTitle:{color:'#456655',fontSize:14,fontWeight:'700'},link:{color:'#092b45',fontSize:10,fontWeight:'700',marginTop:10},error:{color:'#9b2c2c',fontSize:11,lineHeight:17,marginBottom:14}
})
