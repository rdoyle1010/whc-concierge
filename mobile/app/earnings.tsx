import { useEffect, useMemo, useState } from 'react'
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native'
import { router } from 'expo-router'
import { supabase } from '../src/lib/supabase'
import { palette, radius, space, type } from '../src/lib/theme'

// The money.
//
// The app could accept a shift, work it and message about it, and then had
// nowhere to say what any of it was worth. A self-employed therapist tracking
// their own income had to open a laptop to find out what they were owed, so
// most of them tracked it in a notebook instead and the platform became the
// place the work happened rather than the place the money was.
//
// The same arithmetic as /talent/agency/statement on the website, because two
// answers to "what am I owed" is worse than one.

const WEB_URL = process.env.EXPO_PUBLIC_WEB_URL || 'https://talenthousecollective.co.uk'

type Booking = {
  id: string
  viewer_role?: string
  shift_date?: string | null
  rate?: number | null
  hours?: number | null
  payout_amount?: number | null
  amount_paid?: number | null
  payout_status?: string | null
  payout_at?: string | null
  dispute_status?: string | null
  paid_at?: string | null
  property_name?: string | null
  company_name?: string | null
  candidate_name?: string | null
}

// A shift with no stated hours is a standard day. The website assumes the
// same, and a different assumption here would produce a different total.
const hoursOf = (b: Booking) => (b.hours && b.hours > 0 ? b.hours : 8)
const grossOf = (b: Booking) => Number(b.rate || 0) * hoursOf(b)
const payoutOf = (b: Booking) => (b.payout_amount ?? grossOf(b))

function money(value: number) {
  return `£${value.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function dateLabel(value?: string | null) {
  if (!value) return 'an agreed date'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? 'an agreed date' : date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

function stateOf(b: Booking): { word: string; tone: 'paid' | 'waiting' | 'held' } {
  if (b.dispute_status === 'open') return { word: 'ON HOLD', tone: 'held' }
  if (b.payout_status === 'paid') return { word: 'PAID', tone: 'paid' }
  return { word: 'DUE', tone: 'waiting' }
}

export default function EarningsScreen() {
  const [role, setRole] = useState<'talent' | 'employer'>('talent')
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => { void load() }, [])

  async function load(showSpinner = true) {
    if (showSpinner) setLoading(true)
    setError('')
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.replace('/login'); return }
      const { data: account } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle()
      const resolved: 'talent' | 'employer' = account?.role === 'employer' ? 'employer' : 'talent'
      setRole(resolved)

      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) throw new Error('Your session has expired. Please sign in again.')
      const response = await fetch(`${WEB_URL}/api/agency/booking`, { headers: { Authorization: `Bearer ${session.access_token}` } })
      const body = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(body?.error || 'Could not load your earnings.')

      const viewer = resolved === 'talent' ? 'candidate' : 'employer'
      setBookings((body.bookings || []).filter((b: Booking) => b.viewer_role === viewer && b.paid_at))
    } catch (e: any) {
      setError(e?.message || 'Could not load your earnings.')
    } finally {
      if (showSpinner) setLoading(false)
    }
  }

  const totals = useMemo(() => {
    let paid = 0, due = 0, held = 0
    for (const booking of bookings) {
      const amount = role === 'talent' ? payoutOf(booking) : Number(booking.amount_paid || grossOf(booking))
      const state = stateOf(booking)
      if (state.tone === 'paid') paid += amount
      else if (state.tone === 'held') held += amount
      else due += amount
    }
    return { paid, due, held, count: bookings.length }
  }, [bookings, role])

  if (loading) return <View style={styles.center}><ActivityIndicator color={palette.ink} /></View>

  const talent = role === 'talent'

  return <ScrollView
    style={styles.scroll}
    contentContainerStyle={styles.page}
    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(false); setRefreshing(false) }} tintColor={palette.muted} />}
  >
    <Pressable onPress={() => router.back()} style={styles.backButton}><Text style={styles.back}>← Back</Text></Pressable>
    <Text style={styles.eyebrow}>FLEXIBLE WORK</Text>
    <Text style={styles.title}>{talent ? 'Your earnings' : 'Agency spend'}</Text>
    <Text style={styles.intro}>{talent
      ? 'Every Agency shift a property has paid for. Your payout is your agreed rate times the hours worked - the property pays the Talent House fee on top, and nothing is deducted from you.'
      : 'Every Agency shift you have paid for, and where the professional’s payout has got to.'}</Text>

    {error ? <Text style={styles.error}>{error}</Text> : null}

    <View style={styles.summary}>
      <View style={styles.summaryRow}>
        <View style={styles.figure}>
          <Text style={styles.figureLabel}>{talent ? 'DUE TO YOU' : 'AWAITING PAYOUT'}</Text>
          <Text style={styles.figureBig}>{money(totals.due)}</Text>
        </View>
        <View style={styles.figure}>
          <Text style={styles.figureLabel}>{talent ? 'PAID TO YOU' : 'PAID OUT'}</Text>
          <Text style={styles.figureBig}>{money(totals.paid)}</Text>
        </View>
      </View>
      {totals.held > 0 ? <Text style={styles.held}>{money(totals.held)} is on hold while a case is settled.</Text> : null}
      <Text style={styles.summaryFoot}>{totals.count === 0 ? 'No paid shifts yet.' : `${totals.count} paid shift${totals.count === 1 ? '' : 's'}.`}</Text>
    </View>

    {talent ? <View style={styles.note}>
      <Text style={styles.noteTitle}>How and when you are paid</Text>
      <Text style={styles.noteCopy}>Your payout is released once you have reviewed the shift, or seven days after it, whichever comes first. The property’s review is chased but never holds your money. You are self-employed, so your own tax and National Insurance are yours to handle.</Text>
    </View> : null}

    {bookings.length === 0 ? null : <>
      <Text style={styles.sectionEyebrow}>SHIFT BY SHIFT</Text>
      {bookings.map(booking => {
        const state = stateOf(booking)
        const amount = talent ? payoutOf(booking) : Number(booking.amount_paid || grossOf(booking))
        const other = talent
          ? (booking.property_name || booking.company_name || 'A property')
          : (booking.candidate_name || 'A professional')
        return <View key={booking.id} style={[styles.row, state.tone === 'held' && styles.rowHeld, state.tone === 'paid' && styles.rowPaid]}>
          <View style={styles.rowCopy}>
            <Text style={styles.rowDate}>{dateLabel(booking.shift_date)}</Text>
            <Text style={styles.rowMeta}>{other} · {hoursOf(booking)}h at £{Number(booking.rate || 0)}/hr</Text>
            {booking.payout_at && state.tone === 'paid' ? <Text style={styles.rowPaidOn}>Paid {dateLabel(booking.payout_at)}</Text> : null}
          </View>
          <View style={styles.rowRight}>
            <Text style={styles.rowAmount}>{money(amount)}</Text>
            <Text style={[styles.rowState, state.tone === 'paid' && styles.statePaid, state.tone === 'held' && styles.stateHeld]}>{state.word}</Text>
          </View>
        </View>
      })}
    </>}

    <Pressable onPress={() => router.push('/agency-cases')} style={styles.secondary}>
      <Text style={styles.secondaryText}>SOMETHING WRONG WITH A PAYMENT?</Text>
    </Pressable>
  </ScrollView>
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: palette.stone },
  page: { paddingHorizontal: space.page, paddingTop: 18, paddingBottom: 130 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: palette.stone },
  backButton: { alignSelf: 'flex-start', paddingVertical: 6, marginBottom: 22 },
  back: { color: palette.muted, fontSize: 13 },
  eyebrow: { color: palette.quiet, fontSize: 8, letterSpacing: 2.2, fontWeight: '700', marginBottom: 9 },
  title: { color: palette.inkStrong, fontFamily: type.serif, fontSize: 34, lineHeight: 40, fontWeight: '400', maxWidth: 365 },
  intro: { color: palette.muted, fontSize: 12.5, lineHeight: 19, marginTop: 10, marginBottom: 22, maxWidth: 365 },
  error: { color: palette.danger, fontSize: 11, lineHeight: 17, marginBottom: 14 },
  summary: { backgroundColor: palette.inkStrong, padding: 18, borderRadius: radius.large, marginBottom: 12 },
  summaryRow: { flexDirection: 'row', gap: 14 },
  figure: { flex: 1 },
  figureLabel: { color: '#C8D1D2', fontSize: 7.5, letterSpacing: 1.5, fontWeight: '700' },
  figureBig: { color: palette.paper, fontFamily: type.serif, fontSize: 29, fontWeight: '400', marginTop: 5 },
  held: { color: '#E9C9C9', fontSize: 10.5, lineHeight: 16, marginTop: 14 },
  summaryFoot: { color: '#C8D1D2', fontSize: 10, marginTop: 12 },
  note: { backgroundColor: palette.sageSoft, padding: 15, borderRadius: radius.large, marginBottom: 26 },
  noteTitle: { color: palette.sage, fontSize: 10.5, fontWeight: '700' },
  noteCopy: { color: palette.muted, fontSize: 10, lineHeight: 16, marginTop: 5 },
  sectionEyebrow: { color: palette.quiet, fontSize: 8, letterSpacing: 1.7, fontWeight: '700', marginBottom: 9 },
  row: { borderWidth: 1, borderColor: palette.line, backgroundColor: palette.paper, padding: 15, borderRadius: radius.large, marginBottom: 9, flexDirection: 'row', gap: 12, borderLeftWidth: 4, borderLeftColor: palette.lineStrong },
  rowPaid: { borderLeftColor: palette.sage },
  rowHeld: { borderLeftColor: palette.danger },
  rowCopy: { flex: 1 },
  rowDate: { color: palette.inkStrong, fontSize: 13, fontWeight: '700' },
  rowMeta: { color: palette.muted, fontSize: 10, lineHeight: 15, marginTop: 3 },
  rowPaidOn: { color: palette.sage, fontSize: 9.5, marginTop: 3 },
  rowRight: { alignItems: 'flex-end' },
  rowAmount: { color: palette.inkStrong, fontSize: 15, fontWeight: '700' },
  rowState: { color: palette.quiet, fontSize: 7.5, fontWeight: '800', letterSpacing: 1, marginTop: 4 },
  statePaid: { color: palette.sage },
  stateHeld: { color: palette.danger },
  secondary: { borderWidth: 1, borderColor: palette.lineStrong, paddingVertical: 12, alignItems: 'center', marginTop: 18, borderRadius: radius.medium },
  secondaryText: { color: palette.ink, fontSize: 10.5, fontWeight: '700', letterSpacing: .6 },
})
