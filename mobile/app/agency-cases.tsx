import { useEffect, useMemo, useState } from 'react'
import { ActivityIndicator, Alert, Linking, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { router } from 'expo-router'
import { supabase } from '../src/lib/supabase'
import { palette, radius, space, type } from '../src/lib/theme'

// Shift Resolution, on the device the shift actually happens on.
//
// This existed only on the website. A shift goes wrong at seven in the
// morning in a spa: the property has changed the hours, the professional was
// sent home early, the commission is not what was agreed. Nobody involved is
// sitting at a laptop. The one route for raising it was the one route they
// could not reach, so it got raised over text message instead, off-platform,
// with no record and no payout hold.
//
// Opening a case freezes the payout on that booking, which is why it is worth
// having here rather than "later": once money has left, the argument is a
// different and much worse conversation.
//
// The money side of an agreement - a property paying an adjustment through
// Stripe - stays on the website. It is a card payment inside a signed
// agreement, and half-building that on a phone would be worse than sending
// somebody to the page that already does it properly.

const WEB_URL = process.env.EXPO_PUBLIC_WEB_URL || 'https://talenthousecollective.co.uk'

const TALENT_ISSUES: [string, string][] = [
  ['property_cancelled', 'The property cancelled or ended my shift early'],
  ['extra_hours', 'I worked additional hours'],
  ['shift_changed', 'My shift hours were changed'],
  ['retail_commission', 'Retail commission is owed'],
  ['treatment_commission', 'Treatment or service commission is owed'],
  ['tips_service_charge', 'Tips or service charge are owed'],
  ['expenses', 'Expenses are owed'],
  ['incorrect_payment', 'My payment is incorrect'],
  ['conduct_concern', 'Conduct or working conditions concern'],
  ['other', 'Another issue with this shift'],
]

const EMPLOYER_ISSUES: [string, string][] = [
  ['no_show', 'The professional did not attend'],
  ['late_arrival', 'The professional arrived late'],
  ['left_early', 'The professional left early'],
  ['shift_changed', 'The hours worked were different from agreed'],
  ['extra_hours', 'Approve additional hours worked'],
  ['retail_commission', 'Retail commission adjustment'],
  ['treatment_commission', 'Treatment or service commission adjustment'],
  ['tips_service_charge', 'Tips or service charge adjustment'],
  ['expenses', 'Expenses adjustment'],
  ['professional_cancelled', 'The professional cancelled'],
  ['conduct_concern', 'Conduct or standards concern'],
  ['incorrect_payment', 'Incorrect payment'],
  ['other', 'Another issue with this shift'],
]

const STATUS_WORD: Record<string, string> = {
  open: 'OPEN',
  awaiting_response: 'AWAITING A RESPONSE',
  under_review: 'UNDER REVIEW',
  awaiting_agreement: 'AWAITING AGREEMENT',
  awaiting_payment: 'AWAITING PAYMENT',
  resolved: 'RESOLVED',
  rejected: 'CLOSED',
}

const SETTLED = ['resolved', 'rejected']

function issueLabel(value?: string | null) {
  const all = [...TALENT_ISSUES, ...EMPLOYER_ISSUES]
  return all.find(([key]) => key === value)?.[1] || 'An issue with this shift'
}

function shiftLabel(value?: string | null) {
  if (!value) return 'an agreed date'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? 'an agreed date' : date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
}

export default function AgencyCasesScreen() {
  const [role, setRole] = useState<'talent' | 'employer'>('talent')
  const [userId, setUserId] = useState('')
  const [cases, setCases] = useState<any[]>([])
  const [bookings, setBookings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [busy, setBusy] = useState('')
  const [error, setError] = useState('')
  const [openingFor, setOpeningFor] = useState<any>(null)
  const [issueType, setIssueType] = useState('other')
  const [description, setDescription] = useState('')
  const [replies, setReplies] = useState<Record<string, string>>({})

  const issues = role === 'talent' ? TALENT_ISSUES : EMPLOYER_ISSUES

  // A case can only be opened on a shift that actually happened and does not
  // already have one running.
  const eligible = useMemo(() => {
    const withCase = new Set(cases.filter(row => !SETTLED.includes(String(row.status))).map(row => row.booking_id))
    return bookings.filter(b => ['confirmed', 'completed'].includes(String(b.status)) && !withCase.has(b.id))
  }, [bookings, cases])

  useEffect(() => { void load() }, [])

  async function authFetch(path: string, options?: RequestInit) {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.access_token) throw new Error('Your session has expired. Please sign in again.')
    const response = await fetch(`${WEB_URL}${path}`, {
      ...options,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}`, ...(options?.headers || {}) },
    })
    const body = await response.json().catch(() => ({}))
    if (!response.ok) throw new Error(body?.error || 'Something went wrong.')
    return body
  }

  async function load(showSpinner = true) {
    if (showSpinner) setLoading(true)
    setError('')
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.replace('/login'); return }
      setUserId(user.id)
      const { data: account } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle()
      const resolved: 'talent' | 'employer' = account?.role === 'employer' ? 'employer' : 'talent'
      setRole(resolved)
      setIssueType(resolved === 'talent' ? 'property_cancelled' : 'no_show')

      const [caseBody, bookingBody] = await Promise.all([
        authFetch('/api/agency/cases'),
        authFetch('/api/agency/booking'),
      ])
      setCases(caseBody.cases || [])
      const viewer = resolved === 'talent' ? 'candidate' : 'employer'
      setBookings((bookingBody.bookings || []).filter((b: any) => b.viewer_role === viewer))
    } catch (e: any) {
      setError(e?.message || 'Could not load Shift Resolution.')
    } finally {
      if (showSpinner) setLoading(false)
    }
  }

  async function openCase() {
    if (!openingFor) return
    if (description.trim().length < 5) { Alert.alert('Say what happened', 'A sentence is enough, but there needs to be one.'); return }
    setBusy('open')
    try {
      await authFetch('/api/agency/cases', {
        method: 'POST',
        body: JSON.stringify({ action: 'open', bookingId: openingFor.id, issueType, description: description.trim() }),
      })
      setOpeningFor(null)
      setDescription('')
      await load(false)
      Alert.alert('Case opened', 'The other side has been told and asked to respond. The payout on this shift is held until it is settled.')
    } catch (e: any) {
      Alert.alert('Not opened', e?.message || 'Could not open this case.')
    } finally {
      setBusy('')
    }
  }

  async function send(row: any) {
    const text = (replies[row.id] || '').trim()
    if (!text) return
    // The first reply from the other side is the formal response; everything
    // after that is a message on the thread. The server decides which, and
    // rejects a response from the person who opened it.
    const isFirstResponse = !row.counterparty_response && row.opened_by_user_id !== userId
    setBusy(row.id)
    try {
      await authFetch('/api/agency/cases', {
        method: 'POST',
        body: JSON.stringify(isFirstResponse
          ? { action: 'respond', caseId: row.id, response: text }
          : { action: 'message', caseId: row.id, message: text }),
      })
      setReplies(current => ({ ...current, [row.id]: '' }))
      await load(false)
    } catch (e: any) {
      Alert.alert('Not sent', e?.message || 'Could not send that.')
    } finally {
      setBusy('')
    }
  }

  if (loading) return <View style={styles.center}><ActivityIndicator color={palette.ink} /></View>

  return <ScrollView
    style={styles.scroll}
    contentContainerStyle={styles.page}
    keyboardShouldPersistTaps="handled"
    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(false); setRefreshing(false) }} tintColor={palette.muted} />}
  >
    <Pressable onPress={() => router.back()} style={styles.backButton}><Text style={styles.back}>← Back</Text></Pressable>
    <Text style={styles.eyebrow}>FLEXIBLE WORK</Text>
    <Text style={styles.title}>Shift Resolution</Text>
    <Text style={styles.intro}>Raise or answer an issue about a confirmed Agency shift - attendance, hours, commission, expenses or payment. Opening a case holds the payout on that shift until it is settled.</Text>

    {error ? <Text style={styles.error}>{error}</Text> : null}

    {openingFor ? <View style={styles.openCard}>
      <Text style={styles.sectionEyebrow}>RAISING AN ISSUE</Text>
      <Text style={styles.openTitle}>{shiftLabel(openingFor.shift_date)}</Text>
      <Text style={styles.copy}>Choose what happened, then say it in your own words. The other side sees exactly what you write.</Text>

      {issues.map(([key, label]) => <Pressable key={key} onPress={() => setIssueType(key)} style={[styles.option, issueType === key && styles.optionChosen]}>
        <Text style={[styles.optionText, issueType === key && styles.optionTextChosen]}>{label}</Text>
      </Pressable>)}

      <TextInput
        value={description}
        onChangeText={setDescription}
        placeholder="What happened, in your own words"
        placeholderTextColor={palette.quiet}
        multiline
        style={styles.textarea}
      />
      <Pressable onPress={openCase} disabled={busy === 'open'} style={[styles.primary, busy === 'open' && styles.disabled]}>
        <Text style={styles.primaryText}>{busy === 'open' ? 'OPENING' : 'OPEN THE CASE'}</Text>
      </Pressable>
      <Pressable onPress={() => { setOpeningFor(null); setDescription('') }} style={styles.secondary}>
        <Text style={styles.secondaryText}>CANCEL</Text>
      </Pressable>
    </View> : null}

    {cases.length === 0 && !openingFor ? <View style={styles.empty}>
      <Text style={styles.emptyTitle}>No cases</Text>
      <Text style={styles.emptyCopy}>Nothing has been raised about any of your shifts. That is the way it should be.</Text>
    </View> : null}

    {cases.map(row => {
      const settled = SETTLED.includes(String(row.status))
      const mine = row.opened_by_user_id === userId
      const needsMyResponse = !settled && !row.counterparty_response && !mine
      return <View key={row.id} style={[styles.card, needsMyResponse && styles.cardUrgent]}>
        <View style={styles.cardTop}>
          <Text style={styles.shift}>{shiftLabel(row.booking?.shift_date)}</Text>
          <Text style={[styles.status, settled && styles.statusSettled, needsMyResponse && styles.statusUrgent]}>
            {STATUS_WORD[String(row.status)] || String(row.status || '').toUpperCase()}
          </Text>
        </View>
        <Text style={styles.issue}>{issueLabel(row.issue_type)}</Text>
        <Text style={styles.raisedBy}>{mine ? 'Raised by you' : 'Raised by the other side'}</Text>
        <Text style={styles.description}>{row.description}</Text>

        {needsMyResponse ? <Text style={styles.prompt}>This is waiting on your response.</Text> : null}

        {(row.messages || []).map((message: any) => <View key={message.id} style={[styles.message, message.sender_user_id === userId && styles.messageMine]}>
          <Text style={styles.messageWho}>{message.sender_user_id === userId ? 'You' : message.sender_role === 'admin' ? 'Talent House' : 'The other side'}</Text>
          <Text style={styles.messageText}>{message.message}</Text>
        </View>)}

        {settled ? <Text style={styles.closedNote}>This case is closed. Nothing further can be added to it.</Text> : <>
          <TextInput
            value={replies[row.id] || ''}
            onChangeText={text => setReplies(current => ({ ...current, [row.id]: text }))}
            placeholder={needsMyResponse ? 'Your response' : 'Add a message'}
            placeholderTextColor={palette.quiet}
            multiline
            style={styles.replyBox}
          />
          <Pressable onPress={() => send(row)} disabled={busy === row.id || !(replies[row.id] || '').trim()} style={[styles.primary, (busy === row.id || !(replies[row.id] || '').trim()) && styles.disabled]}>
            <Text style={styles.primaryText}>{busy === row.id ? 'SENDING' : needsMyResponse ? 'SEND YOUR RESPONSE' : 'SEND MESSAGE'}</Text>
          </Pressable>
        </>}

        {['awaiting_agreement', 'awaiting_payment'].includes(String(row.status)) ? <Pressable
          onPress={() => Linking.openURL(`${WEB_URL}${role === 'talent' ? '/talent' : '/employer'}/agency/cases`)}
          style={styles.secondary}
        >
          <Text style={styles.secondaryText}>SIGN OR PAY ON THE WEBSITE</Text>
        </Pressable> : null}
      </View>
    })}

    {!openingFor && eligible.length > 0 ? <View style={styles.raiseSection}>
      <Text style={styles.sectionEyebrow}>SOMETHING WRONG WITH A SHIFT?</Text>
      <Text style={styles.sectionCopy}>Pick the shift it happened on. Only confirmed and completed shifts can have a case raised.</Text>
      {eligible.slice(0, 12).map(booking => <Pressable key={booking.id} onPress={() => setOpeningFor(booking)} style={styles.bookingRow}>
        <View style={styles.bookingCopy}>
          <Text style={styles.bookingDate}>{shiftLabel(booking.shift_date)}</Text>
          <Text style={styles.bookingMeta}>{role === 'talent' ? (booking.property_name || booking.company_name || 'A property') : (booking.candidate_name || 'A professional')}</Text>
        </View>
        <Text style={styles.arrow}>›</Text>
      </Pressable>)}
    </View> : null}
  </ScrollView>
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: palette.stone },
  page: { paddingHorizontal: space.page, paddingTop: 18, paddingBottom: 140 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: palette.stone },
  backButton: { alignSelf: 'flex-start', paddingVertical: 6, marginBottom: 22 },
  back: { color: palette.muted, fontSize: 13 },
  eyebrow: { color: palette.quiet, fontSize: 8, letterSpacing: 2.2, fontWeight: '700', marginBottom: 9 },
  title: { color: palette.inkStrong, fontFamily: type.serif, fontSize: 34, lineHeight: 40, fontWeight: '400', maxWidth: 365 },
  intro: { color: palette.muted, fontSize: 13, lineHeight: 20, marginTop: 10, marginBottom: 22, maxWidth: 365 },
  error: { color: palette.danger, fontSize: 11, lineHeight: 17, marginBottom: 14 },
  empty: { borderWidth: 1, borderColor: palette.line, backgroundColor: palette.paper, padding: 22, borderRadius: radius.large, marginBottom: 22 },
  emptyTitle: { color: palette.inkStrong, fontFamily: type.serif, fontSize: 21, fontWeight: '400' },
  emptyCopy: { color: palette.muted, fontSize: 11, lineHeight: 17, marginTop: 7 },
  card: { borderWidth: 1, borderColor: palette.line, backgroundColor: palette.paper, padding: 17, borderRadius: radius.large, marginBottom: 12 },
  cardUrgent: { borderLeftWidth: 4, borderLeftColor: palette.danger },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 },
  shift: { color: palette.inkStrong, fontSize: 13, fontWeight: '700', flex: 1 },
  status: { color: palette.quiet, fontSize: 7.5, fontWeight: '800', letterSpacing: 1, paddingTop: 3 },
  statusSettled: { color: palette.sage },
  statusUrgent: { color: palette.danger },
  issue: { color: palette.inkStrong, fontFamily: type.serif, fontSize: 19, lineHeight: 24, fontWeight: '400', marginTop: 8 },
  raisedBy: { color: palette.quiet, fontSize: 9.5, marginTop: 4 },
  description: { color: palette.muted, fontSize: 11.5, lineHeight: 18, marginTop: 9 },
  prompt: { color: palette.danger, fontSize: 10.5, fontWeight: '700', marginTop: 11 },
  message: { backgroundColor: palette.stoneDeep, padding: 12, borderRadius: radius.medium, marginTop: 9 },
  messageMine: { backgroundColor: palette.sageSoft },
  messageWho: { color: palette.quiet, fontSize: 8, letterSpacing: 1, fontWeight: '800' },
  messageText: { color: palette.text, fontSize: 11.5, lineHeight: 18, marginTop: 4 },
  closedNote: { color: palette.quiet, fontSize: 10, lineHeight: 16, marginTop: 12 },
  replyBox: { borderWidth: 1, borderColor: palette.line, backgroundColor: palette.paper, borderRadius: radius.medium, padding: 12, marginTop: 12, minHeight: 74, color: palette.text, fontSize: 12, textAlignVertical: 'top' },
  openCard: { borderWidth: 1, borderColor: palette.lineStrong, backgroundColor: palette.paper, padding: 18, borderRadius: radius.large, marginBottom: 22 },
  openTitle: { color: palette.inkStrong, fontFamily: type.serif, fontSize: 22, lineHeight: 27, fontWeight: '400', marginTop: 4 },
  copy: { color: palette.muted, fontSize: 11, lineHeight: 17, marginTop: 7, marginBottom: 13 },
  option: { borderWidth: 1, borderColor: palette.line, borderRadius: radius.medium, paddingVertical: 11, paddingHorizontal: 13, marginBottom: 7 },
  optionChosen: { borderColor: palette.inkStrong, backgroundColor: palette.stoneDeep },
  optionText: { color: palette.text, fontSize: 11.5, lineHeight: 17 },
  optionTextChosen: { color: palette.inkStrong, fontWeight: '700' },
  textarea: { borderWidth: 1, borderColor: palette.line, backgroundColor: palette.paper, borderRadius: radius.medium, padding: 12, marginTop: 8, minHeight: 96, color: palette.text, fontSize: 12, textAlignVertical: 'top' },
  raiseSection: { marginTop: 14 },
  sectionEyebrow: { color: palette.quiet, fontSize: 8, letterSpacing: 1.7, fontWeight: '700', marginBottom: 5 },
  sectionCopy: { color: palette.muted, fontSize: 10.5, lineHeight: 16, marginBottom: 12 },
  bookingRow: { borderWidth: 1, borderColor: palette.line, backgroundColor: palette.paper, padding: 15, borderRadius: radius.large, marginBottom: 9, flexDirection: 'row', alignItems: 'center', gap: 12 },
  bookingCopy: { flex: 1 },
  bookingDate: { color: palette.inkStrong, fontSize: 13, fontWeight: '700' },
  bookingMeta: { color: palette.muted, fontSize: 10, marginTop: 3 },
  arrow: { color: palette.ink, fontSize: 17 },
  primary: { backgroundColor: palette.inkStrong, paddingVertical: 13, alignItems: 'center', marginTop: 12, borderRadius: radius.medium },
  primaryText: { color: palette.paper, fontSize: 10.5, fontWeight: '700', letterSpacing: .6 },
  secondary: { borderWidth: 1, borderColor: palette.lineStrong, paddingVertical: 12, alignItems: 'center', marginTop: 9, borderRadius: radius.medium },
  secondaryText: { color: palette.ink, fontSize: 10.5, fontWeight: '700', letterSpacing: .6 },
  disabled: { opacity: .5 },
})
