import { useMemo, useRef, useState } from 'react'
import { ActivityIndicator, Alert, Animated, Dimensions, PanResponder, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { router } from 'expo-router'
import { supabase } from '../src/lib/supabase'

type Candidate = {
  id: string
  full_name?: string | null
  headline?: string | null
  role_level?: string | null
  experience_years?: number | null
  location?: string | null
  hourly_rate?: number | null
  review_score?: number | null
  review_count?: number | null
  whc_verified?: boolean | null
  has_insurance?: boolean | null
  distance_miles?: number | null
  travel_radius_miles?: number | null
  completed_shift_count?: number | null
  services_offered?: string[] | null
  is_featured?: boolean | null
}

const WEB_URL = process.env.EXPO_PUBLIC_WEB_URL || 'https://talent.wellnesshousecollective.co.uk'
const SCREEN_WIDTH = Dimensions.get('window').width
const SWIPE_THRESHOLD = Math.min(105, SCREEN_WIDTH * 0.25)

function defaultDate() {
  const date = new Date()
  date.setDate(date.getDate() + 1)
  return date.toISOString().slice(0, 10)
}

export default function AgencySearchScreen() {
  const [shiftDate, setShiftDate] = useState(defaultDate())
  const [startTime, setStartTime] = useState('09:00')
  const [endTime, setEndTime] = useState('17:00')
  const [radius, setRadius] = useState('30')
  const [shiftType, setShiftType] = useState('Spa Therapist')
  const [repeatWeeks, setRepeatWeeks] = useState('1')
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [loading, setLoading] = useState(false)
  const [sendingId, setSendingId] = useState('')
  const [rates, setRates] = useState<Record<string, string>>({})
  const [searched, setSearched] = useState(false)
  const [error, setError] = useState('')
  const [cardIndex,setCardIndex]=useState(0)
  const [lastAction,setLastAction]=useState('')
  const position=useRef(new Animated.ValueXY()).current

  async function authFetch(path: string, options?: RequestInit) {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.access_token) throw new Error('Your session has expired. Please sign in again.')
    const response = await fetch(`${WEB_URL}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
        ...(options?.headers || {}),
      },
    })
    const body = await response.json().catch(() => ({}))
    if (!response.ok) throw new Error(body?.error || 'Could not complete this Agency request.')
    return body
  }

  async function search() {
    setLoading(true)
    setError('')
    setSearched(true)
    setCardIndex(0)
    setLastAction('')
    position.setValue({x:0,y:0})
    try {
      const params = new URLSearchParams({
        shiftDate,
        shiftStartTime: startTime,
        shiftEndTime: endTime,
      })
      const parsedRadius = Number(radius)
      if (Number.isFinite(parsedRadius) && parsedRadius > 0) params.set('radius', String(parsedRadius))
      const payload = await authFetch(`/api/agency/directory?${params.toString()}`)
      const rows = (payload?.candidates || []) as Candidate[]
      setCandidates(rows)
      setRates(Object.fromEntries(rows.map(candidate => [candidate.id, candidate.hourly_rate ? String(candidate.hourly_rate) : ''])))
    } catch (e: any) {
      setCandidates([])
      setError(e?.message || 'Could not search Agency Talent.')
    } finally {
      setLoading(false)
    }
  }

  async function sendOffer(candidate: Candidate) {
    const rate = rates[candidate.id] || ''
    if (!rate || Number(rate) <= 0) {
      setError('Enter the hourly rate you want to offer.')
      return
    }
    setSendingId(candidate.id)
    setError('')
    try {
      const payload = await authFetch('/api/mobile/agency/create-offer', {
        method: 'POST',
        body: JSON.stringify({
          candidateId: candidate.id,
          shiftDate,
          shiftStartTime: startTime,
          shiftEndTime: endTime,
          shiftType,
          rate: Number(rate),
          repeatWeeks: Math.max(1, Math.min(8, Number(repeatWeeks) || 1)),
        }),
      })
      Alert.alert(
        payload?.urgent ? 'Urgent shift sent' : 'Shift offer sent',
        payload?.created > 1
          ? `${payload.created} weekly shift offers have been sent to ${candidate.full_name || 'the professional'}.`
          : `The shift offer has been sent to ${candidate.full_name || 'the professional'}.`,
        [{ text: 'View bookings', onPress: () => router.replace('/agency') }],
      )
    } catch (e: any) {
      setError(e?.message || 'Could not send this offer.')
    } finally {
      setSendingId('')
    }
  }

  const searchSummary = useMemo(() => `${shiftDate} · ${startTime} - ${endTime}${radius ? ` · up to ${radius} miles` : ''}`, [shiftDate, startTime, endTime, radius])
  const current=candidates[cardIndex]
  const next=candidates[cardIndex+1]

  function resetPosition(){Animated.spring(position,{toValue:{x:0,y:0},useNativeDriver:false,friction:5}).start()}
  function completeSwipe(direction:'left'|'right'){
    setLastAction(direction==='right'?'Kept for offer':'Passed for now')
    setCardIndex(index=>index+1)
    position.setValue({x:0,y:0})
  }
  function triggerSwipe(direction:'left'|'right'){
    Animated.timing(position,{toValue:{x:direction==='right'?SCREEN_WIDTH:-SCREEN_WIDTH,y:0},duration:190,useNativeDriver:false}).start(()=>completeSwipe(direction))
  }

  const panResponder=useMemo(()=>PanResponder.create({
    onStartShouldSetPanResponder:()=>false,
    onMoveShouldSetPanResponder:(_,gesture)=>Math.abs(gesture.dx)>6,
    onPanResponderMove:Animated.event([null,{dx:position.x,dy:position.y}],{useNativeDriver:false}),
    onPanResponderRelease:(_,gesture)=>{
      if(gesture.dx>SWIPE_THRESHOLD)triggerSwipe('right')
      else if(gesture.dx< -SWIPE_THRESHOLD)triggerSwipe('left')
      else resetPosition()
    },
  }),[cardIndex,current?.id])

  const rotate=position.x.interpolate({inputRange:[-SCREEN_WIDTH/2,0,SCREEN_WIDTH/2],outputRange:['-8deg','0deg','8deg'],extrapolate:'clamp'})
  const keepOpacity=position.x.interpolate({inputRange:[0,SWIPE_THRESHOLD],outputRange:[0,1],extrapolate:'clamp'})
  const passOpacity=position.x.interpolate({inputRange:[-SWIPE_THRESHOLD,0],outputRange:[1,0],extrapolate:'clamp'})

  function renderCandidate(candidate:Candidate, interactive=true){
    return <>
      <View style={styles.topRow}>
        <View style={styles.flex}>
          <Text style={styles.cardTitle}>{candidate.full_name || 'Agency Professional'}</Text>
          <Text style={styles.meta}>{[candidate.headline || candidate.role_level, candidate.location].filter(Boolean).join(' · ')}</Text>
        </View>
        {candidate.is_featured ? <Text style={styles.featured}>FEATURED</Text> : null}
      </View>
      <View style={styles.tags}>
        {candidate.whc_verified ? <Text style={styles.tag}>WHC Verified</Text> : null}
        {candidate.has_insurance ? <Text style={styles.tag}>Insured</Text> : null}
        {candidate.experience_years != null ? <Text style={styles.tag}>{candidate.experience_years} yrs experience</Text> : null}
      </View>
      <View style={styles.facts}>
        {candidate.distance_miles != null ? <Text style={styles.fact}>{candidate.distance_miles} miles away</Text> : null}
        {candidate.review_score != null ? <Text style={styles.fact}>{candidate.review_score}/5 {candidate.review_count ? `(${candidate.review_count})` : ''}</Text> : null}
        {candidate.completed_shift_count ? <Text style={styles.fact}>{candidate.completed_shift_count} completed Agency shifts</Text> : null}
      </View>
      {candidate.services_offered?.length ? <Text style={styles.services}>{candidate.services_offered.slice(0, 5).join(' · ')}</Text> : null}
      {interactive?<View style={styles.offerBox}>
        <Text style={styles.offerLabel}>Hourly rate to offer</Text>
        <View style={styles.rateRow}><Text style={styles.pound}>£</Text><TextInput value={rates[candidate.id] || ''} onChangeText={value => setRates(currentRates => ({ ...currentRates, [candidate.id]: value }))} keyboardType="numeric" style={styles.rateInput} placeholder={candidate.hourly_rate ? String(candidate.hourly_rate) : 'Rate'} /></View>
        {candidate.hourly_rate ? <Text style={styles.rateHint}>Professional’s listed rate: £{candidate.hourly_rate}/hr</Text> : null}
        <Pressable onPress={() => sendOffer(candidate)} disabled={sendingId === candidate.id} style={[styles.sendButton, sendingId === candidate.id && styles.disabled]}>
          <Text style={styles.sendText}>{sendingId === candidate.id ? 'Sending...' : `Send shift offer to ${candidate.full_name?.split(' ')[0] || 'Talent'}`}</Text>
        </Pressable>
      </View>:null}
    </>
  }

  return <ScrollView style={styles.scroll} contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled">
    <Pressable onPress={() => router.back()}><Text style={styles.back}>‹ Back to Agency</Text></Pressable>
    <Text style={styles.eyebrow}>EMPLOYER AGENCY SEARCH</Text>
    <Text style={styles.title}>Find available Talent</Text>
    <Text style={styles.intro}>Choose the exact shift first. The app only shows professionals who are approved, within travel rules and genuinely available for the whole shift.</Text>

    <View style={styles.formCard}>
      <Text style={styles.formTitle}>Shift details</Text>
      <Text style={styles.label}>Date</Text>
      <TextInput value={shiftDate} onChangeText={setShiftDate} placeholder="YYYY-MM-DD" style={styles.input} autoCapitalize="none" />
      <View style={styles.twoCol}>
        <View style={styles.flex}><Text style={styles.label}>Start</Text><TextInput value={startTime} onChangeText={setStartTime} placeholder="09:00" style={styles.input} /></View>
        <View style={styles.flex}><Text style={styles.label}>Finish</Text><TextInput value={endTime} onChangeText={setEndTime} placeholder="17:00" style={styles.input} /></View>
      </View>
      <Text style={styles.label}>Search radius in miles</Text>
      <TextInput value={radius} onChangeText={setRadius} keyboardType="numeric" placeholder="30" style={styles.input} />
      <Text style={styles.label}>Shift type</Text>
      <TextInput value={shiftType} onChangeText={setShiftType} placeholder="Spa Therapist" style={styles.input} />
      <Text style={styles.label}>Repeat weekly</Text>
      <TextInput value={repeatWeeks} onChangeText={setRepeatWeeks} keyboardType="numeric" placeholder="1" style={styles.input} />
      <Text style={styles.help}>Enter 1 for a single shift, or up to 8 weeks for a standing booking. The professional must already be available for every repeat date.</Text>
      <Pressable onPress={search} disabled={loading} style={[styles.primaryButton, loading && styles.disabled]}>
        <Text style={styles.primaryText}>{loading ? 'Searching...' : 'Find available Talent'}</Text>
      </Pressable>
    </View>

    {error ? <Text style={styles.error}>{error}</Text> : null}
    {loading ? <ActivityIndicator color="#092b45" style={{ marginVertical: 25 }} /> : null}

    {searched && !loading ? <View style={styles.resultsHeader}>
      <Text style={styles.sectionTitle}>{candidates.length} available {candidates.length === 1 ? 'professional' : 'professionals'}</Text>
      <Text style={styles.summary}>{searchSummary}</Text>
      {candidates.length>0?<Text style={styles.swipeHint}>Swipe right to keep someone for this shift. Swipe left to pass.</Text>:null}
    </View> : null}

    {searched && !loading && candidates.length === 0 ? <View style={styles.empty}><Text style={styles.emptyTitle}>No exact matches for this shift.</Text><Text style={styles.emptyCopy}>Try a different time, date or wider radius. The search will not show people who have not confirmed the full shift window.</Text></View> : null}

    {searched&&!loading&&current?<>
      <View style={styles.deck}>
        {next?<View style={[styles.card,styles.nextCard]}>{renderCandidate(next,false)}</View>:null}
        <Animated.View {...panResponder.panHandlers} style={[styles.card,styles.topCard,{transform:[{translateX:position.x},{translateY:position.y},{rotate}]}]}>
          <Animated.View pointerEvents="none" style={[styles.decisionBadge,styles.passBadge,{opacity:passOpacity}]}><Text style={styles.passText}>PASS</Text></Animated.View>
          <Animated.View pointerEvents="none" style={[styles.decisionBadge,styles.keepBadge,{opacity:keepOpacity}]}><Text style={styles.keepText}>KEEP</Text></Animated.View>
          {renderCandidate(current,true)}
        </Animated.View>
      </View>
      <View style={styles.swipeActions}>
        <Pressable onPress={()=>triggerSwipe('left')} style={[styles.circleButton,styles.passCircle]}><Text style={styles.circleSymbol}>×</Text><Text style={styles.circleLabel}>Pass</Text></Pressable>
        <Pressable onPress={()=>triggerSwipe('right')} style={[styles.circleButton,styles.keepCircle]}><Text style={styles.heartSymbol}>♡</Text><Text style={styles.circleLabel}>Keep</Text></Pressable>
      </View>
      <Text style={styles.progress}>{Math.min(cardIndex+1,candidates.length)} of {candidates.length}{lastAction?` · ${lastAction}`:''}</Text>
    </>:null}

    {searched&&!loading&&candidates.length>0&&!current?<View style={styles.empty}><Text style={styles.emptyTitle}>You have reviewed everyone available.</Text><Text style={styles.emptyCopy}>Change the shift details and search again, or review this group again.</Text><Pressable onPress={()=>setCardIndex(0)} style={styles.restart}><Text style={styles.restartText}>Review again</Text></Pressable></View>:null}
  </ScrollView>
}

const styles = StyleSheet.create({
  scroll:{flex:1,backgroundColor:'#fff'}, page:{paddingHorizontal:22,paddingTop:26,paddingBottom:120}, back:{color:'#66747c',fontSize:13,marginBottom:30}, eyebrow:{color:'#71808a',fontSize:9,letterSpacing:2.1,marginBottom:10}, title:{color:'#092b45',fontSize:30,lineHeight:36,fontWeight:'500'}, intro:{color:'#66747c',fontSize:13,lineHeight:20,marginTop:9,marginBottom:22}, formCard:{backgroundColor:'#f4f7f8',padding:16,marginBottom:22}, formTitle:{color:'#173246',fontSize:16,fontWeight:'600',marginBottom:12}, label:{color:'#173246',fontSize:10,fontWeight:'600',marginBottom:5,marginTop:9}, input:{backgroundColor:'#fff',borderWidth:1,borderColor:'#d7e0e4',paddingHorizontal:11,paddingVertical:10,color:'#173246',fontSize:12}, twoCol:{flexDirection:'row',gap:10}, flex:{flex:1}, help:{color:'#71808a',fontSize:10,lineHeight:15,marginTop:8}, primaryButton:{backgroundColor:'#092b45',padding:14,marginTop:15,alignItems:'center'}, primaryText:{color:'#fff',fontSize:11,fontWeight:'700'}, disabled:{opacity:.5}, error:{color:'#9b2c2c',fontSize:12,lineHeight:18,marginBottom:16}, resultsHeader:{marginBottom:12}, sectionTitle:{color:'#173246',fontSize:17,fontWeight:'600'}, summary:{color:'#71808a',fontSize:10,marginTop:4},swipeHint:{color:'#526976',fontSize:11,lineHeight:16,marginTop:7}, empty:{backgroundColor:'#f4f7f8',padding:18}, emptyTitle:{color:'#173246',fontSize:14,fontWeight:'600'}, emptyCopy:{color:'#71808a',fontSize:11,lineHeight:17,marginTop:5}, card:{position:'absolute',left:0,right:0,borderWidth:1,borderColor:'#dce3e7',padding:18,backgroundColor:'#fff',minHeight:455,shadowColor:'#0b2f4d',shadowOpacity:.10,shadowRadius:14,shadowOffset:{width:0,height:8},elevation:4}, topRow:{flexDirection:'row',gap:12,justifyContent:'space-between'}, cardTitle:{color:'#173246',fontSize:19,fontWeight:'600'}, meta:{color:'#66747c',fontSize:11,lineHeight:17,marginTop:4}, featured:{color:'#092b45',fontSize:8,fontWeight:'700',letterSpacing:1}, tags:{flexDirection:'row',flexWrap:'wrap',gap:6,marginTop:12}, tag:{backgroundColor:'#eef3f5',color:'#173246',fontSize:9,paddingHorizontal:8,paddingVertical:5}, facts:{flexDirection:'row',flexWrap:'wrap',gap:10,marginTop:12}, fact:{color:'#66747c',fontSize:10}, services:{color:'#71808a',fontSize:10,lineHeight:16,marginTop:10}, offerBox:{borderTopWidth:1,borderTopColor:'#edf1f3',marginTop:15,paddingTop:13}, offerLabel:{color:'#173246',fontSize:10,fontWeight:'600'}, rateRow:{flexDirection:'row',alignItems:'center',marginTop:7}, pound:{color:'#173246',fontSize:18,marginRight:6}, rateInput:{borderWidth:1,borderColor:'#d7e0e4',paddingHorizontal:11,paddingVertical:9,minWidth:100,color:'#173246',fontSize:13}, rateHint:{color:'#71808a',fontSize:9,marginTop:5}, sendButton:{backgroundColor:'#092b45',padding:12,alignItems:'center',marginTop:12}, sendText:{color:'#fff',fontSize:10,fontWeight:'700'},deck:{height:500,position:'relative',marginTop:4},nextCard:{top:10,left:8,right:8,opacity:.52,transform:[{scale:.975}]},topCard:{zIndex:2},decisionBadge:{position:'absolute',top:20,zIndex:20,borderWidth:2,paddingHorizontal:12,paddingVertical:7},passBadge:{right:18,borderColor:'#9b3d45',transform:[{rotate:'-8deg'}]},keepBadge:{left:18,borderColor:'#3f7a62',transform:[{rotate:'8deg'}]},passText:{color:'#9b3d45',fontSize:16,fontWeight:'800',letterSpacing:1.4},keepText:{color:'#3f7a62',fontSize:16,fontWeight:'800',letterSpacing:1.4},swipeActions:{flexDirection:'row',justifyContent:'center',gap:38,alignItems:'center',marginTop:12},circleButton:{width:68,height:68,borderRadius:34,backgroundColor:'#fff',borderWidth:1,alignItems:'center',justifyContent:'center',shadowColor:'#0b2f4d',shadowOpacity:.08,shadowRadius:8,shadowOffset:{width:0,height:4},elevation:2},passCircle:{borderColor:'#dfc7ca'},keepCircle:{borderColor:'#c7d9d0'},circleSymbol:{fontSize:29,color:'#9b3d45',lineHeight:30},heartSymbol:{fontSize:28,color:'#3f7a62',lineHeight:30},circleLabel:{fontSize:8,color:'#71808a',textTransform:'uppercase',letterSpacing:.8,marginTop:1},progress:{textAlign:'center',fontSize:10,color:'#71808a',marginTop:14},restart:{backgroundColor:'#092b45',paddingVertical:12,paddingHorizontal:16,alignSelf:'flex-start',marginTop:14},restartText:{color:'#fff',fontSize:11,fontWeight:'700'}
})
