import { useEffect, useState } from 'react'
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { router } from 'expo-router'
import { supabase } from '../src/lib/supabase'

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
}

export default function JobsScreen() {
  const [role, setRole] = useState<AccountRole>('talent')
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.replace('/login'); return }

      const { data: account } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle()
      const resolved: AccountRole = account?.role === 'employer' ? 'employer' : 'talent'
      setRole(resolved)

      if (resolved === 'employer') {
        const { data: employer } = await supabase.from('employer_profiles').select('id').eq('user_id', user.id).maybeSingle()
        if (!employer) { setError('Employer profile not found.'); setLoading(false); return }
        const { data, error: queryError } = await supabase.from('job_listings')
          .select('id,job_title,location,job_type,salary_display_text,tier,is_featured,status,employer_profiles(company_name,property_name)')
          .eq('employer_id', employer.id)
          .order('posted_date', { ascending: false })
        if (queryError) setError(queryError.message)
        setJobs((data || []) as Job[])
      } else {
        const now = new Date().toISOString()
        const { data, error: queryError } = await supabase.from('job_listings')
          .select('id,job_title,location,job_type,salary_display_text,tier,is_featured,status,employer_profiles(company_name,property_name)')
          .eq('is_live', true)
          .or(`expires_at.is.null,expires_at.gt.${now}`)
          .order('is_featured', { ascending: false })
          .order('posted_date', { ascending: false })
        if (queryError) setError(queryError.message)
        setJobs((data || []) as Job[])
      }
      setLoading(false)
    }
    load()
  }, [])

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.page}>
      <Pressable onPress={() => router.back()}><Text style={styles.back}>‹ Back</Text></Pressable>
      <Text style={styles.eyebrow}>{role === 'employer' ? 'RECRUITMENT' : 'OPPORTUNITIES'}</Text>
      <Text style={styles.title}>{role === 'employer' ? 'Your jobs' : 'Browse roles'}</Text>
      <Text style={styles.intro}>{role === 'employer' ? 'The same roles currently managed from your web dashboard.' : 'Live roles from Wellness House Talent, with the full employer and role detail available before you apply.'}</Text>

      {loading ? <ActivityIndicator color="#092b45" style={{ marginTop: 30 }} /> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {!loading && !error && jobs.length === 0 ? <View style={styles.empty}><Text style={styles.emptyTitle}>Nothing to show yet.</Text><Text style={styles.emptyCopy}>{role === 'employer' ? 'Your posted roles will appear here.' : 'New live opportunities will appear here as employers publish them.'}</Text></View> : null}

      <View style={styles.list}>
        {jobs.map(job => {
          const employer = Array.isArray(job.employer_profiles) ? job.employer_profiles[0] : job.employer_profiles
          const company = employer?.property_name || employer?.company_name || 'Wellness employer'
          return <Pressable key={job.id} onPress={() => router.push({ pathname: '/job/[id]', params: { id: job.id } })} style={styles.card}>
            <View style={styles.row}><Text style={styles.company}>{company}</Text>{job.is_featured ? <Text style={styles.featured}>FEATURED</Text> : null}</View>
            <Text style={styles.jobTitle}>{job.job_title}</Text>
            <Text style={styles.meta}>{[job.location, job.job_type, job.salary_display_text].filter(Boolean).join('  ·  ') || 'Details available inside'}</Text>
            {role === 'employer' ? <Text style={styles.status}>{job.status || 'draft'}</Text> : null}
            <Text style={styles.view}>View full role →</Text>
          </Pressable>
        })}
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: '#fff' },
  page: { paddingHorizontal: 22, paddingTop: 64, paddingBottom: 44 },
  back: { color: '#66747c', fontSize: 13, marginBottom: 34 },
  eyebrow: { color: '#71808a', fontSize: 9, letterSpacing: 2.1, marginBottom: 10 },
  title: { color: '#092b45', fontSize: 31, lineHeight: 37, fontWeight: '500' },
  intro: { color: '#66747c', fontSize: 14, lineHeight: 21, marginTop: 10, marginBottom: 26 },
  list: { gap: 12 },
  card: { borderWidth: 1, borderColor: '#dce3e7', padding: 19, backgroundColor: '#fff' },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  company: { color: '#71808a', fontSize: 11, letterSpacing: .4, flex: 1 },
  featured: { color: '#092b45', backgroundColor: '#edf2f4', paddingHorizontal: 8, paddingVertical: 4, fontSize: 8, letterSpacing: 1.2 },
  jobTitle: { color: '#173246', fontSize: 19, lineHeight: 24, fontWeight: '600', marginTop: 7 },
  meta: { color: '#66747c', fontSize: 12, lineHeight: 18, marginTop: 8 },
  status: { color: '#71808a', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1.2, marginTop: 10 },
  view: { color: '#092b45', fontSize: 12, fontWeight: '600', marginTop: 16 },
  empty: { backgroundColor: '#f4f7f8', padding: 20 },
  emptyTitle: { color: '#173246', fontSize: 15, fontWeight: '600' },
  emptyCopy: { color: '#71808a', fontSize: 12, lineHeight: 18, marginTop: 6 },
  error: { color: '#9b2c2c', fontSize: 12, marginBottom: 18 },
})