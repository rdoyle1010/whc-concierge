import { useEffect, useState } from 'react'
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { supabase } from '../../src/lib/supabase'

const WEB_URL = process.env.EXPO_PUBLIC_WEB_URL || 'https://talent.wellnesshousecollective.co.uk'

type Job = {
  id: string
  employer_id: string | null
  job_title: string
  job_description: string | null
  location: string | null
  job_type: string | null
  contract_type: string | null
  salary_display_text: string | null
  requirements: string[] | null
  benefits: string[] | null
  required_qualifications: string[] | null
  required_skills: string[] | null
  perks: string[] | null
  employer_profiles?: {
    company_name?: string | null
    property_name?: string | null
    location?: string | null
    property_description?: string | null
    overall_rating?: number | null
    total_reviews?: number | null
    property_photos?: string[] | null
  } | {
    company_name?: string | null
    property_name?: string | null
    location?: string | null
    property_description?: string | null
    overall_rating?: number | null
    total_reviews?: number | null
    property_photos?: string[] | null
  }[] | null
}

type AiResult = { summary:string; strengths:string[]; gaps:string[]; covering_letter:string }

function ListBlock({ title, items }: { title: string; items?: string[] | null }) {
  const values = (items || []).filter(Boolean)
  if (!values.length) return null
  return <View style={styles.section}><Text style={styles.sectionTitle}>{title}</Text>{values.map((item, i) => <View key={`${title}-${i}`} style={styles.bulletRow}><Text style={styles.bullet}>•</Text><Text style={styles.bulletText}>{item}</Text></View>)}</View>
}

export default function JobDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const [job, setJob] = useState<Job | null>(null)
  const [role, setRole] = useState<'talent' | 'employer'>('talent')
  const [candidateId, setCandidateId] = useState<string | null>(null)
  const [applicationId, setApplicationId] = useState<string | null>(null)
  const [applicationStatus, setApplicationStatus] = useState<string | null>(null)
  const [coverLetter, setCoverLetter] = useState('')
  const [matchScore, setMatchScore] = useState<number | null>(null)
  const [matchLabel, setMatchLabel] = useState('')
  const [matchExplanation, setMatchExplanation] = useState('')
  const [ai, setAi] = useState<AiResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.replace('/login'); return }

      const { data: account } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle()
      const resolved = account?.role === 'employer' ? 'employer' : 'talent'
      setRole(resolved)

      const { data, error: jobError } = await supabase.from('job_listings')
        .select('id,employer_id,job_title,job_description,location,job_type,contract_type,salary_display_text,requirements,benefits,required_qualifications,required_skills,perks,employer_profiles(company_name,property_name,location,property_description,overall_rating,total_reviews,property_photos)')
        .eq('id', id)
        .maybeSingle()
      if (jobError) setError(jobError.message)
      setJob(data as Job | null)

      if (resolved === 'talent') {
        const { data: candidate } = await supabase.from('candidate_profiles').select('id').eq('user_id', user.id).maybeSingle()
        if (candidate) {
          setCandidateId(candidate.id)
          const { data: existing } = await supabase.from('applications').select('id,status,cover_letter,match_score').eq('role_id', id).eq('candidate_id', candidate.id).maybeSingle()
          if (existing) {
            setApplicationId(existing.id)
            setApplicationStatus(existing.status)
            setCoverLetter(existing.cover_letter || '')
            if (existing.match_score != null) setMatchScore(Number(existing.match_score))
          }
        }
      }
      setLoading(false)
    }
    if (id) load()
  }, [id])

  async function authPost(path:string, body:any) {
    const { data:{ session } } = await supabase.auth.getSession()
    if (!session?.access_token) throw new Error('Your session has expired. Please sign in again.')
    const response = await fetch(`${WEB_URL}${path}`, {
      method:'POST',
      headers:{ Authorization:`Bearer ${session.access_token}`, 'Content-Type':'application/json' },
      body:JSON.stringify(body),
    })
    const payload = await response.json().catch(()=>({}))
    if (!response.ok) {
      const e:any = new Error(payload?.error || 'Something went wrong.')
      e.payload = payload
      throw e
    }
    return payload
  }

  async function startApplication() {
    if (!job || busy) return
    setBusy('draft'); setError('')
    try {
      const data = await authPost('/api/applications/draft', { jobId: job.id })
      setApplicationId(data.applicationId)
      setApplicationStatus('draft')
      setCoverLetter(data.coverLetter || '')
      setMatchScore(Number(data.matchScore || 0))
      setMatchLabel(data.matchLabel || '')
      setMatchExplanation(data.matchExplanation || '')
      await runAi('analyse', data.applicationId, data.coverLetter || '')
    } catch (e:any) {
      setError(e.message || 'Could not start your application.')
      if (e?.payload?.matchScore != null) setMatchScore(Number(e.payload.matchScore))
    }
    setBusy('')
  }

  async function runAi(mode:'analyse'|'draft'|'improve', appId?:string, current?:string) {
    const targetId = appId || applicationId
    if (!targetId || busy) return
    setBusy(mode); setError('')
    try {
      const data = await authPost('/api/applications/ai', { applicationId: targetId, mode, currentLetter: current ?? coverLetter })
      const result:AiResult = {
        summary: data.summary || '',
        strengths: Array.isArray(data.strengths) ? data.strengths : [],
        gaps: Array.isArray(data.gaps) ? data.gaps : [],
        covering_letter: data.covering_letter || '',
      }
      setAi(result)
      if ((mode === 'draft' || mode === 'improve') && result.covering_letter) setCoverLetter(result.covering_letter)
    } catch (e:any) {
      setError(e.message || 'The application assistant is unavailable.')
    }
    setBusy('')
  }

  async function submitApplication() {
    if (!applicationId || busy) return
    Alert.alert('Submit application?', 'Your profile and covering letter will be sent to the employer. You can review the letter before sending.', [
      { text:'Not yet', style:'cancel' },
      { text:'Submit', onPress: async () => {
        setBusy('submit'); setError('')
        try {
          await authPost('/api/applications/submit', { applicationId, coverLetter })
          setApplicationStatus('pending')
          Alert.alert('Application sent', 'Your application has been sent to the employer and is now in Applications.')
        } catch (e:any) {
          setError(e.message || 'Could not submit your application.')
        }
        setBusy('')
      }}
    ])
  }

  if (loading) return <View style={styles.loading}><ActivityIndicator color="#092b45" /></View>
  if (!job) return <View style={styles.loading}><Text style={styles.error}>{error || 'This role is no longer available.'}</Text><Pressable onPress={() => router.back()}><Text style={styles.back}>‹ Back</Text></Pressable></View>

  const employer = Array.isArray(job.employer_profiles) ? job.employer_profiles[0] : job.employer_profiles
  const company = employer?.property_name || employer?.company_name || 'Wellness employer'
  const rating = Number(employer?.overall_rating || 0)
  const submitted = applicationStatus && applicationStatus !== 'draft'
  const draft = applicationStatus === 'draft' && applicationId

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled" automaticallyAdjustKeyboardInsets>
        <Pressable onPress={() => router.back()}><Text style={styles.back}>‹ Back to roles</Text></Pressable>
        <Text style={styles.company}>{company}</Text>
        <Text style={styles.title}>{job.job_title}</Text>
        <Text style={styles.meta}>{[job.location || employer?.location, job.job_type, job.contract_type, job.salary_display_text].filter(Boolean).join('  ·  ')}</Text>
        {rating > 0 ? <Text style={styles.rating}>★ {rating.toFixed(1)}{employer?.total_reviews ? `  (${employer.total_reviews} reviews)` : ''}</Text> : null}

        {role === 'talent' && !applicationId ? <View style={styles.assistantIntro}>
          <Text style={styles.assistantEyebrow}>WHC APPLICATION ASSISTANT</Text>
          <Text style={styles.assistantTitle}>Don’t just apply. Build a stronger application.</Text>
          <Text style={styles.assistantCopy}>We’ll compare your profile with this role, explain why you match, flag genuine gaps and help you write a tailored covering letter before anything is sent.</Text>
          <Pressable onPress={startApplication} disabled={busy==='draft' || !candidateId} style={styles.applyButton}><Text style={styles.applyText}>{busy==='draft' ? 'Checking your match…' : 'Start my application'}</Text></Pressable>
        </View> : null}

        {role === 'talent' && submitted ? <View style={styles.sentCard}><Text style={styles.sentTitle}>Application sent ✓</Text><Text style={styles.sentCopy}>This role is now being tracked in your Applications area.</Text><Pressable onPress={()=>router.push('/applications')}><Text style={styles.sentLink}>View application →</Text></Pressable></View> : null}

        {role === 'talent' && draft ? <View style={styles.applicationBox}>
          <Text style={styles.assistantEyebrow}>YOUR APPLICATION</Text>
          {matchScore != null ? <View style={styles.matchRow}><Text style={styles.matchScore}>{matchScore}%</Text><View style={{flex:1}}><Text style={styles.matchLabel}>{matchLabel || 'role match'}</Text><Text style={styles.matchCopy}>{matchExplanation || 'Your profile has been compared with the role requirements.'}</Text></View></View> : null}

          <Text style={styles.stepTitle}>1. Why you fit</Text>
          {ai?.summary ? <Text style={styles.analysisSummary}>{ai.summary}</Text> : null}
          {ai?.strengths?.length ? <View style={styles.aiPanel}><Text style={styles.aiHeading}>Your strongest evidence</Text>{ai.strengths.map((x,i)=><View key={`s-${i}`} style={styles.aiBullet}><Text style={styles.goodDot}>✓</Text><Text style={styles.aiText}>{x}</Text></View>)}</View> : null}
          {ai?.gaps?.length ? <View style={styles.gapPanel}><Text style={styles.aiHeading}>Worth addressing</Text>{ai.gaps.map((x,i)=><View key={`g-${i}`} style={styles.aiBullet}><Text style={styles.gapDot}>•</Text><Text style={styles.aiText}>{x}</Text></View>)}</View> : null}
          <Pressable disabled={!!busy} onPress={()=>runAi('analyse')} style={styles.secondary}><Text style={styles.secondaryText}>{busy==='analyse'?'Analysing…':ai?'Refresh my analysis':'Analyse my fit'}</Text></Pressable>

          <Text style={styles.stepTitle}>2. Your covering letter</Text>
          <Text style={styles.stepCopy}>Use AI to create a first draft from your real profile and this job, then change anything you want before sending.</Text>
          {!coverLetter ? <Pressable disabled={!!busy} onPress={()=>runAi('draft')} style={styles.primary}><Text style={styles.primaryText}>{busy==='draft'?'Writing…':'Write my tailored letter'}</Text></Pressable> : null}
          {coverLetter ? <>
            <TextInput multiline value={coverLetter} onChangeText={setCoverLetter} style={styles.letterInput} placeholder="Your covering letter" textAlignVertical="top" />
            <View style={styles.letterActions}>
              <Pressable disabled={!!busy} onPress={()=>runAi('improve')} style={styles.secondaryHalf}><Text style={styles.secondaryText}>{busy==='improve'?'Improving…':'Improve my letter'}</Text></Pressable>
              <Pressable disabled={!!busy} onPress={()=>runAi('draft')} style={styles.secondaryHalf}><Text style={styles.secondaryText}>{busy==='draft'?'Rewriting…':'New version'}</Text></Pressable>
            </View>
          </> : null}

          <Text style={styles.stepTitle}>3. Review & submit</Text>
          <Text style={styles.stepCopy}>Nothing goes to the employer until you press Submit. Check your letter and make sure it sounds like you.</Text>
          <Pressable onPress={submitApplication} disabled={!!busy} style={[styles.submitButton,!!busy&&styles.disabled]}><Text style={styles.submitText}>{busy==='submit'?'Submitting…':'Submit application'}</Text></Pressable>
        </View> : null}

        {error ? <Text style={styles.errorBox}>{error}</Text> : null}

        {employer?.property_description ? <View style={styles.section}><Text style={styles.sectionTitle}>About the property</Text><Text style={styles.copy}>{employer.property_description}</Text></View> : null}
        <View style={styles.section}><Text style={styles.sectionTitle}>The role</Text><Text style={styles.copy}>{job.job_description || 'The employer has not added a full description yet.'}</Text></View>
        <ListBlock title="Requirements" items={job.requirements} />
        <ListBlock title="Qualifications" items={job.required_qualifications} />
        <ListBlock title="Skills" items={job.required_skills} />
        <ListBlock title="Benefits" items={[...(job.benefits || []), ...(job.perks || [])]} />
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  flex:{flex:1,backgroundColor:'#fff'},scroll: { flex: 1, backgroundColor: '#fff' },page: { paddingHorizontal: 22, paddingTop: 64, paddingBottom: 120 },loading: { flex: 1, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', padding: 30 },back: { color: '#66747c', fontSize: 13, marginBottom: 32 },company: { color: '#71808a', fontSize: 11, letterSpacing: .5, marginBottom: 7 },title: { color: '#092b45', fontSize: 30, lineHeight: 36, fontWeight: '600' },meta: { color: '#66747c', fontSize: 12, lineHeight: 19, marginTop: 10 },rating: { color: '#173246', fontSize: 12, marginTop: 10 },assistantIntro:{backgroundColor:'#f4f7f8',padding:20,marginTop:24},assistantEyebrow:{color:'#71808a',fontSize:8,letterSpacing:1.8,marginBottom:8},assistantTitle:{color:'#092b45',fontSize:20,lineHeight:25,fontWeight:'600'},assistantCopy:{color:'#66747c',fontSize:12,lineHeight:19,marginTop:8},applyButton:{backgroundColor:'#092b45',paddingVertical:15,alignItems:'center',marginTop:18},applyText:{color:'#fff',fontSize:12,fontWeight:'700'},applicationBox:{borderWidth:1,borderColor:'#d8e1e5',padding:18,marginTop:24},matchRow:{backgroundColor:'#092b45',padding:16,flexDirection:'row',gap:15,alignItems:'center',marginBottom:24},matchScore:{color:'#fff',fontSize:31,fontWeight:'700'},matchLabel:{color:'#fff',fontSize:12,fontWeight:'700',textTransform:'uppercase'},matchCopy:{color:'#d5e0e5',fontSize:10,lineHeight:15,marginTop:4},stepTitle:{color:'#173246',fontSize:16,fontWeight:'700',marginTop:20,marginBottom:7},stepCopy:{color:'#71808a',fontSize:11,lineHeight:17,marginBottom:12},analysisSummary:{color:'#526976',fontSize:12,lineHeight:19,marginBottom:10},aiPanel:{backgroundColor:'#f4f8f5',padding:14,marginTop:8},gapPanel:{backgroundColor:'#faf7f3',padding:14,marginTop:8},aiHeading:{color:'#173246',fontSize:11,fontWeight:'700',marginBottom:6},aiBullet:{flexDirection:'row',gap:8,marginTop:5},goodDot:{color:'#315846',fontSize:12,fontWeight:'700'},gapDot:{color:'#8a6a3a',fontSize:12,fontWeight:'700'},aiText:{color:'#5d6e77',fontSize:11,lineHeight:17,flex:1},primary:{backgroundColor:'#092b45',paddingVertical:14,alignItems:'center',marginTop:4},primaryText:{color:'#fff',fontSize:11,fontWeight:'700'},secondary:{borderWidth:1,borderColor:'#bfcbd1',paddingVertical:12,alignItems:'center',marginTop:12},secondaryText:{color:'#092b45',fontSize:10,fontWeight:'700'},letterInput:{borderWidth:1,borderColor:'#d6dfe3',minHeight:260,padding:13,fontSize:12,lineHeight:19,color:'#173246',marginTop:4},letterActions:{flexDirection:'row',gap:8,marginTop:9},secondaryHalf:{flex:1,borderWidth:1,borderColor:'#bfcbd1',paddingVertical:12,alignItems:'center'},submitButton:{backgroundColor:'#173246',paddingVertical:16,alignItems:'center',marginTop:6},submitText:{color:'#fff',fontSize:12,fontWeight:'800'},disabled:{opacity:.5},sentCard:{backgroundColor:'#f1f7f3',padding:18,marginTop:24},sentTitle:{color:'#254a39',fontSize:15,fontWeight:'700'},sentCopy:{color:'#64786e',fontSize:11,lineHeight:17,marginTop:5},sentLink:{color:'#254a39',fontSize:11,fontWeight:'700',marginTop:10},errorBox:{color:'#9b2c2c',backgroundColor:'#fff5f5',padding:12,fontSize:11,lineHeight:17,marginTop:14},section: { borderTopWidth: 1, borderTopColor: '#e2e7ea', paddingTop: 22, marginTop: 24 },sectionTitle: { color: '#173246', fontSize: 17, fontWeight: '600', marginBottom: 11 },copy: { color: '#66747c', fontSize: 13, lineHeight: 21 },bulletRow: { flexDirection: 'row', gap: 9, marginBottom: 8 },bullet: { color: '#092b45', fontSize: 14 },bulletText: { color: '#66747c', fontSize: 13, lineHeight: 20, flex: 1 },error: { color: '#9b2c2c', fontSize: 13, textAlign: 'center', marginBottom: 16 },
})
