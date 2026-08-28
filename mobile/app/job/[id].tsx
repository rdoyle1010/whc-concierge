import { useCallback, useState } from 'react'
import { ActivityIndicator, Alert, Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router'
import { supabase } from '../../src/lib/supabase'

const WEB_URL = process.env.EXPO_PUBLIC_WEB_URL || 'https://talent.wellnesshousecollective.co.uk'

type Job = {
  id: string
  employer_id: string | null
  job_title: string
  job_description: string | null
  job_image_url?: string | null
  location: string | null
  job_type: string | null
  contract_type: string | null
  salary_display_text: string | null
  requirements: string[] | null
  benefits: string[] | null
  required_qualifications: string[] | null
  required_skills: string[] | null
  perks: string[] | null
  employer_profiles?: any
}
type AiResult = { summary: string; strengths: string[]; gaps: string[]; covering_letter: string }

function ListBlock({ title, items }: { title: string; items?: string[] | null }) {
  const values = (items || []).filter(Boolean)
  if (!values.length) return null
  return <View style={styles.section}><Text style={styles.sectionTitle}>{title}</Text>{values.map((item, index) => <View key={`${title}-${index}`} style={styles.bulletRow}><Text style={styles.bullet}>•</Text><Text style={styles.bulletText}>{item}</Text></View>)}</View>
}

function applicationStage(status?: string | null) {
  const stages: Record<string, { title: string; copy: string }> = {
    pending: { title: 'Application sent', copy: 'The employer has received your application.' },
    reviewed: { title: 'Under review', copy: 'The employer is reviewing your profile and application.' },
    shortlisted: { title: 'Shortlisted', copy: 'You have progressed. Any interview invitation will appear in Applications.' },
    interview: { title: 'Interview stage', copy: 'Open Applications to review or confirm interview arrangements.' },
    offered: { title: 'Offer received', copy: 'Open Applications to review and respond to the offer.' },
    accepted: { title: 'Offer accepted', copy: 'Your accepted role is being completed through the recruitment journey.' },
  }
  return stages[String(status || '')] || { title: 'Application active', copy: 'Open Applications to view the latest stage.' }
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

  useFocusEffect(useCallback(() => { void load() }, [id]))

  async function load() {
    setLoading(true)
    setError('')
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.replace('/login'); return }
      const { data: account } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle()
      const resolved = account?.role === 'employer' ? 'employer' : 'talent'
      setRole(resolved)
      const { data, error: jobError } = await supabase.from('job_listings')
        .select('id,employer_id,job_title,job_description,job_image_url,location,job_type,contract_type,salary_display_text,requirements,benefits,required_qualifications,required_skills,perks,employer_profiles(id,company_name,property_name,logo_url,location,postcode,property_description,about_text,overall_rating,review_score,total_reviews,review_count,star_rating,property_photos,num_treatment_rooms,team_size,property_type,product_houses_used,services_offered,systems_used,highlights)')
        .eq('id', id)
        .maybeSingle()
      if (jobError) throw jobError
      setJob(data as Job | null)

      if (resolved === 'talent') {
        const { data: candidate } = await supabase.from('candidate_profiles').select('id').eq('user_id', user.id).maybeSingle()
        setCandidateId(candidate?.id || null)
        if (candidate?.id) {
          const { data: existing } = await supabase.from('applications')
            .select('id,status,cover_letter,match_score')
            .eq('role_id', id)
            .eq('candidate_id', candidate.id)
            .maybeSingle()
          setApplicationId(existing?.id || null)
          setApplicationStatus(existing?.status || null)
          setCoverLetter(existing?.cover_letter || '')
          setMatchScore(existing?.match_score == null ? null : Number(existing.match_score))
          if (!existing || existing.status !== 'draft') setAi(null)
        }
      }
    } catch (e: any) {
      setError(e?.message || 'Could not load this role.')
    } finally {
      setLoading(false)
    }
  }

  async function authPost(path: string, body: any) {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.access_token) throw new Error('Your session has expired. Please sign in again.')
    const response = await fetch(`${WEB_URL}${path}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${session.access_token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const payload = await response.json().catch(() => ({}))
    if (!response.ok) {
      const error: any = new Error(payload?.error || 'Something went wrong.')
      error.payload = payload
      throw error
    }
    return payload
  }

  async function startApplication() {
    if (!job || busy) return
    setBusy('draft')
    setError('')
    try {
      const data = await authPost('/api/applications/draft', { jobId: job.id })
      setApplicationId(data.applicationId)
      setApplicationStatus('draft')
      setCoverLetter(data.coverLetter || '')
      setMatchScore(Number(data.matchScore || 0))
      setMatchLabel(data.matchLabel || '')
      setMatchExplanation(data.matchExplanation || '')
      setAi(null)
    } catch (e: any) {
      if (e?.payload?.applicationId) {
        setApplicationId(String(e.payload.applicationId))
        setError('You already have an active application for this role. Open Applications to continue.')
      } else {
        setError(e.message || 'Could not start your application.')
      }
    } finally {
      setBusy('')
    }
  }

  async function runAi(mode: 'analyse' | 'draft' | 'improve') {
    if (!applicationId || busy) return
    setBusy(mode)
    setError('')
    try {
      const data = await authPost('/api/applications/ai', { applicationId, mode, currentLetter: coverLetter })
      const result: AiResult = {
        summary: data.summary || '',
        strengths: Array.isArray(data.strengths) ? data.strengths : [],
        gaps: Array.isArray(data.gaps) ? data.gaps : [],
        covering_letter: data.covering_letter || '',
      }
      setAi(result)
      if ((mode === 'draft' || mode === 'improve') && result.covering_letter) setCoverLetter(result.covering_letter)
    } catch (e: any) {
      setError(e.message || 'The application assistant is unavailable.')
    } finally {
      setBusy('')
    }
  }

  async function submitApplication() {
    if (!applicationId || busy) return
    if (coverLetter.trim().length < 80) {
      Alert.alert('Check your covering letter', 'Write or generate a meaningful covering letter before submitting.')
      return
    }
    Alert.alert('Submit application?', 'Your profile and covering letter will be sent to the employer.', [
      { text: 'Not yet', style: 'cancel' },
      { text: 'Submit', onPress: async () => {
        setBusy('submit')
        setError('')
        try {
          await authPost('/api/applications/submit', { applicationId, coverLetter })
          setApplicationStatus('pending')
          Alert.alert('Application sent', 'Your application is now being tracked in Applications.')
        } catch (e: any) {
          setError(e.message || 'Could not submit your application.')
        } finally {
          setBusy('')
        }
      } },
    ])
  }

  function openApplication() {
    if (!applicationId) return
    router.push({ pathname: '/talent-application/[id]', params: { id: applicationId } })
  }

  if (loading) return <View style={styles.loading}><ActivityIndicator color="#092b45" /></View>
  if (!job) return <View style={styles.loading}><Text style={styles.error}>{error || 'This role is no longer available.'}</Text><Pressable onPress={() => router.back()}><Text style={styles.back}>‹ Back</Text></Pressable></View>

  const employer = Array.isArray(job.employer_profiles) ? job.employer_profiles[0] : job.employer_profiles
  const company = employer?.property_name || employer?.company_name || 'Wellness employer'
  const rating = Number(employer?.overall_rating || employer?.review_score || employer?.star_rating || 0)
  const reviewCount = Number(employer?.total_reviews || employer?.review_count || 0)
  const photos = [job.job_image_url, ...(Array.isArray(employer?.property_photos) ? employer.property_photos : [])].filter(Boolean) as string[]
  const draft = applicationStatus === 'draft' && Boolean(applicationId)
  const restartable = applicationStatus === 'rejected' || applicationStatus === 'withdrawn'
  const activeApplication = Boolean(applicationStatus && !['draft', 'rejected', 'withdrawn'].includes(applicationStatus))
  const propertyDescription = employer?.about_text || employer?.property_description
  const propertyFacts = [employer?.star_rating ? `${employer.star_rating}★ property` : null, employer?.num_treatment_rooms ? `${employer.num_treatment_rooms} treatment rooms` : null, employer?.team_size ? `${employer.team_size} spa team` : null, employer?.property_type || null].filter(Boolean)
  const activeStage = applicationStage(applicationStatus)

  return <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
    <ScrollView style={styles.scroll} contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled" automaticallyAdjustKeyboardInsets>
      <Pressable onPress={() => router.back()}><Text style={styles.back}>‹ Back to roles</Text></Pressable>
      {photos[0] ? <Image source={{ uri: photos[0] }} style={styles.hero} /> : null}
      <Text style={styles.company}>{company}</Text>
      <Text style={styles.title}>{job.job_title}</Text>
      <Text style={styles.meta}>{[job.location || employer?.location, job.job_type, job.contract_type, job.salary_display_text].filter(Boolean).join('  ·  ')}</Text>

      <View style={styles.propertySummary}>
        {employer?.logo_url ? <Image source={{ uri: employer.logo_url }} style={styles.propertyLogo} resizeMode="contain" /> : null}
        <View style={{ flex: 1 }}><Text style={styles.propertyName}>{company}</Text><Text style={styles.propertyLocation}>{[employer?.location || job.location, employer?.postcode].filter(Boolean).join(' · ') || 'Location available in role details'}</Text></View>
        <View style={styles.ratingBox}><Text style={styles.ratingValue}>{rating > 0 ? `${rating.toFixed(1)} ★` : 'NEW'}</Text><Text style={styles.ratingCount}>{reviewCount > 0 ? `${reviewCount} review${reviewCount === 1 ? '' : 's'}` : 'No reviews yet'}</Text></View>
      </View>
      {propertyFacts.length ? <View style={styles.factRow}>{propertyFacts.map((fact: any) => <Text key={String(fact)} style={styles.factChip}>{String(fact)}</Text>)}</View> : null}
      {photos.length > 1 ? <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.gallery}>{photos.slice(1, 6).map((photo, index) => <Image key={`${photo}-${index}`} source={{ uri: photo }} style={styles.thumb} />)}</ScrollView> : null}
      {propertyDescription ? <View style={styles.propertyCard}><Text style={styles.sectionTitle}>About this hotel & spa</Text><Text style={styles.copy}>{propertyDescription}</Text></View> : null}
      {employer?.id ? <Pressable onPress={() => router.push({ pathname: '/property/[id]', params: { id: employer.id } })} style={styles.propertyButton}><Text style={styles.propertyButtonTitle}>Explore {company}</Text><Text style={styles.propertyButtonCopy}>Photos · WHC reviews · spa facts · treatments · brands · facilities · location</Text><Text style={styles.propertyButtonLink}>View full hotel & spa profile →</Text></Pressable> : null}

      {role === 'talent' && !applicationId ? <View style={styles.assistantIntro}>
        <Text style={styles.assistantEyebrow}>WHC APPLICATION ASSISTANT</Text><Text style={styles.assistantTitle}>Don’t just apply. Build a stronger application.</Text><Text style={styles.assistantCopy}>Compare your profile with the role, understand genuine gaps and create a tailored covering letter before anything is sent.</Text>
        <Pressable onPress={startApplication} disabled={busy === 'draft' || !candidateId} style={[styles.applyButton, (!candidateId || busy === 'draft') && styles.disabled]}><Text style={styles.applyText}>{busy === 'draft' ? 'Starting…' : 'Start my application'}</Text></Pressable>
      </View> : null}

      {role === 'talent' && restartable ? <View style={styles.restartCard}>
        <Text style={styles.restartTitle}>{applicationStatus === 'rejected' ? 'Previous application closed' : 'Application withdrawn'}</Text>
        <Text style={styles.restartCopy}>This is not an active application. You can start a fresh draft while the role remains live.</Text>
        <Pressable onPress={startApplication} disabled={!!busy} style={[styles.applyButton, !!busy && styles.disabled]}><Text style={styles.applyText}>{busy === 'draft' ? 'Restarting…' : 'Start a new application'}</Text></Pressable>
      </View> : null}

      {role === 'talent' && activeApplication ? <View style={styles.statusCard}>
        <Text style={styles.statusEyebrow}>YOUR APPLICATION</Text><Text style={styles.statusTitle}>{activeStage.title}</Text><Text style={styles.statusCopy}>{activeStage.copy}</Text>
        <Pressable onPress={openApplication} style={styles.statusButton}><Text style={styles.statusButtonText}>Open application →</Text></Pressable>
      </View> : null}

      {role === 'talent' && draft ? <View style={styles.applicationBox}>
        <Text style={styles.assistantEyebrow}>YOUR APPLICATION DRAFT</Text>
        {matchScore != null ? <View style={styles.matchRow}><Text style={styles.matchScore}>{matchScore}%</Text><View style={{ flex: 1 }}><Text style={styles.matchLabel}>{matchLabel || 'role match'}</Text><Text style={styles.matchCopy}>{matchExplanation || 'Your profile has been compared with the role requirements.'}</Text></View></View> : null}
        <Text style={styles.stepTitle}>1. Understand your fit</Text>
        {ai?.summary ? <Text style={styles.analysisSummary}>{ai.summary}</Text> : null}
        {ai?.strengths?.length ? <View style={styles.aiPanel}><Text style={styles.aiHeading}>Your strongest evidence</Text>{ai.strengths.map((item, index) => <View key={`s-${index}`} style={styles.aiBullet}><Text style={styles.goodDot}>✓</Text><Text style={styles.aiText}>{item}</Text></View>)}</View> : null}
        {ai?.gaps?.length ? <View style={styles.gapPanel}><Text style={styles.aiHeading}>Worth addressing</Text>{ai.gaps.map((item, index) => <View key={`g-${index}`} style={styles.aiBullet}><Text style={styles.gapDot}>•</Text><Text style={styles.aiText}>{item}</Text></View>)}</View> : null}
        <Pressable disabled={!!busy} onPress={() => runAi('analyse')} style={styles.secondary}><Text style={styles.secondaryText}>{busy === 'analyse' ? 'Analysing…' : ai ? 'Refresh my analysis' : 'Analyse my fit'}</Text></Pressable>

        <Text style={styles.stepTitle}>2. Create your covering letter</Text><Text style={styles.stepCopy}>AI uses your real profile and this role. Edit the draft so it always sounds like you.</Text>
        {!coverLetter ? <Pressable disabled={!!busy} onPress={() => runAi('draft')} style={styles.primary}><Text style={styles.primaryText}>{busy === 'draft' ? 'Writing…' : 'Write my tailored letter'}</Text></Pressable> : null}
        {coverLetter ? <><TextInput multiline value={coverLetter} onChangeText={setCoverLetter} style={styles.letterInput} placeholder="Your covering letter" textAlignVertical="top" /><View style={styles.letterActions}><Pressable disabled={!!busy} onPress={() => runAi('improve')} style={styles.secondaryHalf}><Text style={styles.secondaryText}>{busy === 'improve' ? 'Improving…' : 'Improve my letter'}</Text></Pressable><Pressable disabled={!!busy} onPress={() => runAi('draft')} style={styles.secondaryHalf}><Text style={styles.secondaryText}>{busy === 'draft' ? 'Rewriting…' : 'New version'}</Text></Pressable></View></> : null}

        <Text style={styles.stepTitle}>3. Review & submit</Text><Text style={styles.stepCopy}>Nothing goes to the employer until you press Submit.</Text>
        <Pressable onPress={submitApplication} disabled={!!busy} style={[styles.submitButton, !!busy && styles.disabled]}><Text style={styles.submitText}>{busy === 'submit' ? 'Submitting…' : 'Submit application'}</Text></Pressable>
      </View> : null}

      {error ? <Text style={styles.errorBox}>{error}</Text> : null}
      <View style={styles.section}><Text style={styles.sectionTitle}>The role</Text><Text style={styles.copy}>{job.job_description || 'The employer has not added a full description yet.'}</Text></View>
      <ListBlock title="Requirements" items={job.requirements} />
      <ListBlock title="Qualifications" items={job.required_qualifications} />
      <ListBlock title="Skills" items={job.required_skills} />
      <ListBlock title="Benefits" items={[...(job.benefits || []), ...(job.perks || [])]} />
    </ScrollView>
  </KeyboardAvoidingView>
}

const styles = StyleSheet.create({
  flex:{flex:1,backgroundColor:'#fff'},scroll:{flex:1,backgroundColor:'#fff'},page:{paddingHorizontal:22,paddingTop:64,paddingBottom:120},loading:{flex:1,backgroundColor:'#fff',justifyContent:'center',alignItems:'center',padding:30},back:{color:'#66747c',fontSize:13,marginBottom:24},hero:{width:'100%',height:220,marginBottom:18,backgroundColor:'#eef2f4'},company:{color:'#71808a',fontSize:11,letterSpacing:.5,marginBottom:7},title:{color:'#092b45',fontSize:30,lineHeight:36,fontWeight:'600'},meta:{color:'#66747c',fontSize:12,lineHeight:19,marginTop:10},propertySummary:{flexDirection:'row',gap:12,alignItems:'center',borderWidth:1,borderColor:'#dce3e7',padding:14,marginTop:18},propertyLogo:{width:45,height:45,borderRadius:8,borderWidth:1,borderColor:'#e0e6e8',backgroundColor:'#fff'},propertyName:{color:'#173246',fontSize:14,fontWeight:'700'},propertyLocation:{color:'#71808a',fontSize:10.5,marginTop:3},ratingBox:{alignItems:'flex-end'},ratingValue:{color:'#092b45',fontSize:17,fontWeight:'700'},ratingCount:{color:'#71808a',fontSize:9,marginTop:2},factRow:{flexDirection:'row',flexWrap:'wrap',gap:6,marginTop:10},factChip:{backgroundColor:'#f2f5f6',color:'#526976',fontSize:9.5,paddingHorizontal:9,paddingVertical:6,borderRadius:14},gallery:{marginTop:10},thumb:{width:120,height:82,marginRight:8,backgroundColor:'#eef2f4'},propertyCard:{backgroundColor:'#f4f7f8',padding:16,marginTop:14},propertyButton:{borderWidth:1,borderColor:'#bfcbd1',padding:15,marginTop:12},propertyButtonTitle:{color:'#173246',fontSize:14,fontWeight:'700'},propertyButtonCopy:{color:'#71808a',fontSize:9.5,lineHeight:15,marginTop:5},propertyButtonLink:{color:'#092b45',fontSize:10.5,fontWeight:'700',marginTop:10},assistantIntro:{backgroundColor:'#f4f7f8',padding:20,marginTop:24},assistantEyebrow:{color:'#71808a',fontSize:8,letterSpacing:1.8,marginBottom:8},assistantTitle:{color:'#092b45',fontSize:20,lineHeight:25,fontWeight:'600'},assistantCopy:{color:'#66747c',fontSize:12,lineHeight:19,marginTop:8},applyButton:{backgroundColor:'#092b45',paddingVertical:15,alignItems:'center',marginTop:18},applyText:{color:'#fff',fontSize:12,fontWeight:'700'},restartCard:{borderWidth:1,borderColor:'#d7e0e4',padding:18,marginTop:22},restartTitle:{color:'#173246',fontSize:17,fontWeight:'700'},restartCopy:{color:'#71808a',fontSize:11.5,lineHeight:18,marginTop:6},statusCard:{backgroundColor:'#092b45',padding:19,marginTop:22},statusEyebrow:{color:'#b9c8d1',fontSize:8,letterSpacing:1.5},statusTitle:{color:'#fff',fontSize:20,fontWeight:'700',marginTop:7},statusCopy:{color:'#dce6eb',fontSize:11.5,lineHeight:18,marginTop:6},statusButton:{borderWidth:1,borderColor:'#8fa7b5',paddingVertical:12,alignItems:'center',marginTop:16},statusButtonText:{color:'#fff',fontSize:11,fontWeight:'700'},applicationBox:{borderWidth:1,borderColor:'#b9c8cf',padding:18,marginTop:22},matchRow:{flexDirection:'row',gap:14,alignItems:'center',backgroundColor:'#f4f7f8',padding:14},matchScore:{color:'#092b45',fontSize:28,fontWeight:'700'},matchLabel:{color:'#173246',fontSize:12,fontWeight:'700',textTransform:'uppercase'},matchCopy:{color:'#71808a',fontSize:10.5,lineHeight:16,marginTop:3},stepTitle:{color:'#173246',fontSize:16,fontWeight:'700',marginTop:24,marginBottom:7},stepCopy:{color:'#71808a',fontSize:11.5,lineHeight:18,marginBottom:10},analysisSummary:{color:'#526976',fontSize:12,lineHeight:19},aiPanel:{backgroundColor:'#f5f9f7',padding:14,marginTop:12},gapPanel:{backgroundColor:'#faf8f3',padding:14,marginTop:10},aiHeading:{color:'#173246',fontSize:11,fontWeight:'700',marginBottom:7},aiBullet:{flexDirection:'row',gap:8,marginTop:5},goodDot:{color:'#315846',fontWeight:'800'},gapDot:{color:'#8a5b18',fontWeight:'800'},aiText:{color:'#526976',fontSize:10.5,lineHeight:16,flex:1},primary:{backgroundColor:'#092b45',paddingVertical:14,alignItems:'center',marginTop:12},primaryText:{color:'#fff',fontSize:11,fontWeight:'700'},secondary:{borderWidth:1,borderColor:'#bfcbd1',paddingVertical:13,alignItems:'center',marginTop:12},secondaryText:{color:'#092b45',fontSize:10.5,fontWeight:'700'},letterInput:{borderWidth:1,borderColor:'#cbd6db',minHeight:220,padding:13,color:'#173246',fontSize:12,lineHeight:19},letterActions:{flexDirection:'row',gap:8,marginTop:9},secondaryHalf:{flex:1,borderWidth:1,borderColor:'#bfcbd1',paddingVertical:12,alignItems:'center'},submitButton:{backgroundColor:'#0b6245',paddingVertical:16,alignItems:'center',marginTop:12},submitText:{color:'#fff',fontSize:12,fontWeight:'800'},disabled:{opacity:.45},error:{color:'#9b2c2c',fontSize:12},errorBox:{color:'#9b2c2c',fontSize:12,lineHeight:18,backgroundColor:'#fff4f4',padding:13,marginTop:14},section:{borderTopWidth:1,borderTopColor:'#e3e8eb',paddingTop:20,marginTop:24},sectionTitle:{color:'#173246',fontSize:17,fontWeight:'700',marginBottom:8},copy:{color:'#66747c',fontSize:12.5,lineHeight:20},bulletRow:{flexDirection:'row',gap:8,marginTop:7},bullet:{color:'#092b45',fontWeight:'800'},bulletText:{color:'#66747c',fontSize:12,lineHeight:18,flex:1},
})
