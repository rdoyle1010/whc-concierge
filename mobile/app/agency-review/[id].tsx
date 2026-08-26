import { useState } from 'react'
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { supabase } from '../../src/lib/supabase'

const WEB_URL = process.env.EXPO_PUBLIC_WEB_URL || 'https://talent.wellnesshousecollective.co.uk'

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

  return <ScrollView style={styles.scroll} contentContainerStyle={styles.page}>
    <Pressable onPress={() => router.back()}><Text style={styles.back}>‹ Agency</Text></Pressable>
    <Text style={styles.eyebrow}>POST-SHIFT REVIEW</Text>
    <Text style={styles.title}>How did it go?</Text>
    <Text style={styles.intro}>Review {params.name || 'this shift partner'} after the completed shift. Keep it fair, useful and based on what actually happened.</Text>

    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Your rating</Text>
      <View style={styles.ratingRow}>{[1,2,3,4,5].map(value => <Pressable key={value} onPress={() => setRating(value)} style={[styles.rating, rating === value && styles.ratingActive]}><Text style={[styles.ratingText, rating === value && styles.ratingTextActive]}>{value}</Text></Pressable>)}</View>
      <Text style={styles.ratingLabel}>{rating === 5 ? 'Excellent' : rating === 4 ? 'Very good' : rating === 3 ? 'Good' : rating === 2 ? 'Needs improvement' : 'Poor'}</Text>
    </View>

    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Comment</Text>
      <TextInput value={comment} onChangeText={setComment} multiline placeholder="What would be useful for the other side to know?" style={styles.textarea} maxLength={1200} />
    </View>

    {error ? <Text style={styles.error}>{error}</Text> : null}
    <Pressable disabled={busy} onPress={submit} style={[styles.primary, busy && styles.disabled]}>{busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryText}>Submit review</Text>}</Pressable>
  </ScrollView>
}

const styles = StyleSheet.create({
  scroll:{flex:1,backgroundColor:'#fff'},page:{paddingHorizontal:22,paddingTop:64,paddingBottom:48},back:{color:'#66747c',fontSize:13,marginBottom:34},eyebrow:{color:'#71808a',fontSize:9,letterSpacing:2.1,marginBottom:10},title:{color:'#092b45',fontSize:31,lineHeight:37,fontWeight:'500'},intro:{color:'#66747c',fontSize:14,lineHeight:21,marginTop:10,marginBottom:26},section:{borderTopWidth:1,borderTopColor:'#e3e8eb',paddingTop:22,marginTop:18},sectionTitle:{color:'#173246',fontSize:16,fontWeight:'600',marginBottom:12},ratingRow:{flexDirection:'row',gap:8},rating:{width:46,height:46,borderWidth:1,borderColor:'#d7e0e4',alignItems:'center',justifyContent:'center'},ratingActive:{backgroundColor:'#092b45',borderColor:'#092b45'},ratingText:{color:'#66747c',fontSize:15,fontWeight:'600'},ratingTextActive:{color:'#fff'},ratingLabel:{color:'#71808a',fontSize:11,marginTop:9},textarea:{borderWidth:1,borderColor:'#d7e0e4',minHeight:120,padding:13,textAlignVertical:'top',fontSize:13,color:'#173246'},primary:{backgroundColor:'#092b45',paddingVertical:15,alignItems:'center',marginTop:28},primaryText:{color:'#fff',fontSize:12,fontWeight:'700'},disabled:{opacity:.5},error:{color:'#9b2c2c',fontSize:12,lineHeight:18,marginTop:18}
})
