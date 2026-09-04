import { useEffect, useMemo, useState } from 'react'
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { router } from 'expo-router'
import { supabase } from '../src/lib/supabase'

// Urgent cover, phone-first.
//
// Posts the same 'urgent_cascade' action the web employer page posts to
// /api/agency/booking. The server ranks everyone on the register who is
// genuinely free for the exact window, deals them round-robin into as many
// parallel cascades as people were asked for, and walks each queue every 30
// minutes until someone accepts or the four-hour window runs out.
//
// The confirmation repeats what the server actually did - who holds the first
// offer in each lane, how deep each queue is, and any shortfall against the
// number requested - rather than a flat "sent".

const WEB_URL = process.env.EXPO_PUBLIC_WEB_URL || 'https://talenthousecollective.co.uk'
// Mirrors src/lib/constants.ts: 15% base, 10% on Agency Plus, plus a 5%
// premium on same-day and next-day cover. The professional always keeps their
// full hourly rate - the fee sits on top and the property pays it.
const AGENCY_PLATFORM_FEE_PCT = 0.15
const AGENCY_PLUS_FEE_PCT = 0.10
const AGENCY_URGENT_FEE_SURCHARGE = 0.05
const TIMES = Array.from({ length: 33 }, (_, index) => {
  const total = 6 * 60 + index * 30
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
})
const RADIUS_OPTIONS = ['5', '10', '25', '50', '100']
const COUNT_OPTIONS = ['1', '2', '3', '4', '5']

type Offer = { first_name?: string; queue_size?: number }
type PickerField = 'start' | 'end' | null

function todayLondon() {
  return new Date().toLocaleDateString('en-CA')
}

function nextDays(count: number) {
  return Array.from({ length: count }, (_, index) => {
    const day = new Date()
    day.setDate(day.getDate() + index)
    return day.toLocaleDateString('en-CA')
  })
}

function dateLabel(date: string) {
  return new Date(`${date}T12:00:00`).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
}

// Same rule as the server: today or tomorrow carries the urgency premium.
function isPremiumDate(date: string) {
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  return date <= tomorrow.toLocaleDateString('en-CA')
}

export default function AgencyUrgentScreen() {
  const [shiftDate, setShiftDate] = useState(todayLondon())
  const [startTime, setStartTime] = useState('09:00')
  const [endTime, setEndTime] = useState('17:00')
  const [count, setCount] = useState('1')
  const [radius, setRadius] = useState('25')
  const [maxRate, setMaxRate] = useState('')
  const [shiftType, setShiftType] = useState('')
  const [notes, setNotes] = useState('')
  const [picker, setPicker] = useState<PickerField>(null)
  const [plusActive, setPlusActive] = useState(false)
  const [preferred, setPreferred] = useState(true)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [confirmation, setConfirmation] = useState('')

  const days = useMemo(() => nextDays(14), [])
  const basePct = Math.round((plusActive ? AGENCY_PLUS_FEE_PCT : AGENCY_PLATFORM_FEE_PCT) * 100)
  const feePct = basePct + (isPremiumDate(shiftDate) ? Math.round(AGENCY_URGENT_FEE_SURCHARGE * 100) : 0)

  useEffect(() => { load() }, [])

  async function authFetch(path: string, options?: RequestInit) {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.access_token) throw new Error('Your session has expired. Please sign in again.')
    const response = await fetch(`${WEB_URL}${path}`, {
      ...options,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}`, ...(options?.headers || {}) },
    })
    const body = await response.json().catch(() => ({}))
    if (!response.ok) throw new Error(body?.error || 'Could not send the request. Please try again.')
    return body
  }

  async function load() {
    setLoading(true)
    try {
      const payload = await authFetch('/api/agency/booking')
      const employer = payload?.viewer?.employer
      if (!employer) { setError('Urgent cover is for properties. Sign in with your property account to request cover.'); setPreferred(false) }
      else { setPlusActive(Boolean(employer.agency_plus_active)); setPreferred(Boolean(employer.preferred_employer)) }
    } catch (e: any) {
      setError(e?.message || 'Could not load your Agency account.')
    } finally {
      setLoading(false)
    }
  }

  async function send() {
    setError('')
    if (startTime >= endTime) { setError('The finish time must be after the start time.'); return }
    setBusy(true)
    try {
      const result = await authFetch('/api/agency/booking', {
        method: 'POST',
        body: JSON.stringify({
          action: 'urgent_cascade',
          shiftDate,
          shiftStartTime: startTime,
          shiftEndTime: endTime,
          radius,
          count,
          maxRate: maxRate.trim() || undefined,
          shiftType: shiftType.trim() || undefined,
          notes: notes.trim() || undefined,
        }),
      })
      const offers: Offer[] = Array.isArray(result?.offers) && result.offers.length
        ? result.offers
        : [{ first_name: result?.first_name, queue_size: result?.queue_size }]
      const requested = Number(result?.requested || count) || 1
      const shortfall = Number(result?.shortfall || 0)
      const shortfallLine = shortfall > 0
        ? ` Only ${offers.length} of the ${requested} you asked for could be queued - that is everyone available for this shift.`
        : ''
      setConfirmation(offers.length > 1
        ? `${offers.length} parallel requests are out. The first offers went to ${offers.map(offer => offer.first_name || 'a professional').join(', ')}. Each one moves down its own queue every 30 minutes until somebody accepts, and gives up after four hours.${shortfallLine} You will be notified as each is accepted.`
        : `The shift has been offered to ${offers[0]?.first_name || 'the nearest available professional'}. ${Number(offers[0]?.queue_size || 0) > 1
          ? `If they cannot take it, it moves automatically through ${Number(offers[0]?.queue_size) - 1} more professional${Number(offers[0]?.queue_size) > 2 ? 's' : ''}, 30 minutes each, for up to four hours.`
          : 'They are the only match right now, so there is nobody behind them in the queue.'}${shortfallLine} You will be notified the moment somebody accepts.`)
    } catch (e: any) {
      setError(e?.message || 'Could not send the request. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  if (loading) return <View style={styles.center}><ActivityIndicator color="#0b2f4d" /></View>

  if (confirmation) return <ScrollView style={styles.scroll} contentContainerStyle={styles.page}>
    <Pressable onPress={() => router.back()}><Text style={styles.back}>‹ Agency</Text></Pressable>
    <Text style={styles.eyebrow}>URGENT COVER</Text>
    <Text style={styles.title}>Request sent</Text>
    <View style={styles.confirmBox}><Text style={styles.confirmCopy}>{confirmation}</Text></View>
    <Text style={styles.help}>Nothing is charged until somebody accepts. When they do, you pay their hourly rate plus the {feePct}% Talent House fee to confirm the shift.</Text>
    <Pressable onPress={() => router.replace('/agency')} style={styles.primary}><Text style={styles.primaryText}>Back to Agency bookings</Text></Pressable>
    <Pressable onPress={() => { setConfirmation(''); setError('') }} style={styles.secondary}><Text style={styles.secondaryText}>Send another request</Text></Pressable>
  </ScrollView>

  const timeField = (field: 'start' | 'end') => {
    const value = field === 'start' ? startTime : endTime
    const isOpen = picker === field
    return <View style={{ flex: 1 }}>
      <Text style={styles.label}>{field === 'start' ? 'Starts' : 'Finishes'}</Text>
      <Pressable onPress={() => setPicker(isOpen ? null : field)} style={[styles.select, isOpen && styles.selectOpen]}>
        <Text style={styles.selectText}>{value}</Text><Text style={styles.chevron}>{isOpen ? '▲' : '▼'}</Text>
      </Pressable>
      {isOpen ? <View style={styles.timePanel}>{TIMES.map(option => <Pressable key={option} onPress={() => { field === 'start' ? setStartTime(option) : setEndTime(option); setPicker(null) }} style={styles.timeOption}><Text style={styles.timeOptionText}>{option}</Text></Pressable>)}</View> : null}
    </View>
  }

  return <ScrollView style={styles.scroll} contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled">
    <Pressable onPress={() => router.back()}><Text style={styles.back}>‹ Agency</Text></Pressable>
    <Text style={styles.eyebrow}>URGENT COVER</Text>
    <Text style={styles.title}>Cover, found for you</Text>
    <Text style={styles.intro}>We offer the shift to the nearest genuinely available professionals in turn. Each has 30 minutes to accept before it moves on, and the whole search gives up after four hours if nobody takes it.</Text>
    <Text style={styles.help}>You pay their hourly rate plus the {feePct}% Talent House fee once somebody accepts{isPremiumDate(shiftDate) ? ` (same-day and next-day cover carries a premium; booked further ahead it is ${basePct}%)` : ''}. The professional always receives their full rate.</Text>

    {!preferred ? <View style={styles.warning}><Text style={styles.warningTitle}>Preferred Employer registration needed</Text><Text style={styles.warningCopy}>Urgent cover is part of Preferred Employer registration (£150/year). Register from Agency Bookings on the web to unlock it.</Text></View> : null}

    <Text style={styles.sectionTitle}>Which day?</Text>
    <View style={styles.chipRow}>{days.map(day => <Pressable key={day} onPress={() => setShiftDate(day)} style={[styles.chip, shiftDate === day && styles.chipActive]}><Text style={[styles.chipText, shiftDate === day && styles.chipTextActive]}>{day === todayLondon() ? 'Today' : dateLabel(day)}</Text></Pressable>)}</View>

    <Text style={styles.sectionTitle}>What hours?</Text>
    <View style={styles.row}>{timeField('start')}{timeField('end')}</View>

    <Text style={styles.sectionTitle}>How many people?</Text>
    <Text style={styles.help}>Each person is hunted in a separate queue at the same time, so nobody is offered two of your slots.</Text>
    <View style={styles.chipRow}>{COUNT_OPTIONS.map(option => <Pressable key={option} onPress={() => setCount(option)} style={[styles.chip, count === option && styles.chipActive]}><Text style={[styles.chipText, count === option && styles.chipTextActive]}>{option === '1' ? '1 professional' : `${option} professionals`}</Text></Pressable>)}</View>

    <Text style={styles.sectionTitle}>How far should we search?</Text>
    <Text style={styles.help}>We never go beyond a professional's own travel radius, whatever you choose here.</Text>
    <View style={styles.chipRow}>{RADIUS_OPTIONS.map(option => <Pressable key={option} onPress={() => setRadius(option)} style={[styles.chip, radius === option && styles.chipActive]}><Text style={[styles.chipText, radius === option && styles.chipTextActive]}>Within {option} miles</Text></Pressable>)}</View>

    <Text style={styles.sectionTitle}>Maximum rate</Text>
    <Text style={styles.help}>Optional. Leave it empty to see everyone available, whatever they charge.</Text>
    <View style={styles.rateRow}><Text style={styles.currency}>£</Text><TextInput value={maxRate} onChangeText={setMaxRate} keyboardType="number-pad" placeholder="No cap" placeholderTextColor="#98a3aa" style={styles.input} /><Text style={styles.perHour}>/hr</Text></View>

    <Text style={styles.sectionTitle}>Treatment or role</Text>
    <TextInput value={shiftType} onChangeText={setShiftType} placeholder="e.g. Massage, Facials, Spa host" placeholderTextColor="#98a3aa" style={styles.input} />

    <Text style={styles.sectionTitle}>Notes for the professional</Text>
    <TextInput value={notes} onChangeText={setNotes} multiline placeholder="e.g. 10am start, ESPA treatments, parking on site" placeholderTextColor="#98a3aa" style={[styles.input, styles.notes]} />

    {error ? <Text style={styles.error}>{error}</Text> : null}
    <Pressable disabled={busy || !preferred} onPress={send} style={[styles.primary, (busy || !preferred) && styles.disabled]}><Text style={styles.primaryText}>{busy ? 'Finding the nearest available...' : 'Send it out'}</Text></Pressable>
    <Text style={styles.footnote}>Nothing is charged now. You only pay when a professional accepts and you confirm the booking.</Text>
  </ScrollView>
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: '#fff' },
  page: { paddingHorizontal: 22, paddingTop: 18, paddingBottom: 110 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' },
  back: { color: '#66747c', fontSize: 14, marginBottom: 26 },
  eyebrow: { color: '#71808a', fontSize: 8, letterSpacing: 2, marginBottom: 8 },
  title: { color: '#0b2f4d', fontSize: 29, lineHeight: 34, fontWeight: '500' },
  intro: { color: '#66747c', fontSize: 13, lineHeight: 20, marginTop: 8 },
  help: { color: '#71808a', fontSize: 10.5, lineHeight: 16, marginTop: 8 },
  warning: { backgroundColor: '#f6f2f2', borderLeftWidth: 3, borderLeftColor: '#9a2f2f', padding: 13, marginTop: 16 },
  warningTitle: { color: '#5c2a2a', fontSize: 12, fontWeight: '800' },
  warningCopy: { color: '#7a5555', fontSize: 10.5, lineHeight: 16, marginTop: 4 },
  sectionTitle: { color: '#173246', fontSize: 15, fontWeight: '700', marginTop: 26 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginTop: 11 },
  chip: { borderWidth: 1, borderColor: '#d7e0e4', paddingHorizontal: 11, paddingVertical: 9, backgroundColor: '#fff' },
  chipActive: { backgroundColor: '#0b2f4d', borderColor: '#0b2f4d' },
  chipText: { color: '#66747c', fontSize: 10, fontWeight: '700' },
  chipTextActive: { color: '#fff' },
  row: { flexDirection: 'row', gap: 10, marginTop: 11, alignItems: 'flex-start' },
  label: { color: '#173246', fontSize: 9, fontWeight: '700', marginBottom: 5 },
  select: { borderWidth: 1, borderColor: '#d7e0e4', paddingHorizontal: 11, paddingVertical: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff' },
  selectOpen: { borderColor: '#0b2f4d' },
  selectText: { color: '#173246', fontSize: 13, fontWeight: '700' },
  chevron: { color: '#71808a', fontSize: 8 },
  timePanel: { borderWidth: 1, borderColor: '#d7e0e4', backgroundColor: '#fff', flexDirection: 'row', flexWrap: 'wrap', gap: 4, padding: 6, marginTop: 4, maxHeight: 180, overflow: 'hidden' },
  timeOption: { width: '23%', paddingVertical: 7, alignItems: 'center', backgroundColor: '#f6f8f9' },
  timeOptionText: { color: '#173246', fontSize: 9, fontWeight: '600' },
  rateRow: { flexDirection: 'row', alignItems: 'center', marginTop: 11 },
  currency: { color: '#173246', fontSize: 17, marginRight: 6 },
  perHour: { color: '#66747c', fontSize: 11, marginLeft: 7 },
  input: { flex: 1, borderWidth: 1, borderColor: '#d7e0e4', paddingHorizontal: 12, paddingVertical: 12, color: '#173246', fontSize: 13, backgroundColor: '#fff', marginTop: 11 },
  notes: { minHeight: 78, textAlignVertical: 'top' },
  primary: { backgroundColor: '#0b2f4d', paddingVertical: 15, alignItems: 'center', marginTop: 22 },
  primaryText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  secondary: { borderWidth: 1, borderColor: '#cfd9de', paddingVertical: 14, alignItems: 'center', marginTop: 11 },
  secondaryText: { color: '#173246', fontSize: 11, fontWeight: '700' },
  disabled: { opacity: 0.45 },
  confirmBox: { backgroundColor: '#f4f7f8', padding: 18, marginTop: 18 },
  confirmCopy: { color: '#2f4a5c', fontSize: 12.5, lineHeight: 20 },
  footnote: { color: '#8b989f', fontSize: 10, lineHeight: 16, marginTop: 12 },
  error: { color: '#9b2c2c', fontSize: 11, lineHeight: 17, marginTop: 16 },
})
