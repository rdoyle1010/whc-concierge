import { useEffect, useState } from 'react'
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { router } from 'expo-router'
import { supabase } from '../src/lib/supabase'
import { calculateMatchScore } from '../src/lib/matching'

export default function SavedRolesScreen() {
  const [items, setItems] = useState<any[]>([])
  const [candidate, setCandidate] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => { load() }, [])

  async function load() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.replace('/login'); return }
    const { data: candidateRow } = await supabase.from('candidate_profiles').select('*').eq('user_id', user.id).maybeSingle()
    setCandidate(candidateRow)
    if (!candidateRow?.id) { setLoading(false); return }
    const { data, error: queryError } = await supabase.from('saved_jobs')
      .select('job_id,created_at,job_listings(*,employer_profiles(company_name,property_name))')
      .eq('candidate_id', candidateRow.id)
      .order('created_at', { ascending: false })
    if (queryError) setError(queryError.message)
    setItems((data || []).filter((row: any) => row.job_listings))
    setLoading(false)
  }

  async function remove(jobId: string) {
    if (!candidate?.id) return
    const { error: removeError } = await supabase.from('saved_jobs').delete().eq('candidate_id', candidate.id).eq('job_id', jobId)
    if (removeError) { setError(removeError.message); return }
    setItems(current => current.filter((row: any) => row.job_id !== jobId))
  }

  return <ScrollView style={styles.scroll} contentContainerStyle={styles.page}>
    <Text style={styles.eyebrow}>YOUR SHORTLIST</Text>
    <Text style={styles.title}>Saved roles</Text>
    <Text style={styles.intro}>Keep the opportunities you want to come back to in one place.</Text>
    {loading ? <ActivityIndicator color="#092b45" style={{ marginTop: 30 }} /> : null}
    {error ? <Text style={styles.error}>{error}</Text> : null}
    {!loading && items.length === 0 ? <View style={styles.empty}><Text style={styles.emptyTitle}>No saved roles yet.</Text><Text style={styles.emptyCopy}>Save a role from Matches & Jobs and it will appear here.</Text><Pressable onPress={() => router.push('/jobs')}><Text style={styles.open}>Browse roles →</Text></Pressable></View> : null}
    <View style={styles.list}>{items.map((row: any) => {
      const job = Array.isArray(row.job_listings) ? row.job_listings[0] : row.job_listings
      const employer = Array.isArray(job?.employer_profiles) ? job.employer_profiles[0] : job?.employer_profiles
      const match = candidate && job ? calculateMatchScore(candidate, job) : null
      return <View key={row.job_id} style={styles.card}>
        <Pressable onPress={() => router.push({ pathname: '/job/[id]', params: { id: row.job_id } })}>
          <View style={styles.row}><Text style={styles.company}>{employer?.property_name || employer?.company_name || 'Wellness employer'}</Text>{match ? <Text style={styles.match}>{match.score}% MATCH</Text> : null}</View>
          <Text style={styles.jobTitle}>{job?.job_title || 'Role'}</Text>
          <Text style={styles.meta}>{[job?.location, job?.job_type, job?.salary_display_text].filter(Boolean).join('  ·  ')}</Text>
          <Text style={styles.view}>View full role →</Text>
        </Pressable>
        <Pressable onPress={() => remove(row.job_id)} style={styles.remove}><Text style={styles.removeText}>Remove from saved</Text></Pressable>
      </View>
    })}</View>
  </ScrollView>
}

const styles=StyleSheet.create({scroll:{flex:1,backgroundColor:'#fff'},page:{paddingHorizontal:22,paddingTop:64,paddingBottom:32},eyebrow:{color:'#71808a',fontSize:9,letterSpacing:2.1,marginBottom:10},title:{color:'#092b45',fontSize:31,lineHeight:37,fontWeight:'500'},intro:{color:'#66747c',fontSize:14,lineHeight:21,marginTop:10,marginBottom:26},list:{gap:12},card:{borderWidth:1,borderColor:'#dce3e7',padding:19},row:{flexDirection:'row',justifyContent:'space-between',gap:12},company:{color:'#71808a',fontSize:11,flex:1},match:{color:'#092b45',fontSize:8,fontWeight:'700',borderWidth:1,borderColor:'#cdd8dd',paddingHorizontal:8,paddingVertical:4},jobTitle:{color:'#173246',fontSize:19,fontWeight:'600',marginTop:8},meta:{color:'#66747c',fontSize:12,lineHeight:18,marginTop:8},view:{color:'#092b45',fontSize:12,fontWeight:'600',marginTop:16},remove:{borderTopWidth:1,borderTopColor:'#eef1f2',marginTop:14,paddingTop:13},removeText:{color:'#7a4a4a',fontSize:11},empty:{backgroundColor:'#f4f7f8',padding:20},emptyTitle:{color:'#173246',fontSize:15,fontWeight:'600'},emptyCopy:{color:'#71808a',fontSize:12,lineHeight:18,marginTop:6},open:{color:'#092b45',fontSize:12,fontWeight:'600',marginTop:14},error:{color:'#9b2c2c',fontSize:12,marginBottom:18}})
