import { useEffect, useState } from 'react'
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { supabase } from '../../src/lib/supabase'

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
  const [alreadyApplied, setAlreadyApplied] = useState(false)
  const [loading, setLoading] = useState(true)
  const [applying, setApplying] = useState(false)
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
          const { data: existing } = await supabase.from('applications').select('id').eq('role_id', id).eq('candidate_id', candidate.id).neq('status', 'withdrawn').maybeSingle()
          setAlreadyApplied(Boolean(existing))
        }
      }
      setLoading(false)
    }
    if (id) load()
  }, [id])

  async function apply() {
    if (!job || !candidateId || alreadyApplied || applying) return
    setApplying(true)
    const now = new Date().toISOString()
    const { data: application, error: applyError } = await supabase.from('applications').insert({
      role_id: job.id,
      job_id: job.id,
      candidate_id: candidateId,
      status: 'pending',
      submitted_at: now,
      updated_at: now,
    }).select('id').single()
    setApplying(false)
    if (applyError) {
      Alert.alert('Could not apply', applyError.message)
      return
    }
    if (application?.id) {
      supabase.functions.invoke('mobile-event-push',{body:{eventType:'job_application',recordId:application.id}}).catch(()=>null)
    }
    setAlreadyApplied(true)
    Alert.alert('Application sent', 'This role is now in your Applications area.')
  }

  if (loading) return <View style={styles.loading}><ActivityIndicator color="#092b45" /></View>
  if (!job) return <View style={styles.loading}><Text style={styles.error}>{error || 'This role is no longer available.'}</Text><Pressable onPress={() => router.back()}><Text style={styles.back}>‹ Back</Text></Pressable></View>

  const employer = Array.isArray(job.employer_profiles) ? job.employer_profiles[0] : job.employer_profiles
  const company = employer?.property_name || employer?.company_name || 'Wellness employer'
  const rating = Number(employer?.overall_rating || 0)

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.page}>
      <Pressable onPress={() => router.back()}><Text style={styles.back}>‹ Back to roles</Text></Pressable>
      <Text style={styles.company}>{company}</Text>
      <Text style={styles.title}>{job.job_title}</Text>
      <Text style={styles.meta}>{[job.location || employer?.location, job.job_type, job.contract_type, job.salary_display_text].filter(Boolean).join('  ·  ')}</Text>
      {rating > 0 ? <Text style={styles.rating}>★ {rating.toFixed(1)}{employer?.total_reviews ? `  (${employer.total_reviews} reviews)` : ''}</Text> : null}

      {role === 'talent' ? <Pressable onPress={apply} disabled={alreadyApplied || applying || !candidateId} style={[styles.applyButton, (alreadyApplied || applying || !candidateId) && styles.applyButtonDisabled]}><Text style={styles.applyText}>{alreadyApplied ? 'Applied' : applying ? 'Sending…' : 'Apply for this role'}</Text></Pressable> : null}

      {employer?.property_description ? <View style={styles.section}><Text style={styles.sectionTitle}>About the property</Text><Text style={styles.copy}>{employer.property_description}</Text></View> : null}
      <View style={styles.section}><Text style={styles.sectionTitle}>The role</Text><Text style={styles.copy}>{job.job_description || 'The employer has not added a full description yet.'}</Text></View>
      <ListBlock title="Requirements" items={job.requirements} />
      <ListBlock title="Qualifications" items={job.required_qualifications} />
      <ListBlock title="Skills" items={job.required_skills} />
      <ListBlock title="Benefits" items={[...(job.benefits || []), ...(job.perks || [])]} />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: '#fff' },
  page: { paddingHorizontal: 22, paddingTop: 64, paddingBottom: 48 },
  loading: { flex: 1, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', padding: 30 },
  back: { color: '#66747c', fontSize: 13, marginBottom: 32 },
  company: { color: '#71808a', fontSize: 11, letterSpacing: .5, marginBottom: 7 },
  title: { color: '#092b45', fontSize: 30, lineHeight: 36, fontWeight: '600' },
  meta: { color: '#66747c', fontSize: 12, lineHeight: 19, marginTop: 10 },
  rating: { color: '#173246', fontSize: 12, marginTop: 10 },
  applyButton: { backgroundColor: '#092b45', paddingVertical: 16, alignItems: 'center', marginTop: 24, marginBottom: 10 },
  applyButtonDisabled: { opacity: .45 },
  applyText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  section: { borderTopWidth: 1, borderTopColor: '#e2e7ea', paddingTop: 22, marginTop: 24 },
  sectionTitle: { color: '#173246', fontSize: 17, fontWeight: '600', marginBottom: 11 },
  copy: { color: '#66747c', fontSize: 13, lineHeight: 21 },
  bulletRow: { flexDirection: 'row', gap: 9, marginBottom: 8 },
  bullet: { color: '#092b45', fontSize: 14 },
  bulletText: { color: '#66747c', fontSize: 13, lineHeight: 20, flex: 1 },
  error: { color: '#9b2c2c', fontSize: 13, textAlign: 'center', marginBottom: 16 },
})
