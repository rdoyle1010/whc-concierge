import { useCallback, useState } from 'react'
import { ActivityIndicator, Alert, Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router'
import { supabase } from '../../src/lib/supabase'
import { palette, radius, space, type } from '../../src/lib/theme'

const WEB_URL = process.env.EXPO_PUBLIC_WEB_URL || 'https://talenthousecollective.co.uk'

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

  if (loading) return <View style={styles.loading}><ActivityIndicator color={palette.ink} /></View>
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
      {employer?.id ? <Pressable onPress={() => router.push({ pathname: '/property/[id]', params: { id: employer.id } })} style={styles.propertyButton}><Text style={styles.propertyButtonTitle}>Explore {company}</Text><Text style={styles.propertyButtonCopy}>Photos · Talent House reviews · spa facts · treatments · brands · facilities · location</Text><Text style={styles.propertyButtonLink}>View full hotel & spa profile →</Text></Pressable> : null}

      {role === 'talent' && !applicationId ? <View style={styles.assistantIntro}>
        <Text style={styles.assistantEyebrow}>TALENT HOUSE APPLICATION ASSISTANT</Text><Text style={styles.assistantTitle}>Don’t just apply. Build a stronger application.</Text><Text style={styles.assistantCopy}>Compare your profile with the role, understand genuine gaps and create a tailored covering letter before anything is sent.</Text>
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
  flex:{flex:1,backgroundColor:palette.stone},
  scroll:{flex:1,backgroundColor:palette.stone},
  page:{paddingHorizontal:space.page,paddingTop:18,paddingBottom:118},
  loading:{flex:1,backgroundColor:palette.stone,justifyContent:'center',alignItems:'center',padding:30},
  back:{color:palette.muted,fontSize:13,marginBottom:22,fontFamily:type.sans},
  hero:{width:'100%',height:220,marginBottom:18,backgroundColor:palette.stoneDeep,borderRadius:radius.large},
  company:{color:palette.quiet,fontSize:8,letterSpacing:1.8,marginBottom:7,fontWeight:'700',fontFamily:type.sans,textTransform:'uppercase'},
  title:{color:palette.inkStrong,fontSize:34,lineHeight:40,fontWeight:'400',fontFamily:type.serif},
  meta:{color:palette.muted,fontSize:11,lineHeight:18,marginTop:9,fontFamily:type.sans},
  propertySummary:{flexDirection:'row',gap:12,alignItems:'center',borderWidth:1,borderColor:palette.line,padding:14,marginTop:18,backgroundColor:palette.paper,borderRadius:radius.large},
  propertyLogo:{width:45,height:45,borderRadius:radius.medium,borderWidth:1,borderColor:palette.line,backgroundColor:palette.paper},
  propertyName:{color:palette.inkStrong,fontSize:13,fontWeight:'700',fontFamily:type.sans},
  propertyLocation:{color:palette.muted,fontSize:9.5,marginTop:3,fontFamily:type.sans},
  ratingBox:{alignItems:'flex-end'},
  ratingValue:{color:palette.inkStrong,fontSize:15,fontWeight:'700',fontFamily:type.sans},
  ratingCount:{color:palette.quiet,fontSize:8.5,marginTop:2,fontFamily:type.sans},
  factRow:{flexDirection:'row',flexWrap:'wrap',gap:6,marginTop:10},
  factChip:{backgroundColor:palette.stoneDeep,color:palette.muted,fontSize:8.5,paddingHorizontal:9,paddingVertical:6,borderRadius:999,fontFamily:type.sans},
  gallery:{marginTop:10},
  thumb:{width:120,height:82,marginRight:8,backgroundColor:palette.stoneDeep,borderRadius:radius.medium},
  propertyCard:{backgroundColor:palette.paper,borderWidth:1,borderColor:palette.line,padding:16,marginTop:14,borderRadius:radius.large},
  propertyButton:{borderWidth:1,borderColor:palette.lineStrong,padding:15,marginTop:12,backgroundColor:palette.paper,borderRadius:radius.large},
  propertyButtonTitle:{color:palette.inkStrong,fontSize:15,fontWeight:'400',fontFamily:type.serif},
  propertyButtonCopy:{color:palette.muted,fontSize:9.5,lineHeight:15,marginTop:5,fontFamily:type.sans},
  propertyButtonLink:{color:palette.ink,fontSize:10,fontWeight:'700',marginTop:10,fontFamily:type.sans},
  assistantIntro:{backgroundColor:palette.inkStrong,padding:18,marginTop:24,borderRadius:radius.large},
  assistantEyebrow:{color:palette.quiet,fontSize:7.5,letterSpacing:1.6,marginBottom:7,fontWeight:'700',fontFamily:type.sans},
  assistantTitle:{color:palette.paper,fontSize:21,lineHeight:26,fontWeight:'400',fontFamily:type.serif},
  assistantCopy:{color:'#DCE4E7',fontSize:10.5,lineHeight:17,marginTop:7,fontFamily:type.sans},
  applyButton:{backgroundColor:palette.paper,paddingVertical:14,alignItems:'center',marginTop:16,borderRadius:radius.medium},
  applyText:{color:palette.inkStrong,fontSize:10.5,fontWeight:'800',fontFamily:type.sans},
  restartCard:{borderWidth:1,borderColor:palette.line,padding:17,marginTop:22,backgroundColor:palette.paper,borderRadius:radius.large},
  restartTitle:{color:palette.inkStrong,fontSize:18,fontWeight:'400',fontFamily:type.serif},
  restartCopy:{color:palette.muted,fontSize:10.5,lineHeight:17,marginTop:6,fontFamily:type.sans},
  statusCard:{backgroundColor:palette.inkStrong,padding:18,marginTop:22,borderRadius:radius.large},
  statusEyebrow:{color:'#CBD5D9',fontSize:7.5,letterSpacing:1.4,fontWeight:'700',fontFamily:type.sans},
  statusTitle:{color:palette.paper,fontSize:20,lineHeight:25,fontWeight:'400',fontFamily:type.serif,marginTop:6},
  statusCopy:{color:'#DCE4E7',fontSize:10.5,lineHeight:17,marginTop:5,fontFamily:type.sans},
  statusButton:{borderWidth:1,borderColor:'rgba(255,255,255,.28)',paddingVertical:12,alignItems:'center',marginTop:14,borderRadius:radius.medium},
  statusButtonText:{color:palette.paper,fontSize:10,fontWeight:'700',fontFamily:type.sans},
  applicationBox:{borderWidth:1,borderColor:palette.line,padding:17,marginTop:22,backgroundColor:palette.paper,borderRadius:radius.large},
  matchRow:{flexDirection:'row',gap:14,alignItems:'center',backgroundColor:palette.stoneDeep,padding:14,borderRadius:radius.medium},
  matchScore:{color:palette.inkStrong,fontSize:29,fontWeight:'400',fontFamily:type.serif},
  matchLabel:{color:palette.inkStrong,fontSize:9,fontWeight:'800',textTransform:'uppercase',letterSpacing:.8,fontFamily:type.sans},
  matchCopy:{color:palette.muted,fontSize:9.5,lineHeight:15,marginTop:3,fontFamily:type.sans},
  stepTitle:{color:palette.inkStrong,fontSize:18,lineHeight:23,fontWeight:'400',fontFamily:type.serif,marginTop:24,marginBottom:6},
  stepCopy:{color:palette.muted,fontSize:10.5,lineHeight:17,marginBottom:10,fontFamily:type.sans},
  analysisSummary:{color:palette.muted,fontSize:11,lineHeight:18,fontFamily:type.sans},
  aiPanel:{backgroundColor:palette.sageSoft,padding:14,marginTop:12,borderRadius:radius.medium},
  gapPanel:{backgroundColor:'#F7F3EA',padding:14,marginTop:10,borderRadius:radius.medium},
  aiHeading:{color:palette.inkStrong,fontSize:10.5,fontWeight:'700',marginBottom:7,fontFamily:type.sans},
  aiBullet:{flexDirection:'row',gap:8,marginTop:5},
  goodDot:{color:palette.sage,fontWeight:'800'},
  gapDot:{color:'#8A6A2C',fontWeight:'800'},
  aiText:{color:palette.muted,fontSize:9.5,lineHeight:15,flex:1,fontFamily:type.sans},
  primary:{backgroundColor:palette.inkStrong,paddingVertical:14,alignItems:'center',marginTop:12,borderRadius:radius.medium},
  primaryText:{color:palette.paper,fontSize:10.5,fontWeight:'700',fontFamily:type.sans},
  secondary:{borderWidth:1,borderColor:palette.lineStrong,paddingVertical:12,alignItems:'center',marginTop:12,backgroundColor:palette.paper,borderRadius:radius.medium},
  secondaryText:{color:palette.ink,fontSize:10,fontWeight:'700',fontFamily:type.sans},
  letterInput:{borderWidth:1,borderColor:palette.line,minHeight:220,padding:13,color:palette.text,fontSize:11,lineHeight:18,backgroundColor:palette.stone,borderRadius:radius.medium,fontFamily:type.sans},
  letterActions:{flexDirection:'row',gap:8,marginTop:9},
  secondaryHalf:{flex:1,borderWidth:1,borderColor:palette.lineStrong,paddingVertical:12,alignItems:'center',backgroundColor:palette.paper,borderRadius:radius.medium},
  submitButton:{backgroundColor:palette.sage,paddingVertical:15,alignItems:'center',marginTop:12,borderRadius:radius.medium},
  submitText:{color:palette.paper,fontSize:10.5,fontWeight:'800',fontFamily:type.sans},
  disabled:{opacity:.45},
  error:{color:palette.danger,fontSize:11,fontFamily:type.sans},
  errorBox:{color:palette.danger,fontSize:10.5,lineHeight:17,backgroundColor:palette.dangerSoft,padding:13,marginTop:14,borderRadius:radius.medium,fontFamily:type.sans},
  section:{borderTopWidth:1,borderTopColor:palette.line,paddingTop:20,marginTop:24},
  sectionTitle:{color:palette.inkStrong,fontSize:20,lineHeight:25,fontWeight:'400',fontFamily:type.serif,marginBottom:8},
  copy:{color:palette.muted,fontSize:11.5,lineHeight:19,fontFamily:type.sans},
  bulletRow:{flexDirection:'row',gap:8,marginTop:7},
  bullet:{color:palette.sage,fontWeight:'800'},
  bulletText:{color:palette.muted,fontSize:11,lineHeight:18,flex:1,fontFamily:type.sans},
})
