import { useEffect, useMemo, useState } from 'react'
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { router } from 'expo-router'
import { supabase } from '../src/lib/supabase'

type Role = 'talent' | 'employer'

type Application = {
  id: string
  status: string
  match_score: number | null
  created_at: string | null
  candidate_id: string
  role_id: string
  job_listings?: { job_title?: string | null; location?: string | null; employer_profiles?: { property_name?: string | null; company_name?: string | null } | { property_name?: string | null; company_name?: string | null }[] | null } | { job_title?: string | null; location?: string | null; employer_profiles?: { property_name?: string | null; company_name?: string | null } | { property_name?: string | null; company_name?: string | null }[] | null }[] | null
  candidate_profiles?: { full_name?: string | null; headline?: string | null; role_level?: string | null } | { full_name?: string | null; headline?: string | null; role_level?: string | null }[] | null
}

const statusCopy: Record<string, string> = {
  draft: 'Draft', pending: 'Applied', reviewed: 'Reviewed', shortlisted: 'Shortlisted', interview: 'Interview', offered: 'Offer', accepted: 'Accepted', rejected: 'Not progressing', withdrawn: 'Withdrawn',
}

export default function ApplicationsScreen() {
  const [role, setRole] = useState<Role>('talent')
  const [items, setItems] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.replace('/login'); return }
      const { data: account } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle()
      const resolved: Role = account?.role === 'employer' ? 'employer' : 'talent'
      setRole(resolved)

      if (resolved === 'talent') {
        const { data: candidate } = await supabase.from('candidate_profiles').select('id').eq('user_id', user.id).maybeSingle()
        if (!candidate) { setLoading(false); return }
        const { data, error: queryError } = await supabase.from('applications')
          .select('id,status,match_score,created_at,candidate_id,role_id,job_listings(job_title,location,employer_profiles(property_name,company_name))')
          .eq('candidate_id', candidate.id)
          .order('created_at', { ascending: false })
        if (queryError) setError(queryError.message)
        setItems((data || []) as Application[])
      } else {
        const { data: employer } = await supabase.from('employer_profiles').select('id').eq('user_id', user.id).maybeSingle()
        if (!employer) { setLoading(false); return }
        const { data: jobs } = await supabase.from('job_listings').select('id').eq('employer_id', employer.id)
        const ids = (jobs || []).map(j => j.id)
        if (!ids.length) { setLoading(false); return }
        const { data, error: queryError } = await supabase.from('applications')
          .select('id,status,match_score,created_at,candidate_id,role_id,job_listings(job_title,location),candidate_profiles(full_name,headline,role_level)')
          .in('role_id', ids)
          .order('created_at', { ascending: false })
        if (queryError) setError(queryError.message)
        setItems((data || []) as Application[])
      }
      setLoading(false)
    }
    load()
  }, [])

  const live = useMemo(() => items.filter(item => item.status !== 'withdrawn'), [items])

  async function withdraw(item: Application) {
    const { error: updateError } = await supabase.from('applications').update({ status: 'withdrawn', updated_at: new Date().toISOString() }).eq('id', item.id)
    if (updateError) { setError(updateError.message); return }
    setItems(current => current.map(row => row.id === item.id ? { ...row, status: 'withdrawn' } : row))
  }

  return <ScrollView style={styles.scroll} contentContainerStyle={styles.page}>
    <Pressable onPress={() => router.back()}><Text style={styles.back}>‹ Back</Text></Pressable>
    <Text style={styles.eyebrow}>{role === 'employer' ? 'RECRUITMENT PIPELINE' : 'YOUR PROGRESS'}</Text>
    <Text style={styles.title}>Applications</Text>
    <Text style={styles.intro}>{role === 'employer' ? 'See who has applied, then shortlist, interview, offer or close the application from the app.' : 'Keep every application, interview and outcome together.'}</Text>
    {loading ? <ActivityIndicator color="#092b45" style={{ marginTop: 30 }} /> : null}
    {error ? <Text style={styles.error}>{error}</Text> : null}
    {!loading && live.length === 0 ? <View style={styles.empty}><Text style={styles.emptyTitle}>No applications yet.</Text><Text style={styles.emptyCopy}>{role === 'talent' ? 'Browse live roles and apply when you find the right fit.' : 'Applications will appear here as Talent apply to your roles.'}</Text></View> : null}
    <View style={styles.list}>{live.map(item => {
      const job = Array.isArray(item.job_listings) ? item.job_listings[0] : item.job_listings
      const employer = Array.isArray(job?.employer_profiles) ? job?.employer_profiles[0] : job?.employer_profiles
      const candidate = Array.isArray(item.candidate_profiles) ? item.candidate_profiles[0] : item.candidate_profiles
      return <View key={item.id} style={styles.card}>
        <View style={styles.topRow}><Text style={styles.status}>{statusCopy[item.status] || item.status}</Text>{item.match_score ? <Text style={styles.score}>{item.match_score}% match</Text> : null}</View>
        <Text style={styles.cardTitle}>{role === 'talent' ? (job?.job_title || 'Role') : (candidate?.full_name || 'Candidate')}</Text>
        <Text style={styles.meta}>{role === 'talent' ? [employer?.property_name || employer?.company_name, job?.location].filter(Boolean).join('  ·  ') : [candidate?.headline || candidate?.role_level, job?.job_title].filter(Boolean).join('  ·  ')}</Text>
        {role === 'talent' ? <Pressable onPress={() => router.push({ pathname: '/talent-application/[id]', params: { id: item.id } })} style={styles.manage}><Text style={styles.manageText}>{['interview','offered','accepted'].includes(item.status) ? 'View & respond →' : 'View progress →'}</Text></Pressable> : null}
        {role === 'talent' && !['accepted','rejected','offered'].includes(item.status) ? <Pressable onPress={() => withdraw(item)}><Text style={styles.withdraw}>Withdraw interest</Text></Pressable> : null}
        {role === 'employer' ? <Pressable onPress={() => router.push({ pathname: '/application/[id]', params: { id: item.id } })} style={styles.manage}><Text style={styles.manageText}>{['accepted','rejected'].includes(item.status) ? 'View application →' : 'Manage candidate →'}</Text></Pressable> : null}
      </View>
    })}</View>
  </ScrollView>
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: '#fff' }, page: { paddingHorizontal: 22, paddingTop: 64, paddingBottom: 44 }, back: { color: '#66747c', fontSize: 13, marginBottom: 34 }, eyebrow: { color: '#71808a', fontSize: 9, letterSpacing: 2.1, marginBottom: 10 }, title: { color: '#092b45', fontSize: 31, lineHeight: 37, fontWeight: '500' }, intro: { color: '#66747c', fontSize: 14, lineHeight: 21, marginTop: 10, marginBottom: 26 }, list: { gap: 12 }, card: { borderWidth: 1, borderColor: '#dce3e7', padding: 19 }, topRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 }, status: { color: '#092b45', fontSize: 9, letterSpacing: 1.3, textTransform: 'uppercase' }, score: { color: '#173246', fontSize: 11, fontWeight: '600' }, cardTitle: { color: '#173246', fontSize: 18, fontWeight: '600', marginTop: 9 }, meta: { color: '#66747c', fontSize: 12, lineHeight: 18, marginTop: 7 }, withdraw: { color: '#7a4a4a', fontSize: 11, marginTop: 13 }, manage: { borderTopWidth: 1, borderTopColor: '#edf1f3', marginTop: 16, paddingTop: 14 }, manageText: { color: '#092b45', fontSize: 11, fontWeight: '700' }, empty: { backgroundColor: '#f4f7f8', padding: 20 }, emptyTitle: { color: '#173246', fontSize: 15, fontWeight: '600' }, emptyCopy: { color: '#71808a', fontSize: 12, lineHeight: 18, marginTop: 6 }, error: { color: '#9b2c2c', fontSize: 12, marginBottom: 18 },
})
