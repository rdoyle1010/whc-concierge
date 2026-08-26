import { useEffect, useMemo, useState } from 'react'
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { router } from 'expo-router'
import { supabase } from '../src/lib/supabase'
import { calculateMatchScore } from '../src/lib/matching'

type AccountRole = 'talent' | 'employer'

type Job = {
  id: string
  job_title: string
  location: string | null
  job_type: string | null
  salary_display_text: string | null
  tier: string | null
  is_featured: boolean | null
  status: string | null
  employer_profiles?: { company_name?: string | null; property_name?: string | null } | { company_name?: string | null; property_name?: string | null }[] | null
  [key: string]: any
}

export default function JobsScreen() {
  const [role, setRole] = useState<AccountRole>('talent')
  const [jobs, setJobs] = useState<Job[]>([])
  const [candidate, setCandidate] = useState<any>(null)
  const [saved, setSaved] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => { load() }, [])

  async function load() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.replace('/login'); return }
    const { data: account } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle()
    const resolved: AccountRole = account?.role === 'employer' ? 'employer' : 'talent'
    setRole(resolved)

    if (resolved === 'employer') {
      const { data: employer } = await supabase.from('employer_profiles').select('id').eq('user_id', user.id).maybeSingle()
      if (!employer) { setError('Employer profile not found.'); setLoading(false); return }
      const { data, error: queryError } = await supabase.from('job_listings').select('*,employer_profiles(company_name,property_name)').eq('employer_id', employer.id).order('created_at', { ascending: false })
      if (queryError) setError(queryError.message)
      setJobs((data || []) as Job[])
    } else {
      const { data: candidateRow } = await supabase.from('candidate_profiles').select('*').eq('user_id', user.id).maybeSingle()
      setCandidate(candidateRow || null)
      if (candidateRow?.id) {
        const { data: savedRows } = await supabase.from('saved_jobs').select('job_id').eq('candidate_id', candidateRow.id)
        setSaved(new Set((savedRows || []).map((row: any) => row.job_id)))
      }
      const now = new Date().toISOString()
      const { data, error: queryError } = await supabase.from('job_listings').select('*,employer_profiles(company_name,property_name)').eq('is_live', true).or(`expires_at.is.null,expires_at.gt.${now}`).order('is_featured', { ascending: false }).order('posted_date', { ascending: false })
      if (queryError) setError(queryError.message)
      setJobs((data || []) as Job[])
    }
    setLoading(false)
  }

  async function toggleSave(jobId: string) {
    if (!candidate?.id) return
    if (saved.has(jobId)) {
      await supabase.from('saved_jobs').delete().eq('candidate_id', candidate.id).eq('job_id', jobId)
      setSaved(prev => { const next = new Set(prev); next.delete(jobId); return next })
    } else {
      const { error: saveError } = await supabase.from('saved_jobs').insert({ candidate_id: candidate.id, job_id: jobId })
      if (!saveError) setSaved(prev => new Set(prev).add(jobId))
    }
  }

  const rankedJobs = useMemo(() => {
    if (role !== 'talent' || !candidate) return jobs.map(job => ({ job, match: null as any }))
    return jobs.map(job => ({ job, match: calculateMatchScore(candidate, job) })).sort((a, b) => {
      if (Boolean(b.job.is_featured) !== Boolean(a.job.is_featured)) return Number(Boolean(b.job.is_featured)) - Number(Boolean(a.job.is_featured))
      return Number(b.match?.score || 0) - Number(a.match?.score || 0)
    })
  }, [jobs, candidate, role])

  return <ScrollView style={styles.scroll} contentContainerStyle={styles.page}>
    <Pressable onPress={() => router.back()}><Text style={styles.back}>‹ Back</Text></Pressable>
    <Text style={styles.eyebrow}>{role === 'employer' ? 'RECRUITMENT' : 'OPPORTUNITIES'}</Text>
    <Text style={styles.title}>{role === 'employer' ? 'Your jobs' : 'Your matched roles'}</Text>
    <Text style={styles.intro}>{role === 'employer' ? 'Create, edit, publish and close roles from the same recruitment workspace.' : 'Roles are ranked using the same WHC matching logic as the website, including progression, skills, location and experience.'}</Text>
    {role === 'employer' ? <Pressable onPress={() => router.push({ pathname: '/employer-job/[id]', params: { id: 'new' } })} style={styles.postButton}><Text style={styles.postButtonText}>+ Post a role</Text></Pressable> : null}
    {loading ? <ActivityIndicator color="#092b45" style={{ marginTop: 30 }} /> : null}
    {error ? <Text style={styles.error}>{error}</Text> : null}
    {!loading && !error && rankedJobs.length === 0 ? <View style={styles.empty}><Text style={styles.emptyTitle}>Nothing to show yet.</Text><Text style={styles.emptyCopy}>{role === 'employer' ? 'Create your first role and save it as a draft or publish it when ready.' : 'New live opportunities will appear here as employers publish them.'}</Text></View> : null}
    <View style={styles.list}>{rankedJobs.map(({ job, match }) => {
      const employer = Array.isArray(job.employer_profiles) ? job.employer_profiles[0] : job.employer_profiles
      const company = employer?.property_name || employer?.company_name || 'Wellness employer'
      return <View key={job.id} style={styles.card}>
        <Pressable onPress={() => router.push({ pathname: '/job/[id]', params: { id: job.id } })}>
          <View style={styles.row}><Text style={styles.company}>{company}</Text><View style={styles.badges}>{job.is_featured ? <Text style={styles.featured}>FEATURED</Text> : null}{match ? <Text style={styles.match}>{match.score}% MATCH</Text> : null}</View></View>
          <Text style={styles.jobTitle}>{job.job_title}</Text>
          <Text style={styles.meta}>{[job.location, job.job_type, job.salary_display_text].filter(Boolean).join('  ·  ') || 'Details available inside'}</Text>
          {match?.matchExplanation ? <Text style={styles.explanation}>{match.matchExplanation}</Text> : null}
          {match?.hardStop ? <Text style={styles.warning}>{match.hardStopReason}</Text> : null}
          {role === 'employer' ? <Text style={styles.status}>{job.status || 'draft'}{job.tier ? ` · ${job.tier === 'Bronze' ? 'Standard' : job.tier === 'Platinum' ? 'Featured' : job.tier}` : ''}</Text> : null}
          <Text style={styles.view}>View full role →</Text>
        </Pressable>
        {role === 'talent' ? <Pressable onPress={() => toggleSave(job.id)} style={styles.save}><Text style={styles.saveText}>{saved.has(job.id) ? 'Saved ✓' : 'Save role'}</Text></Pressable> : <Pressable onPress={() => router.push({ pathname: '/employer-job/[id]', params: { id: job.id } })} style={styles.manage}><Text style={styles.manageText}>Manage role →</Text></Pressable>}
      </View>
    })}</View>
  </ScrollView>
}

const styles = StyleSheet.create({
  scroll:{flex:1,backgroundColor:'#fff'}, page:{paddingHorizontal:22,paddingTop:64,paddingBottom:100}, back:{color:'#66747c',fontSize:13,marginBottom:34}, eyebrow:{color:'#71808a',fontSize:9,letterSpacing:2.1,marginBottom:10}, title:{color:'#092b45',fontSize:31,lineHeight:37,fontWeight:'500'}, intro:{color:'#66747c',fontSize:14,lineHeight:21,marginTop:10,marginBottom:20}, postButton:{backgroundColor:'#092b45',paddingVertical:14,alignItems:'center',marginBottom:24},postButtonText:{color:'#fff',fontSize:11,fontWeight:'700'},list:{gap:12}, card:{borderWidth:1,borderColor:'#dce3e7',padding:19,backgroundColor:'#fff'}, row:{flexDirection:'row',justifyContent:'space-between',gap:12}, company:{color:'#71808a',fontSize:11,letterSpacing:.4,flex:1}, badges:{flexDirection:'row',gap:6,flexWrap:'wrap',justifyContent:'flex-end'}, featured:{color:'#092b45',backgroundColor:'#edf2f4',paddingHorizontal:8,paddingVertical:4,fontSize:8,letterSpacing:1.2}, match:{color:'#092b45',borderWidth:1,borderColor:'#cdd8dd',paddingHorizontal:8,paddingVertical:4,fontSize:8,fontWeight:'700',letterSpacing:.8}, jobTitle:{color:'#173246',fontSize:19,lineHeight:24,fontWeight:'600',marginTop:7}, meta:{color:'#66747c',fontSize:12,lineHeight:18,marginTop:8}, explanation:{color:'#526976',fontSize:11,lineHeight:17,marginTop:11}, warning:{color:'#8b3c3c',fontSize:11,lineHeight:17,marginTop:10}, status:{color:'#71808a',fontSize:10,textTransform:'uppercase',letterSpacing:1.2,marginTop:10}, view:{color:'#092b45',fontSize:12,fontWeight:'600',marginTop:16}, save:{marginTop:14,borderTopWidth:1,borderTopColor:'#eef1f2',paddingTop:13}, saveText:{color:'#526976',fontSize:11,fontWeight:'600'},manage:{marginTop:14,borderTopWidth:1,borderTopColor:'#eef1f2',paddingTop:13},manageText:{color:'#092b45',fontSize:11,fontWeight:'700'}, empty:{backgroundColor:'#f4f7f8',padding:20}, emptyTitle:{color:'#173246',fontSize:15,fontWeight:'600'}, emptyCopy:{color:'#71808a',fontSize:12,lineHeight:18,marginTop:6}, error:{color:'#9b2c2c',fontSize:12,marginBottom:18}
})
