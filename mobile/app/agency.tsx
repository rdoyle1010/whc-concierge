import { useEffect, useState } from 'react'
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { router } from 'expo-router'
import { supabase } from '../src/lib/supabase'

type Role = 'talent' | 'employer'
type WindowRow = { id: string; date: string; start_time: string; end_time: string }
type BookingRow = { id: string; shift_date: string | null; shift_start_time: string | null; shift_end_time: string | null; status: string; rate: number; urgent: boolean | null; specialism: string | null; candidate_profiles?: { full_name?: string | null } | { full_name?: string | null }[] | null; employer_profiles?: { property_name?: string | null; company_name?: string | null } | { property_name?: string | null; company_name?: string | null }[] | null }

function timeLabel(value?: string | null) { return value ? value.slice(0, 5) : '' }

export default function AgencyScreen() {
  const [role, setRole] = useState<Role>('talent')
  const [windows, setWindows] = useState<WindowRow[]>([])
  const [bookings, setBookings] = useState<BookingRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.replace('/login'); return }
      const { data: account } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle()
      const resolved: Role = account?.role === 'employer' ? 'employer' : 'talent'
      setRole(resolved)

      if (resolved === 'talent') {
        const { data: candidate } = await supabase.from('candidate_profiles').select('id').eq('user_id', user.id).maybeSingle()
        if (!candidate) { setLoading(false); return }
        const [{ data: availability, error: availabilityError }, { data: bookingData, error: bookingError }] = await Promise.all([
          supabase.from('agency_availability_windows').select('id,date,start_time,end_time').eq('candidate_id', candidate.id).gte('date', new Date().toISOString().slice(0, 10)).order('date').order('start_time'),
          supabase.from('agency_bookings').select('id,shift_date,shift_start_time,shift_end_time,status,rate,urgent,specialism,employer_profiles(property_name,company_name)').eq('candidate_id', candidate.id).order('shift_date', { ascending: true }),
        ])
        if (availabilityError) setError(availabilityError.message)
        else if (bookingError) setError(bookingError.message)
        setWindows((availability || []) as WindowRow[])
        setBookings((bookingData || []) as BookingRow[])
      } else {
        const { data: employer } = await supabase.from('employer_profiles').select('id').eq('user_id', user.id).maybeSingle()
        if (!employer) { setLoading(false); return }
        const { data, error: bookingError } = await supabase.from('agency_bookings').select('id,shift_date,shift_start_time,shift_end_time,status,rate,urgent,specialism,candidate_profiles(full_name)').eq('employer_id', employer.id).order('shift_date', { ascending: true })
        if (bookingError) setError(bookingError.message)
        setBookings((data || []) as BookingRow[])
      }
      setLoading(false)
    }
    load()
  }, [])

  return <ScrollView style={styles.scroll} contentContainerStyle={styles.page}>
    <Pressable onPress={() => router.back()}><Text style={styles.back}>‹ Back</Text></Pressable>
    <Text style={styles.eyebrow}>AGENCY</Text>
    <Text style={styles.title}>{role === 'talent' ? 'Your flexible work' : 'Agency staffing'}</Text>
    <Text style={styles.intro}>{role === 'talent' ? 'Your availability and upcoming agency shifts, using the same day-by-day times set on the platform.' : 'Upcoming flexible staffing bookings for your property.'}</Text>
    {loading ? <ActivityIndicator color="#092b45" style={{ marginTop: 30 }} /> : null}
    {error ? <Text style={styles.error}>{error}</Text> : null}

    {role === 'talent' && !loading ? <View style={styles.section}>
      <Text style={styles.sectionTitle}>Availability</Text>
      {windows.length === 0 ? <Text style={styles.emptyCopy}>No future availability has been added yet.</Text> : windows.map(window => <View key={window.id} style={styles.row}><Text style={styles.rowMain}>{new Date(`${window.date}T12:00:00`).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}</Text><Text style={styles.rowMeta}>{timeLabel(window.start_time)} - {timeLabel(window.end_time)}</Text></View>)}
    </View> : null}

    {!loading ? <View style={styles.section}>
      <Text style={styles.sectionTitle}>{role === 'talent' ? 'Your shifts' : 'Bookings'}</Text>
      {bookings.length === 0 ? <Text style={styles.emptyCopy}>No agency bookings to show yet.</Text> : bookings.map(booking => {
        const candidate = Array.isArray(booking.candidate_profiles) ? booking.candidate_profiles[0] : booking.candidate_profiles
        const employer = Array.isArray(booking.employer_profiles) ? booking.employer_profiles[0] : booking.employer_profiles
        const name = role === 'talent' ? (employer?.property_name || employer?.company_name || 'Property') : (candidate?.full_name || 'Talent')
        return <View key={booking.id} style={styles.card}><View style={styles.topRow}><Text style={styles.status}>{booking.status}</Text>{booking.urgent ? <Text style={styles.urgent}>URGENT</Text> : null}</View><Text style={styles.cardTitle}>{name}</Text><Text style={styles.cardCopy}>{[booking.specialism, booking.shift_date, `${timeLabel(booking.shift_start_time)}${booking.shift_end_time ? ` - ${timeLabel(booking.shift_end_time)}` : ''}`, booking.rate ? `£${booking.rate}` : null].filter(Boolean).join('  ·  ')}</Text></View>
      })}
    </View> : null}
  </ScrollView>
}

const styles = StyleSheet.create({ scroll:{flex:1,backgroundColor:'#fff'}, page:{paddingHorizontal:22,paddingTop:64,paddingBottom:44}, back:{color:'#66747c',fontSize:13,marginBottom:34}, eyebrow:{color:'#71808a',fontSize:9,letterSpacing:2.1,marginBottom:10}, title:{color:'#092b45',fontSize:31,lineHeight:37,fontWeight:'500'}, intro:{color:'#66747c',fontSize:14,lineHeight:21,marginTop:10,marginBottom:28}, section:{marginBottom:28}, sectionTitle:{color:'#173246',fontSize:17,fontWeight:'600',marginBottom:12}, row:{flexDirection:'row',justifyContent:'space-between',borderBottomWidth:1,borderBottomColor:'#e6eaed',paddingVertical:13}, rowMain:{color:'#173246',fontSize:13,fontWeight:'500'}, rowMeta:{color:'#66747c',fontSize:12}, card:{borderWidth:1,borderColor:'#dce3e7',padding:18,marginBottom:10}, topRow:{flexDirection:'row',justifyContent:'space-between'}, status:{color:'#71808a',fontSize:9,textTransform:'uppercase',letterSpacing:1.2}, urgent:{color:'#8a3434',fontSize:8,letterSpacing:1.2}, cardTitle:{color:'#173246',fontSize:17,fontWeight:'600',marginTop:8}, cardCopy:{color:'#66747c',fontSize:12,lineHeight:18,marginTop:6}, emptyCopy:{color:'#71808a',fontSize:12,lineHeight:18,backgroundColor:'#f4f7f8',padding:17}, error:{color:'#9b2c2c',fontSize:12,marginBottom:18} })