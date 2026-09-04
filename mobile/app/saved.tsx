import { useEffect, useState } from 'react'
import { ActivityIndicator, Alert, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native'
import { router } from 'expo-router'
import { supabase } from '../src/lib/supabase'
import { palette, radius, space, type } from '../src/lib/theme'

// Saved Roles existed on the website and nowhere in the app, so a role
// bookmarked on the sofa could not be found again on the train. The bookmark
// itself was always shared - /api/saved-jobs reads a cookie or a bearer token
// and writes the same rows - it was only the screen that was missing.

const WEB_URL = process.env.EXPO_PUBLIC_WEB_URL || 'https://talenthousecollective.co.uk'

type SavedRow = {
  id: string
  job_id: string
  job_listings?: {
    id?: string
    job_title?: string
    location?: string
    contract_type?: string
    salary_min?: number | null
    salary_max?: number | null
    tier?: string | null
    is_live?: boolean | null
    employer_profiles?: { property_name?: string | null; company_name?: string | null } | null
  } | null
}

function salaryLabel(min?: number | null, max?: number | null) {
  if (!min || !max) return ''
  const short = (value: number) => (value >= 1000 ? `£${Math.round(value / 1000)}k` : `£${value}`)
  return `${short(min)} - ${short(max)}`
}

export default function SavedRolesScreen() {
  const [saved, setSaved] = useState<SavedRow[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [removing, setRemoving] = useState('')
  const [error, setError] = useState('')

  useEffect(() => { void load() }, [])

  async function authFetch(path: string, options?: RequestInit) {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.access_token) throw new Error('Your session has expired. Please sign in again.')
    const response = await fetch(`${WEB_URL}${path}`, {
      ...options,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}`, ...(options?.headers || {}) },
    })
    const body = await response.json().catch(() => ({}))
    if (!response.ok) throw new Error(body?.error || 'Could not load your saved roles.')
    return body
  }

  async function load(showSpinner = true) {
    if (showSpinner) setLoading(true)
    setError('')
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.replace('/login'); return }
      const body = await authFetch('/api/saved-jobs')
      setSaved(body.saved || [])
    } catch (e: any) {
      setError(e?.message || 'Could not load your saved roles.')
    } finally {
      if (showSpinner) setLoading(false)
    }
  }

  async function remove(jobId: string) {
    setRemoving(jobId)
    // Removed from the list first, and put back if the server refuses. A
    // bookmark that lingers after you tap the bin reads as a broken button.
    const previous = saved
    setSaved(current => current.filter(row => row.job_id !== jobId))
    try {
      await authFetch('/api/saved-jobs', { method: 'DELETE', body: JSON.stringify({ jobId }) })
    } catch (e: any) {
      setSaved(previous)
      Alert.alert('Not removed', e?.message || 'Could not remove this role.')
    } finally {
      setRemoving('')
    }
  }

  if (loading) return <View style={styles.center}><ActivityIndicator color={palette.ink} /></View>

  return <ScrollView
    style={styles.scroll}
    contentContainerStyle={styles.page}
    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(false); setRefreshing(false) }} tintColor={palette.muted} />}
  >
    <Pressable onPress={() => router.back()} style={styles.backButton}><Text style={styles.back}>← Back</Text></Pressable>
    <Text style={styles.eyebrow}>JOBS & MATCHES</Text>
    <Text style={styles.title}>Saved Roles</Text>
    <Text style={styles.intro}>Roles you have bookmarked to read properly and apply for later.</Text>

    {error ? <Text style={styles.error}>{error}</Text> : null}

    {saved.length === 0 ? <View style={styles.empty}>
      <Text style={styles.emptyTitle}>Nothing saved yet</Text>
      <Text style={styles.emptyCopy}>Bookmark a role while you are browsing and it waits here until you have time to read it properly.</Text>
      <Pressable onPress={() => router.push('/jobs')} style={styles.primary}><Text style={styles.primaryText}>BROWSE ROLES</Text></Pressable>
    </View> : saved.map(row => {
      const job = row.job_listings
      if (!job) return null
      const property = job.employer_profiles?.property_name || job.employer_profiles?.company_name || 'A property'
      const salary = salaryLabel(job.salary_min, job.salary_max)
      return <View key={row.id} style={styles.card}>
        <View style={styles.cardTop}>
          <Text style={styles.property}>{property.toUpperCase()}</Text>
          {job.tier ? <Text style={styles.tier}>{String(job.tier).toUpperCase()}</Text> : null}
        </View>
        <Text style={styles.role}>{job.job_title || 'Role'}</Text>
        <Text style={styles.meta}>
          {[job.location, job.contract_type ? String(job.contract_type).replace('_', ' ') : '', salary].filter(Boolean).join('  ·  ')}
        </Text>
        {job.is_live === false ? <Text style={styles.closed}>This role is no longer live. It stays here until you remove it.</Text> : null}
        <View style={styles.actions}>
          <Pressable onPress={() => router.push({ pathname: '/job/[id]', params: { id: row.job_id } })} style={styles.primaryCompact}>
            <Text style={styles.primaryText}>VIEW & APPLY</Text>
          </Pressable>
          <Pressable onPress={() => remove(row.job_id)} disabled={removing === row.job_id} style={[styles.secondaryCompact, removing === row.job_id && styles.disabled]}>
            <Text style={styles.secondaryText}>{removing === row.job_id ? 'REMOVING' : 'REMOVE'}</Text>
          </Pressable>
        </View>
      </View>
    })}
  </ScrollView>
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: palette.stone },
  page: { paddingHorizontal: space.page, paddingTop: 18, paddingBottom: 120 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: palette.stone },
  backButton: { alignSelf: 'flex-start', paddingVertical: 6, marginBottom: 22 },
  back: { color: palette.muted, fontSize: 13 },
  eyebrow: { color: palette.quiet, fontSize: 8, letterSpacing: 2.2, fontWeight: '700', marginBottom: 9 },
  title: { color: palette.inkStrong, fontFamily: type.serif, fontSize: 34, lineHeight: 40, fontWeight: '400', maxWidth: 365 },
  intro: { color: palette.muted, fontSize: 13, lineHeight: 20, marginTop: 10, marginBottom: 22, maxWidth: 365 },
  error: { color: palette.danger, fontSize: 11, lineHeight: 17, marginBottom: 14 },
  empty: { borderWidth: 1, borderColor: palette.line, backgroundColor: palette.paper, padding: 22, borderRadius: radius.large, alignItems: 'center' },
  emptyTitle: { color: palette.inkStrong, fontFamily: type.serif, fontSize: 21, fontWeight: '400' },
  emptyCopy: { color: palette.muted, fontSize: 11, lineHeight: 17, marginTop: 7, marginBottom: 16, textAlign: 'center' },
  card: { borderWidth: 1, borderColor: palette.line, backgroundColor: palette.paper, padding: 17, borderRadius: radius.large, marginBottom: 10 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 },
  property: { color: palette.quiet, fontSize: 8, letterSpacing: 1.4, fontWeight: '700', flex: 1 },
  tier: { color: palette.sage, fontSize: 8, letterSpacing: 1.1, fontWeight: '800' },
  role: { color: palette.inkStrong, fontFamily: type.serif, fontSize: 21, lineHeight: 26, fontWeight: '400', marginTop: 6 },
  meta: { color: palette.muted, fontSize: 10.5, lineHeight: 16, marginTop: 6 },
  closed: { color: palette.danger, fontSize: 10, lineHeight: 15, marginTop: 8 },
  actions: { flexDirection: 'row', gap: 9, marginTop: 14 },
  primary: { backgroundColor: palette.inkStrong, paddingVertical: 13, paddingHorizontal: 20, alignItems: 'center', borderRadius: radius.medium },
  primaryCompact: { flex: 1, backgroundColor: palette.inkStrong, paddingVertical: 12, alignItems: 'center', borderRadius: radius.medium },
  primaryText: { color: palette.paper, fontSize: 10.5, fontWeight: '700', letterSpacing: .6 },
  secondaryCompact: { borderWidth: 1, borderColor: palette.lineStrong, paddingVertical: 11, paddingHorizontal: 16, alignItems: 'center', borderRadius: radius.medium },
  secondaryText: { color: palette.ink, fontSize: 10.5, fontWeight: '700', letterSpacing: .6 },
  disabled: { opacity: .5 },
})
