import { useEffect, useMemo, useState } from 'react'
import { ActivityIndicator, Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { router } from 'expo-router'
import { supabase } from '../src/lib/supabase'
import { palette, radius, space, type } from '../src/lib/theme'

type Role = 'talent' | 'employer'
type WindowRow = { id:string; date:string; start_time:string; end_time:string; timezone?:string|null }
type DayDraft = { date:string; start:string; end:string }
type PickerState = { date:string; field:'start'|'end' } | null

type BookingRow = {
  id:string
  shift_date:string|null
  shift_start_time:string|null
  shift_end_time:string|null
  shift_type?:string|null
  hours?:number|null
  status:string
  rate:number
  urgent:boolean|null
  expires_at?:string|null
  paid_at?:string|null
  booking_group?:string|null
  distance_miles?:number|null
  candidate_travel_radius?:number|null
  within_radius?:boolean|null
  employer_name?:string|null
  employer_user_id?:string|null
  employer_location?:string|null
  employer_review_score?:number|null
  employer_review_count?:number|null
  employer_star_rating?:number|null
  employer_postcode?:string|null
  employer_description?:string|null
  employer_photos?:string[]|null
  commute_car_required?:boolean|null
  nearest_transport?:string|null
  transport_walk_minutes?:number|null
  parking_available?:boolean|null
  taxi_support?:boolean|null
  taxi_notes?:string|null
  travel_notes?:string|null
  candidate_name?:string|null
  candidate_user_id?:string|null
  reviewed_by_viewer?:boolean|null
  viewer_role?:'candidate'|'employer'
  employer_review_completed_at?:string|null
  candidate_review_completed_at?:string|null
}

const WEB_URL = process.env.EXPO_PUBLIC_WEB_URL || 'https://talenthousecollective.co.uk'
const TIMES = Array.from({ length: 33 }, (_, index) => {
  const total = 6 * 60 + index * 30
  const hour = Math.floor(total / 60)
  const minute = total % 60
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
})
const QUICK_HOURS = [['09:00','17:00'],['10:00','18:00'],['12:00','20:00'],['13:00','21:00']]

function timeLabel(value?:string|null){ return value ? value.slice(0,5) : '' }
function dateLabel(date:string){ return new Date(`${date}T12:00:00`).toLocaleDateString('en-GB',{ weekday:'short', day:'numeric', month:'short' }) }
function nextSevenDays():DayDraft[]{
  return Array.from({ length:7 }, (_, index) => {
    const date = new Date()
    date.setDate(date.getDate() + index)
    return { date:date.toISOString().slice(0,10), start:'09:00', end:'17:00' }
  })
}
function shiftFinished(booking:BookingRow){
  if(!booking.shift_date) return false
  const end = booking.shift_end_time || booking.shift_start_time || '23:59'
  return new Date(`${booking.shift_date}T${end}`).getTime() <= Date.now()
}

export default function AgencyScreen(){
  const [role,setRole] = useState<Role>('talent')
  const [windows,setWindows] = useState<WindowRow[]>([])
  const [bookings,setBookings] = useState<BookingRow[]>([])
  const [drafts,setDrafts] = useState<DayDraft[]>(nextSevenDays())
  const [loading,setLoading] = useState(true)
  const [savingDate,setSavingDate] = useState('')
  const [error,setError] = useState('')
  const [picker,setPicker] = useState<PickerState>(null)

  useEffect(()=>{ void load() },[])

  async function authFetch(path:string,options?:RequestInit){
    const { data:{ session } } = await supabase.auth.getSession()
    if(!session?.access_token) throw new Error('Your session has expired. Please sign in again.')
    const response = await fetch(`${WEB_URL}${path}`,{
      ...options,
      headers:{ 'Content-Type':'application/json', Authorization:`Bearer ${session.access_token}`, ...(options?.headers||{}) },
    })
    const body = await response.json().catch(()=>({}))
    if(!response.ok) throw new Error(body?.error || 'Could not load Agency data.')
    return body
  }

  async function load(){
    setLoading(true)
    setError('')
    try{
      const { data:{ user } } = await supabase.auth.getUser()
      if(!user){ router.replace('/login'); return }
      const { data:account } = await supabase.from('profiles').select('role').eq('id',user.id).maybeSingle()
      const resolved:Role = account?.role === 'employer' ? 'employer' : 'talent'
      setRole(resolved)

      const bookingPayload = await authFetch('/api/agency/booking')
      setBookings((bookingPayload?.bookings || []) as BookingRow[])

      if(resolved === 'talent'){
        const availabilityPayload = await authFetch('/api/agency/availability')
        const future = (availabilityPayload?.windows || []) as WindowRow[]
        setWindows(future)
        setDrafts(current => current.map(day => {
          const existing = future.find(window => window.date === day.date)
          return existing ? { ...day, start:timeLabel(existing.start_time), end:timeLabel(existing.end_time) } : day
        }))
      }
    }catch(e:any){
      setError(e?.message || 'Could not load Agency data.')
    }finally{
      setLoading(false)
    }
  }

  const upcoming = useMemo(
    ()=>bookings.filter(booking=>!['declined','cancelled','expired'].includes(booking.status)),
    [bookings]
  )

  function updateDraft(date:string,field:'start'|'end',value:string){
    setDrafts(current=>current.map(day=>day.date===date?{...day,[field]:value}:day))
    setPicker(null)
  }

  function setQuickHours(date:string,start:string,end:string){
    setDrafts(current=>current.map(day=>day.date===date?{...day,start,end}:day))
    setPicker(null)
  }

  async function saveAvailability(day:DayDraft,state:'available'|'unavailable'|'clear'){
    setSavingDate(day.date)
    setError('')
    try{
      if(state==='available' && day.start>=day.end) throw new Error('Finish time must be after the start time.')
      await authFetch('/api/agency/availability',{
        method:'POST',
        body:JSON.stringify({ date:day.date, state, startTime:day.start, endTime:day.end }),
      })
      const payload = await authFetch('/api/agency/availability')
      setWindows((payload?.windows || []) as WindowRow[])
      Alert.alert(
        state==='available'?'Availability saved':state==='unavailable'?'Marked unavailable':'Availability cleared',
        `${dateLabel(day.date)} has been updated.`
      )
    }catch(e:any){
      setError(e?.message || 'Could not update availability.')
    }finally{
      setSavingDate('')
    }
  }

  function openBooking(booking:BookingRow){
    if(role==='talent') router.push({ pathname:'/agency-fact-file/[id]', params:{ id:booking.id } })
    else router.push({ pathname:'/agency-booking/[id]', params:{ id:booking.id } })
  }

  function timePicker(day:DayDraft,field:'start'|'end'){
    const isOpen = picker?.date===day.date && picker.field===field
    return <View style={styles.timeColumn}>
      <Text style={styles.label}>{field==='start'?'From':'Until'}</Text>
      <Pressable onPress={()=>setPicker(isOpen?null:{date:day.date,field})} style={[styles.timeSelector,isOpen&&styles.timeSelectorOpen]}>
        <Text style={styles.timeSelectorText}>{field==='start'?day.start:day.end}</Text>
        <Text style={styles.chevron}>{isOpen?'▲':'▼'}</Text>
      </Pressable>
      {isOpen?<View style={styles.timePanel}>{TIMES.map(value=><Pressable key={value} onPress={()=>updateDraft(day.date,field,value)} style={styles.timeOption}><Text style={styles.timeOptionText}>{value}</Text></Pressable>)}</View>:null}
    </View>
  }

  return <ScrollView style={styles.scroll} contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled">
    <Pressable onPress={()=>router.back()} style={styles.backButton}><Text style={styles.back}>‹ Back</Text></Pressable>
    <Text style={styles.eyebrow}>AGENCY</Text>
    <Text style={styles.title}>{role==='talent'?'Flexible work, on your terms.':'Flexible staffing, clearly managed.'}</Text>
    <Text style={styles.intro}>{role==='talent'?'Set the hours that genuinely work for you. Every offer includes a full Property Fact File before you decide.':'Search real availability for the hours you need, then manage offers and bookings in one place.'}</Text>

    {loading?<ActivityIndicator color={palette.ink} style={{marginTop:24}}/>:null}
    {error?<Text style={styles.error}>{error}</Text>:null}

    {role==='employer'&&!loading?<Pressable onPress={()=>router.push('/agency-search')} style={styles.findTalentCard}>
      <Text style={styles.findTalentEyebrow}>NEED COVER?</Text>
      <Text style={styles.findTalentTitle}>Find available professionals</Text>
      <Text style={styles.findTalentCopy}>Choose the exact date, hours and search radius. Results respect both real availability and each professional’s own travel radius.</Text>
      <View style={styles.linkRow}><Text style={styles.findTalentLink}>Search Agency Talent</Text><Text style={styles.findTalentArrow}>→</Text></View>
    </Pressable>:null}

    {role==='talent'&&!loading?<View style={styles.section}>
      <View style={styles.availHeading}>
        <View style={styles.headingCopy}>
          <Text style={styles.sectionEyebrow}>YOUR AVAILABILITY</Text>
          <Text style={styles.sectionTitle}>When can you work?</Text>
          <Text style={styles.help}>Each day can be different. Set only the hours you actually want to offer.</Text>
        </View>
        <View style={styles.livePill}><Text style={styles.livePillText}>{windows.length} SET</Text></View>
      </View>

      {drafts.map(day=>{
        const existing = windows.some(window=>window.date===day.date)
        return <View key={day.date} style={[styles.availabilityCard,existing&&styles.availabilityCardSet]}>
          <View style={styles.dayHeader}>
            <View>
              <Text style={styles.rowMain}>{dateLabel(day.date)}</Text>
              <Text style={[styles.savedState,existing&&styles.savedStateOn]}>{existing?'AVAILABLE':'NOT SET'}</Text>
            </View>
            {existing?<Text style={styles.savedHours}>{day.start}–{day.end}</Text>:null}
          </View>

          <View style={styles.quickRow}>{QUICK_HOURS.map(([start,end])=><Pressable key={`${start}-${end}`} onPress={()=>setQuickHours(day.date,start,end)} style={[styles.quickChip,day.start===start&&day.end===end&&styles.quickChipActive]}><Text style={[styles.quickChipText,day.start===start&&day.end===end&&styles.quickChipTextActive]}>{start.slice(0,2)}–{end.slice(0,2)}</Text></Pressable>)}</View>

          <View style={styles.timeRow}>{timePicker(day,'start')}{timePicker(day,'end')}</View>

          <View style={styles.buttonRow}>
            <Pressable disabled={savingDate===day.date} onPress={()=>saveAvailability(day,'available')} style={[styles.saveButton,savingDate===day.date&&styles.disabled]}><Text style={styles.saveText}>{savingDate===day.date?'Saving…':existing?'Update hours':'Set as available'}</Text></Pressable>
            <Pressable disabled={savingDate===day.date} onPress={()=>saveAvailability(day,'unavailable')} style={styles.outlineButton}><Text style={styles.outlineText}>Unavailable</Text></Pressable>
            {existing?<Pressable disabled={savingDate===day.date} onPress={()=>saveAvailability(day,'clear')} style={styles.clearButton}><Text style={styles.clearText}>Clear</Text></Pressable>:null}
          </View>
        </View>
      })}
    </View>:null}

    {!loading?<View style={styles.section}>
      <Text style={styles.sectionEyebrow}>{role==='talent'?'YOUR SHIFTS':'CURRENT ACTIVITY'}</Text>
      <Text style={styles.sectionTitle}>{role==='talent'?'Offers & bookings':'Bookings'}</Text>
      {role==='talent'?<Text style={styles.help}>Open an offer before accepting to see property photos, rating, distance, travel information, parking, arrival details and working facts.</Text>:null}

      {upcoming.length===0?<View style={styles.empty}><Text style={styles.emptyTitle}>Nothing waiting right now.</Text><Text style={styles.emptyCopy}>New Agency activity will appear here automatically.</Text></View>:upcoming.map(booking=>{
        const name = role==='talent' ? (booking.employer_name||'Property') : (booking.candidate_name||'Talent')
        const photos = Array.isArray(booking.employer_photos) ? booking.employer_photos.filter(Boolean) : []
        const rating = Number(booking.employer_review_score||booking.employer_star_rating||0)
        const actionable = ['pending','offered','requested','countered'].includes(booking.status)
        const finished = shiftFinished(booking)
        const reviewable = (booking.status==='completed'||(booking.status==='confirmed'&&finished))&&!booking.reviewed_by_viewer
        const reviewedId = role==='talent' ? booking.employer_user_id : booking.candidate_user_id
        const bothReviews = Boolean(booking.employer_review_completed_at&&booking.candidate_review_completed_at)

        return <View key={booking.id} style={[styles.card,actionable&&role==='talent'?styles.actionCard:null]}>
          {role==='talent'&&photos[0]?<Image source={{uri:photos[0]}} style={styles.propertyImage}/>:null}
          <View style={styles.cardPad}>
            <View style={styles.topRow}>
              <Text style={styles.status}>{booking.status}</Text>
              {booking.urgent?<Text style={styles.urgent}>URGENT</Text>:null}
            </View>
            <Text style={styles.cardTitle}>{name}</Text>
            {role==='talent'&&rating>0?<Text style={styles.rating}>{rating.toFixed(1)} ★ {booking.employer_review_count?`· ${booking.employer_review_count} reviews`:''}</Text>:null}
            <Text style={styles.cardCopy}>{[booking.shift_type,booking.shift_date,`${timeLabel(booking.shift_start_time)}${booking.shift_end_time?`–${timeLabel(booking.shift_end_time)}`:''}`,booking.rate?`£${booking.rate}/hr`:null].filter(Boolean).join(' · ')}</Text>

            {role==='talent'?<View style={styles.quickFacts}>
              {booking.employer_location?<Text style={styles.quickLine}>{booking.employer_location}{booking.employer_postcode?` · ${booking.employer_postcode}`:''}</Text>:null}
              {booking.distance_miles!=null?<Text style={styles.quickLine}>{booking.distance_miles} miles away</Text>:null}
              {booking.nearest_transport?<Text style={styles.quickLine}>Nearest transport · {booking.nearest_transport}</Text>:null}
              {booking.parking_available?<Text style={styles.quickLine}>Staff parking available</Text>:null}
            </View>:null}

            <Pressable onPress={()=>openBooking(booking)} style={actionable&&role==='talent'?styles.actionButton:styles.viewButton}>
              <Text style={actionable&&role==='talent'?styles.actionButtonText:styles.viewButtonText}>{role==='talent'?(actionable?'Review shift before deciding':'Open Property Fact File'):(booking.status==='countered'?'Review counter offer':'Open booking')}</Text>
              <Text style={actionable&&role==='talent'?styles.actionButtonArrow:styles.viewButtonArrow}>→</Text>
            </Pressable>

            {booking.booking_group&&actionable&&role==='talent'?<Text style={styles.standing}>Standing booking available</Text>:null}

            {finished&&!booking.paid_at?<View style={styles.paymentHold}>
              <Text style={styles.paymentHoldTitle}>{bothReviews?'Reviews complete':'Payment held until both reviews'}</Text>
              <Text style={styles.paymentHoldCopy}>{bothReviews?'Both sides have reviewed the shift. Payment can now move to release.':'The professional and property must both complete their post-shift review before payment is released.'}</Text>
            </View>:null}

            {reviewable&&reviewedId?<Pressable onPress={()=>router.push({pathname:'/agency-review/[id]',params:{id:booking.id,reviewedId,type:role==='talent'?'employer':'candidate',name}})} style={styles.reviewButton}><Text style={styles.reviewButtonText}>Complete my shift review</Text><Text style={styles.reviewButtonArrow}>→</Text></Pressable>:null}
            {booking.reviewed_by_viewer?<Text style={styles.reviewed}>Your review is complete ✓</Text>:null}
          </View>
        </View>
      })}
    </View>:null}
  </ScrollView>
}

const styles = StyleSheet.create({
  scroll:{flex:1,backgroundColor:palette.stone},
  page:{paddingHorizontal:space.page,paddingTop:18,paddingBottom:118},
  backButton:{alignSelf:'flex-start',paddingVertical:6,marginBottom:22},
  back:{color:palette.muted,fontSize:13},
  eyebrow:{color:palette.quiet,fontSize:8,letterSpacing:2.2,fontWeight:'700',marginBottom:9},
  title:{color:palette.inkStrong,fontSize:34,lineHeight:40,fontWeight:'400',fontFamily:type.serif,maxWidth:350},
  intro:{color:palette.muted,fontSize:13,lineHeight:20,marginTop:11,marginBottom:24,maxWidth:360},
  error:{color:palette.danger,fontSize:11,lineHeight:17,marginBottom:16},

  findTalentCard:{backgroundColor:palette.inkStrong,padding:20,marginBottom:30,borderRadius:radius.large},
  findTalentEyebrow:{color:'#C8D1D2',fontSize:8,letterSpacing:1.7,fontWeight:'700'},
  findTalentTitle:{color:palette.paper,fontFamily:type.serif,fontSize:24,lineHeight:29,fontWeight:'400',marginTop:8},
  findTalentCopy:{color:'#D8DEDF',fontSize:11,lineHeight:18,marginTop:8},
  linkRow:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginTop:17,paddingTop:14,borderTopWidth:1,borderTopColor:'rgba(255,255,255,.16)'},
  findTalentLink:{color:palette.paper,fontSize:11,fontWeight:'700'},
  findTalentArrow:{color:palette.paper,fontSize:16},

  section:{marginBottom:32},
  sectionEyebrow:{color:palette.quiet,fontSize:8,letterSpacing:1.8,fontWeight:'700',marginBottom:6},
  sectionTitle:{color:palette.inkStrong,fontSize:23,lineHeight:28,fontWeight:'400',fontFamily:type.serif,marginBottom:7},
  help:{color:palette.muted,fontSize:10.5,lineHeight:16,marginBottom:14},
  availHeading:{flexDirection:'row',alignItems:'flex-start',gap:10,marginBottom:4},
  headingCopy:{flex:1},
  livePill:{backgroundColor:palette.sageSoft,paddingHorizontal:9,paddingVertical:6,borderRadius:999},
  livePillText:{color:palette.sage,fontSize:8,fontWeight:'800'},

  availabilityCard:{borderWidth:1,borderColor:palette.line,padding:16,marginBottom:10,backgroundColor:palette.paper,borderRadius:radius.large},
  availabilityCardSet:{borderColor:'#BCC8BF',backgroundColor:'#FBFCFA'},
  dayHeader:{flexDirection:'row',justifyContent:'space-between',alignItems:'center'},
  rowMain:{color:palette.text,fontSize:14,fontWeight:'700'},
  savedState:{color:palette.quiet,fontSize:8,marginTop:4,letterSpacing:.8,fontWeight:'700'},
  savedStateOn:{color:palette.sage},
  savedHours:{color:palette.sage,fontSize:13,fontWeight:'700'},
  quickRow:{flexDirection:'row',flexWrap:'wrap',gap:6,marginTop:14},
  quickChip:{borderWidth:1,borderColor:palette.line,paddingHorizontal:10,paddingVertical:7,backgroundColor:palette.paper,borderRadius:radius.small},
  quickChipActive:{backgroundColor:palette.inkStrong,borderColor:palette.inkStrong},
  quickChipText:{color:palette.muted,fontSize:9,fontWeight:'700'},
  quickChipTextActive:{color:palette.paper},
  timeRow:{flexDirection:'row',gap:9,marginTop:12,alignItems:'flex-start'},
  timeColumn:{flex:1},
  label:{color:palette.text,fontSize:9,fontWeight:'700',marginBottom:5},
  timeSelector:{borderWidth:1,borderColor:palette.line,paddingHorizontal:11,paddingVertical:12,flexDirection:'row',justifyContent:'space-between',alignItems:'center',backgroundColor:palette.paper,borderRadius:radius.small},
  timeSelectorOpen:{borderColor:palette.sage},
  timeSelectorText:{color:palette.text,fontSize:12,fontWeight:'700'},
  chevron:{color:palette.quiet,fontSize:8},
  timePanel:{borderWidth:1,borderColor:palette.line,backgroundColor:palette.paper,flexDirection:'row',flexWrap:'wrap',gap:4,padding:6,marginTop:4,maxHeight:180,overflow:'hidden',borderRadius:radius.small},
  timeOption:{width:'23%',paddingVertical:7,alignItems:'center',backgroundColor:palette.stone},
  timeOptionText:{color:palette.text,fontSize:9,fontWeight:'600'},
  buttonRow:{flexDirection:'row',alignItems:'center',gap:8,marginTop:13,flexWrap:'wrap'},
  saveButton:{backgroundColor:palette.inkStrong,paddingHorizontal:13,paddingVertical:11,borderRadius:radius.small},
  saveText:{color:palette.paper,fontSize:9.5,fontWeight:'700'},
  outlineButton:{borderWidth:1,borderColor:palette.lineStrong,paddingHorizontal:12,paddingVertical:10,borderRadius:radius.small},
  outlineText:{color:palette.muted,fontSize:9.5,fontWeight:'600'},
  clearButton:{paddingHorizontal:6,paddingVertical:10},
  clearText:{color:palette.danger,fontSize:9.5},
  disabled:{opacity:.45},

  card:{borderWidth:1,borderColor:palette.line,backgroundColor:palette.paper,marginBottom:12,overflow:'hidden',borderRadius:radius.large},
  actionCard:{borderColor:'#C9B99D'},
  propertyImage:{width:'100%',height:160,backgroundColor:palette.stoneDeep},
  cardPad:{padding:16},
  topRow:{flexDirection:'row',justifyContent:'space-between',alignItems:'center'},
  status:{color:palette.quiet,fontSize:8,textTransform:'uppercase',letterSpacing:1.2,fontWeight:'700'},
  urgent:{color:palette.danger,fontSize:8,fontWeight:'800',letterSpacing:1},
  cardTitle:{color:palette.inkStrong,fontFamily:type.serif,fontSize:23,lineHeight:28,fontWeight:'400',marginTop:8},
  rating:{color:palette.sage,fontSize:10,fontWeight:'700',marginTop:5},
  cardCopy:{color:palette.muted,fontSize:11,lineHeight:17,marginTop:8},
  quickFacts:{backgroundColor:palette.stone,padding:11,marginTop:12,gap:4,borderRadius:radius.medium},
  quickLine:{color:palette.muted,fontSize:9.5,lineHeight:15},

  actionButton:{backgroundColor:palette.inkStrong,paddingHorizontal:14,paddingVertical:13,marginTop:13,flexDirection:'row',justifyContent:'space-between',alignItems:'center',borderRadius:radius.medium},
  actionButtonText:{color:palette.paper,fontSize:10.5,fontWeight:'700'},
  actionButtonArrow:{color:palette.paper,fontSize:15},
  viewButton:{borderTopWidth:1,borderTopColor:palette.line,paddingTop:13,marginTop:14,flexDirection:'row',justifyContent:'space-between',alignItems:'center'},
  viewButtonText:{color:palette.ink,fontSize:10.5,fontWeight:'700'},
  viewButtonArrow:{color:palette.ink,fontSize:15},
  standing:{color:'#806D4F',fontSize:9,marginTop:9},

  paymentHold:{backgroundColor:'#F7F3E9',borderLeftWidth:2,borderLeftColor:'#B29A6A',padding:11,marginTop:13,borderRadius:radius.small},
  paymentHoldTitle:{color:'#5C4E35',fontSize:10,fontWeight:'800'},
  paymentHoldCopy:{color:'#75694F',fontSize:9,lineHeight:14,marginTop:4},
  reviewButton:{borderTopWidth:1,borderTopColor:palette.line,paddingTop:13,marginTop:13,flexDirection:'row',justifyContent:'space-between',alignItems:'center'},
  reviewButtonText:{color:palette.ink,fontSize:10.5,fontWeight:'700'},
  reviewButtonArrow:{color:palette.ink,fontSize:15},
  reviewed:{color:palette.sage,fontSize:9,fontWeight:'700',marginTop:11},

  empty:{backgroundColor:palette.paper,borderWidth:1,borderColor:palette.line,padding:18,borderRadius:radius.large},
  emptyTitle:{color:palette.inkStrong,fontSize:18,fontWeight:'400',fontFamily:type.serif},
  emptyCopy:{color:palette.muted,fontSize:11.5,lineHeight:18,marginTop:6},
})