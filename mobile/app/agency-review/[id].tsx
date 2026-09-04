import { useState } from 'react'
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { supabase } from '../../src/lib/supabase'
import { palette, radius, space, type } from '../../src/lib/theme'

const WEB_URL = process.env.EXPO_PUBLIC_WEB_URL || 'https://talenthousecollective.co.uk'

const ratingCopy: Record<number,{title:string;copy:string}> = {
  5:{title:'Excellent',copy:'Everything worked well and you would be happy to work together again.'},
  4:{title:'Very good',copy:'A strong shift with only minor points that could be improved.'},
  3:{title:'Good',copy:'The shift was broadly positive, with some useful feedback to share.'},
  2:{title:'Needs improvement',copy:'There were meaningful issues that the other side should understand.'},
  1:{title:'Poor',copy:'The experience fell well below what you reasonably expected.'},
}

export default function AgencyReviewScreen() {
  const params = useLocalSearchParams<{ id: string; reviewedId?: string; type?: string; name?: string }>()
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function submit() {
    if (!params.id || !params.reviewedId) return
    setBusy(true)
    setError('')
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) throw new Error('Your session has expired. Please sign in again.')
      const response = await fetch(`${WEB_URL}/api/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({
          reviewed_id: params.reviewedId,
          rating,
          comment: comment.trim(),
          type: params.type === 'employer' ? 'employer' : 'candidate',
          booking_id: params.id,
        }),
      })
      const body = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(body?.error || 'Could not save your review.')
      Alert.alert('Review submitted', 'Thank you. Your review helps keep Agency Shifts reliable for everyone.')
      router.replace('/agency')
    } catch (e: any) {
      setError(e?.message || 'Could not save your review.')
    } finally {
      setBusy(false)
    }
  }

  const selected = ratingCopy[rating]

  return <ScrollView style={styles.scroll} contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled">
    <Pressable onPress={() => router.back()} style={styles.backButton}><Text style={styles.back}>‹ Agency</Text></Pressable>
    <Text style={styles.eyebrow}>AGENCY · POST-SHIFT REVIEW</Text>
    <Text style={styles.title}>How did it go?</Text>
    <Text style={styles.intro}>Review {params.name || 'this shift partner'} after the completed shift. Keep it factual, fair and useful to the next person making a decision.</Text>

    <View style={styles.trustNote}>
      <Text style={styles.trustEyebrow}>VERIFIED WORKING RELATIONSHIP</Text>
      <Text style={styles.trustTitle}>This review is linked to a completed Agency booking.</Text>
      <Text style={styles.trustCopy}>Talent House uses booking-linked feedback to build a more useful reputation record for both Talent and properties.</Text>
    </View>

    <View style={styles.card}>
      <Text style={styles.sectionEyebrow}>YOUR RATING</Text>
      <Text style={styles.sectionTitle}>Overall experience</Text>
      <View style={styles.ratingRow}>{[1,2,3,4,5].map(value => {
        const active = rating === value
        return <Pressable key={value} onPress={() => setRating(value)} style={[styles.rating, active && styles.ratingActive]}>
          <Text style={[styles.ratingNumber, active && styles.ratingNumberActive]}>{value}</Text>
          <Text style={[styles.star, active && styles.starActive]}>★</Text>
        </Pressable>
      })}</View>
      <View style={styles.ratingMeaning}>
        <Text style={styles.ratingTitle}>{selected.title}</Text>
        <Text style={styles.ratingCopy}>{selected.copy}</Text>
      </View>
    </View>

    <View style={styles.card}>
      <Text style={styles.sectionEyebrow}>WRITTEN FEEDBACK</Text>
      <Text style={styles.sectionTitle}>What would be useful to know?</Text>
      <Text style={styles.sectionCopy}>Focus on reliability, communication, standards, professionalism and anything that would genuinely help the other side improve.</Text>
      <TextInput
        value={comment}
        onChangeText={setComment}
        multiline
        placeholder="Share clear, professional feedback about the completed shift…"
        placeholderTextColor={palette.quiet}
        style={styles.textarea}
        maxLength={1200}
      />
      <View style={styles.characterRow}><Text style={styles.characterHelp}>Optional, but useful when there is context behind the rating.</Text><Text style={styles.characterCount}>{comment.length}/1200</Text></View>
    </View>

    <View style={styles.guidance}>
      <Text style={styles.guidanceEyebrow}>REVIEW STANDARD</Text>
      <Text style={styles.guidanceTitle}>Keep it professional and evidence-based.</Text>
      <Text style={styles.guidanceCopy}>Do not include private personal information, speculation or comments unrelated to the shift. If something serious happened, use the appropriate Agency support or dispute route as well as leaving fair feedback.</Text>
    </View>

    {error ? <View style={styles.errorCard}><Text style={styles.errorTitle}>Review not submitted</Text><Text style={styles.error}>{error}</Text></View> : null}
    <Pressable disabled={busy} onPress={submit} style={[styles.primary, busy && styles.disabled]}>{busy ? <ActivityIndicator color={palette.paper} /> : <Text style={styles.primaryText}>Submit verified review</Text>}</Pressable>
  </ScrollView>
}

const styles = StyleSheet.create({
  scroll:{flex:1,backgroundColor:palette.stone},
  page:{paddingHorizontal:space.page,paddingTop:18,paddingBottom:118},
  backButton:{alignSelf:'flex-start',paddingVertical:6,marginBottom:22},
  back:{color:palette.muted,fontSize:13,fontFamily:type.sans},
  eyebrow:{color:palette.quiet,fontSize:8,letterSpacing:2.1,marginBottom:9,fontWeight:'700',fontFamily:type.sans},
  title:{color:palette.inkStrong,fontSize:34,lineHeight:40,fontWeight:'400',fontFamily:type.serif},
  intro:{color:palette.muted,fontSize:13,lineHeight:20,marginTop:10,marginBottom:20,fontFamily:type.sans},
  trustNote:{backgroundColor:palette.inkStrong,padding:17,borderRadius:radius.large,marginBottom:10},
  trustEyebrow:{color:'#CBD5D9',fontSize:7.5,letterSpacing:1.3,fontWeight:'700',fontFamily:type.sans},
  trustTitle:{color:palette.paper,fontSize:18,lineHeight:23,fontWeight:'400',fontFamily:type.serif,marginTop:5},
  trustCopy:{color:'#DCE4E7',fontSize:10.5,lineHeight:17,marginTop:5,fontFamily:type.sans},
  card:{backgroundColor:palette.paper,borderWidth:1,borderColor:palette.line,padding:17,borderRadius:radius.large,marginBottom:10},
  sectionEyebrow:{color:palette.quiet,fontSize:7.5,letterSpacing:1.3,fontWeight:'700',fontFamily:type.sans},
  sectionTitle:{color:palette.inkStrong,fontSize:20,lineHeight:25,fontWeight:'400',fontFamily:type.serif,marginTop:5},
  sectionCopy:{color:palette.muted,fontSize:10.5,lineHeight:17,marginTop:5,fontFamily:type.sans},
  ratingRow:{flexDirection:'row',gap:7,marginTop:15},
  rating:{flex:1,minHeight:58,borderWidth:1,borderColor:palette.lineStrong,borderRadius:radius.medium,alignItems:'center',justifyContent:'center',backgroundColor:palette.stone},
  ratingActive:{backgroundColor:palette.ink,borderColor:palette.ink},
  ratingNumber:{color:palette.text,fontSize:13,fontWeight:'700',fontFamily:type.sans},
  ratingNumberActive:{color:palette.paper},
  star:{color:palette.quiet,fontSize:10,marginTop:3},
  starActive:{color:palette.paper},
  ratingMeaning:{backgroundColor:palette.stoneDeep,padding:13,borderRadius:radius.medium,marginTop:12},
  ratingTitle:{color:palette.inkStrong,fontSize:13,fontWeight:'700',fontFamily:type.sans},
  ratingCopy:{color:palette.muted,fontSize:9.5,lineHeight:15,marginTop:4,fontFamily:type.sans},
  textarea:{borderWidth:1,borderColor:palette.lineStrong,minHeight:132,padding:13,textAlignVertical:'top',fontSize:11.5,lineHeight:18,color:palette.text,backgroundColor:palette.stone,borderRadius:radius.medium,marginTop:13,fontFamily:type.sans},
  characterRow:{flexDirection:'row',justifyContent:'space-between',gap:12,marginTop:7},
  characterHelp:{color:palette.quiet,fontSize:8.5,lineHeight:13,flex:1,fontFamily:type.sans},
  characterCount:{color:palette.quiet,fontSize:8.5,fontFamily:type.sans},
  guidance:{backgroundColor:palette.stoneDeep,padding:16,borderRadius:radius.large,marginTop:2},
  guidanceEyebrow:{color:palette.quiet,fontSize:7.5,letterSpacing:1.2,fontWeight:'700',fontFamily:type.sans},
  guidanceTitle:{color:palette.inkStrong,fontSize:17,lineHeight:22,fontWeight:'400',fontFamily:type.serif,marginTop:5},
  guidanceCopy:{color:palette.muted,fontSize:10,lineHeight:16,marginTop:5,fontFamily:type.sans},
  errorCard:{backgroundColor:palette.dangerSoft,borderWidth:1,borderColor:'#E8D7D4',padding:14,borderRadius:radius.large,marginTop:14},
  errorTitle:{color:palette.danger,fontSize:13,fontWeight:'700',fontFamily:type.sans},
  error:{color:palette.danger,fontSize:10.5,lineHeight:17,marginTop:4,fontFamily:type.sans},
  primary:{backgroundColor:palette.ink,paddingVertical:14,alignItems:'center',marginTop:16,borderRadius:radius.medium},
  primaryText:{color:palette.paper,fontSize:10.5,fontWeight:'700',fontFamily:type.sans},
  disabled:{opacity:.5},
})
